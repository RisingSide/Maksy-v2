'use client'

import { useEffect, useState } from 'react'
import UpgradeModal from './upgrade-modal'
import { supabase } from '@/lib/supabaseClient'

export default function BillingPage() {
  const [state, setState] = useState<'loading' | 'signed-out' | 'ready'>(
    'loading'
  )

  useEffect(() => {
    let mounted = true
    async function init() {
      // Browser-side session check avoids SSR cookie typing issues
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return
      setState(user ? 'ready' : 'signed-out')
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  if (state === 'loading') {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <div>Loading…</div>
      </main>
    )
  }

  if (state === 'signed-out') {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <a className="bg-amber-500 text-white px-4 py-2 rounded" href="/login">
          Sign in to continue
        </a>
      </main>
    )
  }

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <UpgradeModal />
    </main>
  )
}
