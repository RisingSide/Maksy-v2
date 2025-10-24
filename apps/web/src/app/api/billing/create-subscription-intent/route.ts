import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options?: any) {
            // ✅ Next 16 requires object format for cookies
            cookieStore.set({ name, value, ...(options || {}) })
          },
          remove(name: string, options?: any) {
            // expire the cookie safely
            cookieStore.set({
              name,
              value: '',
              expires: new Date(0),
              ...(options || {}),
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not signed in')

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email!,
      line_items: [
        { price: process.env.STRIPE_PRICE_PRO_MONTHLY!, quantity: 1 },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (err: any) {
    console.error('Billing intent error:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
  }
}
