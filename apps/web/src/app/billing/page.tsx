'use client'
import { useState } from 'react'

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  async function startCheckout() {
    setLoading(true)
    const res = await fetch('/api/billing/create-checkout', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <button onClick={startCheckout} disabled={loading} className="bg-amber-500 text-white rounded px-4 py-2">
        {loading ? 'Redirecting…' : 'Upgrade to Pro'}
      </button>
    </main>
  )
}
