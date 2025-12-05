/**
 * Subscription API
 *
 * GET /api/subscription - Get current user's subscription
 */

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { subscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.companyId, context.companyId),
      columns: {
        id: true,
        planType: true,
        seatCount: true,
        status: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error fetching subscription:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
