# MAKSY V2 - COMPLETE PRODUCT SPECIFICATION

## 🎯 Vision

Maksy is an **AI-powered, all-in-one business management platform** for service-based businesses that combines CRM, scheduling, invoicing, team management, and intelligent automation into a single, seamless experience.

---

## 📚 Documentation Structure

This folder contains the complete specification for building Maksy from start to finish.

### Navigation

1. **[00-MASTER_PLAN.md](./00-MASTER_PLAN.md)**  
   📋 Start here - Overview, tech stack, and document navigation

2. **[01-PRICING_TIERS.md](./01-PRICING_TIERS.md)**  
   💰 Pro / Scale / Maksy Team plan breakdown with feature matrix & AI usage limits

3. **[02-PAGES_ROUTES.md](./02-PAGES_ROUTES.md)**  
   📄 Every page, route, form, and UI component detailed

4. **[03-DATABASE_SCHEMA.md](./03-DATABASE_SCHEMA.md)**  
   🗄️ Complete database design - 41 tables with relationships

5. **[04-API_ENDPOINTS.md](./04-API_ENDPOINTS.md)**  
   🔌 All API routes, webhooks, and background jobs

6. **[05-USER_FLOWS.md](./05-USER_FLOWS.md)**  
   🚶 Step-by-step user journeys from signup to daily operations

7. **[06-CLARIFICATIONS.md](./06-CLARIFICATIONS.md)**  
   ❓ Answers to all critical planning questions & design decisions

8. **[07-GLOSSARY.md](./07-GLOSSARY.md)**  
   📖 Complete terminology guide for Maksy-specific and technical terms

9. **[08-BUILD_PLAN.md](./08-BUILD_PLAN.md)**  
   🛠️ Foundation-first build roadmap (Phase 0 → Phase 2)

10. **[09-SUPABASE_CLEANUP_GUIDE.md](./09-SUPABASE_CLEANUP_GUIDE.md)**  
    🗄️ Database setup, cleanup steps, and environment configuration

11. **[10-TEAM_MANAGEMENT.md](./10-TEAM_MANAGEMENT.md)**  
    👥 Team member management - invitation flows, direct creation, roles & permissions

12. **[05-IMPLEMENTATION_CHECKLIST.md](./05-IMPLEMENTATION_CHECKLIST.md)**  
    ✅ Detailed implementation tasks & sequencing

13. **[CHANGELOG.md](./CHANGELOG.md)**  
    📝 Version history, new features, and bug fixes

14. **[DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md)**  
    ⚠️ Guidelines to preserve existing functionality during development

15. **[../BUGS_FIXED.md](../BUGS_FIXED.md)**  
    🐛 Bug fix log with detailed cause analysis and solutions

---

## 🚀 Quick Start Guide

### Step 1: Read the Docs

1. Read `00-MASTER_PLAN.md` for overview
2. Understand pricing & AI usage limits in `01-PRICING_TIERS.md`
3. Review all user flows in `05-USER_FLOWS.md`
4. Study the database schema in `03-DATABASE_SCHEMA.md`
5. Check `06-CLARIFICATIONS.md` for all design decisions

### Step 2: Set Up Environment

```bash
cd /Users/chaseshooltz/Maksy-v2/apps/web

# Install new dependencies
pnpm add resend zustand @tanstack/react-query react-big-calendar \
  react-day-picker @tanstack/react-table react-dropzone \
  @react-pdf/renderer libphonenumber-js papaparse

pnpm add -D @types/papaparse
```

### Step 3: Configure Environment Variables

Create `/apps/web/.env.local`:

```bash
# See 05-IMPLEMENTATION_CHECKLIST.md for complete list
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# ... (30+ more variables)
```

### Step 4: Run Database Migrations

```bash
# Create migration files from 03-DATABASE_SCHEMA.md
# Then run:
pnpm run migrate
```

### Step 5: Start Building

Follow the **Implementation Checklist** (`05-IMPLEMENTATION_CHECKLIST.md`) starting with Phase 1.

---

## 📊 Project Stats

### Scope

- **Pages:** 30+ unique pages
- **API Routes:** 100+ endpoints implemented
- **Database Tables:** 53 tables (verified via schema.ts)
- **Features:** 100+ distinct features
- **Integrations:** 10+ external services (Stripe, Twilio, Resend, OpenAI, Inngest, Sentry)
- **Status:** ✅ Phase 0-9 Complete, Phase 3+ Enhancements Complete

### Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js API Routes, Drizzle ORM, PostgreSQL (Supabase)
- **Services:** Stripe, Twilio, OpenAI, Inngest, Sentry
- **Mobile:** iOS app (future phase)

---

## 🎨 UI Theme

**Design System:**

- Dark mode with animated gradient background (default for new accounts)
- Light mode available via theme toggle
- Primary color: Orange (#f4a125)
- Glass morphism effects
- Clean, minimal, modern aesthetic

**Reference:** See the dark theme mockup in user prompt

---

## 🏗️ Architecture Overview

### Frontend

```
/apps/web/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, signup
│   ├── (protected)/       # Main app pages
│   ├── booking/[company]/ # Public booking
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Sidebar, TopBar
│   ├── dashboard/        # Dashboard widgets
│   └── ...               # Feature-specific
└── lib/                   # Utilities, helpers
    ├── supabase/         # Auth & DB clients
    ├── stripe.ts         # Payment processing
    ├── sms.ts            # Twilio SMS
    ├── ai.ts             # OpenAI integration
    └── inngest/          # Background jobs
```

### Database

```
PostgreSQL (Supabase) - 53 Tables
├── Core: users, companies, subscriptions, company_settings
├── Team: team_members, team_availability
├── CRM: customers, custom_fields, field_values
├── Services: services, categories, add_ons
├── Jobs: jobs, job_tracking, job_add_ons, job_media
├── Tasks: tasks, task_usage_counters
├── Inventory: inventory_items, inventory_movements, inventory_attachments
├── Financial: estimates, estimate_line_items, invoices, invoice_line_items, payments
├── Coupons: coupons, coupon_service_restrictions, coupon_usages
├── Automation: automations, automation_executions
├── Forms: custom_forms, form_submissions
├── Integrations: integrations, notification_preferences
├── AI: ai_chat_history, ai_usage_counters, ai_usage_lifetime
└── Audit: audit_logs, reviews
```

### API Structure

```
/api/
├── clerk/webhook      # Clerk auth sync
├── onboarding/        # Setup flow (complete-critical, progress, tasks)
├── customers/         # Customer CRUD
├── services/          # Service CRUD
├── service-categories/# Category CRUD
├── jobs/              # Job CRUD + status + assign
├── invoices/          # Invoice CRUD + send + payment
├── estimates/         # Estimate CRUD + send + approve + convert
├── tasks/             # Task CRUD + complete
├── team/              # Team member CRUD + invite
├── dashboard/         # Stats, revenue, activity
├── company/           # Profile & settings
├── upload/            # File uploads (logos, icons, media)
├── maksy/             # AI chat + usage tracking
├── subscription/      # Subscription info
├── slugs/check        # Slug availability
├── stripe/webhook     # Stripe payment events
├── twilio/webhook     # SMS delivery status
└── inngest            # Background jobs
```

---

## 🎯 Core Features Breakdown

### 1. CRM & Customer Management

- Unlimited customers
- Custom fields
- CSV import with AI
- Job history & LTV tracking
- Tags & notes

### 2. Smart Scheduling

- Week/Month/Day calendar views
- Drag-and-drop
- Team availability
- No double-booking
- Recurring jobs
- AI schedule optimization
- Full access on Pro/Scale (Team plan: tasks only, no jobs)

### 3. Job Management

- Create, assign, track jobs
- On My Way → Start → Complete workflow
- GPS tracking (paid plans)
- Payment collection
- Customer notifications (SMS)

### 4. Financial

- Estimates/Quotes
- Invoices
- Payment tracking
- Stripe integration
- Overdue alerts

### 5. Automation

- Stock automations (reminders, confirmations)
- Custom workflow builder (Scale)
- SMS/Email triggers
- Conditional logic

### 6. Maksy AI Assistant

- Natural language interface
- **Plan-based limits** (Pro 30/day, Scale 50/day with advanced GPT, Team 25/day)
- Create tasks, jobs, invoices via chat
- Business analysis & insights
- Revenue optimization tips
- Data extraction from files & uploads
- Usage summary card + limit banner when exhausted

### 7. Public Booking Page

- Customizable booking portal
- Service selection
- Calendar integration
- Customer data capture
- **Custom slug (editable on Pro & Scale)**
- Branding options
- Remove "Powered by Maksy" (Pro & Scale)
- Advanced styling controls (Scale)

### 8. Team Management ✅ Complete

- **Invite Member** - Send email invitation via Resend, recipient creates account
- **Add Member** - Create Clerk account directly with credentials to share
- **Accept Invitation** - Public page for invited members to accept
- Role-based access (Owner, Admin, Team Member)
- Commission/hourly rate tracking
- Resend invitation functionality
- Plan-based member limits (Pro: 5, Scale: unlimited, Team: seat-based)

### 9. Inventory

- Centralized item catalogue (all plans)
- Low-stock alerts (banner, email, SMS)
- Job consumption (Pro/Scale)
- Predictive restock reports (Scale)

---

## 🔐 Security & Compliance

### Authentication

- Clerk Authentication (email + Google OAuth)
- Row Level Security (RLS) via Supabase
- JWT sessions
- 2FA available on all plans

### Data Protection

- Encrypted at rest (Supabase)
- HTTPS only
- API rate limiting
- Audit logs (basic on Pro, full on Scale)

### Compliance

- GDPR ready
- CAN-SPAM compliant
- TCPA compliant (SMS opt-in)
- PCI DSS (via Stripe)

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

- Utility functions
- React components
- API route handlers

### Integration Tests

- Database operations
- API endpoints
- Stripe webhooks

### E2E Tests (Playwright)

- User flows (signup, onboarding)
- Booking process
- Job workflow
- Payment processing

### Performance Tests

- Page load times (< 2s target)
- API response times (< 500ms p95)
- Database query optimization

---

## 📈 Success Metrics

### MVP Launch Criteria

- [ ] User signup & onboarding complete
- [ ] Customer CRUD operations
- [ ] Job scheduling functional
- [ ] Invoicing working
- [ ] Public booking page live
- [ ] Stripe payments processing
- [ ] SMS notifications sending
- [ ] Zero critical bugs

### Post-Launch KPIs

- User acquisition rate
- Conversion from free to paid
- Monthly recurring revenue (MRR)
- Customer retention rate
- Feature adoption (which features used most)
- Performance metrics (uptime, speed)

---

## 🚧 Known Challenges & Solutions

### Challenge 1: Feature Complexity

**Problem:** 100+ features is a lot  
**Solution:** Phased approach in Implementation Checklist

### Challenge 2: AI Token Costs

**Problem:** OpenAI API can get expensive  
**Solution:** Guard rails, caching, usage limits per plan

### Challenge 3: SMS Costs

**Problem:** Twilio charges per SMS  
**Solution:** Bundle into pricing, encourage Messaging Service

### Challenge 4: Database Performance

**Problem:** Complex queries with lots of joins  
**Solution:** Proper indexing, caching, pagination

### Challenge 5: Real-time Features

**Problem:** GPS tracking, live calendar updates  
**Solution:** Supabase Realtime, optimistic updates

---

## 🎓 Learning Resources

### Next.js 16

- https://nextjs.org/docs

### Drizzle ORM

- https://orm.drizzle.team/docs/overview

### Supabase

- https://supabase.com/docs

### Stripe

- https://stripe.com/docs/payments

### OpenAI API

- https://platform.openai.com/docs

### Inngest

- https://www.inngest.com/docs

---

## 📞 Support & Questions

**For implementation questions:**

- Review the specific doc section
- Check the Implementation Checklist
- Reference the API Endpoints doc

**For missing features:**

- See `01-PRICING_TIERS.md` for what's locked per plan
- Check roadmap for future additions

---

## 🗺️ Roadmap Beyond MVP

### Phase 11: Mobile App (iOS)

- Native iOS app for team members
- Job management
- GPS tracking
- Push notifications

### Phase 12: Advanced Features

- Multiple business locations (Pro)
- Team chat/messaging
- Customer portal (self-service)
- Inventory management

### Phase 13: Integrations

- Zapier
- Facebook/Instagram organic posting
- Additional payment processors
- Accounting software sync

### Phase 14: Scale & Optimize

- Performance optimization
- Caching layer (Redis)
- CDN for assets
- Database read replicas

---

## ✨ What Makes Maksy Special?

1. **AI-First:** Not a bolt-on feature - AI is core to the experience
2. **Single Codebase:** Feature flags instead of multiple apps
3. **Service-Focused:** Built specifically for field service businesses
4. **All-in-One:** No need for 5 different tools
5. **Beautiful UX:** Glass morphism, smooth animations, modern design
6. **Fair Pricing:** Powerful free tier, affordable paid plans

---

## 🎬 Next Steps

1. ✅ **Read all documentation** (you are here!)
2. ⏳ **Set up development environment**
3. ⏳ **Run database migrations**
4. ⏳ **Start Phase 1 implementation**
5. ⏳ **Build, test, iterate**
6. ⏳ **Launch MVP**
7. ⏳ **Gather feedback & improve**
8. ⏳ **Scale to thousands of users**

---

**Let's build something incredible!** 🚀

---

_Last Updated: December 4, 2024_  
_Version: 3.0_  
_Status: Phase 0-9 Complete | Phase 3+ Enhancements Complete | Ready for Production Testing_
