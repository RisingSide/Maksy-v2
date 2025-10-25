import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        // ✅ Next 16 + @supabase/ssr current API: pass a function returning the store
        cookies: () => cookieStore,
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')

    // require an existing org
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('default_org_id')
      .eq('id', user.id)
      .single()
    if (profErr) throw new Error(profErr.message)
    const orgId = prof?.default_org_id as string
    if (!orgId)
      throw new Error(
        'No default organization. Create an org before upgrading.'
      )

    // Create a Stripe customer for this org (link back by metadata)
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { orgId },
    })

    // Link immediately in DB (no magic—server write with service role)
    await supabaseAdmin
      .from('organizations')
      .update({ stripe_customer_id: customer.id })
      .eq('id', orgId)

    // Create subscription in incomplete state (client will confirm card with Payment Element)
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_PRO_MONTHLY! }],
      payment_behavior: 'default_incomplete',
      metadata: { orgId },
      expand: ['latest_invoice.payment_intent'],
    })

    const pi = (sub.latest_invoice as any)?.payment_intent
    return NextResponse.json({
      clientSecret: pi?.client_secret,
      subscriptionId: sub.id,
      customerId: customer.id,
    })
  } catch (e: any) {
    console.error('[billing:create-subscription-intent]', e.message)
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
