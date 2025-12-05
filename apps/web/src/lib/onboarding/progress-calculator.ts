import {
  ONBOARDING_TASKS,
  getTasksForPlan,
  type OnboardingTask,
} from './tasks.client'

export interface TaskCompletionStatus {
  [taskId: string]: boolean
}

/**
 * Calculate overall completion percentage based on completed tasks
 * @param tasksCompleted - Object with task IDs as keys and boolean completion status
 * @param planType - User's subscription plan
 * @returns Completion percentage (0-100)
 */
export function calculateCompletionPercentage(
  tasksCompleted: TaskCompletionStatus,
  planType: 'pro' | 'scale' | 'team'
): number {
  // Get tasks available for this plan
  const availableTasks = getTasksForPlan(planType)

  // Calculate total weight of available tasks
  const totalWeight = availableTasks.reduce((sum, task) => sum + task.weight, 0)

  // Calculate weight of completed tasks
  const completedWeight = availableTasks.reduce((sum, task) => {
    return tasksCompleted[task.id] ? sum + task.weight : sum
  }, 0)

  // Return percentage (rounded to nearest integer)
  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
}

/**
 * Get list of incomplete tasks
 */
export function getIncompleteTasks(
  tasksCompleted: TaskCompletionStatus,
  planType: 'pro' | 'scale' | 'team'
) {
  const availableTasks = getTasksForPlan(planType)
  return availableTasks.filter((task) => !tasksCompleted[task.id])
}

/**
 * Get list of completed tasks
 */
export function getCompletedTasks(
  tasksCompleted: TaskCompletionStatus,
  planType: 'pro' | 'scale' | 'team'
) {
  const availableTasks = getTasksForPlan(planType)
  return availableTasks.filter((task) => tasksCompleted[task.id])
}

/**
 * Check if all tasks are completed
 */
export function isOnboardingComplete(
  tasksCompleted: TaskCompletionStatus,
  planType: 'pro' | 'scale' | 'team'
): boolean {
  const availableTasks = getTasksForPlan(planType)
  return availableTasks.every((task) => tasksCompleted[task.id])
}
