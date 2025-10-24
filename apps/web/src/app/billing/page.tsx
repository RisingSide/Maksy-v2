import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import UpgradeModal from './upgrade-modal'

export default async function BillingPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (name, value, options) =>
          cookieStore.set({ name, value, ...(options || {}) }),
        remove: (name, options) =>
          cookieStore.set({
            name,
            value: '',
            expires: new Date(0),
            ...(options || {}),
          }),
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
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
