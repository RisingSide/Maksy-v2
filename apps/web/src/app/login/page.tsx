'use client'
import { supabase } from '@/lib/supabaseClient'
export default function LoginPage() {
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) alert(error.message)
  }
  async function signOut(){ await supabase.auth.signOut(); alert('Signed out.') }
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <button onClick={signInWithGoogle} className="px-4 py-2 rounded bg-amber-500 text-white">Continue with Google</button>
        <button onClick={signOut} className="px-4 py-2 rounded bg-gray-700 text-white">Sign out</button>
      </div>
    </main>
  )
}
