import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export async function GET() {
  return NextResponse.json({ ok: true })
}

async function upsertEvent(e: Stripe.Event) {
  // webhook_events table must have unique index on (source,event_id)
  await supabaseAdmin.from('webhook_events').upsert(
    {
      source: 'stripe',
      event_id: e.id,
      type: e.type,
      payload_json: e as any,
      status: 'received',
    },
    { onConflict: 'source,event_id' }
  )
}

async function alreadyProcessed(e: Stripe.Event) {
  const { data } = await supabaseAdmin
    .from('webhook_events')
    .select('id')
    .eq('source', 'stripe')
    .eq('event_id', e.id)
    .limit(1)
  return data && data.length > 0
}

async function patchByOrg(orgId: string, patch: Record<string, any>) {
  await supabaseAdmin.from('organizations').update(patch).eq('id', orgId)
}
async function patchByCustomer(customerId: string, patch: Record<string, any>) {
  await supabaseAdmin
    .from('organizations')
    .update(patch)
    .eq('stripe_customer_id', customerId)
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') as string
  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // idempotency: if we’ve seen it, short-circuit
  if (await alreadyProcessed(event))
    return NextResponse.json({ ok: true, skipped: true })
  await upsertEvent(event) // record reception

  switch (event.type) {
    case 'customer.created': {
      const c = event.data.object as Stripe.Customer
      const orgId = (c.metadata as any)?.orgId
      if (orgId) await patchByOrg(orgId, { stripe_customer_id: c.id })
      break
    }
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = (sub.metadata as any)?.orgId
      if (orgId)
        await patchByOrg(orgId, {
          stripe_customer_id: sub.customer as string,
          plan: 'pro',
          subscription_status: sub.status,
        })
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await patchByCustomer(sub.customer as string, {
        subscription_status: sub.status,
      })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await patchByCustomer(sub.customer as string, {
        subscription_status: 'canceled',
      })
      break
    }
    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice
      await patchByCustomer(inv.customer as string, {
        plan: 'pro',
        subscription_status: 'active',
      })
      break
    }
    default:
      // ignore
      break
  }

  // mark processed
  await supabaseAdmin
    .from('webhook_events')
    .update({ status: 'processed' })
    .eq('source', 'stripe')
    .eq('event_id', event.id)
  return NextResponse.json({ received: true })
}
