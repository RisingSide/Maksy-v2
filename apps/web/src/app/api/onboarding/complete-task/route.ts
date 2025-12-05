import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { onboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  calculateCompletionPercentage,
  isOnboardingComplete,
} from '@/lib/onboarding/progress-calculator'
import { ONBOARDING_TASKS } from '@/lib/onboarding/tasks.client'
import { checkTasksCompletion } from '@/lib/onboarding/tasks.server'

export interface CompleteTaskRequest {
  taskId: string
}

/**
 * POST /api/onboarding/complete-task
 * Mark a specific onboarding task as complete
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, planType } = context
    const body: CompleteTaskRequest = await request.json()

    // Validate task ID
    const validTaskIds = ONBOARDING_TASKS.map((t) => t.id)
    if (!validTaskIds.includes(body.taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    // Fetch current progress
    const progress = await db.query.onboardingProgress.findFirst({
      where: eq(onboardingProgress.companyId, companyId),
    })

    if (!progress) {
      return NextResponse.json(
        { error: 'Onboarding progress not found' },
        { status: 404 }
      )
    }

    // Update tasks_completed
    const tasksCompleted = progress.tasksCompleted as Record<string, boolean>
    tasksCompleted[body.taskId] = true

    // Recalculate completion percentage
    const newPercentage = calculateCompletionPercentage(
      tasksCompleted,
      planType
    )
    const allComplete = isOnboardingComplete(tasksCompleted, planType)

    // Update progress
    await db
      .update(onboardingProgress)
      .set({
        tasksCompleted,
        completionPercentage: newPercentage,
        completedAt: allComplete ? new Date() : null,
        tourMode: allComplete ? 'completed' : progress.tourMode,
        updatedAt: new Date(),
      })
      .where(eq(onboardingProgress.companyId, companyId))

    return NextResponse.json({
      message: 'Task marked as complete',
      taskId: body.taskId,
      completionPercentage: newPercentage,
      allComplete,
      success: true,
    })
  } catch (error) {
    console.error('Error completing task:', error)
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}
