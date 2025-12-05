# BUILD PLAN – Foundation-First Roadmap

## Goal

Ship a working Maksy web app with reliable signup, onboarding, and paywall logic before building advanced features. Past iterations failed because the core flows were brittle; this plan front-loads the plumbing so we can confidently layer on intelligence, automations, and deep reporting later.

---

## Phase 0 – Foundation Hardening & Pricing Restructure (COMPLETE ✅)

### Security Enhancements (Added December 2, 2024) ✅

- ✅ **Rate Limiting**: Configurable limits per endpoint type with headers
- ✅ **Input Sanitization**: XSS/injection prevention via DOMPurify
- ✅ **CORS Configuration**: Environment-specific origin restrictions
- ✅ **Database Pooling**: Optimized connections (max 20, min 2)
- ✅ **API Security Middleware**: Unified wrapper for all endpoints

**Objectives** ✅

- Landing experience drives to signup
- Users can create an account, complete onboarding, and land inside the app
- Plan selection and payment gating behave predictably
- Three-tier pricing model implemented: Pro, Scale, Maksy Team
- Feature gating correctly hides service business features for Team plan
- All Supabase tables are clean and aligned with the new schema

**Deliverables**

1. **Pricing Restructure**
   - Remove Starter (free) plan completely
   - Add Maksy Team plan ($29/month + $8/seat)
   - Update database schema: `plan_type` enum to ['pro', 'scale', 'team']
   - Add seat-based billing fields to subscriptions table
   - Create feature gating system (isServiceBusinessPlan, isTeamPlan helpers)
2. **Landing Page & Pricing CTA**
   - Update copy/CTA to "Start 14-day Pro trial", "Start 14-day Scale trial", "Start 14-day Team trial"
   - Pricing cards match Pro / Scale / Maksy Team feature sets
   - Clearly differentiate service business vs team management plans
3. **Signup Flow**
   - Email/password signup (no card required for trial)
   - Optional Google OAuth stub (can be enabled later)
   - Session established and user redirected to onboarding
4. **Onboarding Wizard**
   - Step 1: Business type selection ("Service Business" → Pro/Scale or "Team Management" → Team)
   - Step 2: Industry selection (skip for Team plan)
   - Step 3: Business info (auto slug + availability check)
   - Step 4: Owner info
   - Step 5: Payment step (Stripe Checkout) - required before trial ends
   - Step 6: Service setup (Pro/Scale only)
   - Step 7: Team invitation (all plans, optional)
   - Completion flag stored so returning users bypass onboarding
5. **Plan Selection & Paywall Logic**
   - `?plan=pro|scale|team` query param pre-selects desired plan
   - All plans require payment method before trial expires (14 days)
   - Billing page shows current plan, seat count (Team only), upgrade CTA, and trial countdown
   - Team plan: Show seat management UI
6. **Supabase Migration**
   - Update plan_type enum: ['starter', 'pro', 'scale'] → ['pro', 'scale', 'team']
   - Add seat_count and stripe_seat_price_id to subscriptions table
   - Remove Starter-specific constraints (job limits, task limits, AI lifetime counters)
   - Verify RLS policies for plan-based access
7. **Skeleton App Shell**
   - Sidebar/nav with plan-based visibility
   - Jobs, Services, Estimates, Invoices, Time & GPS hidden for Team plan
   - Dashboard placeholder with plan-appropriate metrics
   - Feature gates wired up (Team locks, Scale locks)

**Acceptance Criteria**

- QA can create a Pro account end-to-end and see service business features
- QA can create a Team account and confirm Jobs/Services/Estimates are hidden
- QA can add team members to Team plan and see seat-based billing calculation
- Billing page correctly shows seat count and per-seat pricing for Team plan
- All plans show 14-day trial countdown and payment requirement
- Supabase tables match updated `03-DATABASE_SCHEMA.md`

**✅ PHASE 0 STATUS: COMPLETE (100%)**

All infrastructure and foundation work is done:

- ✅ Clerk authentication integrated
- ✅ Database schema (49 tables) migrated
- ✅ Feature gating system implemented
- ✅ Pricing tiers updated (Pro, Scale, Team)
- ✅ Onboarding system functional
- ✅ Stripe/Twilio/Inngest webhooks configured
- ✅ UI shell with all page skeletons

**Next:** Phase 2 - Scale-Up Features & AI Enhancements

---

## Phase 1 – Essential App Skeleton ✅ COMPLETE (December 2024)

**Goal:** Deliver the core experience that proves Maksy works before automations/AI depth.

### ✅ Completed Items

1. **Dashboard** ✅
   - ✅ Summary cards with stat metrics
   - ✅ Revenue chart placeholder
   - ✅ Service breakdown chart placeholder
   - ✅ Recent activity feed
   - ✅ Maksy Intel drawer/dropdown
   - ✅ Onboarding progress banner

2. **Calendar & Jobs** ✅ (Pro/Scale only)
   - ✅ Week/Month/Day views with modals
   - ✅ Add job modal
   - ✅ Job detail page placeholder
   - ✅ Jobs API (GET, POST, PATCH, DELETE, status, assign)

3. **Services & Customers** ✅
   - ✅ Services API (GET, POST, PATCH, DELETE) with category support
   - ✅ Services: color field, slug, sorting
   - ✅ Service Categories API
   - ✅ Customers API (GET, POST, PATCH, DELETE)
   - ✅ Customer validation with Zod

4. **Financial Basics** ✅ (Pro/Scale only)
   - ✅ Estimates API (GET, POST, PATCH, DELETE, send, approve, convert)
   - ✅ Invoices API (GET, POST, PATCH, DELETE, send, payment)
   - ✅ Stripe webhooks (subscription events, payment intents)
   - ✅ Financial insights API

5. **Tasks & Activity Feed** ✅ (All plans)
   - ✅ Tasks API (GET, POST, PATCH, DELETE, complete)
   - ✅ Dashboard activity route

6. **Inventory Module** ✅ (all plans)
   - ✅ Inventory API (GET, POST) with filters, search, pagination
   - ✅ Inventory item API (GET, PATCH, DELETE)
   - ✅ Inventory adjustment API (POST) with movement ledger
   - ✅ Low stock filtering

7. **Maksy AI** ✅ (All paid plans)
   - ✅ Chat UI component
   - ✅ Usage tracking API
   - ✅ Chat API with OpenAI integration

8. **Contracts & Documents** ✅ (Pro/Scale/Team)
   - ✅ Contracts API (GET, POST) with pagination
   - ✅ Contract AI generation endpoint
   - ✅ Documents API with folder structure

9. **Settings & Configuration** ✅
   - ✅ Company settings API
   - ✅ Team management API (GET, POST, PATCH, DELETE, resend-invite)
   - ✅ Subscription API
   - ✅ Stripe billing integration

10. **Infrastructure** ✅
    - ✅ SMS utility module (`/lib/sms.ts`) for job reminders, invoice reminders
    - ✅ Inngest financial insights job fixed
    - ✅ Rate limiting middleware
    - ✅ Input sanitization
    - ✅ CORS configuration

### API Routes Summary (40+ endpoints implemented)

| Category        | Endpoints |
| --------------- | --------- |
| Auth/Onboarding | 4 routes  |
| Customers       | 2 routes  |
| Services        | 4 routes  |
| Jobs            | 4 routes  |
| Invoices        | 4 routes  |
| Estimates       | 6 routes  |
| Contracts       | 3 routes  |
| Documents       | 1 route   |
| Tasks           | 4 routes  |
| Inventory       | 3 routes  |
| Financial       | 3 routes  |
| Team            | 4 routes  |
| Settings        | 2 routes  |
| Webhooks        | 3 routes  |

**Testing Focus**

- Playwright flows: signup → onboarding → create customer → create job → invoice → upgrade
- Unit tests for plan checks, AI usage counter, job cap
- Integration tests for Stripe & Supabase interactions

---

## Phase 2 – Scale-Up Features & AI Enhancements (Weeks 6-12)

**Goal:** Layer on differentiators once the foundation is stable. Implement automation templates, financial AI dashboard, AI contract builder, and dynamic pricing engine.

### Phase 2 Infrastructure Status: ✅ READY

All backend infrastructure is complete. Phase 2 requires **UI implementation only**.

---

### 1. **Automation Templates** (Scale only)

**Infrastructure Status:**

- ✅ Database: `automation_templates` table exists in schema
- ✅ Seed data: 5 templates in `/db/seeds/automation-templates.ts`
- ✅ API: `GET /api/automation-templates` - List templates
- ✅ API: `POST /api/automation-templates/[id]/use` - Create automation from template
- ✅ Feature gate: `automationTemplates` (Scale only)

**Templates Included:**

1. Estimate follow-up (3-day reminder sequence)
2. New job workflow (assign → confirm → remind → review)
3. Customer onboarding (welcome → intake → follow-up)
4. Inactive customer reactivation (90-day dormancy trigger)
5. Upsell after service (24h delay → related services suggestion)

**UI Status: ✅ COMPLETE**

- [x] Template gallery page (`TemplateGallery.tsx`)
- [x] Category filter UI
- [x] "Use Template" modal (`UseTemplateModal.tsx`)
- [x] Integrated into `/automations` page

---

### 2. **Financial AI Dashboard** (Scale only)

**Infrastructure Status:**

- ✅ Database: `financial_insights` table exists
- ✅ Service: `FinancialAIService` with 5 analysis methods:
  - `analyzeProfitMargins()` - Profit margin trends with AI explanation
  - `suggestPricingChanges()` - Pricing optimization recommendations
  - `forecastRevenue()` - Quarterly revenue projections
  - `analyzeCosts()` - Cost trend analysis by category
  - `predictCashFlow()` - 30-day cash flow prediction
- ✅ API: `GET /api/financial/insights` - List insights with filters
- ✅ API: `POST /api/financial/insights` - Generate all insights
- ✅ API: `GET /api/financial/analysis` - On-demand analysis
- ✅ API: `GET /api/financial/forecast` - Revenue forecast
- ✅ Inngest: `generateFinancialInsights` cron job (daily at 6am UTC)
- ✅ Feature gate: `financialDashboard` (Scale only)

**UI Status: ✅ COMPLETE**

- [x] "AI Insights" card section (`FinancialInsightsSection.tsx`)
- [x] Revenue data hooks (`useFinancialInsights`, `useRevenueForecast`)
- [x] Priority-based insight display
- [x] Integrated into Dashboard for Scale users

---

### 3. **AI Contract Builder** (Scale only)

**Infrastructure Status:**

- ✅ Service: `ContractAIService` with `generateContract()` method
- ✅ API: `POST /api/contracts/ai-generate` - Generate contract from params
- ✅ Feature gate: `aiContractBuilder` (Scale only)

**Generates:**

- Full contract draft (HTML/markdown)
- Warranty section
- Payment terms
- Scope of work
- Suggested pricing

**UI Status: ✅ COMPLETE**

- [x] "Generate with AI" button (`ContractGenerationModal.tsx`)
- [x] Contract generation form with all fields
- [x] Preview modal (`ContractPreviewModal.tsx`)
- [x] Integrated into `/contracts` page

---

### 4. **Dynamic AI Pricing Engine** (Scale only)

**Infrastructure Status:**

- ✅ Database: `pricing_rules` table exists
- ✅ Database: `pricing_history` table exists
- ✅ Service: `PricingEngine` (444 lines) with:
  - `calculatePrice()` - Full price calculation with 9 factors
  - `applyPricingRules()` - Apply custom rules
  - `recordPricingDecision()` - Track outcomes for ML
- ✅ API: `GET /api/pricing/rules` - List pricing rules
- ✅ API: `POST /api/pricing/rules` - Create pricing rule
- ✅ API: `POST /api/pricing/calculate` - Get AI price suggestion
- ✅ Feature gate: `dynamicPricing` (Scale only)

**Pricing Factors Considered:**

1. Base service price
2. Material costs (from inventory)
3. Labor hours × hourly rate
4. Location (distance, cost of living)
5. Demand (schedule availability)
6. Customer history (repeat discounts)
7. Job difficulty (complexity multiplier)
8. Seasonality
9. Urgency (rush job premium)

**UI Status: ✅ COMPLETE**

- [x] "Get AI Price Suggestion" button (`AIPriceButton.tsx`)
- [x] Price breakdown display with explanations
- [x] `usePricing` and `usePricingRules` hooks
- [x] Ready for integration in estimates flow

---

### 5. **Maksy AI Enhancements** (All plans)

**Infrastructure Status:**

- ✅ Chat API: `/api/maksy/chat` - OpenAI integration
- ✅ Usage tracking: `/api/maksy/usage` - Daily limits
- ✅ Feature gate: Plan-specific AI limits (30/day Pro, 50/day Scale)

**UI Status: 🔄 PARTIAL**

- [x] Chat UI component (`maksy-chat.tsx`)
- [x] Usage tracking integrated
- [ ] Advanced prompts UI (Scale only) - Future
- [ ] File ingestion (CSV/PDF) - Future

---

### 6. **Additional Phase 2 Features** (Future Enhancements)

**Automation Builder (Scale)** - Future

- [ ] Visual workflow editor MVP
- [ ] Trigger + action node system
- [ ] Template cloning

**Advanced Reporting** - Future

- [ ] AI-powered dashboard widgets
- [ ] Inventory analytics
- [ ] Export to CSV/PDF

**Booking Page Polish** - Future

- [ ] Advanced styling options (Scale)
- [ ] Embed widget snippet

**Integrations** - Future

- [ ] QuickBooks sync (basic Pro, full Scale)
- [ ] Google Business Profile connection

**Contracts & Documents** - Future

- [ ] E-signature flow (drawing canvas)
- [ ] OCR integration (Pro/Scale)
- [ ] Smart linking AI (Scale)

**Contract Templates Library** - Future

- [ ] 5 pre-built templates
- [ ] User template management

---

## Database Status

- **ORM:** Drizzle (PostgreSQL on Supabase)
- **Tables:** 53 tables defined in `/db/schema.ts`
- **Auth:** Clerk (replaced Supabase Auth)
- **RLS:** Application-level security via `getAuthContext()`

---

## Signup & Onboarding Flow Summary

1. Entry point (Landing CTA or Pricing CTA)
2. Signup via Clerk (email/password or Google OAuth)
3. Clerk webhook creates: company, team_member, subscription, onboarding_progress
4. Onboarding form: Business name, industry, phone, slug
5. Redirect to dashboard with setup progress banner
6. 14-day trial, payment required before trial ends

---

## Success Criteria

### Phase 0 & 1 ✅ COMPLETE

- ✅ Pro, Scale, and Team trials can be created end-to-end
- ✅ Clerk authentication working with webhook sync
- ✅ Feature gating correctly restricts access by plan
- ✅ Pro plan: 5 team members, 30 AI/day, stock automations
- ✅ Scale plan: Unlimited team, 50 AI/day, full automations, AI features
- ✅ Team plan: No service features, seat-based billing
- ✅ 53 database tables migrated and indexed
- ✅ 93 API endpoint handlers across 57 route files
- ✅ Onboarding with progress tracking
- ✅ SMS utility for notifications
- ✅ Inngest background jobs configured
- ✅ Rate limiting, CORS, input sanitization

### Phase 2 Prerequisites ✅ COMPLETE

- ✅ All AI services implemented (Financial, Contract, Pricing)
- ✅ All Phase 2 API endpoints exist and compile
- ✅ All Phase 2 database tables exist
- ✅ Feature gates configured for Scale-only features
- ✅ Automation templates seeded (5 templates)
- ✅ Inngest cron for financial insights

### Phase 2 Remaining Work

- [x] UI components for AI features ✅ COMPLETE
- [ ] Automation builder visual editor (Future enhancement)
- [ ] Advanced reporting dashboards (Future enhancement)
- [ ] E-signature flow (Future enhancement)
- [ ] Third-party integrations (Future enhancement)

---

**Phase 2 is READY to build. All backend infrastructure is complete.**
