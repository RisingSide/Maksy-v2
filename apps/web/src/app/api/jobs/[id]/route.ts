import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { jobs, customers, services, teamMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/jobs/[id]
 * Get a single job by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const result = await db
      .select({
        job: jobs,
        customer: customers,
        service: services,
        teamMember: teamMembers,
      })
      .from(jobs)
      .innerJoin(customers, eq(jobs.customerId, customers.id))
      .innerJoin(services, eq(jobs.serviceId, services.id))
      .leftJoin(teamMembers, eq(jobs.assignedTeamMemberId, teamMembers.id))
      .where(and(eq(jobs.id, id), eq(jobs.companyId, context.companyId)))
      .limit(1)

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const jobWithRelations = {
      ...result[0].job,
      customer: result[0].customer,
      service: result[0].service,
      teamMember: result[0].teamMember,
    }

    return NextResponse.json(jobWithRelations)
  } catch (error: any) {
    console.error('Error fetching job:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update a job
 */

const updateJobSchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID').optional(),
  serviceId: z.string().uuid('Service ID must be a valid UUID').optional(),
  assignedTeamMemberId: z
    .string()
    .uuid('Team member ID must be a valid UUID')
    .optional()
    .nullable(),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be in HH:MM or HH:MM:SS format')
    .optional(),
  durationMinutes: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .optional(),
  status: z
    .enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  notes: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z
    .enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
    .optional()
    .nullable(),
  recurringUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  totalPrice: z.number().min(0, 'Total price must be positive').optional(),
  paymentStatus: z.enum(['unpaid', 'paid', 'partial']).optional(),
  paymentMethod: z.string().optional().nullable(),
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
    const validatedData = updateJobSchema.parse(body)

    // Check if job exists and belongs to company
    const existingJob = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, id), eq(jobs.companyId, context.companyId)),
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify customer belongs to company (if updating)
    if (validatedData.customerId) {
      const customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.id, validatedData.customerId),
          eq(customers.companyId, context.companyId)
        ),
      })

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found or does not belong to your company' },
          { status: 404 }
        )
      }
    }

    // Verify service belongs to company (if updating)
    if (validatedData.serviceId) {
      const service = await db.query.services.findFirst({
        where: and(
          eq(services.id, validatedData.serviceId),
          eq(services.companyId, context.companyId)
        ),
      })

      if (!service) {
        return NextResponse.json(
          { error: 'Service not found or does not belong to your company' },
          { status: 404 }
        )
      }
    }

    // Verify team member belongs to company (if updating)
    if (validatedData.assignedTeamMemberId) {
      const teamMember = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.id, validatedData.assignedTeamMemberId),
          eq(teamMembers.companyId, context.companyId)
        ),
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'Team member not found or does not belong to your company' },
          { status: 404 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (validatedData.customerId !== undefined)
      updateData.customerId = validatedData.customerId
    if (validatedData.serviceId !== undefined)
      updateData.serviceId = validatedData.serviceId
    if (validatedData.assignedTeamMemberId !== undefined)
      updateData.assignedTeamMemberId = validatedData.assignedTeamMemberId
    if (validatedData.scheduledDate !== undefined)
      updateData.scheduledDate = validatedData.scheduledDate
    if (validatedData.scheduledTime !== undefined)
      updateData.scheduledTime = validatedData.scheduledTime
    if (validatedData.durationMinutes !== undefined)
      updateData.durationMinutes = validatedData.durationMinutes
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes
    if (validatedData.customerNotes !== undefined)
      updateData.customerNotes = validatedData.customerNotes
    if (validatedData.isRecurring !== undefined)
      updateData.isRecurring = validatedData.isRecurring
    if (validatedData.recurringFrequency !== undefined)
      updateData.recurringFrequency = validatedData.recurringFrequency
    if (validatedData.recurringUntil !== undefined)
      updateData.recurringUntil = validatedData.recurringUntil
    if (validatedData.totalPrice !== undefined)
      updateData.totalPrice = validatedData.totalPrice.toString()
    if (validatedData.paymentStatus !== undefined)
      updateData.paymentStatus = validatedData.paymentStatus
    if (validatedData.paymentMethod !== undefined)
      updateData.paymentMethod = validatedData.paymentMethod

    updateData.updatedAt = new Date()

    // Update job
    const [updated] = await db
      .update(jobs)
      .set(updateData)
      .where(and(eq(jobs.id, id), eq(jobs.companyId, context.companyId)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating job:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

/**
 * DELETE /api/jobs/[id]
 * Delete a job
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    // Check if job exists and belongs to company
    const existingJob = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, id), eq(jobs.companyId, context.companyId)),
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Delete job (cascades to job_add_ons, job_tracking, etc.)
    await db
      .delete(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.companyId, context.companyId)))

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting job:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for foreign key constraint (job is referenced elsewhere)
    if (error.code === '23503') {
      return NextResponse.json(
        {
          error:
            'Cannot delete job that is referenced in invoices or other records',
        },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
