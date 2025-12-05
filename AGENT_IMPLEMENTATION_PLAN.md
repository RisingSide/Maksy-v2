# STRATEGIC IMPLEMENTATION PLAN FOR AGENT MODE

## Phase 1: Core Functionality → MVP

### Generated: December 2, 2024

---

## 📋 EXECUTIVE SUMMARY

**Current Status:** Phase 0 Complete (100%) | Phase 1 In Progress (30%)

**Foundation Complete:**

- ✅ Clerk authentication
- ✅ Database schema (49 tables)
- ✅ Feature gating
- ✅ All UI skeletons
- ✅ Webhooks configured

**What's Missing:**

- ❌ API route implementations (47 routes)
- ❌ Database queries (all CRUD operations)
- ❌ File upload handling (8 storage buckets)
- ❌ AI integrations (OpenAI, Twilio, Resend)

**Goal:** Complete Phase 1 (MVP) in 3-4 weeks

---

## 🎯 PHASE 1 EXECUTION PLAN

### SPRINT 1: Foundation + Customers (Week 1, Days 1-3)

#### Day 1: Verify & Setup

**Time Estimate:** 4 hours

1. **Verify Clerk Webhook** ✅ COMPLETE
   - File: `apps/web/src/app/api/clerk/webhook/route.ts`
   - Status: Properly creates company + team_member + subscription
   - Test: Sign up via Clerk → verify database records

2. **Test Onboarding Flow**
   - Navigate to `/onboarding`
   - Complete critical onboarding form
   - Verify API routes work:
     - `/api/onboarding/complete-critical`
     - `/api/onboarding/progress`
     - `/api/onboarding/complete-task`

3. **Install Missing Packages**

```bash
cd apps/web
pnpm add zod react-hook-form @hookform/resolvers
pnpm add papaparse @types/papaparse
pnpm add libphonenumber-js
```

#### Day 2-3: Customers API (Full CRUD)

**Time Estimate:** 6-8 hours

**Files to Create:**

```
apps/web/src/app/api/customers/
├── route.ts (GET, POST)
└── [id]/
    └── route.ts (GET, PATCH, DELETE)
```

**Implementation:**

`GET /api/customers`

```typescript
import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db'
import { customers } from '@/db/schema'
import { eq, and, or, like, desc } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db
      .select()
      .from(customers)
      .where(eq(customers.companyId, context.companyId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(customers.createdAt))

    if (search) {
      query = query.where(
        or(
          like(customers.firstName, `%${search}%`),
          like(customers.lastName, `%${search}%`),
          like(customers.email, `%${search}%`),
          like(customers.phone, `%${search}%`)
        )
      )
    }

    const results = await query

    return NextResponse.json({
      customers: results,
      total: results.length,
      has_more: results.length === limit,
    })
  } catch (error) {
    console.error('Error fetching customers:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
```

`POST /api/customers`

```typescript
import { z } from 'zod'

const createCustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    const body = await request.json()

    const validatedData = createCustomerSchema.parse(body)

    const [customer] = await db
      .insert(customers)
      .values({
        companyId: context.companyId,
        ...validatedData,
      })
      .returning()

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
```

`GET/PATCH/DELETE /api/customers/[id]`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getAuthContext()

    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, params.id),
        eq(customers.companyId, context.companyId)
      ),
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    // ... error handling
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getAuthContext()
    const body = await request.json()

    const [updated] = await db
      .update(customers)
      .set(body)
      .where(
        and(
          eq(customers.id, params.id),
          eq(customers.companyId, context.companyId)
        )
      )
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    // ... error handling
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getAuthContext()

    await db
      .delete(customers)
      .where(
        and(
          eq(customers.id, params.id),
          eq(customers.companyId, context.companyId)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    // ... error handling
  }
}
```

**UI Updates:**

Update `apps/web/src/app/(protected)/customers/page.tsx`:

- Add data fetching with `useEffect`
- Display customer table
- Add search input
- Add "Add Customer" button
- Create customer modal component

**Testing:**

1. Create customer via API
2. List customers
3. Update customer
4. Delete customer
5. Test search functionality

---

### SPRINT 2: Services (Week 1, Days 4-5)

#### Setup Storage Bucket

1. Go to Supabase Dashboard
2. Create `service-icons` bucket:
   - Public: Yes
   - File size limit: 1MB
   - Allowed MIME types: image/png, image/jpeg, image/svg+xml

3. Add RLS policy:

```sql
CREATE POLICY "Anyone can view service icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-icons');

CREATE POLICY "Company members can upload icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-icons' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies
    WHERE id IN (
      SELECT company_id FROM team_members
      WHERE user_id = auth.uid()
    )
  )
);
```

#### Implement Services API

**Files to Create:**

```
apps/web/src/app/api/services/
├── route.ts (GET, POST)
└── [id]/
    ├── route.ts (GET, PATCH, DELETE)
    └── icon/
        └── route.ts (POST)
```

**Similar structure to Customers API, but add:**

- Service categories handling
- Add-ons linking
- Icon upload to Supabase Storage
- Public/private visibility

---

### SPRINT 3: Jobs (Week 1, Days 6-7 + Week 2, Days 1-2)

#### Implement Jobs API

**Files to Create:**

```
apps/web/src/app/api/jobs/
├── route.ts (GET, POST)
└── [id]/
    ├── route.ts (GET, PATCH, DELETE)
    ├── status/
    │   └── route.ts (PATCH)
    └── assign/
        └── route.ts (PATCH)
```

**Key Features:**

- Date/time handling with company timezone
- Team member assignment
- Customer + Service linking
- Status workflow (scheduled → in_progress → completed)
- Recurring jobs support

**UI Updates:**

- Update Jobs page
- Update Calendar page with real data
- Enable drag-and-drop scheduling
- Job detail modal

---

### SPRINT 4: Financial (Week 2, Days 3-5)

#### Invoices API

**Files to Create:**

```
apps/web/src/app/api/invoices/
├── route.ts (GET, POST)
└── [id]/
    ├── route.ts (GET, PATCH, DELETE)
    ├── send/
    │   └── route.ts (POST)
    └── payment/
        └── route.ts (POST)
```

#### Estimates API

**Files to Create:**

```
apps/web/src/app/api/estimates/
├── route.ts (GET, POST)
└── [id]/
    ├── route.ts (GET, PATCH, DELETE)
    ├── send/
    │   └── route.ts (POST)
    ├── approve/
    │   └── route.ts (POST)
    └── convert/
        └── route.ts (POST)
```

---

### SPRINT 5: Tasks + Team (Week 2, Days 6-7)

#### Tasks API

Standard CRUD + complete action

#### Team API

- List team members
- Invite flow (send email with token)
- Update/deactivate members
- Plan-based limits (Pro: 5, Scale: unlimited)

---

### SPRINT 6: Dashboard + AI (Week 3)

#### Dashboard API

- `/api/dashboard/stats` - KPIs
- `/api/dashboard/revenue` - Chart data
- `/api/dashboard/recent-activity` - Activity feed

#### Maksy AI

- OpenAI integration
- Usage tracking
- Function calling

---

### SPRINT 7: File Uploads (Week 3)

#### Create Storage Buckets

1. `company-logos` (public)
2. `company-covers` (public)
3. `job-media` (private)
4. `inventory-attachments` (private)
5. `invoice-pdfs` (private)
6. `contract-signatures` (private)
7. `documents` (private)

#### Upload API Routes

- `/api/upload/company-logo`
- `/api/upload/service-icon`
- `/api/upload/job-media`

---

### SPRINT 8: Testing + Polish (Week 4)

#### End-to-End Testing

1. Signup → Onboarding → Dashboard
2. Create customer → service → job
3. Create invoice → send
4. Create estimate → approve → convert
5. Invite team member
6. Upload files
7. Use Maksy AI

#### Polish

- Error handling
- Loading states
- Form validation
- Toast notifications
- Mobile responsive

---

## 📦 DELIVERY MILESTONES

### Week 1 End:

- ✅ Customers fully functional
- ✅ Services fully functional
- ✅ Jobs partially functional

### Week 2 End:

- ✅ Jobs fully functional
- ✅ Invoices fully functional
- ✅ Estimates fully functional
- ✅ Tasks fully functional
- ✅ Team management functional

### Week 3 End:

- ✅ Dashboard with real data
- ✅ Maksy AI functional
- ✅ File uploads working

### Week 4 End:

- ✅ All features tested
- ✅ MVP ready for production
- ✅ Documentation updated

---

## 🚀 SUCCESS CRITERIA

User can complete this flow end-to-end:

1. Sign up with Clerk
2. Complete onboarding
3. Create 3 customers
4. Create 2 services
5. Schedule 5 jobs on calendar
6. Create invoice from job
7. Send invoice to customer
8. Create estimate
9. Send estimate to customer
10. Chat with Maksy AI
11. Invite team member
12. Upload company logo

**All without errors or console warnings.**

---

## 📝 FILES UPDATED

### Documentation:

- ✅ `CURRENT_IMPLEMENTATION_STATUS.md` - Current state
- ✅ `AGENT_IMPLEMENTATION_PLAN.md` - This file
- ✅ `docs/04-API_ENDPOINTS_CURRENT.md` - API status
- ✅ `docs/08-BUILD_PLAN.md` - Phase 0 complete marker

### Code (Ready to Implement):

- 🎯 `apps/web/src/app/api/customers/*.ts` - Sprint 1
- 🎯 `apps/web/src/app/api/services/*.ts` - Sprint 2
- 🎯 `apps/web/src/app/api/jobs/*.ts` - Sprint 3
- 🎯 `apps/web/src/app/api/invoices/*.ts` - Sprint 4
- 🎯 `apps/web/src/app/api/estimates/*.ts` - Sprint 4
- 🎯 `apps/web/src/app/api/tasks/*.ts` - Sprint 5
- 🎯 `apps/web/src/app/api/team/*.ts` - Sprint 5
- 🎯 `apps/web/src/app/api/dashboard/*.ts` - Sprint 6
- 🎯 `apps/web/src/app/api/maksy/*.ts` - Sprint 6
- 🎯 `apps/web/src/app/api/upload/*.ts` - Sprint 7

---

## ✅ READY TO BEGIN

All planning complete. Documentation aligned. Foundation verified.

**Next Command:**

```bash
# Begin Sprint 1, Day 2-3: Customers API Implementation
```

Let's build! 🚀
