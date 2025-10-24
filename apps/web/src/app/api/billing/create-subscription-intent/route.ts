import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '@/lib/stripe'

async function getUserAndOrg() {
  const c = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies:{ get:(n)=>c.get(n)?.value, set:(n,v,o)=>c.set({name:n,value:v,...o}), remove:(n,o)=>c.set({name:n,value:'',expires:new Date(0),...o}) } }
  )
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data: prof } = await supabase.from('profiles').select('default_org_id').eq('id', user.id).single()
  if (!prof?.default_org_id) throw new Error('No default org')
  return { orgId: prof.default_org_id as string }
}

export async function POST() {
  try {
    const { orgId } = await getUserAndOrg()
    // Create a Customer for this org (webhook will store stripe_customer_id)
   const customer = await stripe.customers.create({ metadata: { orgId } })
    // Create subscription in "incomplete" state; client will confirm the payment
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_PRO_MONTHLY! }],
      payment_behavior: 'default_incomplete',
      metadata: { orgId },
      expand: ['latest_invoice.payment_intent'],
    })
    const pi = (sub.latest_invoice as any)?.payment_intent
    return NextResponse.json({ clientSecret: pi?.client_secret, subscriptionId: sub.id, customerId: customer.id })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
