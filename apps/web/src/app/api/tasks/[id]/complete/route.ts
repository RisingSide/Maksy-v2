import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { tasks } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * POST /api/tasks/[id]/complete
 * Mark a task as complete (or toggle completion)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    // Get existing task
    const existingTask = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.companyId, context.companyId)),
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Toggle completion status
    const newStatus =
      existingTask.status === 'complete' ? 'incomplete' : 'complete'

    // Update task
    const [updated] = await db
      .update(tasks)
      .set({
        status: newStatus,
        completedAt: newStatus === 'complete' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.companyId, context.companyId)))
      .returning()

    return NextResponse.json({
      success: true,
      message:
        newStatus === 'complete'
          ? 'Task marked as complete'
          : 'Task marked as incomplete',
      task: updated,
    })
  } catch (error: any) {
    console.error('Error completing task:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}
