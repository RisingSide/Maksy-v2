import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export async function GET() { return NextResponse.json({ ok: true }) }

async function patchByOrg(orgId: string, patch: Record<string, any>) {
  await supabaseAdmin.from('organizations').update(patch).eq('id', orgId)
}
async function patchByCustomer(customerId: string, patch: Record<string, any>) {
  await supabaseAdmin.from('organizations').update(patch).eq('stripe_customer_id', customerId)
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') as string
  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log('[stripe] event:', event.type)

  async function ensureOrgExists(orgId: string, customerId?: string) {
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .maybeSingle()

    if (!org) {
      console.log('[stripe] creating missing org', orgId)
      await supabaseAdmin.from('organizations').insert({
        id: orgId,
        name: 'Auto-created org',
        stripe_customer_id: customerId ?? null,
      })
    }
  }

  switch (event.type) {
    case 'customer.created': {
      const c = event.data.object as Stripe.Customer
      const orgId = (c.metadata as any)?.orgId
      console.log('[stripe] customer.created orgId =', orgId)
      if (orgId) {
        await ensureOrgExists(orgId, c.id)
        await patchByOrg(orgId, { stripe_customer_id: c.id })
        console.log('[stripe] linked org ->', orgId, 'customer ->', c.id)
      }
      break
    }

    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = (sub.metadata as any)?.orgId
      if (orgId) {
        await ensureOrgExists(orgId, sub.customer as string)
        await patchByOrg(orgId, {
          stripe_customer_id: sub.customer as string,
          plan: 'pro',
          subscription_status: sub.status,
        })
        console.log('[stripe] subscription.created', orgId, sub.status)
      }
      break
    }

    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice
      console.log('[stripe] invoice.paid customer =', inv.customer)
      await patchByCustomer(inv.customer as string, {
        plan: 'pro',
        subscription_status: 'active',
      })
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await patchByCustomer(sub.customer as string, {
        subscription_status: sub.status,
      })
      break
    }

    default:
      console.log('[stripe] ignored', event.type)
  }

  return NextResponse.json({ received: true })
}
