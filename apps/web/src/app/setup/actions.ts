'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createOrganization(formData: FormData): Promise<void> {
  const name = (formData.get('name') as string)?.trim() || 'My Organization'

  // read current user from session (server)
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Bridge Next 16 cookies ↔ @supabase/ssr types so CI passes
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: any) {
          try {
            ;(cookieStore as any).set({ name, value, ...(options || {}) })
          } catch {
            ;(cookieStore as any).set(name, value, options)
          }
        },
        remove(name: string, options?: any) {
          try {
            ;(cookieStore as any).delete(name, options)
          } catch {
            ;(cookieStore as any).set({
              name,
              value: '',
              expires: new Date(0),
              ...(options || {}),
            })
          }
        },
      } as any, // ← type bridge
    }
  )

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) throw new Error('Not signed in')

  // 1) create org
  const { data: org, error: orgErr } = await supabaseAdmin
    .from('organizations')
    .insert({ name })
    .select()
    .single()
  if (orgErr) throw new Error(orgErr.message)

  // 2) add membership
  const { error: memErr } = await supabaseAdmin
    .from('organization_members')
    .insert({ organization_id: org.id, user_id: user.id, role: 'owner' })
  if (memErr) throw new Error(memErr.message)

  // 3) set default org on profile
  await supabaseAdmin
    .from('profiles')
    .update({ default_org_id: org.id })
    .eq('id', user.id)

  // revalidate this page (optional) and go somewhere useful
  revalidatePath('/setup')
  redirect('/billing') // or '/dashboard'
  // NOTE: return nothing (Promise<void>)
}
