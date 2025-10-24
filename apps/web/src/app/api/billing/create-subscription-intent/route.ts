import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '@/lib/stripe'

async function getUserAndOrg() {
  // ✅ Next 16: cookies() is async
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options?: any) => cookieStore.set(name, value, options),
        remove: (name: string, options?: any) => cookieStore.delete(name, options),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data: prof } = await supabase
    .from('profiles')
    .select('default_org_id')
    .eq('id', user.id)
    .single()

  if (!prof?.default_org_id) throw new Error('No default org')
  return { orgId: prof.default_org_id as string }
}

export async function POST() {
  try {
    const { orgId } = await getUserAndOrg()

    // 1) Create Stripe customer with orgId metadata
    const customer = await stripe.customers.create({ metadata: { orgId } })

    // 2) Immediately link it in Supabase (no magic — server writes to DB)
    //    Requires SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local (no NEXT_PUBLIC)
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    await supabaseAdmin
      .from('organizations')
      .update({ stripe_customer_id: customer.id })
      .eq('id', orgId)

    // 3) Create subscription (incomplete — client confirms card)
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
    console.error('[create-subscription-intent] error:', e)
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
