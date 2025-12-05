# SUPABASE CLEANUP & SETUP GUIDE

## Current Status ✅

**Good news:** Your Supabase project is currently **clean** with no legacy tables or migrations. The `/supabase/migrations/` folder is empty and ready for fresh migrations from the new schema.

---

## Pre-Build Checklist

Before running any migrations, ensure:

1. ✅ **Supabase project created** (or use existing clean project)
2. ✅ **Environment variables configured** (see below)
3. ✅ **No conflicting tables** from previous versions

---

## Required Environment Variables

Create `/apps/web/.env.local`:

```bash
# Supabase (get from https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Stripe (get from https://dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (after creating webhook endpoint)

# Twilio (get from https://console.twilio.com)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
TWILIO_MESSAGING_SERVICE_SID=MG... (optional, for better deliverability)

# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Inngest (get from https://app.inngest.com)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Sentry (get from https://sentry.io)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=maksy

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Migration Strategy

### Step 1: Generate Migrations from Drizzle Schema

Once you create the Drizzle schema file (`apps/web/src/db/schema.ts`) based on `docs/03-DATABASE_SCHEMA.md`, run:

```bash
cd /Users/chaseshooltz/Maksy-v2/apps/web
pnpm drizzle-kit generate:pg
```

This will create migration files in `/supabase/migrations/`

### Step 2: Apply Migrations to Supabase

```bash
pnpm run migrate
```

Or manually via Supabase SQL Editor if you prefer visual confirmation.

### Step 3: Verify Tables Created

Log into Supabase Dashboard → Table Editor and confirm all **39 tables** exist:

**Core Tables (6):**

1. users (Supabase Auth)
2. user_profiles
3. companies
4. company_settings
5. subscriptions
6. team_members

**CRM Tables (4):** 7. team_availability 8. customers 9. custom_customer_fields 10. customer_field_values

**Service Tables (3):** 11. service_categories 12. services 13. service_add_ons

**Job Tables (3):** 14. jobs 15. job_add_ons 16. job_tracking

**Task & Inventory Tables (6):** 17. tasks 18. task_usage_counters 19. inventory_items 20. inventory_movements 21. inventory_attachments 22. job_media

**Financial Tables (6):** 23. estimates 24. estimate_line_items 25. invoices 26. invoice_line_items 27. payments 28. coupons

**Coupon Tables (2):** 29. coupon_service_restrictions 30. coupon_usages

**Automation Tables (2):** 31. automations 32. automation_executions

**Form Tables (2):** 33. custom_forms 34. form_submissions

**Settings & AI Tables (5):** 35. integrations 36. notification_preferences 37. ai_chat_history 38. ai_usage_counters 39. ai_usage_lifetime

**Audit Tables (2):** 40. audit_logs 41. reviews

**Total: 41 tables** (updated count after inventory + media additions)

---

## If You Have Legacy Data from Previous Version

### Option 1: Clean Slate (Recommended)

1. **Export anything you want to keep:**

   ```sql
   -- Run in Supabase SQL Editor
   COPY (SELECT * FROM old_customers) TO '/tmp/customers_backup.csv' CSV HEADER;
   ```

2. **Drop all old tables:**

   ```sql
   -- BE CAREFUL! This deletes everything
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```

3. **Apply new migrations** (Step 1-3 above)

### Option 2: Selective Cleanup

List current tables:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Drop specific tables you don't need:

```sql
DROP TABLE IF EXISTS old_table_name CASCADE;
```

---

## Row Level Security (RLS) Setup

After migrations, enable RLS on all tables:

```sql
-- Example for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company's customers"
  ON customers FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers for their company"
  ON customers FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );
```

Repeat for all 39+ tables as documented in `03-DATABASE_SCHEMA.md`

---

## Supabase Storage Buckets

Create these storage buckets in Supabase Dashboard → Storage:

1. **`company-logos`** (public)
   - For company logos on booking pages
   - Max file size: 2MB
   - Allowed types: image/jpeg, image/png, image/webp

2. **`company-covers`** (public)
   - For booking page hero images
   - Max file size: 5MB
   - Allowed types: image/jpeg, image/png, image/webp

3. **`service-icons`** (public)
   - For service category icons
   - Max file size: 1MB
   - Allowed types: image/svg+xml, image/png

4. **`job-media`** (private with signed URLs)
   - For before/after photos
   - Max file size: 10MB per file
   - Allowed types: image/jpeg, image/png, image/heic

5. **`inventory-attachments`** (private with signed URLs)
   - For receipts, manuals, safety sheets
   - Max file size: 10MB per file
   - Allowed types: image/\*, application/pdf

6. **`invoice-pdfs`** (private with signed URLs)
   - For generated invoices
   - Max file size: 5MB
   - Allowed types: application/pdf

### Storage Policies

Enable RLS on storage buckets and create policies:

```sql
-- Example for job-media bucket
CREATE POLICY "Users can upload media for their company's jobs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'job-media' AND
    auth.uid() IN (
      SELECT user_id FROM user_profiles
      WHERE company_id IN (
        SELECT company_id FROM jobs WHERE id::text = (storage.foldername(name))[1]
      )
    )
  );
```

---

## Verification Steps

After setup:

1. ✅ All 41 tables exist in Supabase
2. ✅ All RLS policies active (check Table Editor → each table shows 🔒)
3. ✅ All storage buckets created
4. ✅ Can create test user via Supabase Auth
5. ✅ Can insert test company record
6. ✅ RLS prevents cross-company data access

---

## Troubleshooting

**Issue: "permission denied for table X"**

- Solution: Check RLS policies are created correctly

**Issue: "relation X does not exist"**

- Solution: Run migrations again or check schema.ts matches docs

**Issue: "duplicate key violates unique constraint"**

- Solution: Old data still exists; clean or migrate incrementally

---

**Ready to migrate!** Once you create the Drizzle schema file, migrations will be auto-generated and you can apply them to your clean Supabase project.

---

_Last Updated: November 5, 2025_  
_Version: 1.0_
