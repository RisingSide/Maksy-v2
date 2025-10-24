import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export async function GET() { return NextResponse.json({ ok: true }) }

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') as string
  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }
  switch (event.type) {
    case 'checkout.session.completed':
      // TODO: map event.data.object.customer -> organizations.stripe_customer_id
      break
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // TODO: update org plan/status
      break
  }
  return NextResponse.json({ received: true })
}
