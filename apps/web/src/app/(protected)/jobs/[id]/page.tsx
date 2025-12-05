import { notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import {
  jobs,
  customers,
  services,
  teamMembers,
  userProfiles,
  jobMedia,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { JobDetailClient } from './client'

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const context = await getAuthContext()

  if (!context) {
    return <div>Unauthorized</div>
  }

  const { id } = await params

  // Fetch job with related data
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, id), eq(jobs.companyId, context.companyId)),
  })

  if (!job) {
    notFound()
  }

  // Fetch customer
  const customer = job.customerId
    ? await db.query.customers.findFirst({
        where: eq(customers.id, job.customerId),
      })
    : null

  // Fetch service
  const service = job.serviceId
    ? await db.query.services.findFirst({
        where: eq(services.id, job.serviceId),
      })
    : null

  // Fetch assigned team member
  let assignedMember = null
  if (job.assignedTeamMemberId) {
    const teamMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.id, job.assignedTeamMemberId),
        eq(teamMembers.companyId, context.companyId)
      ),
    })
    if (teamMember && teamMember.userId) {
      const userProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, teamMember.userId),
      })
      assignedMember = userProfile
        ? {
            id: teamMember.id,
            name:
              `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() ||
              teamMember.email,
            email: teamMember.email,
            avatarUrl: userProfile.avatarUrl,
          }
        : null
    }
  }

  // Fetch job media (before/after photos)
  const media = await db
    .select()
    .from(jobMedia)
    .where(eq(jobMedia.jobId, id))
    .orderBy(jobMedia.uploadedAt)

  // Fetch team members for assignment dropdown
  const companyTeamMembers = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      email: teamMembers.email,
      firstName: userProfiles.firstName,
      lastName: userProfiles.lastName,
      avatarUrl: userProfiles.avatarUrl,
    })
    .from(teamMembers)
    .leftJoin(userProfiles, eq(teamMembers.userId, userProfiles.userId))
    .where(eq(teamMembers.companyId, context.companyId))

  return (
    <JobDetailClient
      job={{
        id: job.id,
        jobNumber: job.jobNumber,
        status: job.status as
          | 'scheduled'
          | 'confirmed'
          | 'in_progress'
          | 'completed'
          | 'cancelled',
        scheduledDate: job.scheduledDate,
        scheduledTime: job.scheduledTime,
        durationMinutes: job.durationMinutes,
        notes: job.notes,
        customerNotes: job.customerNotes,
        totalPrice: job.totalPrice
          ? parseFloat(job.totalPrice.toString())
          : null,
        paymentStatus: job.paymentStatus,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      }}
      customer={
        customer
          ? {
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              address: customer.addressLine1
                ? {
                    line1: customer.addressLine1,
                    line2: customer.addressLine2,
                    city: customer.city,
                    state: customer.state,
                    zip: customer.zipCode,
                  }
                : null,
            }
          : null
      }
      service={
        service
          ? {
              id: service.id,
              name: service.name,
              color: service.color,
              price: service.price
                ? parseFloat(service.price.toString())
                : null,
              durationMinutes: service.durationMinutes,
            }
          : null
      }
      assignedMember={assignedMember}
      media={media.map((m) => ({
        id: m.id,
        url: m.fileUrl,
        type: m.mediaType as 'before' | 'after' | 'other',
        caption: m.caption,
        uploadedAt: m.uploadedAt.toISOString(),
      }))}
      teamMembers={companyTeamMembers.map((m) => ({
        id: m.id,
        name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email,
        email: m.email,
        avatarUrl: m.avatarUrl,
        role: m.role,
      }))}
    />
  )
}
