# Clerk Migration Plan - From Supabase Auth to Clerk

**Date:** November 18, 2025  
**Status:** Infrastructure Installed - Planning Phase  
**Complexity:** HIGH - Core authentication replacement affecting entire app

---

## ✅ Phase 0: Clerk Installation (COMPLETE)

### What Was Done:

1. ✅ Installed `@clerk/nextjs@6.35.2`
2. ✅ Created `/apps/web/src/middleware.ts` with `clerkMiddleware()`
3. ✅ Wrapped app with `<ClerkProvider>` in `app/layout.tsx`
4. ✅ Environment variables added to `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### Current State:

- **Clerk is installed** but NOT active (middleware allows all requests through)
- **Supabase Auth still works** - nothing broken
- Both systems can co-exist temporarily during migration

---

## 🚨 Critical Challenges

### Challenge 1: Row Level Security (RLS) Policies

**Problem:** Your entire database security model relies on Supabase Auth's `auth.uid()`

**Current RLS Helper:**

```sql
-- This function powers ALL your RLS policies
CREATE FUNCTION auth.company_id()
RETURNS uuid AS $$
  SELECT company_id FROM team_members
  WHERE user_id = auth.uid()  -- ⚠️ This is Supabase Auth specific
  LIMIT 1;
$$ LANGUAGE sql STABLE;
```

**Used in policies like:**

```sql
CREATE POLICY "Users can view their company's customers"
  ON customers FOR SELECT
  USING (company_id = auth.company_id());  -- ⚠️ Breaks with Clerk
```

**Impact:**

- **41 tables** have RLS policies
- **All depend** on `auth.uid()` returning Supabase user ID
- **Entire security model breaks** if this changes

### Challenge 2: User ID Schema Mismatch

**Supabase:** Uses UUIDs (`550e8400-e29b-41d4-a716-446655440000`)  
**Clerk:** Uses prefixed strings (`user_2abc123xyz`)

**Tables Affected:**

- `users` (Supabase Auth table - can't change)
- `user_profiles.user_id` (references Supabase `auth.users`)
- `companies.owner_user_id`
- `team_members.user_id`
- Any other tables with `user_id` foreign keys

### Challenge 3: Existing Signup Flow

Your signup route creates **6 database records** in sequence:

1. Supabase Auth user
2. user_profiles
3. companies
4. team_members (CRITICAL for RLS)
5. company_settings
6. subscriptions

**With Clerk, this becomes:**

1. Clerk webhook fires (user created in Clerk)
2. You receive Clerk user ID
3. Must create all 6 records
4. Must handle **sync failures** (Clerk has user, DB doesn't)

---

## 📋 Migration Strategies (Choose One)

### Option A: Dual Auth System (Recommended for Safe Migration)

**Keep Supabase Auth as "source of truth" for existing users, Clerk for new users**

**Pros:**

- ✅ Existing users unaffected
- ✅ Can test Clerk with new signups only
- ✅ Rollback is easy
- ✅ RLS policies keep working

**Cons:**

- ❌ More complex (two auth systems)
- ❌ Need to maintain both
- ❌ Migration takes longer

**Implementation:**

1. Create new `clerk_users` table mapping Clerk ID → Supabase User ID
2. Modify middleware to support both auth types
3. New signups go through Clerk
4. Existing users stay on Supabase Auth
5. Gradually migrate users (optional)

---

### Option B: Full Replacement (Riskier, Cleaner Long-term)

**Replace Supabase Auth entirely with Clerk**

**Pros:**

- ✅ Single auth system
- ✅ Cleaner architecture
- ✅ Better user experience (Clerk UI)

**Cons:**

- ❌ **Requires database schema changes**
- ❌ **RLS policies must be rewritten**
- ❌ **All existing users must re-register** or migrate
- ❌ Risky if anything goes wrong
- ❌ 2-3 weeks of refactoring

**Implementation:**

1. Change `user_id` columns from `uuid` to `text` (supports Clerk IDs)
2. Rewrite ALL RLS policies to use Clerk's JWT claims
3. Create Clerk webhook handlers
4. Update signup/login pages
5. Migrate existing users (or force re-registration)

---

### Option C: Hybrid with Sync (Middle Ground)

**Keep Supabase Auth but sync with Clerk for better UX**

**Pros:**

- ✅ Get Clerk's UI components
- ✅ Keep RLS policies working
- ✅ Existing users work

**Cons:**

- ❌ Complex sync logic
- ❌ Potential sync failures
- ❌ Still need Supabase for database auth

**Implementation:**

1. User signs in via Clerk
2. Middleware creates/syncs Supabase session
3. Database operations use Supabase RLS
4. UI uses Clerk components

---

## 🎯 Recommended Approach: Option A (Dual Auth)

### Why This is Safest:

1. **No breaking changes** to existing code
2. **Test Clerk** with low risk
3. **Gradual rollout** - new users only
4. **Easy rollback** if issues arise
5. **Keeps RLS policies intact**

---

## 📝 Detailed Implementation Plan (Option A)

### Step 1: Create Clerk-Supabase Bridge Table

```sql
-- New table to map Clerk users to Supabase users
CREATE TABLE clerk_user_mappings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id text NOT NULL UNIQUE,
  supabase_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_clerk_mappings_clerk_id ON clerk_user_mappings(clerk_user_id);
CREATE INDEX idx_clerk_mappings_supabase_id ON clerk_user_mappings(supabase_user_id);
```

### Step 2: Update Middleware to Support Both

```typescript
// src/middleware.ts
import { clerkMiddleware, getAuth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export default clerkMiddleware(async (auth, req) => {
  const { userId: clerkUserId } = await auth()

  // If user authenticated with Clerk
  if (clerkUserId) {
    // Look up or create corresponding Supabase user
    // Set Supabase session
    // Continue request
  }

  // Otherwise, check for Supabase session
  // (existing users)

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### Step 3: Create Clerk Webhook Handler

```typescript
// src/app/api/clerk/webhook/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET not set')
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Error: Verification failed', { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data
    const primaryEmail = email_addresses[0]?.email_address

    // Create Supabase Auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: primaryEmail,
        email_confirm: true,
      })

    if (authError || !authData.user) {
      console.error('Failed to create Supabase user:', authError)
      return new Response('Error: Failed to create user', { status: 500 })
    }

    const supabaseUserId = authData.user.id

    // Create mapping
    await supabaseAdmin.from('clerk_user_mappings').insert({
      clerk_user_id: clerkUserId,
      supabase_user_id: supabaseUserId,
    })

    // Create user_profiles, companies, etc. (same as current signup flow)
    // ... (copy logic from /api/auth/signup/route.ts)
  }

  return new Response('Webhook processed', { status: 200 })
}
```

### Step 4: Update Signup Flow

**Option 1:** Route new users to Clerk signup  
**Option 2:** Keep existing signup, add "Sign up with Clerk" option  
**Option 3:** Gradual rollout - show Clerk to 10% of users

### Step 5: Create Admin Toggle

Add a feature flag to switch between auth systems:

```typescript
// lib/feature-flags.ts
export const USE_CLERK_AUTH = process.env.NEXT_PUBLIC_USE_CLERK_AUTH === 'true'
```

---

## 🧪 Testing Plan

### Phase 1: Clerk Infrastructure Test (Current)

- [x] Clerk installed
- [x] Middleware created
- [x] ClerkProvider added
- [ ] Test signup with Clerk components
- [ ] Verify webhook receives events

### Phase 2: Dual Auth Test

- [ ] Create bridge table
- [ ] Create webhook handler
- [ ] Test new user signup via Clerk
- [ ] Verify Supabase user created
- [ ] Verify RLS policies work
- [ ] Test existing Supabase users still work

### Phase 3: Production Rollout

- [ ] Deploy to staging
- [ ] Monitor for errors
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor both auth systems

---

## 📊 Database Changes Required

### For Option A (Dual Auth):

```sql
-- Minimal changes
CREATE TABLE clerk_user_mappings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id text NOT NULL UNIQUE,
  supabase_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### For Option B (Full Replacement):

```sql
-- MAJOR changes - requires migration
ALTER TABLE user_profiles ALTER COLUMN user_id TYPE text;
ALTER TABLE companies ALTER COLUMN owner_user_id TYPE text;
ALTER TABLE team_members ALTER COLUMN user_id TYPE text;
-- ... (20+ more tables)

-- Rewrite RLS function to use Clerk JWT
CREATE OR REPLACE FUNCTION auth.company_id()
RETURNS uuid AS $$
  -- Extract Clerk user ID from JWT
  -- Look up company_id from team_members
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## ⚠️ Risks & Mitigation

### Risk 1: Webhook Failures

**Problem:** Clerk webhook fails, user created in Clerk but not in database  
**Mitigation:**

- Implement retry logic
- Log all webhook attempts
- Create admin dashboard to manually sync users

### Risk 2: RLS Bypass

**Problem:** Middleware fails to set Supabase session, RLS blocks all queries  
**Mitigation:**

- Thorough testing of middleware
- Fallback to service role key for admin operations
- Monitor RLS violations in logs

### Risk 3: Session Conflicts

**Problem:** User has both Clerk and Supabase sessions, causing conflicts  
**Mitigation:**

- Clear guidance on which session to use
- Middleware handles session priority
- Admin tools to merge accounts

---

## 🎯 Next Steps (Your Decision)

### Option A: Safe Dual Auth (Recommended)

1. Create `clerk_user_mappings` table
2. Implement webhook handler
3. Update middleware
4. Test with new signups
5. Gradual rollout

**Timeline:** 1-2 weeks  
**Risk:** Low  
**Reversibility:** High

### Option B: Full Replacement (Advanced)

1. Plan database schema changes
2. Write migration scripts
3. Rewrite RLS policies
4. Update all auth-related code
5. Migrate existing users

**Timeline:** 3-4 weeks  
**Risk:** High  
**Reversibility:** Low

### Option C: Keep Supabase Auth

1. Remove Clerk
2. Improve Supabase Auth UI
3. Add Google OAuth (Supabase supports it)
4. Enhance onboarding flow

**Timeline:** 1 week  
**Risk:** None  
**Reversibility:** N/A

---

## 📝 Decision Required

**Which approach do you want to take?**

A. **Dual Auth** - Safest, keeps everything working  
B. **Full Replacement** - Cleanest long-term, highest risk  
C. **Keep Supabase** - Reverse Clerk installation, improve existing auth

Let me know and I'll proceed with the implementation! 🚀

---

_Last Updated: November 18, 2025_  
_Status: Awaiting Decision_
