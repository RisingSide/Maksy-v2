import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/index.server'
import { onboardingProgress, teamMembers, subscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/onboarding/progress
 * Get current onboarding progress for the authenticated user's company
 *
 * Handles new users gracefully - returns appropriate status instead of errors
 */
export async function GET() {
  try {
    // Get Clerk user ID directly (don't use getAuthContext which requires company)
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get user's team member record
    const teamMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
      columns: {
        companyId: true,
      },
    })

    // New user - no company yet
    if (!teamMember) {
      return NextResponse.json({
        progress: null,
        isNewUser: true,
        message: 'User has not completed initial setup yet',
      })
    }

    const { companyId } = teamMember

    // Fetch onboarding progress
    const progress = await db.query.onboardingProgress.findFirst({
      where: eq(onboardingProgress.companyId, companyId),
    })

    if (!progress) {
      // Company exists but no onboarding progress record
      // This can happen if webhook created company but not onboarding record
      return NextResponse.json({
        progress: {
          criticalCompleted: false,
          tasksCompleted: {},
          completionPercentage: 0,
          tourMode: 'pending',
        },
        isNewUser: false,
        needsOnboarding: true,
        message: 'Onboarding progress not initialized',
      })
    }

    // Get subscription for plan type
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.companyId, companyId),
      columns: {
        planType: true,
      },
    })

    return NextResponse.json({
      progress: {
        ...progress,
        planType: subscription?.planType || 'pro',
      },
      isNewUser: false,
      needsOnboarding: !progress.criticalCompleted,
      message: 'Onboarding progress fetched successfully',
    })
  } catch (error) {
    console.error('Error fetching onboarding progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding progress' },
      { status: 500 }
    )
  }
}
