-- Replace the Supabase Auth dependent function with a dummy one
-- This ensures that if RLS is active, it defaults to denying access (returning NULL)
-- rather than throwing an error because auth.uid() is missing/invalid.
-- Since Drizzle connects as a service role/superuser, RLS is likely bypassed anyway.

CREATE OR REPLACE FUNCTION auth.company_id()
RETURNS uuid AS $$
  SELECT NULL::uuid;
$$ LANGUAGE sql STABLE;
