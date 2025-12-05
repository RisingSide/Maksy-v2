# MAKSY - COMPLETE APPLICATION SPECIFICATION

## Master Plan & Feature Index

**Version:** 3.0  
**Last Updated:** December 4, 2024  
**Status:** Production Ready - Phase 0-9 Complete

---

## Document Structure

This specification is broken into manageable sections:

1. **[00-MASTER_PLAN.md](00-MASTER_PLAN.md)** (This file) - Navigation & Overview
2. **[01-PRICING_TIERS.md](01-PRICING_TIERS.md)** - All 4 pricing tiers and feature gates
3. **[02-PAGES_ROUTES.md](02-PAGES_ROUTES.md)** - Every page, route, and UI component
4. **[03-DATABASE_SCHEMA.md](03-DATABASE_SCHEMA.md)** - Complete database design
5. **[04-API_ENDPOINTS.md](04-API_ENDPOINTS.md)** - All API routes and webhooks
6. **[05-USER_FLOWS.md](05-USER_FLOWS.md)** - Onboarding, booking, and user journeys
7. **[06-MAKSY_AI.md](06-MAKSY_AI.md)** - AI assistant capabilities and functions
8. **[07-AUTOMATIONS.md](07-AUTOMATIONS.md)** - Background jobs and workflows
9. **[08-INTEGRATIONS.md](08-INTEGRATIONS.md)** - External services (Stripe, Twilio, etc.)
10. **[09-MOBILE_APP.md](09-MOBILE_APP.md)** - iOS team member app
11. **[10-FEATURE_DEPENDENCIES.md](10-FEATURE_DEPENDENCIES.md)** - What depends on what

---

## Executive Summary

### Vision

Maksy is an AI-powered, all-in-one business management platform for service-based businesses (HVAC, landscaping, plumbing, auto detailing, etc.) that combines:

- CRM & Customer Management
- Intelligent Scheduling & Calendar
- Job & Task Management
- Automated Invoicing & Payments
- Team Management & GPS Tracking
- Custom Booking Pages
- Workflow Automations
- AI Business Assistant ("Maksy")

### Core Differentiators

1. **AI-First Design** - Maksy AI assistant handles data extraction, business analysis, and workflow automation
2. **One Link Booking** - Customizable public booking pages with calendar integration
3. **Unified Platform** - No integrations needed for core functionality
4. **Team-Aware** - Built for businesses with mobile field teams
5. **Tiered Simplicity** - Single codebase, features unlock based on plan

### Target Users

- **Primary (Pro/Scale):** Service businesses with 1-20 employees (HVAC, plumbing, landscaping, auto detailing, pool service, etc.)
- **Secondary (Maksy Team):** Non-service businesses (agencies, consultancies, marketing firms, creative studios) who need team management, CRM, and AI tools without field service operations

---

## Pricing Tiers Overview

| Feature             | Pro ($47)                            | Scale ($97)                         | Maksy Team ($29 + $8/seat)          |
| ------------------- | ------------------------------------ | ----------------------------------- | ----------------------------------- |
| Target              | Service businesses                   | Growing service businesses          | Non-service businesses              |
| Users               | Owner + up to 5 team members         | Unlimited owners & team             | Unlimited (seat-based)              |
| Jobs/Month          | Unlimited                            | Unlimited                           | ❌ (not applicable)                 |
| AI Assistant        | 30 requests/user/day (standard GPT)  | 50 requests/user/day (advanced GPT) | 30 requests/user/day (standard GPT) |
| Automations         | Stock templates                      | Stock + Templates + Builder         | Stock templates                     |
| Tasks               | Unlimited                            | Unlimited + automation triggers     | Unlimited                           |
| Inventory           | Bulk import/export, low-stock alerts | Forecasting, vendor tracking        | ❌                                  |
| Invoicing           | Full suite (send, reminders, Stripe) | Advanced workflows & automation     | ❌                                  |
| Estimates           | ✅ (manual + AI suggestions)         | ✅ (AI-powered + dynamic pricing)   | ❌                                  |
| Booking Page        | Custom slug & branding controls      | Advanced styling presets            | ❌                                  |
| Forms               | 1 custom form                        | Unlimited forms with logic          | 1 custom form                       |
| GPS & Time Tracking | ✅                                   | ✅                                  | ❌                                  |
| Reporting           | Advanced reports & CSV export        | Advanced + AI-powered dashboards    | Team productivity reports           |
| Support             | Email (48h response)                 | Priority desk (24h response)        | Email (48h response)                |

See [01-PRICING_TIERS.md](01-PRICING_TIERS.md) for complete feature breakdown.

---

## Application Structure

### Main Navigation (Sidebar)

```
📊 Dashboard
📅 Calendar
💼 Jobs
✅ Tasks
🔧 Services
👥 Customers
📝 Estimates
🧾 Invoices
📍 Time & GPS
⚡ Automations
⚙️ Settings
  ├─ Profile
  ├─ Company
  ├─ Team
  ├─ Booking Page
  ├─ Ask Maksy
  ├─ Customer Fields
  ├─ Forms
  ├─ Coupons
  ├─ Integrations
  ├─ Notifications
  ├─ Reports
  ├─ Security
  └─ Plan & Billing
```

### Public Routes

```
/ - Landing page
/pricing - Pricing tiers
/login - Sign in
/signup - Create account
/onboarding - Multi-step setup
/booking/[company] - Public booking page
/forms/[formId] - Custom forms
```

### Protected Routes (App)

```
/dashboard - Main dashboard
/calendar - Schedule view
/jobs - Job management
/tasks - Task list
/services - Service catalog
/customers - CRM
/estimates - Quote management
/invoices - Billing
/time-gps - Team tracking
/automations - Workflow builder
/settings/* - All settings pages
```

---

## Tech Stack

### Frontend

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Zod
- **State:** Zustand (client) + TanStack Query (server)

### Backend

- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle
- **Auth:** Supabase Auth (Email + Google OAuth)
- **API:** Next.js Route Handlers
- **Background Jobs:** Inngest
- **File Storage:** Supabase Storage

### Integrations

- **Payments:** Stripe
- **SMS:** Twilio
- **Email:** Resend (to be added)
- **AI:** OpenAI GPT-4o-mini
- **Monitoring:** Sentry
- **Analytics:** PostHog (to be added)

### Mobile

- **iOS App:** React Native (future) or PWA initially

---

## Key Metrics & Constraints

### Performance Targets

- Page load: < 2s
- Time to Interactive: < 3s
- API response: < 500ms (p95)

### Data Limits

- Pro tier: Unlimited jobs, up to 5 team members, Maksy AI 30 requests/day
- Scale tier: Unlimited jobs, unlimited team, Maksy AI 50 requests/day (advanced GPT)
- Team tier: No jobs/services (team management focus), 30 AI requests/day, seat-based billing

### Compliance

- GDPR compliant (EU users)
- CAN-SPAM compliant (email)
- TCPA compliant (SMS opt-in)
- PCI DSS (Stripe handles)

---

## Development Phases (To Be Defined)

After reviewing this complete spec, we'll break into:

1. **Phase 1: MVP** - Core functionality (Starter fundamentals: auth, onboarding, jobs, invoices)
2. **Phase 2: Pro** - Team features, Maksy AI (50/day), SMS automations, payments
3. **Phase 3: Scale** - Unlimited team, automation builder, advanced integrations

---

## Current Status

1. ✅ Review complete feature specification (all docs)
2. ✅ Define database schema with relationships (53 tables)
3. ✅ Map API endpoints and webhooks (100+ endpoints)
4. ✅ Plan user flows and wireframes
5. ✅ Break into development phases (Phase 0-9)
6. ✅ Implementation complete (Phase 0-9)
7. ⏳ Phase 10: Deployment (next)

---

**Production ready - see [ROADMAP.md](./ROADMAP.md) for deployment steps!** 🚀
