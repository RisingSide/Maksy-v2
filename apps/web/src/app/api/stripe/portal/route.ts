import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { subscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'

/**
 * POST /api/stripe/portal
 * Create a Stripe billing portal session
 */
export async function POST() {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owners can access billing portal
    if (context.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the company owner can access billing' },
        { status: 403 }
      )
    }

    // Get subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.companyId, context.companyId),
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      )
    }

    // Create portal session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
