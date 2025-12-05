import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/db/index.server'
import {
  onboardingProgress,
  companies,
  teamMembers,
  userProfiles,
  companySettings,
  subscriptions,
} from '@/db/schema'
import { eq } from 'drizzle-orm'

export interface CompleteCriticalRequest {
  companyName: string
  industry: string
  businessPhone: string
  businessAddress: {
    street: string
    city: string
    state: string
    zip: string
  }
  slug: string
  website?: string
}

/**
 * POST /api/onboarding/complete-critical
 * Mark Phase 1 (critical onboarding) as complete and update company info
 *
 * This endpoint handles two scenarios:
 * 1. User already has company/team_member records (from Clerk webhook)
 * 2. User is new and needs records created (webhook hasn't fired yet)
 */
export async function POST(request: Request) {
  try {
    // Get Clerk user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user || !user.emailAddresses[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const email = user.emailAddresses[0].emailAddress
    const body: CompleteCriticalRequest = await request.json()

    // Validate required fields
    if (
      !body.companyName ||
      !body.industry ||
      !body.businessPhone ||
      !body.slug
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already has a team_member record
    let teamMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    })

    let companyId: string

    if (teamMember) {
      // User already has records - just update the company
      companyId = teamMember.companyId

      await db
        .update(companies)
        .set({
          companyName: body.companyName,
          industry: body.industry,
          businessPhone: body.businessPhone,
          slug: body.slug,
          websiteUrl: body.website || null,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId))

      // Ensure subscription exists (may not have been created by webhook)
      const existingSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.companyId, companyId),
      })

      if (!existingSubscription) {
        await db.insert(subscriptions).values({
          companyId: companyId,
          planType: 'pro',
          status: 'trialing',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        })
      }

      // Ensure company_settings exists
      const existingSettings = await db.query.companySettings.findFirst({
        where: eq(companySettings.companyId, companyId),
      })

      if (!existingSettings) {
        await db.insert(companySettings).values({
          companyId: companyId,
        })
      }
    } else {
      // User doesn't have records yet - create everything
      // This handles the case where Clerk webhook hasn't fired
      console.log('Creating new company and user records for:', userId)

      const defaultTimeZone = 'America/New_York'

      // 1. Check if user_profile exists, create if not
      const existingProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId),
      })

      if (!existingProfile) {
        await db.insert(userProfiles).values({
          userId: userId,
          firstName: user.firstName || email.split('@')[0],
          lastName: user.lastName || '',
          timeZone: defaultTimeZone,
        })
      }

      // 2. Create company with the onboarding data
      const [company] = await db
        .insert(companies)
        .values({
          ownerUserId: userId,
          companyName: body.companyName,
          slug: body.slug,
          industry: body.industry,
          businessPhone: body.businessPhone,
          websiteUrl: body.website || null,
          timeZone: defaultTimeZone,
        })
        .returning()

      companyId = company.id

      // 3. Create team_member (Owner)
      await db.insert(teamMembers).values({
        companyId: company.id,
        userId: userId,
        firstName: user.firstName || email.split('@')[0],
        lastName: user.lastName || '',
        email: email,
        role: 'owner',
        status: 'active',
        acceptedAt: new Date(),
      })

      // 4. Create company_settings
      await db.insert(companySettings).values({
        companyId: company.id,
      })

      // 5. Create subscription (default to pro trial)
      await db.insert(subscriptions).values({
        companyId: company.id,
        planType: 'pro',
        status: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      })

      // 6. Create onboarding progress
      await db.insert(onboardingProgress).values({
        companyId: company.id,
        criticalCompleted: true, // Will be marked complete below
        criticalCompletedAt: new Date(),
        tasksCompleted: {
          add_services: false,
          import_customers: false,
          create_first_job: false,
          connect_stripe: false,
          customize_booking_page: false,
          add_team_members: false,
          setup_automation: false,
        },
        completionPercentage: 14, // 1 of 7 tasks complete (critical onboarding)
        tourMode: 'pending',
      })

      return NextResponse.json({
        message: 'Account created and onboarding completed successfully',
        success: true,
        companyId: company.id,
      })
    }

    // Mark critical onboarding as complete (for existing users)
    const existingProgress = await db.query.onboardingProgress.findFirst({
      where: eq(onboardingProgress.companyId, companyId),
    })

    if (existingProgress) {
      await db
        .update(onboardingProgress)
        .set({
          criticalCompleted: true,
          criticalCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(onboardingProgress.companyId, companyId))
    } else {
      // Create onboarding progress if it doesn't exist
      await db.insert(onboardingProgress).values({
        companyId: companyId,
        criticalCompleted: true,
        criticalCompletedAt: new Date(),
        tasksCompleted: {
          add_services: false,
          import_customers: false,
          create_first_job: false,
          connect_stripe: false,
          customize_booking_page: false,
          add_team_members: false,
          setup_automation: false,
        },
        completionPercentage: 14,
        tourMode: 'pending',
      })
    }

    return NextResponse.json({
      message: 'Critical onboarding completed successfully',
      success: true,
      companyId,
    })
  } catch (error) {
    console.error('Error completing critical onboarding:', error)
    return NextResponse.json(
      {
        error: 'Failed to complete critical onboarding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
