# RLS Overview

- `profiles`, `organizations`, `organization_members` enforce tenant isolation via RLS.
- Ensure policies exist in prod: SELECT limited to members; INSERT/UPDATE via service-role only.
- Track changes as SQL migrations in `apps/web/supabase/migrations/`.
