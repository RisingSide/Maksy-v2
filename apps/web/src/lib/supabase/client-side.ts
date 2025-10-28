// Client-side Supabase utilities
// For use in client components

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function getClientSupabase() {
  return createClientComponentClient()
}
