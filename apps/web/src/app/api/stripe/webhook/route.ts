/**
 * Stripe Webhook Handler
 *
 * Handles all Stripe events including:
 * - Subscription events (checkout, invoice, subscription updates)
 * - Payment Intent events (direct job/invoice payments)
 * - Charge events (refunds)
 *
 * SECURITY: Always verify webhook signature before processing
 */

import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/index.server'
import { subscriptions, invoices, payments, jobs } from '@/db/schema'
import { eq } from 'drizzle-orm'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Processing Stripe event: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      // ========================================================================
      // SUBSCRIPTION EVENTS
      // ========================================================================

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      // ========================================================================
      // PAYMENT INTENT EVENTS (NEW - Direct job/invoice payments)
      // ========================================================================

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(paymentIntent)
        break
      }

      // ========================================================================
      // CHARGE EVENTS (Refunds)
      // ========================================================================

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// ============================================================================
// SUBSCRIPTION EVENT HANDLERS
// ============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Handling checkout.session.completed')

  const stripeCustomerId = session.customer as string
  const stripeSubscriptionId = session.subscription as string
  const companyId = session.metadata?.company_id

  if (!companyId) {
    console.error('Missing company_id in session metadata')
    return
  }

  // Update subscription record using Drizzle
  try {
    await db
      .update(subscriptions)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'trialing', // Subscription starts in trial
      })
      .where(eq(subscriptions.companyId, companyId))
  } catch (error) {
    console.error('Failed to update subscription:', error)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Handling invoice.paid')

  const stripeCustomerId = invoice.customer as string

  // Update subscription status using Drizzle
  try {
    await db
      .update(subscriptions)
      .set({
        status: 'active',
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
      })
      .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
  } catch (error) {
    console.error('Failed to update subscription:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Handling invoice.payment_failed')

  const stripeCustomerId = invoice.customer as string

  // Update subscription status using Drizzle
  try {
    await db
      .update(subscriptions)
      .set({
        status: 'past_due',
      })
      .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
  } catch (error) {
    console.error('Failed to update subscription:', error)
  }

  // TODO: Send notification to admin about failed payment
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Handling customer.subscription.updated')

  const stripeCustomerId = subscription.customer as string

  // Get all subscription items (base + seats for Team plan)
  const items = subscription.items.data
  const basePriceItem = items[0] // First item is always the base plan
  const seatPriceItem = items.find((item) => item.price.id?.includes('seat')) // Additional item for Team plan seats

  const basePriceId = basePriceItem?.price.id

  // Determine plan type from price ID
  let planType: 'pro' | 'scale' | 'team' = 'pro'
  if (basePriceId?.includes('pro')) planType = 'pro'
  if (basePriceId?.includes('scale')) planType = 'scale'
  if (basePriceId?.includes('team')) planType = 'team'

  // Calculate seat count for Team plan
  const seatCount =
    planType === 'team' && seatPriceItem
      ? (seatPriceItem.quantity || 0) + 1 // +1 for the base seat
      : 1

  // Access raw subscription data for fields that may not be in TypeScript types
  // The Stripe API returns these fields but newer type definitions may not include them
  const rawSubscription = subscription as unknown as {
    cancel_at_period_end?: boolean
    current_period_start?: number
    current_period_end?: number
  }

  const updateData: Record<string, unknown> = {
    planType,
    status: subscription.status,
    stripePriceId: basePriceId,
    seatCount,
    // Sync cancel_at_period_end from Stripe
    // This indicates user's intent to cancel at period end (subscription still active)
    cancelAtPeriodEnd: rawSubscription.cancel_at_period_end ?? false,
  }

  // Update period dates if available
  if (rawSubscription.current_period_start) {
    updateData.currentPeriodStart = new Date(
      rawSubscription.current_period_start * 1000
    )
  }
  if (rawSubscription.current_period_end) {
    updateData.currentPeriodEnd = new Date(
      rawSubscription.current_period_end * 1000
    )
  }

  // Add seat price ID for Team plan
  if (planType === 'team' && seatPriceItem) {
    updateData.stripeSeatPriceId = seatPriceItem.price.id
  }

  try {
    await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
  } catch (error) {
    console.error('Failed to update subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Handling customer.subscription.deleted')

  const stripeCustomerId = subscription.customer as string

  try {
    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
      })
      .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
  } catch (error) {
    console.error('Failed to update subscription:', error)
  }
}

// ============================================================================
// PAYMENT INTENT EVENT HANDLERS (NEW)
// ============================================================================

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('Handling payment_intent.succeeded')

  const paymentIntentId = paymentIntent.id

  try {
    // Find invoice by payment_intent_id using Drizzle
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.stripePaymentIntentId, paymentIntentId),
    })

    if (!invoice) {
      console.log('No invoice found for payment intent:', paymentIntentId)
      return
    }

    // Update invoice status to paid
    await db
      .update(invoices)
      .set({
        status: 'paid',
        paidAt: new Date(),
        amountPaid: (paymentIntent.amount / 100).toString(), // Convert from cents to string
      })
      .where(eq(invoices.id, invoice.id))

    // Create payment record
    await db.insert(payments).values({
      companyId: invoice.companyId,
      invoiceId: invoice.id,
      amount: (paymentIntent.amount / 100).toString(), // Convert to string
      paymentMethod: 'card',
      paymentDate: new Date().toISOString().split('T')[0], // Convert to YYYY-MM-DD format for date field
      stripePaymentIntentId: paymentIntentId,
    })

    // If invoice is linked to a job, update job payment status
    if (invoice.jobId) {
      await db
        .update(jobs)
        .set({
          paymentStatus: 'paid',
        })
        .where(eq(jobs.id, invoice.jobId))
    }

    // TODO: Send receipt email to customer
    console.log(`Payment succeeded for invoice ${invoice.invoiceNumber}`)
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Handling payment_intent.payment_failed')

  const paymentIntentId = paymentIntent.id

  try {
    // Find invoice by payment_intent_id using Drizzle
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.stripePaymentIntentId, paymentIntentId),
    })

    if (!invoice) {
      console.log('No invoice found for payment intent:', paymentIntentId)
      return
    }

    // Log the failure (don't change invoice status yet, as Stripe will retry)
    console.error(`Payment failed for invoice ${invoice.invoiceNumber}`)

    // TODO: Send notification to admin about failed payment
  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}

// ============================================================================
// CHARGE EVENT HANDLERS
// ============================================================================

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Handling charge.refunded')

  const paymentIntentId = charge.payment_intent as string
  const refundedAmount = charge.amount_refunded / 100 // Convert from cents

  try {
    // Find payment by payment_intent_id using Drizzle
    const payment = await db.query.payments.findFirst({
      where: eq(payments.stripePaymentIntentId, paymentIntentId),
    })

    if (!payment) {
      console.log('No payment found for charge:', charge.id)
      return
    }

    // Update invoice amount_paid
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, payment.invoiceId),
    })

    if (invoice) {
      const currentAmountPaid = parseFloat(
        invoice.amountPaid?.toString() || '0'
      )
      const invoiceTotal = parseFloat(invoice.total?.toString() || '0')
      const newAmountPaid = Math.max(0, currentAmountPaid - refundedAmount)
      const newStatus =
        newAmountPaid >= invoiceTotal
          ? 'paid'
          : newAmountPaid > 0
            ? 'partially_paid'
            : 'unpaid'

      await db
        .update(invoices)
        .set({
          amountPaid: newAmountPaid.toString(),
          status: newStatus as any,
        })
        .where(eq(invoices.id, invoice.id))

      console.log(
        `Refunded ${refundedAmount} for invoice ${invoice.invoiceNumber}`
      )
    }

    // TODO: Send refund notification to customer
  } catch (error) {
    console.error('Error handling charge refunded:', error)
  }
}
