'use client'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import React, { useState } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function Form({
  clientSecret,
  onDone,
}: {
  clientSecret: string
  onDone: (ok: boolean, msg?: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || loading) return
    setLoading(true)

    // ✅ REQUIRED: collect & validate any fields in Payment Element
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setLoading(false)
      onDone(false, submitError.message)
      return
    }

    // Then confirm the payment (no redirect in test mode)
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: 'if_required',
    })

    setLoading(false)
    onDone(!error, error?.message)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement />
      <button
        className="bg-amber-500 text-white rounded px-4 py-2 w-full disabled:opacity-50"
        disabled={!stripe || loading}
      >
        {loading ? 'Processing…' : 'Start Pro'}
      </button>
    </form>
  )
}

export default function UpgradeModal() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  async function start() {
    const res = await fetch('/api/billing/create-subscription-intent', { method: 'POST' })
    const json = await res.json()
    if (json.clientSecret) { setClientSecret(json.clientSecret); setOpen(true) } else { alert(json.error || 'Failed') }
  }
  return (
    <div>
      <button onClick={start} className="bg-amber-500 text-white rounded px-4 py-2">Upgrade to Pro</button>
      {open && clientSecret && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center p-4">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <Elements options={{ clientSecret }} stripe={stripePromise}>
              <Form clientSecret={clientSecret} onDone={(ok,msg)=>{ ok ? (setOpen(false), alert('Subscription started')) : alert(msg) }} />
            </Elements>
          </div>
        </div>
      )}
    </div>
  )
}
