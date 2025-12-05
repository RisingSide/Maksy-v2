import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { subscriptions, companies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session for subscription
 */

const checkoutSchema = z.object({
  planType: z.enum(['pro', 'scale', 'team']),
})

// Stripe price IDs (should be in env vars in production)
const PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
  scale: process.env.STRIPE_SCALE_PRICE_ID || 'price_scale',
  team: process.env.STRIPE_TEAM_PRICE_ID || 'price_team',
}

export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owners can upgrade
    if (context.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the company owner can upgrade the plan' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { planType } = checkoutSchema.parse(body)

    // Get company
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, context.companyId),
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.companyId, context.companyId),
    })

    let customerId = subscription?.stripeCustomerId

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: company.businessEmail || undefined,
        name: company.companyName,
        metadata: {
          companyId: company.id,
        },
      })
      customerId = customer.id

      // Update subscription record with customer ID
      if (subscription) {
        await db
          .update(subscriptions)
          .set({ stripeCustomerId: customerId })
          .where(eq(subscriptions.id, subscription.id))
      }
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const priceId = PRICE_IDS[planType]

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/settings/billing?success=true`,
      cancel_url: `${appUrl}/settings/billing?canceled=true`,
      metadata: {
        companyId: company.id,
        planType,
      },
      subscription_data: {
        metadata: {
          companyId: company.id,
          planType,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
