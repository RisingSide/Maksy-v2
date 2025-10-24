'use client'

import { useEffect, useState } from 'react'
import { createOrganization } from './actions'
import { supabase } from '@/lib/supabaseClient'

export default function SetupPage() {
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || '')
    })
  }, [])

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <form action={createOrganization} className="flex flex-col gap-3 w-full max-w-sm">
        <h1 className="text-2xl font-bold">Create your first Organization</h1>

        <input
          name="name"
          placeholder="Organization name"
          className="border rounded px-3 py-2"
          defaultValue="Maksy Demo Org"
        />

        {/* Hidden: current user id */}
        <input type="hidden" name="user_id" value={userId} />

        <button
          type="submit"
          className="bg-amber-500 text-white rounded px-4 py-2 disabled:opacity-60"
          disabled={!userId}
          title={!userId ? 'Sign in first' : 'Create'}
        >
          {userId ? 'Create Organization' : 'Waiting for sign-in…'}
        </button>
      </form>
    </main>
  )
}
