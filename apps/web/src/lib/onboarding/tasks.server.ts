import { db } from '@/db/index.server'
import {
  services,
  customers,
  jobs,
  companySettings,
  teamMembers,
  automations,
} from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'

/**
 * Server-side completion checks for onboarding tasks
 *
 * IMPORTANT: Task IDs must match:
 * - tasks.client.ts ONBOARDING_TASKS
 * - Clerk webhook tasksCompleted object
 */
export const TASK_COMPLETION_CHECKS: Record<
  string,
  (companyId: string) => Promise<boolean>
> = {
  add_services: async (companyId: string) => {
    const serviceList = await db.query.services.findMany({
      where: eq(services.companyId, companyId),
      limit: 1,
    })
    return serviceList.length >= 1
  },

  import_customers: async (companyId: string) => {
    const customerList = await db.query.customers.findMany({
      where: eq(customers.companyId, companyId),
      limit: 1,
    })
    return customerList.length >= 1
  },

  create_first_job: async (companyId: string) => {
    const jobList = await db.query.jobs.findMany({
      where: eq(jobs.companyId, companyId),
      limit: 1,
    })
    return jobList.length >= 1
  },

  connect_stripe: async (companyId: string) => {
    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.companyId, companyId),
    })
    return settings?.stripeConnected ?? false
  },

  customize_booking_page: async (companyId: string) => {
    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.companyId, companyId),
    })
    // Check if booking page colors have been customized (changed from defaults)
    // Default is #f4a125 - if different, user has customized
    return !!(
      settings &&
      (settings.bookingPagePrimaryColor !== '#f4a125' ||
        settings.bookingPageButtonColor !== '#f4a125' ||
        settings.removeMaksyBranding === true)
    )
  },

  add_team_members: async (companyId: string) => {
    // Check for team members other than the owner
    const teamMemberList = await db.query.teamMembers.findMany({
      where: and(
        eq(teamMembers.companyId, companyId),
        ne(teamMembers.role, 'owner')
      ),
      limit: 1,
    })
    return teamMemberList.length >= 1
  },

  setup_automation: async (companyId: string) => {
    const automationList = await db.query.automations.findMany({
      where: eq(automations.companyId, companyId),
      limit: 1,
    })
    return automationList.length >= 1
  },
}

/**
 * Check multiple tasks completion status
 */
export async function checkTasksCompletion(
  companyId: string,
  taskIds: string[]
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}

  await Promise.all(
    taskIds.map(async (taskId) => {
      const check = TASK_COMPLETION_CHECKS[taskId]
      if (check) {
        try {
          results[taskId] = await check(companyId)
        } catch (error) {
          console.error(`Error checking task ${taskId}:`, error)
          results[taskId] = false
        }
      } else {
        results[taskId] = false
      }
    })
  )

  return results
}

/**
 * Check all tasks for a company and return completion status
 */
export async function checkAllTasksCompletion(
  companyId: string
): Promise<Record<string, boolean>> {
  const allTaskIds = Object.keys(TASK_COMPLETION_CHECKS)
  return checkTasksCompletion(companyId, allTaskIds)
}
