'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [state, setState] = useState<'loading' | 'signed-out' | 'ready'>(
    'loading'
  )
  useEffect(() => {
    let ok = true
    supabase.auth.getUser().then(({ data }) => {
      if (!ok) return
      setState(data.user ? 'ready' : 'signed-out')
    })
    return () => {
      ok = false
    }
  }, [])

  if (state === 'loading')
    return (
      <main className="min-h-screen grid place-items-center p-8">Loading…</main>
    )
  if (state === 'signed-out') {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <a href="/login" className="bg-amber-500 text-white px-4 py-2 rounded">
          Sign in to continue
        </a>
      </main>
    )
  }

  return (
    <main className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Maksy Dashboard</h1>
        <nav className="space-x-4 text-sm">
          <Link href="/customers">Customers</Link>
          <Link href="/bookings">Bookings</Link>
          <Link href="/billing">Billing</Link>
          <Link href="/settings">Settings</Link>
        </nav>
      </header>
      <section className="grid gap-4">
        <div className="rounded-xl border p-6">Welcome to Maksy 👋</div>
        <div className="rounded-xl border p-6">
          Next up: connect calendar, services, and notifications.
        </div>
      </section>
    </main>
  )
}
