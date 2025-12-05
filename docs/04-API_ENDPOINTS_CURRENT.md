# API ENDPOINTS - CURRENT STATUS

## Last Updated: December 4, 2024

This document reflects the **actual current state** of implemented API routes.

Legend:

- ✅ **IMPLEMENTED** - Fully functional
- 🟡 **PARTIAL** - Stub exists, needs full implementation
- ❌ **NOT IMPLEMENTED** - Needs to be created

---

## 🔒 Security Features

### Rate Limiting ✅

All endpoints implement rate limiting:

- **Auth endpoints**: 10 requests/minute per IP
- **Standard API**: 30 requests/minute per user
- **Read-heavy endpoints**: 60 requests/minute per user
- **AI/Expensive operations**: 5 requests/minute per user
- **Webhooks**: 100 requests/minute per source

Headers included in responses:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait (on 429 errors)

### CORS Configuration ✅

- **Development**: Allows `localhost:3000`, `localhost:3001`
- **Production**: Restricted to `maksy.com` domains
- **Public API**: Wildcard for designated public endpoints
- **Webhooks**: CORS disabled for external services

### Input Sanitization ✅

All user inputs are sanitized:

- **HTML content**: DOMPurify with allowed tags only
- **Text inputs**: HTML stripped, trimmed
- **Email addresses**: Validated and normalized
- **Phone numbers**: Non-numeric characters removed
- **URLs**: Protocol validation (http/https only)
- **File names**: Path traversal prevention

### Database Security ✅

- **Connection pooling**: Max 20, Min 2 connections
- **Parameterized queries**: Via Drizzle ORM
- **Row Level Security**: Supabase RLS policies
- **Timeout protection**: 2 second connection timeout

---

## Authentication & User Management (Clerk)

### Clerk Managed Routes

- **Sign Up:** `/sign-up` - ✅ Clerk hosted UI
- **Sign In:** `/sign-in` - ✅ Clerk hosted UI
- **User Profile:** Clerk Dashboard
- **OAuth:** Google, Microsoft (via Clerk config)

### POST `/api/clerk/webhook`

**Status:** ✅ IMPLEMENTED

**Purpose:** Sync Clerk users with database

**Events:**

- `user.created` → Create company + team_member + subscription
- `user.updated` → Update user data
- `user.deleted` → Soft delete

**File:** `apps/web/src/app/api/clerk/webhook/route.ts`

---

## Onboarding

### POST `/api/onboarding/complete-critical`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/onboarding/complete-critical/route.ts`

---

### GET `/api/onboarding/progress`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/onboarding/progress/route.ts`

---

### POST `/api/onboarding/complete-task`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/onboarding/complete-task/route.ts`

---

### POST `/api/onboarding/set-tour-mode`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/onboarding/set-tour-mode/route.ts`

---

## Customers

### GET `/api/customers`

**Status:** ✅ IMPLEMENTED

**Features:**

- Query company's customers with RLS
- Search by firstName, lastName, email, phone, companyName
- Pagination (limit max 100, offset)
- Sorting (name, recent, LTV)
- Returns customers array, total count, has_more flag

**File:** `apps/web/src/app/api/customers/route.ts`

---

### POST `/api/customers`

**Status:** ✅ IMPLEMENTED

**Features:**

- Create customer with Zod validation
- Required: firstName, lastName
- Optional: email, phone, companyName, address, notes
- Duplicate email/phone detection (409 conflict)
- Returns created customer (201)

**File:** `apps/web/src/app/api/customers/route.ts`

---

### GET `/api/customers/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Get single customer by ID
- Verify company ownership (RLS)
- Returns 404 if not found or forbidden

**File:** `apps/web/src/app/api/customers/[id]/route.ts`

---

### PATCH `/api/customers/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Update customer with Zod validation
- Verify company ownership
- Partial updates supported
- Returns updated customer

**File:** `apps/web/src/app/api/customers/[id]/route.ts`

---

### DELETE `/api/customers/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Hard delete customer
- Verify company ownership
- Returns success confirmation
- Foreign key constraint handling (409 if referenced)

**File:** `apps/web/src/app/api/customers/[id]/route.ts`

---

## Services

### GET `/api/services`

**Status:** ✅ IMPLEMENTED

**Features:**

- List all services with category data (left join)
- Filter by category, public/private status, search
- Pagination (limit, offset)
- Sorting (name, price, order, recent)
- Returns total count and has_more flag

**File:** `apps/web/src/app/api/services/route.ts`

---

### POST `/api/services`

**Status:** ✅ IMPLEMENTED

**Features:**

- Create service with Zod validation
- Required: name, price, durationMinutes
- Optional: categoryId, description, iconUrl, color, isPublic
- Auto-generates slug from name
- Default color: #f4a125

**File:** `apps/web/src/app/api/services/route.ts`

---

### GET `/api/services/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/services/[id]/route.ts`

---

### PATCH `/api/services/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/services/[id]/route.ts`

---

### DELETE `/api/services/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/services/[id]/route.ts`

---

## Service Categories

### GET `/api/service-categories`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/service-categories/route.ts`

---

### POST `/api/service-categories`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/service-categories/route.ts`

---

### GET `/api/service-categories/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/service-categories/[id]/route.ts`

---

### PATCH `/api/service-categories/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/service-categories/[id]/route.ts`

---

### DELETE `/api/service-categories/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/service-categories/[id]/route.ts`

---

## Jobs

### GET `/api/jobs`

**Status:** ✅ IMPLEMENTED

**Features:**

- List all jobs with customer, service, team member data
- Filter by status, teamMemberId, customerId, date range
- Pagination (limit, offset)
- Sorting (date, recent, customer)
- Returns total count and has_more flag

**File:** `apps/web/src/app/api/jobs/route.ts`

---

### POST `/api/jobs`

**Status:** ✅ IMPLEMENTED

**Features:**

- Create job with Zod validation
- Auto-generate job number (JOB-YYYYMMDD-XXXX)
- Verify customer, service, team member belong to company
- Required: customerId, serviceId, scheduledDate, scheduledTime, durationMinutes, totalPrice
- Optional: assignedTeamMemberId, status, notes, recurring fields
- Default status: 'scheduled', paymentStatus: 'unpaid'

**File:** `apps/web/src/app/api/jobs/route.ts`

---

### GET `/api/jobs/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Get single job with related data (customer, service, team member)
- Verify company ownership

**File:** `apps/web/src/app/api/jobs/[id]/route.ts`

---

### PATCH `/api/jobs/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Update job with validation
- Verify all references (customer, service, team member)
- Partial updates supported

**File:** `apps/web/src/app/api/jobs/[id]/route.ts`

---

### DELETE `/api/jobs/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Delete job (cascades to job_add_ons, job_tracking)
- Foreign key constraint check (409 if referenced in invoices)

**File:** `apps/web/src/app/api/jobs/[id]/route.ts`

---

### PATCH `/api/jobs/[id]/status`

**Status:** ✅ IMPLEMENTED

**Features:**

- Update job status with business logic validation
- Validates status against jobStatusEnum
- Optional notes field

**File:** `apps/web/src/app/api/jobs/[id]/status/route.ts`

---

### PATCH `/api/jobs/[id]/assign`

**Status:** ✅ IMPLEMENTED

**Features:**

- Assign job to team member
- Verify team member belongs to company
- Allows unassignment (null teamMemberId)

**File:** `apps/web/src/app/api/jobs/[id]/assign/route.ts`

---

## Invoices

### GET `/api/invoices`

**Status:** ✅ IMPLEMENTED

**Features:**

- List all invoices with customer, job data
- Filter by status, customerId, jobId, date range
- Pagination (limit, offset)
- Sorting (date, amount, status)
- Returns total count and has_more flag

**File:** `apps/web/src/app/api/invoices/route.ts`

---

### POST `/api/invoices`

**Status:** ✅ IMPLEMENTED

**Features:**

- Create invoice with Zod validation
- Auto-generate invoice number (INV-YYYYMMDD-XXXX)
- Handles line items
- Calculates subtotal, tax, total
- Required: customerId, issueDate, dueDate
- Optional: jobId, notes, terms

**File:** `apps/web/src/app/api/invoices/route.ts`

---

### GET `/api/invoices/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Get single invoice with related data
- Includes line items, customer, job

**File:** `apps/web/src/app/api/invoices/[id]/route.ts`

---

### PATCH `/api/invoices/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Update invoice with validation
- Prevents updates if invoice is paid
- Partial updates supported

**File:** `apps/web/src/app/api/invoices/[id]/route.ts`

---

### DELETE `/api/invoices/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Delete invoice
- Prevents deletion if invoice is paid
- Verify company ownership

**File:** `apps/web/src/app/api/invoices/[id]/route.ts`

---

### POST `/api/invoices/[id]/send`

**Status:** ✅ IMPLEMENTED

**Features:**

- Mark invoice as sent
- Updates sentAt timestamp
- TODO: Actual email sending via Resend

**File:** `apps/web/src/app/api/invoices/[id]/send/route.ts`

---

### POST `/api/invoices/[id]/payment`

**Status:** ✅ IMPLEMENTED

**Features:**

- Record payment on invoice
- Handles partial payments
- Updates amountPaid and status
- Validates payment amount

**File:** `apps/web/src/app/api/invoices/[id]/payment/route.ts`

---

## Estimates

### GET `/api/estimates`

**Status:** ✅ IMPLEMENTED

**Features:**

- List all estimates with customer data
- Filter by status, customerId, date range
- Pagination (limit, offset)
- Returns total count and has_more flag

**File:** `apps/web/src/app/api/estimates/route.ts`

---

### POST `/api/estimates`

**Status:** ✅ IMPLEMENTED

**Features:**

- Create estimate with Zod validation
- Auto-generate estimate number (EST-YYYYMMDD-XXXX)
- Handles line items
- Calculates totals

**File:** `apps/web/src/app/api/estimates/route.ts`

---

### GET `/api/estimates/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Get single estimate with related data
- Includes line items, customer

**File:** `apps/web/src/app/api/estimates/[id]/route.ts`

---

### PATCH `/api/estimates/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Update estimate with validation
- Prevents updates if approved/declined
- Partial updates supported

**File:** `apps/web/src/app/api/estimates/[id]/route.ts`

---

### DELETE `/api/estimates/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/estimates/[id]/route.ts`

---

### POST `/api/estimates/[id]/send`

**Status:** ✅ IMPLEMENTED

**Features:**

- Mark estimate as sent
- Updates sentAt timestamp
- TODO: Actual email sending

**File:** `apps/web/src/app/api/estimates/[id]/send/route.ts`

---

### POST `/api/estimates/[id]/approve`

**Status:** ✅ IMPLEMENTED

**Features:**

- Mark estimate as approved
- Updates approvedAt timestamp
- Checks for expiration

**File:** `apps/web/src/app/api/estimates/[id]/approve/route.ts`

---

### POST `/api/estimates/[id]/convert`

**Status:** ✅ IMPLEMENTED

**Features:**

- Convert estimate to job and/or invoice
- Creates linked records
- Updates estimate status

**File:** `apps/web/src/app/api/estimates/[id]/convert/route.ts`

---

## Tasks

### GET `/api/tasks`

**Status:** ✅ IMPLEMENTED

**Features:**

- List all tasks with filters
- Filter by status, priority, assignee, due date
- Filter by linked entities (customer, job)
- Pagination (limit, offset)

**File:** `apps/web/src/app/api/tasks/route.ts`

---

### POST `/api/tasks`

**Status:** ✅ IMPLEMENTED

**Features:**

- Create task with Zod validation
- Required: title
- Optional: description, priority, dueDate, assignee, linked entities

**File:** `apps/web/src/app/api/tasks/route.ts`

---

### GET `/api/tasks/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/tasks/[id]/route.ts`

---

### PATCH `/api/tasks/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/tasks/[id]/route.ts`

---

### DELETE `/api/tasks/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/tasks/[id]/route.ts`

---

### PATCH `/api/tasks/[id]/complete`

**Status:** ✅ IMPLEMENTED

**Features:**

- Toggle task completion
- Updates status and completedAt

**File:** `apps/web/src/app/api/tasks/[id]/complete/route.ts`

---

## Team Management

### GET `/api/team`

**Status:** ✅ IMPLEMENTED

**Features:**

- List team members
- Filter by role, status
- Pagination (limit, offset)

**File:** `apps/web/src/app/api/team/route.ts`

---

### POST `/api/team`

**Status:** ✅ IMPLEMENTED

**Features:**

- Invite new team member
- Checks seat limits based on subscription plan
- Creates pending invitation

**File:** `apps/web/src/app/api/team/route.ts`

---

### GET `/api/team/[id]`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/team/[id]/route.ts`

---

### PATCH `/api/team/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Update team member
- Prevents changing owner's role

**File:** `apps/web/src/app/api/team/[id]/route.ts`

---

### DELETE `/api/team/[id]`

**Status:** ✅ IMPLEMENTED

**Features:**

- Delete team member
- Prevents deleting owner

**File:** `apps/web/src/app/api/team/[id]/route.ts`

---

### POST `/api/team/[id]/resend-invite`

**Status:** ✅ IMPLEMENTED

**Features:**

- Resend invitation email
- Updates invitationSentAt

**File:** `apps/web/src/app/api/team/[id]/resend-invite/route.ts`

---

## Dashboard

### GET `/api/dashboard/stats`

**Status:** ✅ IMPLEMENTED

**Features:**

- Calculate KPIs (customers, jobs, invoices, estimates, tasks)
- Returns metrics for current period

**File:** `apps/web/src/app/api/dashboard/stats/route.ts`

---

### GET `/api/dashboard/revenue`

**Status:** ✅ IMPLEMENTED

**Features:**

- Revenue by month (last 12 months)
- Returns chart-ready data

**File:** `apps/web/src/app/api/dashboard/revenue/route.ts`

---

### GET `/api/dashboard/activity`

**Status:** ✅ IMPLEMENTED

**Features:**

- Recent activity feed
- Combined events from multiple entities

**File:** `apps/web/src/app/api/dashboard/activity/route.ts`

---

### GET `/api/dashboard/services`

**Status:** ✅ IMPLEMENTED

**Features:**

- Service distribution and revenue breakdown
- Job counts by service for current month
- Percentage distribution calculations
- Average revenue per service
- Returns chart-ready data for pie charts and bar charts

**File:** `apps/web/src/app/api/dashboard/services/route.ts`

---

### GET `/api/dashboard/metrics`

**Status:** ✅ IMPLEMENTED

**Features:**

- Performance metrics for dashboard cards
- Average job duration (hours/minutes)
- Completion rate percentage
- Revenue per job calculation
- Daily revenue average
- Collection rate from invoices
- Total and completed job counts

**File:** `apps/web/src/app/api/dashboard/metrics/route.ts`

---

### GET `/api/dashboard/upcoming`

**Status:** ✅ IMPLEMENTED

**Features:**

- Upcoming appointments (next 7 days)
- Returns jobs with customer, service, team member data
- Formatted dates and times
- Customer initials for avatars
- Status badges (scheduled, confirmed, in_progress)

**File:** `apps/web/src/app/api/dashboard/upcoming/route.ts`

---

## File Uploads

### POST `/api/upload/company-logo`

**Status:** ✅ IMPLEMENTED

**Features:**

- Upload to Supabase Storage (company-logos bucket)
- Updates companies table
- Returns signed URL

**File:** `apps/web/src/app/api/upload/company-logo/route.ts`

---

### DELETE `/api/upload/company-logo`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/upload/company-logo/route.ts`

---

### POST `/api/upload/service-icon`

**Status:** ✅ IMPLEMENTED

**Features:**

- Upload to Supabase Storage (service-icons bucket)
- Supports images and SVG

**File:** `apps/web/src/app/api/upload/service-icon/route.ts`

---

### DELETE `/api/upload/service-icon`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/upload/service-icon/route.ts`

---

### GET `/api/upload/job-media`

**Status:** ✅ IMPLEMENTED

**Features:**

- Get signed URLs for job media

**File:** `apps/web/src/app/api/upload/job-media/route.ts`

---

### POST `/api/upload/job-media`

**Status:** ✅ IMPLEMENTED

**Features:**

- Upload to Supabase Storage (job-media bucket)
- Supports multiple files

**File:** `apps/web/src/app/api/upload/job-media/route.ts`

---

### DELETE `/api/upload/job-media`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/upload/job-media/route.ts`

---

## Company

### GET `/api/company`

**Status:** ✅ IMPLEMENTED

**Features:**

- Get company profile for current user

**File:** `apps/web/src/app/api/company/route.ts`

---

### PATCH `/api/company`

**Status:** ✅ IMPLEMENTED

**Features:**

- Update company profile with Zod validation

**File:** `apps/web/src/app/api/company/route.ts`

---

### GET `/api/company/settings`

**Status:** ✅ IMPLEMENTED

**Features:**

- Get company settings

**File:** `apps/web/src/app/api/company/settings/route.ts`

---

### PATCH `/api/company/settings`

**Status:** ✅ IMPLEMENTED

**Features:**

- Update company settings with Zod validation

**File:** `apps/web/src/app/api/company/settings/route.ts`

---

## Maksy AI

### POST `/api/maksy/chat`

**Status:** ✅ IMPLEMENTED

**Features:**

- AI chat with business context
- Integrates with OpenAI GPT-4o-mini
- Provides company context in system prompt

**File:** `apps/web/src/app/api/maksy/chat/route.ts`

---

### GET `/api/maksy/usage`

**Status:** ✅ IMPLEMENTED

**Features:**

- Get today's usage count
- Get daily limit based on plan
- Return usage stats

**File:** `apps/web/src/app/api/maksy/usage/route.ts`

---

## Subscription

### GET `/api/subscription`

**Status:** ✅ IMPLEMENTED

**Features:**

- Get current subscription for user
- Returns plan type, status, seat count

**File:** `apps/web/src/app/api/subscription/route.ts`

---

## Utilities

### GET `/api/slugs/check`

**Status:** ✅ IMPLEMENTED

**Purpose:** Check if company slug is available

**File:** `apps/web/src/app/api/slugs/check/route.ts`

---

## Contracts (Phase 2 - Stubs)

### GET `/api/contracts`

**Status:** 🟡 PARTIAL (returns empty array)

**File:** `apps/web/src/app/api/contracts/route.ts`

---

### POST `/api/contracts`

**Status:** 🟡 PARTIAL (stub only)

---

### POST `/api/contracts/ai-generate`

**Status:** 🟡 PARTIAL (stub only)

**File:** `apps/web/src/app/api/contracts/ai-generate/route.ts`

---

## Documents (Phase 2 - Stubs)

### GET `/api/documents`

**Status:** 🟡 PARTIAL (returns empty array)

**File:** `apps/web/src/app/api/documents/route.ts`

---

### POST `/api/documents`

**Status:** 🟡 PARTIAL (stub only)

---

## Automation Templates (Phase 2 - Stubs)

### GET `/api/automation-templates`

**Status:** 🟡 PARTIAL (returns empty array)

**File:** `apps/web/src/app/api/automation-templates/route.ts`

---

### POST `/api/automation-templates/[id]/use`

**Status:** 🟡 PARTIAL (stub only)

**File:** `apps/web/src/app/api/automation-templates/[id]/use/route.ts`

---

## Financial AI (Phase 2 - Stubs)

### GET `/api/financial/insights`

**Status:** 🟡 PARTIAL (stub only)

**File:** `apps/web/src/app/api/financial/insights/route.ts`

---

### GET `/api/financial/forecast`

**Status:** 🟡 PARTIAL (stub only)

**File:** `apps/web/src/app/api/financial/forecast/route.ts`

---

### POST `/api/financial/analysis`

**Status:** 🟡 PARTIAL (stub only)

**File:** `apps/web/src/app/api/financial/analysis/route.ts`

---

## Dynamic Pricing (Phase 2 - Stubs)

### POST `/api/pricing/calculate`

**Status:** 🟡 PARTIAL (stub only)

**File:** `apps/web/src/app/api/pricing/calculate/route.ts`

---

### GET `/api/pricing/rules`

**Status:** 🟡 PARTIAL (stub only)

**File:** `apps/web/src/app/api/pricing/rules/route.ts`

---

## Webhooks

### POST `/api/stripe/webhook`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/stripe/webhook/route.ts`

**Events Handled:**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

### POST `/api/twilio/webhook`

**Status:** 🟡 PARTIAL (stub only)

**File:** `apps/web/src/app/api/twilio/webhook/route.ts`

---

### GET/POST `/api/inngest`

**Status:** ✅ IMPLEMENTED

**File:** `apps/web/src/app/api/inngest/route.ts`

**Registered Functions:**

- `sendWelcomeEmail`
- `processPayment`
- `scheduleReminder`
- `generateFinancialInsights`

---

## Summary Statistics

**Total Routes Implemented:** 59

**Status Breakdown:**

- ✅ **Fully Implemented:** 50 (85%)
- 🟡 **Partial/Stub:** 9 (15%)
- ❌ **Not Implemented:** 0 (0%)

**Phase 1 Complete:** All core CRUD APIs implemented
**Phase 2 Stubs:** Contracts, Documents, AI features ready for implementation
