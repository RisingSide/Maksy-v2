/**
 * Client-safe onboarding task definitions
 * This file contains only the task metadata without any database imports
 *
 * IMPORTANT: Task IDs must match the keys in the Clerk webhook's tasksCompleted object
 * See: apps/web/src/app/api/clerk/webhook/route.ts
 */

export interface OnboardingTask {
  id: string
  title: string
  description: string
  weight: number // Relative weight for progress calculation (percentage is normalized per plan)
  targetRoute: string
  spotlightSelector: string // CSS selector to highlight with spotlight
  helperText: string
  requiredPlan?: 'pro' | 'scale' | 'team' // If set, task is only available to this plan and above
}

/**
 * Define all onboarding tasks metadata (without DB checks)
 *
 * Task IDs must match the Clerk webhook initialization:
 * - add_services
 * - import_customers
 * - create_first_job
 * - connect_stripe
 * - customize_booking_page
 * - add_team_members
 * - setup_automation
 */
export const ONBOARDING_TASKS: OnboardingTask[] = [
  {
    id: 'add_services',
    title: 'Add Your Services',
    description: 'Add 2-5 services you commonly offer',
    weight: 20,
    targetRoute: '/services',
    spotlightSelector: '[data-action="add-service"]',
    helperText:
      'Click here to add your first service! Add the services you offer most often. You can always add more later.',
  },
  {
    id: 'import_customers',
    title: 'Import Customer List',
    description: 'Upload your existing customers (optional)',
    weight: 10,
    targetRoute: '/customers',
    spotlightSelector: '[data-action="import-csv"]',
    helperText:
      'Upload a CSV of your existing customers to save time, or skip this step for now!',
  },
  {
    id: 'create_first_job',
    title: 'Schedule Your First Job',
    description: 'Add a job to your calendar',
    weight: 20,
    targetRoute: '/jobs',
    spotlightSelector: '[data-action="add-job"]',
    helperText:
      "Let's schedule your first job! This helps you see how the calendar and scheduling works.",
  },
  {
    id: 'connect_stripe',
    title: 'Connect Stripe',
    description: 'Set up payment processing to accept payments',
    weight: 15,
    targetRoute: '/settings/billing',
    spotlightSelector: '[data-action="connect-stripe"]',
    helperText:
      'Connect your Stripe account to start accepting payments from customers.',
  },
  {
    id: 'customize_booking_page',
    title: 'Customize Booking Page',
    description: 'Personalize your customer booking experience',
    weight: 10,
    targetRoute: '/settings/booking',
    spotlightSelector: '[data-action="customize-booking"]',
    helperText:
      'Make your booking page match your brand! Add your logo and customize colors.',
  },
  {
    id: 'add_team_members',
    title: 'Invite Team Members',
    description: 'Add team members to help manage operations',
    weight: 15,
    targetRoute: '/settings/team',
    spotlightSelector: '[data-action="invite-team"]',
    helperText:
      'Invite your team members so they can help with jobs and tasks.',
    requiredPlan: 'scale', // Only for scale and above
  },
  {
    id: 'setup_automation',
    title: 'Set Up Automations',
    description: 'Create automated workflows for common tasks',
    weight: 10,
    targetRoute: '/automations',
    spotlightSelector: '[data-action="create-automation"]',
    helperText:
      'Save time with automations! Start with a simple reminder automation.',
    requiredPlan: 'scale', // Only for scale and above
  },
]

/**
 * Get tasks available for a specific plan
 * Plan hierarchy: team (basic) < pro < scale
 */
export function getTasksForPlan(
  plan: 'pro' | 'scale' | 'team'
): OnboardingTask[] {
  const planHierarchy: Record<string, number> = {
    team: 1,
    pro: 2,
    scale: 3,
  }

  return ONBOARDING_TASKS.filter((task) => {
    // Tasks without a requiredPlan are available to all
    if (!task.requiredPlan) return true

    // Check if user's plan level is >= required plan level
    return planHierarchy[plan] >= planHierarchy[task.requiredPlan]
  })
}

/**
 * Calculate total weight of tasks for a plan
 */
export function getTotalWeight(plan: 'pro' | 'scale' | 'team'): number {
  const tasks = getTasksForPlan(plan)
  return tasks.reduce((sum, task) => sum + task.weight, 0)
}

/**
 * Calculate completion percentage based on completed tasks
 */
export function calculateCompletionPercentage(
  plan: 'pro' | 'scale' | 'team',
  completedTaskIds: string[]
): number {
  const tasks = getTasksForPlan(plan)
  const totalWeight = getTotalWeight(plan)

  if (totalWeight === 0) return 100

  const completedWeight = tasks
    .filter((task) => completedTaskIds.includes(task.id))
    .reduce((sum, task) => sum + task.weight, 0)

  return Math.round((completedWeight / totalWeight) * 100)
}
