import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { jobs } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * PATCH /api/jobs/[id]/status
 * Update job status
 * Separate endpoint for status updates to allow for specific business logic
 */

const updateStatusSchema = z.object({
  status: z.enum([
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  notes: z.string().optional().nullable(),
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
    const validatedData = updateStatusSchema.parse(body)

    // Check if job exists and belongs to company
    const existingJob = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, id), eq(jobs.companyId, context.companyId)),
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Validate status transition (business logic)
    // Prevent going backward from 'completed' to other statuses
    if (
      existingJob.status === 'completed' &&
      validatedData.status !== 'completed'
    ) {
      return NextResponse.json(
        { error: 'Cannot change status of completed job' },
        { status: 400 }
      )
    }

    // Prevent going from 'cancelled' to other statuses
    if (
      existingJob.status === 'cancelled' &&
      validatedData.status !== 'cancelled'
    ) {
      return NextResponse.json(
        { error: 'Cannot change status of cancelled job' },
        { status: 400 }
      )
    }

    // Update job status
    const updateData: any = {
      status: validatedData.status,
      updatedAt: new Date(),
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

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
    console.error('Error updating job status:', error)

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

    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    )
  }
}
