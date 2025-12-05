import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { jobs, jobTracking } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  jobId: z.string().uuid(),
  action: z.enum(['on-my-way', 'arrived', 'started', 'completed']),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

/**
 * POST /api/tracking/update
 * Update job tracking status (on my way, arrived, started, completed)
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    // Verify job belongs to company
    const job = await db.query.jobs.findFirst({
      where: and(
        eq(jobs.id, validatedData.jobId),
        eq(jobs.companyId, context.companyId)
      ),
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Get or create tracking record
    let tracking = await db.query.jobTracking.findFirst({
      where: eq(jobTracking.jobId, validatedData.jobId),
    })

    const now = new Date()
    const updateData: Record<string, any> = {}

    switch (validatedData.action) {
      case 'on-my-way':
        updateData.onMyWayAt = now
        if (validatedData.latitude && validatedData.longitude) {
          updateData.onMyWayLat = validatedData.latitude.toString()
          updateData.onMyWayLng = validatedData.longitude.toString()
        }
        // Update job status
        await db
          .update(jobs)
          .set({ status: 'confirmed' })
          .where(eq(jobs.id, validatedData.jobId))
        break

      case 'arrived':
        updateData.arrivedAt = now
        if (validatedData.latitude && validatedData.longitude) {
          updateData.arrivedLat = validatedData.latitude.toString()
          updateData.arrivedLng = validatedData.longitude.toString()
        }
        // Calculate drive time if we have on-my-way time
        if (tracking?.onMyWayAt) {
          const driveTime = Math.round(
            (now.getTime() - new Date(tracking.onMyWayAt).getTime()) / 60000
          )
          updateData.driveTimeMinutes = driveTime
        }
        break

      case 'started':
        updateData.startedAt = now
        // Update job status
        await db
          .update(jobs)
          .set({ status: 'in_progress' })
          .where(eq(jobs.id, validatedData.jobId))
        break

      case 'completed':
        updateData.completedAt = now
        // Calculate job duration if we have started time
        if (tracking?.startedAt) {
          const jobDuration = Math.round(
            (now.getTime() - new Date(tracking.startedAt).getTime()) / 60000
          )
          updateData.jobDurationMinutes = jobDuration
        }
        // Update job status
        await db
          .update(jobs)
          .set({ status: 'completed' })
          .where(eq(jobs.id, validatedData.jobId))
        break
    }

    // Insert or update tracking record
    if (tracking) {
      await db
        .update(jobTracking)
        .set(updateData)
        .where(eq(jobTracking.id, tracking.id))
    } else {
      await db.insert(jobTracking).values({
        jobId: validatedData.jobId,
        ...updateData,
      })
    }

    return NextResponse.json({ success: true, action: validatedData.action })
  } catch (error) {
    console.error('Error updating tracking:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update tracking' },
      { status: 500 }
    )
  }
}
