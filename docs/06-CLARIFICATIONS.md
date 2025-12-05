# CLARIFICATIONS & DECISIONS

## Overview

This document answers all critical planning questions, documents design decisions, and provides clarifications for ambiguous requirements identified during planning.

---

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [AI Usage Limits](#ai-usage-limits)
3. [Booking Page Customization](#booking-page-customization)
4. [Team Member Permissions](#team-member-permissions)
5. [Payment & Invoicing](#payment--invoicing)
6. [Recurring Jobs](#recurring-jobs)
7. [Data Import & Export](#data-import--export)
8. [Mobile Experience](#mobile-experience)
9. [Rate Limiting](#rate-limiting)
10. [Error Handling](#error-handling)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Strategy](#deployment-strategy)

---

## Authentication & Security

### Q: Should users be able to switch between companies?

**Decision:** **No, not in MVP.**

- Each user account is tied to ONE company (owner or team member)
- If a user needs to manage multiple businesses, they must create separate accounts
- **Future consideration:** Add company switching for consultants/agencies

### Q: What happens when a team member is removed?

**Decision:**

1. Team member status set to `'inactive'`
2. User account remains (they still own their Supabase Auth user)
3. Access to company revoked immediately (RLS enforced)
4. Historical job assignments remain (for reporting)
5. Future jobs: reassign to "Unassigned" (admin must reassign)
6. Team member can no longer log in to that company

### Q: Do we need 2FA?

**Decision:**

- **Starter:** Optional (user can enable in settings)
- **Pro:** Optional but recommended (banner reminds admins to enable)
- **Scale:** **Required** (enforced at login)
- Use Supabase Auth's built-in TOTP (Authenticator apps)
- No SMS-based 2FA (unreliable + costly)

### Q: Password reset flow?

**Decision:**

- Standard email-based reset via Supabase Auth
- Password reset link valid for 1 hour
- After reset, all sessions invalidated (user must log in again on all devices)

---

## AI Usage Limits

### Q: How are Maksy AI limits enforced?

**Decision:** Maksy now uses a simple **per-user, per-day request counter.** Every time a user sends a prompt, `requests_used` increments by 1.

- Counters live in the `ai_usage_counters` table (unique per `company_id`, `user_id`, `usage_date`).
- When the counter reaches the plan's daily limit, the API returns a `429` error and the chat UI displays "You've used all Maksy AI requests for today".
- Counters reset automatically at midnight in the company's configured timezone.

**Daily Limits by Plan:**

| Plan    | Limit Type        | Allowance                 | Notes                                              |
| ------- | ----------------- | ------------------------- | -------------------------------------------------- |
| Starter | Lifetime per user | 15 total preview requests | Once exhausted, chat input locks with upgrade CTA. |
| Pro     | Daily per user    | 30 requests/day           | Resets at midnight (company timezone).             |
| Scale   | Daily per user    | 50 requests/day           | Uses advanced GPT model for richer insights.       |

### Q: What happens when a user hits the limit mid-conversation?

**Decision:**

- The assistant finishes the current response if already streaming; otherwise it stops immediately.
- The API error payload includes `requests_used_today`, `daily_limit`, and `resets_at` so the UI can show a countdown.
- The chat composer is disabled until the next reset (or an admin override).

### Q: Can admins reset the counter manually?

**Decision:** Yes, admins on Pro/Scale can reset a user's counter from **Settings → Ask Maksy → Recent Activity**. This calls `POST /api/settings/ai-usage/reset` and logs the override in `audit_logs`.

### Q: How do counters reset automatically?

**Decision:**

- Nightly Inngest job `prime-ai-usage-counters` runs a few minutes after midnight in each company's timezone.
- The job upserts tomorrow's row with `requests_used = 0` and trims rows older than 90 days.
- No monthly or annual rollovers—limits are purely daily to keep behavior predictable.

### Q: Can users buy extra AI usage?

**Decision:** **Not in MVP.** If demand warrants it later, we can add a "top-up" SKU that increases `daily_limit` for that billing cycle, but it is intentionally out-of-scope for the first release.

---

## Booking Page Customization

### Q: How do slug conflicts work during onboarding?

**Decision:**

1. User enters business name: "ABC Plumbing"
2. System generates slug: `abc-plumbing`
3. API checks if slug is taken: `GET /api/slugs/check?slug=abc-plumbing`
4. If taken:
   - Generate alternative: `abc-plumbing-x7f2` (append 4 random alphanumeric chars)
   - Show to user: "Your booking page will be: maksy.ai/abc-plumbing-x7f2"
   - User can manually edit slug (re-checks availability on blur)
5. Slug validation:
   - Min 3 chars, max 50 chars
   - Lowercase letters, numbers, hyphens only
   - Cannot start/end with hyphen
   - Regex: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`

### Q: Can users change their slug after onboarding?

**Decision:**

- **Starter:** No, slug is locked after onboarding
- **Pro/Scale:** Yes, can change in `/settings/booking`
  - Must still be unique
  - Old slug becomes available to others immediately
  - Warning modal: "Existing links will break. Update your website/marketing materials."

### Q: What's included in "booking page customization"?

**Decision:**

**Starter Plan:**

- Auto-generated slug (not editable)
- "Powered by Maksy" branding locked on
- Default Maksy color theme
- Upload logo and cover photo only

**Pro Plan:**

- Custom slug editor (with live availability check)
- Remove "Powered by Maksy" branding
- Accent & button color pickers
- Font selector (default, sans-serif, serif)
- Optional embed widget (iframe of Maksy-hosted booking page)

**Scale Plan:**

- Everything in Pro
- Advanced styling controls (glass depth, gradients)
- Layout presets and section reordering
- Form logic controls (show/hide questions based on custom fields)
- Support for multiple location highlights on booking hero

---

## Team Member Permissions

### Q: What's the difference between "Admin" and "Team Member" roles?

**Decision:**

**Owner (Auto-assigned):**

- First user who created the company
- Full access to everything
- Cannot be removed (only transferred)
- Can delete company
- Can manage billing/subscription

**Admin (Assigned by Owner):**

- Full access to app features
- Can add/edit/delete customers, jobs, services
- Can invite team members
- Can edit company settings
- **Cannot** manage billing
- **Cannot** delete company
- **Cannot** remove owner

**Team Member (Assigned by Owner/Admin):**

- Limited access (job-focused)
- Can view assigned jobs only
- Can update job status ("On My Way", "Start Job", "Finish Job")
- Can view customer info (read-only)
- Can add notes to jobs
- **Cannot** create jobs
- **Cannot** edit services/pricing
- **Cannot** access settings
- **Cannot** view reports/analytics

### Q: Can team members access the full dashboard?

**Decision:** **No.**

Team members get a **simplified mobile-first dashboard:**

- **Today's Jobs** (list view)
- **My Tasks** (assigned to them)
- **Job Detail** pages (when tapped)
- **Time Tracking** buttons (On My Way, Start, Finish)
- **Notes** section (add customer notes)

**No access to:**

- Customer list (CRM)
- Financial data (invoices, revenue)
- Company settings
- Team management
- AI assistant (Maksy)

**Rationale:** Most team members are field workers who need a simple, mobile-optimized experience focused on their daily tasks.

### Q: Can team members see each other's jobs?

**Decision:** **No, not in MVP.**

- Team members only see jobs assigned to them
- Privacy/security for pay-per-job teams
- **Future:** Add toggle for company: "Allow team to see all jobs"

---

## Payment & Invoicing

### Q: Can customers pay via the booking page?

**Decision:** **Not in MVP.**

Booking page is **free to book** (no payment required). Payment happens later via:

1. Admin manually records payment (cash/check/card)
2. Admin sends invoice with Stripe payment link
3. Admin collects payment on-site after job completion

**Future:** Add "Pay Deposit" option on booking page (Stripe Checkout)

### Q: What payment methods are supported?

**Decision:**

**MVP:**

- Cash (manually recorded)
- Check (manually recorded)
- Credit/Debit Card (via Stripe)
- Invoice (send later, customer pays online) — **Pro/Scale only** (Starter can view invoices but sees upgrade prompt when attempting to create/send)

**Future:**

- ACH/Bank Transfer
- Buy Now Pay Later (Klarna, Afterpay)
- Digital wallets (Apple Pay, Google Pay) via Stripe

### Q: How do invoices work for recurring jobs?

**Decision:**

User has **2 options when creating recurring job:**

1. **Manual Invoicing (default):**
   - Each job completes independently
   - Admin manually generates invoice per job
   - Flexibility for one-off pricing changes

2. **Auto-Invoice (checkbox during recurring job setup):**
   - When job marked "Completed", system auto-generates invoice
   - Invoice sent to customer immediately
   - Payment link included
   - Best for subscription-style services (e.g., weekly lawn care)

**Database flag:** `jobs.auto_invoice` (boolean)

### Q: Can invoices have partial payments?

**Decision:** **Yes.**

- Invoice can receive multiple payments
- `invoices.amount_paid` tracks total received
- When `amount_paid >= total`, status → `'paid'`
- If `amount_paid < total`, status → `'partially_paid'`
- Each payment recorded separately in `payments` table

---

## Recurring Jobs

### Q: What's the max length for a recurring job series?

**Decision:** **2 years from start date.**

- If user selects "No end date", system creates jobs for next 2 years only
- After 2 years, user must manually extend series
- Rationale: Prevents database bloat, encourages users to review recurring jobs periodically

### Q: Can users edit/delete individual jobs in a series?

**Decision:** **Yes, with confirmation.**

When user edits/deletes a recurring job, modal asks:

- ○ "Edit only this job"
- ○ "Edit all future jobs in this series"

**Edit single job:**

- Only that job updated
- Other jobs in series unchanged

**Edit all future jobs:**

- Current job + all future jobs updated
- Query: `WHERE parent_job_id = [id] AND scheduled_date >= [current date]`
- Past jobs remain unchanged (historical record)

**Delete:**

- Same options as edit
- Jobs soft-deleted (`deleted_at` timestamp)
- Soft delete allows undo + historical reporting

### Q: What happens if a recurring job lands on a holiday/closed day?

**Decision:** **Not handled in MVP.**

- Jobs are created regardless of business hours/holidays
- Admin must manually reschedule if needed
- **Future:** Add "Business Hours" and "Holidays" settings, auto-skip closed days

---

## Data Import & Export

### Q: What CSV format is required for customer import?

**Decision:** **No strict format required.**

Using **OpenAI to parse CSV** (intelligent parsing):

- System detects common column names:
  - `first_name`, `last_name`, `name`, `full_name`
  - `email`, `email_address`
  - `phone`, `phone_number`, `mobile`
  - `address`, `street`, `city`, `state`, `zip`
- For unrecognized columns:
  - AI detects column contents (e.g., "Vehicle Make" → string field)
  - Prompts user: "Would you like to add a custom field 'Vehicle Make'?"
  - If yes: Creates `custom_customer_fields` + `customer_field_values`
- Max file size: 5MB (~10,000 rows)

### Q: Can users export data?

**Decision:** **Yes.**

**Available Exports (all plans):**

- Customers (CSV)
- Jobs (CSV)
- Invoices (CSV, PDF)
- Payments (CSV)
- AI Credit Usage (CSV)

**Export button locations:**

- Top-right of each list page
- Settings > Data & Privacy > "Export All Data" (ZIP file)

**Pro Plan:** API access for custom integrations (future)

---

## Mobile Experience

### Q: Is there a native mobile app?

**Decision:** **Not in MVP. Progressive Web App (PWA) only.**

**Implementation:**

- Fully responsive web app (mobile-first design)
- PWA features:
  - Installable on home screen (iOS/Android)
  - Offline support (view cached jobs)
  - Push notifications (future)
- Mobile-optimized views:
  - Team member dashboard (simplified)
  - Job detail pages (large buttons for "On My Way", etc.)
  - Customer lookup (large search bar)

**Future:** Native iOS/Android apps (React Native or Flutter)

### Q: How does GPS tracking work on mobile?

**Decision:**

- Uses browser Geolocation API (`navigator.geolocation`)
- Team member clicks "On My Way" → browser requests location permission
- If granted:
  - Lat/lng captured + timestamp
  - Stored in `job_tracking.on_my_way_lat`, `on_my_way_lng`
  - ETA calculated via Google Maps Distance Matrix API
  - SMS sent to customer: "We're on our way! ETA: 15 minutes"
- Location tracked again when "Start Job" clicked (arrival location)
- Drive time calculated: `started_at - on_my_way_at`

**Privacy:**

- Location only captured at specific button clicks (not continuous tracking)
- Team members notified: "Maksy will access your location when you click 'On My Way'"

---

## Rate Limiting

### Q: Do we need rate limiting?

**Decision:** **Yes, to prevent abuse and manage costs.**

**Rate Limits (by endpoint type):**

| Endpoint Type                     | Rate Limit                     | Plan                              |
| --------------------------------- | ------------------------------ | --------------------------------- |
| `/api/auth/*`                     | 10 requests / 5 min per IP     | All                               |
| `/api/maksy/chat`                 | 20 requests / min per company  | All (AI credit limits also apply) |
| `/api/booking/*` (public)         | 30 requests / min per IP       | All                               |
| `/api/jobs/*`, `/api/customers/*` | 100 requests / min per company | All                               |
| `/api/slugs/check`                | 10 requests / min per IP       | All                               |

**Implementation:**

- Use Vercel Edge Config or Upstash Redis for rate limiting
- Return `429 Too Many Requests` when exceeded
- Include `Retry-After` header (seconds until reset)

**Example Error:**

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 45
}
```

---

## Error Handling

### Q: How should errors be displayed to users?

**Decision:**

**1. API Errors (Server-Side):**

- Standard JSON format:
  ```json
  {
    "error": "Human-readable message",
    "code": "ERROR_CODE",
    "details": { ... }  // optional
  }
  ```

**2. UI Errors (Client-Side):**

- **Toast notifications** (ephemeral, auto-dismiss after 5sec):
  - Success: Green checkmark + message
  - Error: Red X + message
  - Warning: Yellow ! + message
  - Info: Blue i + message
- **Inline errors** (form validation):
  - Red text below input field
  - Red border on input
- **Modal errors** (critical):
  - For actions that need user acknowledgment
  - Example: "Failed to delete customer. They have 5 active jobs."

**3. Sentry Error Tracking:**

- All server errors automatically captured
- Include user context (company_id, user_id)
- Exclude sensitive data (passwords, credit cards)
- Alert on critical errors (>10 errors/min)

---

## Testing Strategy

### Q: What needs to be tested?

**Decision:**

**1. Unit Tests (Vitest):**

- Utility functions (slug generation, date formatting, price calculations)
- API route logic (mocked database)
- AI credit calculation
- Coverage goal: >70%

**2. Integration Tests (Vitest):**

- Full API flows (signup → onboarding → create job)
- Database operations (insert, update, delete)
- Stripe webhook handling
- SMS/email sending (mocked)

**3. End-to-End Tests (Playwright):**
**Critical Paths:**

- User signup → onboarding → dashboard
- Create customer → create job → complete job → generate invoice
- Public booking page → select service → book appointment
- Team member invite → accept → mobile dashboard
- AI chat → data extraction → create task

**4. Manual Testing:**

- Mobile responsiveness (iPhone, Android, tablets)
- Browser compatibility (Chrome, Safari, Firefox, Edge)
- Payment flows (real Stripe test mode transactions)
- SMS delivery (real Twilio test numbers)

**Test Data:**

- Seed database with realistic data (100 customers, 500 jobs, etc.)
- Use Faker.js for generated data

---

## Deployment Strategy

### Q: How will the app be deployed?

**Decision:**

**Platform:** Vercel (Next.js optimized)

**Environments:**

1. **Local Development:**
   - `pnpm dev` → localhost:3000
   - Supabase local instance (Docker)
   - Stripe test mode
   - Twilio test account

2. **Staging:**
   - URL: `staging.maksy.ai`
   - Auto-deploy on push to `develop` branch
   - Uses staging Supabase project
   - Stripe test mode
   - Real Twilio (test numbers only)
   - E2E tests run on every deployment

3. **Production:**
   - URL: `maksy.ai`
   - Manual deploy (requires approval)
   - Deploy from `main` branch only
   - Uses production Supabase project
   - Stripe live mode
   - Real Twilio
   - Health checks + monitoring

**CI/CD Pipeline:**

```
Push to branch
  → Run linters (ESLint, TypeScript)
  → Run unit tests
  → Run integration tests
  → Build Next.js
  → Deploy to Vercel
  → Run E2E tests (Playwright)
  → Notify Slack (success/failure)
```

**Database Migrations:**

- Use Drizzle migrations (`drizzle-kit push`)
- Run migrations **before** deploying new code
- Test migrations on staging first
- Keep rollback scripts ready

**Environment Variables:**

- Stored in Vercel dashboard
- Separate configs for staging vs production
- Never commit secrets to git
- Use `.env.local` for local development

**Monitoring:**

- Vercel Analytics (page views, performance)
- Sentry (error tracking)
- Uptime monitoring (UptimeRobot or Pingdom)
- Supabase dashboard (database metrics)

---

## Additional Clarifications

### Q: What happens when a user downgrades their plan?

**Decision:**

- User must contact support (prevent accidental data loss)
- Support team:
  1. Exports user's data (full backup)
  2. Confirms data export received
  3. Disables features based on new plan:
     - Scale → Pro: Archive extra locations, cap team members at 5, turn off automation builder, adjust AI limit to 50/day
     - Pro → Starter: Remove team members, disable AI chat, automations, SMS, and booking customizations beyond basics
  4. Processes downgrade in Stripe
  5. User receives confirmation email

**No self-service downgrade** to prevent:

- Accidental data loss
- Support burden from regretful downgrades
- Revenue churn

### Q: How is the Starter task limit enforced?

**Decision:**

- Starter companies are capped at 3 new tasks per ISO week.
- Each task creation updates `task_usage_counters (company_id, week_start)`.
- When the counter hits 3, the API returns `TASK_LIMIT_REACHED` and the UI shows the reset date (next Monday, company timezone).
- Support/admin override can reset the counter; the action is captured in `audit_logs`.
- Pro/Scale bypass the counter entirely.

### Q: How does the Inventory module scale across plans?

**Decision:**

- **Starter:** Manual adjustments, low-stock banner on dashboard, CSV export.
- **Pro:** Bulk import/export, email alerts, job completion consumption flow, SMS alerts optional.
- **Scale:** Adds predictive usage (days remaining), vendor tracking, location tags, automation triggers (e.g., auto-create reorder task).
- Attachments (photos, receipts) available to all plans; storage quotas higher on Scale.

### Q: Who can upload before/after photos?

**Decision:**

- Only Pro and Scale plans expose the photo uploader on jobs.
- Starter shows an upgrade teaser instead of the uploader.
- Uploaded files are stored in `job_media` with signed URLs; Scale adds branded galleries and share links.

### Q: What happens if a Stripe subscription payment fails?

**Decision:**

1. Stripe automatically retries failed payments (3 attempts over 2 weeks)
2. After 1st failure:
   - Email sent: "Payment failed, please update your card"
   - App shows banner: "Payment issue. Update billing info to avoid service interruption."
3. After 2nd failure (1 week later):
   - Email sent: "2nd payment attempt failed"
   - App access limited: Read-only mode (can view data, cannot create/edit)
4. After 3rd failure (2 weeks later):
   - Subscription canceled
   - Account downgraded to Free plan (with feature restrictions)
   - Email sent: "Subscription canceled due to payment failure"
   - Data retained for 30 days (user can reactivate)
5. After 30 days:
   - Account soft-deleted (can be restored by support)
   - Data archived

### Q: How is customer data privacy handled?

**Decision:**

- **GDPR/CCPA Compliance:**
  - Customer data belongs to the company (data controller)
  - Maksy is data processor
  - Terms of Service + Privacy Policy clearly define this
- **Customer Deletion:**
  - Soft delete (data retained for 30 days, then hard deleted)
  - Cascade delete: customers → jobs → invoices → payments
  - Anonymize instead of delete if historical reports are needed
- **Data Export:**
  - Customers can request their data (via company owner)
  - Company owner can export all data (Settings > Export)
- **Data Portability:**
  - All exports in standard formats (CSV, JSON, PDF)
- **Encryption:**
  - All data encrypted at rest (Supabase default)
  - All API calls over HTTPS
  - Database connection over SSL

### Q: What integrations are planned beyond MVP?

**Decision:**

**Phase 2 Integrations (3-6 months post-launch):**

- QuickBooks (accounting sync)
- Google Business Profile (auto-post reviews)
- Zapier (connect to 3,000+ apps)
- Mailchimp (email marketing)

**Phase 3 Integrations (6-12 months):**

- Facebook & Instagram (social media booking)
- Google Ads & Meta Ads (ad spend tracking + ROI)
- Jobber/ServiceTitan (migration tools)
- API access (Pro plan, for custom integrations)

**Not Planned:**

- ERP systems (too complex for target market)
- Industry-specific tools (e.g., HVAC dispatch software) - focus remains on simplicity

---

## Summary of Key Decisions

✅ **Single company per user (no switching in MVP)**  
✅ **Maksy AI limits: Starter preview 15 lifetime, Pro 30/day, Scale 50/day (advanced GPT)**  
✅ **Booking customization focused on custom slugs + styling (no custom domains)**  
✅ **Team members get simplified mobile dashboard (job-focused)**  
✅ **No payment required on booking page (MVP), invoice sent later**  
✅ **Recurring jobs max 2 years, editable per-instance or all-future**  
✅ **CSV import uses AI for intelligent parsing (no strict format)**  
✅ **PWA for mobile (no native app in MVP)**  
✅ **Rate limiting on all endpoints to prevent abuse**  
✅ **No self-service downgrades (support-handled)**  
✅ **GDPR/CCPA compliant, customer data encrypted & exportable**

---

_Last Updated: November 5, 2025_  
_Version: 1.0_
