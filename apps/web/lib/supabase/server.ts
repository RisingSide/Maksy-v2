import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

type CookieStore = Awaited<ReturnType<typeof cookies>>

type CookieOptions = {
  path?: string
  domain?: string
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

type Options = {
  store?: CookieStore
  canMutateCookies?: boolean
}

function adaptCookieStore(store: CookieStore, canMutateCookies: boolean) {
  return {
    get(name: string) {
      return store.get(name)?.value
    },
    set(name: string, value: string, options?: CookieOptions) {
      if (!canMutateCookies) return
      try {
        store.set({ name, value, ...(options ?? {}) })
      } catch {
        try {
          ;(store as any).set(name, value, options)
        } catch (err) {
          console.warn('[supabaseServer] set cookie failed', err)
        }
      }
    },
    remove(name: string, options?: CookieOptions) {
      if (!canMutateCookies) return
      try {
        store.delete(name, options)
      } catch {
        try {
          ;(store as any).set({
            name,
            value: '',
            expires: new Date(0),
            ...(options ?? {}),
          })
        } catch (err) {
          console.warn('[supabaseServer] remove cookie failed', err)
        }
      }
    },
  } as any
}

export const supabaseServer = async (options: Options = {}) => {
  const cookieStore = options.store ?? (await cookies())
  const canMutate = options.canMutateCookies ?? false
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: adaptCookieStore(cookieStore, canMutate) }
  )
}
