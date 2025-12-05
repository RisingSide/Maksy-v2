import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { subscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/maksy/usage
 * Get AI usage statistics for the current billing period
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscription to determine limits
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.companyId, context.companyId),
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 403 }
      )
    }

    // Determine AI limits based on plan
    const planLimits: Record<
      string,
      { monthlyMessages: number; tokensPerMessage: number }
    > = {
      pro: { monthlyMessages: 100, tokensPerMessage: 500 },
      scale: { monthlyMessages: 1000, tokensPerMessage: 1000 },
      team: { monthlyMessages: 500, tokensPerMessage: 500 },
    }

    const limits = planLimits[subscription.planType] || planLimits.pro

    // TODO: Get actual usage from ai_usage_logs table
    // For now, return mock data
    const currentUsage = {
      messagesUsed: 0,
      tokensUsed: 0,
      lastUsed: null,
    }

    return NextResponse.json({
      plan: subscription.planType,
      limits: {
        monthlyMessages: limits.monthlyMessages,
        tokensPerMessage: limits.tokensPerMessage,
      },
      usage: {
        messagesUsed: currentUsage.messagesUsed,
        messagesRemaining: limits.monthlyMessages - currentUsage.messagesUsed,
        tokensUsed: currentUsage.tokensUsed,
        lastUsed: currentUsage.lastUsed,
      },
      billingPeriod: {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd,
      },
    })
  } catch (error: any) {
    console.error('Error fetching AI usage:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch AI usage' },
      { status: 500 }
    )
  }
}
