'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

export async function createOrganization(formData: FormData) {
  const name = (formData.get('name') as string)?.trim() || 'My Organization'
  const userId = (formData.get('user_id') as string)?.trim()

  if (!userId) throw new Error('No user id. Please sign in first.')

  const { data: org, error: orgErr } = await supabaseAdmin
    .from('organizations')
    .insert({ name })
    .select()
    .single()
  if (orgErr) throw new Error(orgErr.message)

  const { error: memErr } = await supabaseAdmin
    .from('organization_members')
    .insert({ organization_id: org.id, user_id: userId, role: 'owner' })
  if (memErr) throw new Error(memErr.message)

  await supabaseAdmin
    .from('profiles')
    .update({ default_org_id: org.id })
    .eq('id', userId)

  revalidatePath('/setup')
  return { orgId: org.id, name: org.name }
}
