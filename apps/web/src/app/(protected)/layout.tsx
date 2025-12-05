import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/index.server'
import { onboardingProgress, teamMembers } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ProtectedLayoutClient } from '@/components/layout/protected-layout-client'

async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    // Get user's team member record to find their company
    const teamMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
      columns: {
        companyId: true,
      },
    })

    if (!teamMember) {
      // No company yet - needs onboarding
      return false
    }

    // Check onboarding progress
    const progress = await db.query.onboardingProgress.findFirst({
      where: eq(onboardingProgress.companyId, teamMember.companyId),
      columns: {
        criticalCompleted: true,
      },
    })

    // If no progress record or critical not completed, needs onboarding
    return progress?.criticalCompleted ?? false
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // On error, redirect to onboarding where the form can create records
    // This is safer than allowing access to a potentially broken state
    return false
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  // Redirect unauthenticated users to login
  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user needs to complete critical onboarding
  const onboardingComplete = await checkOnboardingStatus(userId)
  if (!onboardingComplete) {
    redirect('/onboarding')
  }

  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
}
