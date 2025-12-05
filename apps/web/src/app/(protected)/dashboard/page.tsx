import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { onboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  // Get auth context
  const context = await getAuthContext()

  // Fetch onboarding progress
  let showOnboardingBanner = false
  if (context) {
    const progress = await db.query.onboardingProgress.findFirst({
      where: eq(onboardingProgress.companyId, context.companyId),
    })

    // Show banner if not dismissed and not completed
    showOnboardingBanner = !!(
      progress &&
      !progress.dismissedAt &&
      !progress.completedAt &&
      progress.criticalCompleted
    )
  }

  return (
    <DashboardContent
      showOnboarding={showOnboardingBanner}
      companyId={context?.companyId || ''}
      planType={context?.planType || 'pro'}
    />
  )
}
