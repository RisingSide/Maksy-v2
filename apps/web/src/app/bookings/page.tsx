'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Row = {
  id: string
  starts_at: string
  ends_at: string
  status: string | null
}

export default function BookingsPage() {
  const [state, setState] = useState<'loading' | 'signed-out' | 'ready'>(
    'loading'
  )
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    let ok = true
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (ok) setState('signed-out')
        return
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('default_org_id')
        .eq('id', user.id)
        .single()
      const orgId = prof?.default_org_id as string | undefined
      if (!orgId) {
        if (ok) setState('ready')
        return
      }
      const { data } = await supabase
        .from('bookings')
        .select('id, starts_at, ends_at, status')
        .eq('organization_id', orgId)
        .order('starts_at', { ascending: false })
        .limit(100)
      if (!ok) return
      setRows(data ?? [])
      setState('ready')
    })()
    return () => {
      ok = false
    }
  }, [])

  if (state === 'loading')
    return (
      <main className="min-h-screen grid place-items-center p-8">Loading…</main>
    )
  if (state === 'signed-out')
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <a className="bg-amber-500 text-white px-4 py-2 rounded" href="/login">
          Sign in to continue
        </a>
      </main>
    )

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Bookings</h1>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Start</th>
              <th className="p-2 text-left">End</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">
                  {new Date(r.starts_at).toLocaleString()}
                </td>
                <td className="p-2">{new Date(r.ends_at).toLocaleString()}</td>
                <td className="p-2">{r.status ?? 'scheduled'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={3}>
                  No bookings yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
