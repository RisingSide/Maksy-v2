import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { tasks, teamMembers, customers, jobs } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
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

    // Get task with related data
    const result = await db
      .select({
        task: tasks,
        assignedTo: teamMembers,
        customer: customers,
        job: jobs,
      })
      .from(tasks)
      .leftJoin(teamMembers, eq(tasks.assignedToTeamMemberId, teamMembers.id))
      .leftJoin(customers, eq(tasks.linkedCustomerId, customers.id))
      .leftJoin(jobs, eq(tasks.linkedJobId, jobs.id))
      .where(and(eq(tasks.id, id), eq(tasks.companyId, context.companyId)))
      .limit(1)

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const taskWithDetails = {
      ...result[0].task,
      assignedTo: result[0].assignedTo,
      customer: result[0].customer,
      job: result[0].job,
    }

    return NextResponse.json(taskWithDetails)
  } catch (error: any) {
    console.error('Error fetching task:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['incomplete', 'complete']).optional(),
  assignedToTeamMemberId: z.string().uuid().optional().nullable(),
  linkedCustomerId: z.string().uuid().optional().nullable(),
  linkedJobId: z.string().uuid().optional().nullable(),
  reminderEnabled: z.boolean().optional(),
  reminderFrequency: z.enum(['once', 'daily', 'weekly']).optional().nullable(),
  reminderType: z.enum(['email', 'sms', 'push']).optional().nullable(),
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
    const validatedData = updateTaskSchema.parse(body)

    // Check if task exists and belongs to company
    const existingTask = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.companyId, context.companyId)),
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify team member belongs to company (if provided)
    if (validatedData.assignedToTeamMemberId) {
      const teamMember = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.id, validatedData.assignedToTeamMemberId),
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
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description
    if (validatedData.dueDate !== undefined)
      updateData.dueDate = validatedData.dueDate
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      // Set completedAt if marking as complete
      if (
        validatedData.status === 'complete' &&
        existingTask.status !== 'complete'
      ) {
        updateData.completedAt = new Date()
      } else if (validatedData.status === 'incomplete') {
        updateData.completedAt = null
      }
    }
    if (validatedData.assignedToTeamMemberId !== undefined)
      updateData.assignedToTeamMemberId = validatedData.assignedToTeamMemberId
    if (validatedData.linkedCustomerId !== undefined)
      updateData.linkedCustomerId = validatedData.linkedCustomerId
    if (validatedData.linkedJobId !== undefined)
      updateData.linkedJobId = validatedData.linkedJobId
    if (validatedData.reminderEnabled !== undefined)
      updateData.reminderEnabled = validatedData.reminderEnabled
    if (validatedData.reminderFrequency !== undefined)
      updateData.reminderFrequency = validatedData.reminderFrequency
    if (validatedData.reminderType !== undefined)
      updateData.reminderType = validatedData.reminderType

    // Update task
    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.companyId, context.companyId)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating task:', error)

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
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
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

    // Check if task exists and belongs to company
    const existingTask = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.companyId, context.companyId)),
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete task
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.companyId, context.companyId)))

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting task:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
