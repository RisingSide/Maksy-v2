# CHANGELOG

All notable changes to the Maksy application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2024-12-04] - Phase 9 & 10 Complete

### Added - Loading States (Phase 9.2)

- **Skeleton Loaders** for all protected pages
  - Dashboard, Customers, Jobs, Invoices, Estimates
  - Calendar, Settings, Team, Services, Tasks
  - Automations, Time & GPS, Reports
- Consistent loading UI with glass-card styling
- Proper Suspense boundaries

### Added - Test Infrastructure (Phase 9.3)

- **Vitest Configuration** for unit testing
  - JSDOM environment
  - React Testing Library integration
  - Path aliases configured
  - Coverage reporting (V8)
- **Playwright Configuration** for E2E testing
  - Multi-browser support (Chrome, Firefox, Safari)
  - Mobile viewport testing
  - Auto-start dev server
  - Screenshot/video on failure
- **Sample Tests**
  - Unit tests for utility functions
  - Component tests for Button
  - E2E tests for auth flow
  - E2E tests for customer management

### Added - Production Infrastructure (Phase 10)

- **Environment Template** (`env.example`)
  - All required variables documented
  - Grouped by service (Clerk, Stripe, etc.)
  - Comments explaining each variable
- **Vercel Configuration** (`vercel.json`)
  - Function timeouts (30s default, 60s for webhooks/AI)
  - Security headers (X-Frame-Options, CSP, etc.)
  - Cron jobs for reminders and metrics
- **Health Check Endpoint** (`/api/health`)
  - Database connection check
  - Environment variable validation
  - Uptime tracking
  - HEAD request support for simple checks
- **Production Checklist** (`PRODUCTION_CHECKLIST.md`)
  - Pre-deployment verification
  - Service configuration guides
  - Post-deployment verification
  - Monitoring setup
  - Rollback procedures

---

## [2024-12-04] - Sprint 1-3 Complete

### Added - Reports & Analytics

- **Reports Page** (`/reports`) - Full analytics dashboard
  - Revenue chart (Area chart with gradient fill)
  - Jobs chart (Bar chart showing scheduled/completed/cancelled)
  - Customer growth chart (Line chart with total and new customers)
  - Service breakdown (Pie chart by service type)
  - Top customers by lifetime value
  - Period selector (Daily/Weekly/Monthly)
  - Summary stat cards with trends
  - Export functionality (placeholder)
- **Reports API Endpoints**
  - `/api/reports/revenue` - Revenue aggregation by period
  - `/api/reports/jobs` - Job metrics with service breakdown
  - `/api/reports/customers` - Customer growth and top customers

### Added - Time & GPS Tracking

- **Time & GPS Page** (`/time-gps`) - Real-time team tracking
  - Google Maps integration with dark mode styles
  - Team member markers with status colors
  - Info windows showing job details
  - Team status sidebar with quick actions
  - Status tracking (available, on-the-way, at-job, working)
  - Metrics cards (jobs today, avg drive time, miles, on-time rate)
  - Date navigation (previous/next/today)
  - Auto-refresh every 30 seconds
- **Tracking API Endpoints**
  - `/api/tracking` - Get team locations and job status
  - `/api/tracking/update` - Update job tracking status with GPS

### Added - Visual Automation Builder

- **Automation Builder** (`/automations/builder`) - Drag-and-drop workflow builder
  - React Flow canvas for node-based editing
  - Node palette with categorized nodes:
    - Triggers: Job Scheduled, Job Completed, Customer Added, Invoice Paid, Estimate Approved
    - Actions: Send Email, Send SMS, Create Task, Update Status
    - Delays: Wait Minutes, Wait Hours, Wait Days
    - Conditions: If Field Equals, If Time Is
  - Custom node components with type-specific styling
  - Properties panel for node configuration
  - Save automation to database
  - Smooth step connections with animated edges
  - Link from automations page "Create Automation" button

### Added - Dependencies

- `@xyflow/react` - React Flow for visual automation builder
- `recharts` - Already installed, now fully utilized for reports

---

## [Unreleased]

### Planned

- Test coverage (Vitest + Playwright)
- Production deployment setup
- OAuth flows for integrations

---

## [2024-12-04] - Phase 3+ Complete

### Added - Public Booking System

- **Public Booking Page** (`/[slug]/book`) - Multi-step booking flow
  - Service selection with pricing and duration
  - Calendar date picker with business hours filtering
  - Time slot selection based on service duration
  - Customer information form with validation
  - Booking confirmation with job number
- **Booking Settings Page** (`/settings/booking`)
  - Business hours configuration per day
  - Time slot duration settings
  - Lead time and scheduling window configuration
  - Public booking page URL display

### Added - Settings Pages

- **Profile Settings** (`/settings/profile`) - User profile management
- **Company Settings** (`/settings/company`) - Company info and branding
- **Billing Settings** (`/settings/billing`) - Subscription management with Stripe Portal
- **Notifications Settings** (`/settings/notifications`) - Email/SMS preferences
- **Security Settings** (`/settings/security`) - 2FA status, sessions, connected accounts
- **Customer Fields** (`/settings/fields`) - Custom customer field definitions
- **Integrations Hub** (`/settings/integrations`) - Third-party connection status

### Added - Coupons System

- Coupon creation with percentage/fixed discounts
- Date range restrictions
- Usage limits (total and per-customer)
- Minimum order value requirements
- Service restrictions
- Coupon validation API

### Added - Custom Forms

- Form builder with drag-and-drop fields
- Multiple field types (text, email, phone, textarea, select, checkbox)
- Embed code generation for external sites
- Public form pages (`/forms/[id]`)
- Form submission handling

### Added - Detail Pages

- **Job Detail Page** (`/jobs/[id]`) - Full job management
  - Status tracking and updates
  - Team member assignment
  - Customer information display
  - Notes and photo management
  - Payment status tracking
- **Invoice Detail Page** (`/invoices/[id]`) - Invoice management
  - Line item display
  - Payment recording
  - Payment history timeline
  - Send invoice functionality

### Added - Background Jobs (Inngest)

- `sendAppointmentReminders24h` - 24-hour reminder cron
- `sendAppointmentReminders1h` - 1-hour reminder cron
- `checkOverdueInvoices` - Daily overdue invoice alerts
- `sendReviewRequest` - Post-job review request
- `calculateDailyMetrics` - Daily metrics calculation
- `sendWelcomeEmail` - New user welcome email

### Added - Infrastructure

- Resend email integration with templates
- SMS notifications via Twilio
- Unified notification service (`/lib/notifications.ts`)
- Email templates for invoices, estimates, jobs
- Sentry error tracking integration
- Theme toggle (dark/light mode)
- Error boundary component

### Fixed - Bug Fixes

- **`cancelAtPeriodEnd` vs `canceledAt`** - Added dedicated `cancel_at_period_end` boolean field to subscriptions table to distinguish between future cancellation intent and actual termination timestamp
- **Invoice total field** - Fixed usage of `invoice.total` instead of `invoice.totalAmount` to match database schema
- **Business hours persistence** - Fixed saving and loading of business hours in booking settings
- **SMS notification plan tier** - Fixed plan tier check for SMS notifications (was incorrectly disabling for Team plan instead of Pro)

### Changed - Database Schema

- Added `cancel_at_period_end` (boolean) to `subscriptions` table
- Added `seat_count` (integer) to `subscriptions` table for Team plan
- Added `stripe_seat_price_id` to `subscriptions` table
- Added `business_hours` (jsonb) to `company_settings` table
- Added `color` field to `services` table for chart/label identification

### Changed - Authentication

- Migrated from Supabase Auth to Clerk
- Updated middleware for Clerk authentication
- Added protected layout with onboarding check

---

## [2024-11-15] - Phase 4 Complete

### Added - Team Management

- Team member list with status filtering
- Email invitations via Resend
- Direct team member creation
- Invitation acceptance flow (`/accept-invite`)
- Role management (owner, admin, team_member)
- Commission and hourly rate tracking
- Resend invitation functionality

### Added - Automations

- Automations page with stock automations
- Automation templates gallery (Scale only)
- Template activation modal
- On/off toggle for automations

---

## [2024-11-01] - Phase 2-3 Complete

### Added - Core Features

- Dashboard with real-time stats and metrics
- Customer management (CRUD, search, filters)
- Service catalog with categories
- Calendar views (week, month, day)
- Job management with status workflow
- Invoice creation and sending
- Estimate creation with AI pricing (Scale)
- Task management

### Added - Financial Features

- Stripe subscription management
- Webhook handler for subscription events
- Payment tracking
- Invoice line items

### Added - AI Features

- Maksy AI chat assistant
- Financial AI insights (Scale only)
- AI contract generation
- Dynamic pricing engine

---

## Migration Notes

### Database Migrations Applied

1. `00000_rls_helpers.sql` - RLS helper functions
2. `00001_enable_rls_policies.sql` - Enable RLS on tables
3. `00002_add_service_color.sql` - Add color field to services
4. `00003_add_cancel_at_period_end.sql` - Add subscription cancellation intent field
5. `00004_add_business_hours.sql` - Add business hours to company settings

### Environment Variables Required

```bash
# Clerk (replaces Supabase Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase (Database only)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (Email)
RESEND_API_KEY=
EMAIL_FROM=

# Twilio (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# OpenAI
OPENAI_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
```

---

## Versioning

This project uses date-based versioning for major releases:

- `YYYY-MM-DD` format for release dates
- Features are grouped by phase completion
- Bug fixes are documented as they occur
