import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import {
  jobs,
  teamMembers,
  userProfiles,
  customers,
  services,
  companies,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { sendJobAssignmentNotification } from '@/lib/notifications'

/**
 * PATCH /api/jobs/[id]/assign
 * Assign/reassign job to team member
 * Separate endpoint for assignment to allow for notifications/webhooks
 */

const assignJobSchema = z.object({
  teamMemberId: z
    .string()
    .uuid('Team member ID must be a valid UUID')
    .nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = assignJobSchema.parse(body)

    // Check if job exists and belongs to company
    const existingJob = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, id), eq(jobs.companyId, context.companyId)),
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify team member belongs to company (if assigning)
    let teamMember: typeof teamMembers.$inferSelect | null = null
    let teamMemberProfile: typeof userProfiles.$inferSelect | null = null

    if (validatedData.teamMemberId) {
      const memberResult = await db
        .select({
          member: teamMembers,
          profile: userProfiles,
        })
        .from(teamMembers)
        .leftJoin(userProfiles, eq(teamMembers.userId, userProfiles.userId))
        .where(
          and(
            eq(teamMembers.id, validatedData.teamMemberId),
            eq(teamMembers.companyId, context.companyId)
          )
        )
        .limit(1)

      if (!memberResult.length) {
        return NextResponse.json(
          { error: 'Team member not found or does not belong to your company' },
          { status: 404 }
        )
      }

      teamMember = memberResult[0].member
      teamMemberProfile = memberResult[0].profile

      // Check if team member is active
      if (teamMember.status !== 'active') {
        return NextResponse.json(
          { error: 'Cannot assign job to inactive team member' },
          { status: 400 }
        )
      }
    }

    // Update job assignment
    const [updated] = await db
      .update(jobs)
      .set({
        assignedTeamMemberId: validatedData.teamMemberId,
        updatedAt: new Date(),
      })
      .where(and(eq(jobs.id, id), eq(jobs.companyId, context.companyId)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Send notification to assigned team member
    if (teamMember && teamMember.email) {
      // Get job details for notification
      const [jobDetails] = await db
        .select({
          job: jobs,
          customer: customers,
          service: services,
          company: companies,
        })
        .from(jobs)
        .innerJoin(customers, eq(jobs.customerId, customers.id))
        .innerJoin(services, eq(jobs.serviceId, services.id))
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(eq(jobs.id, id))
        .limit(1)

      if (jobDetails) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // Send notification (fire and forget)
        sendJobAssignmentNotification({
          teamMemberEmail: teamMember.email,
          teamMemberName:
            teamMemberProfile?.firstName || teamMember.email.split('@')[0],
          companyName: jobDetails.company.companyName,
          customerName: `${jobDetails.customer.firstName} ${jobDetails.customer.lastName}`,
          serviceName: jobDetails.service.name,
          jobDate:
            jobDetails.job.scheduledDate ||
            new Date().toISOString().split('T')[0],
          jobTime: jobDetails.job.scheduledTime || '09:00',
          address: jobDetails.customer.addressLine1
            ? `${jobDetails.customer.addressLine1}${jobDetails.customer.city ? `, ${jobDetails.customer.city}` : ''}`
            : undefined,
          notes: jobDetails.job.notes || undefined,
          dashboardLink: `${appUrl}/jobs/${id}`,
        }).catch((err) => {
          console.error('Failed to send job assignment notification:', err)
        })
      }
    }

    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error('Error assigning job:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    if (
      errorMessage === 'Unauthorized' ||
      errorMessage === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to assign job' }, { status: 500 })
  }
}
