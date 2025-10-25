'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Customer = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

export default function CustomersPage() {
  const [state, setState] = useState<'loading' | 'signed-out' | 'ready'>(
    'loading'
  )
  const [rows, setRows] = useState<Customer[]>([])

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
      // fetch orgId from profiles
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
        .from('customers')
        .select('id, full_name, email, phone')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
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
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Phone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.full_name ?? '—'}</td>
                <td className="p-2">{r.email ?? '—'}</td>
                <td className="p-2">{r.phone ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={3}>
                  No customers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
