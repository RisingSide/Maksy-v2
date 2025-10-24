'use client'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  async function signIn() {
    const email = prompt('Email to send a magic link to?') || ''
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin } // let Supabase do the redirect
    })
    if (error) alert(error.message)
    else alert('Check your email for the sign-in link (newest email only).')
  }

  async function signOut() {
    await supabase.auth.signOut()
    alert('Signed out.')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Maksy Auth Test</h1>
      <button onClick={signIn} className="px-4 py-2 rounded bg-amber-500 text-white">
        Sign In (Magic Link)
      </button>
      <button onClick={signOut} className="px-4 py-2 rounded bg-gray-700 text-white">
        Sign Out
      </button>
    </main>
  )
}
