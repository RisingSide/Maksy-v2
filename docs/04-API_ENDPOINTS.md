# API ENDPOINTS & WEBHOOKS

## Overview

All API routes are Next.js Route Handlers located in `/apps/web/src/app/api/`

**Authentication:** Clerk (via `@clerk/nextjs`)  
**Response Format:** JSON  
**Error Format:** `{ error: string, code?: string }`

**Auth Helper:** All protected routes use `getAuthContext()` from `/src/lib/auth-helpers.ts`

```typescript
import { getAuthContext } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    // context: { userId, companyId, role, planType, email, firstName, lastName }
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

---

## Authentication & User Management

### Clerk Handles All Auth

- **Sign Up:** `/sign-up` (Clerk hosted UI)
- **Sign In:** `/sign-in` (Clerk hosted UI)
- **User Profile:** Managed by Clerk
- **OAuth:** Google, Microsoft, etc. (configured in Clerk Dashboard)

### POST `/api/clerk/webhook`

**Purpose:** Sync Clerk users with our database

**Events Handled:**

- `user.created` - Create company, team_member, subscription
- `user.updated` - Update user_profiles
- `user.deleted` - Soft delete records

**Process (user.created):**

1. Extract user data from Clerk webhook
2. Create `companies` record
3. Create `team_members` record (role: owner)
4. Create `subscriptions` record (14-day trial)
5. Set user metadata in Clerk

**Implementation Status:** ✅ Exists, needs verification

---

## Onboarding Routes

### POST `/api/onboarding/industry`

**Purpose:** Save industry selection

**Request Body:**

```typescript
{
  company_id: string
  industry: string
}
```

**Response:**

```typescript
{
  success: true
}
```

---

### POST `/api/onboarding/business-info`

**Purpose:** Save business details

**Request Body:**

```typescript
{
  company_id: string
  company_name: string
  business_phone: string
  business_email: string
  address: AddressObject
  website?: string
}
```

---

### POST `/api/onboarding/personal-info`

**Purpose:** Save owner personal info

**Request Body:**

```typescript
{
  user_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  address: AddressObject
}
```

---

### POST `/api/onboarding/payment`

**Purpose:** Setup Stripe payment for trial

**Request Body:**

```typescript
{
  company_id: string
  payment_method_id: string // from Stripe Elements
  plan: 'pro' | 'scale'
}
```

**Process:**

1. Create Stripe Customer
2. Attach PaymentMethod
3. Create Stripe Subscription (with trial)
4. Update `subscriptions` table
5. Return subscription details

---

### POST `/api/onboarding/import-csv`

**Purpose:** Import customers from CSV via AI

**Request Body:** FormData

- `file`: CSV file
- `company_id`: string

**Process:**

1. Parse CSV
2. Call OpenAI to extract & format data
3. Detect custom fields
4. Return preview data

**Response:**

```typescript
{
  customers: Array<CustomerData>
  custom_fields_detected: Array<{ name: string; sample_value: string }>
  preview: Array<{ original_row: any; mapped_data: CustomerData }>
}
```

---

### POST `/api/onboarding/confirm-import`

**Purpose:** Confirm and save imported data

**Request Body:**

```typescript
{
  company_id: string
  customers: Array<CustomerData>
  custom_fields: Array<{ field_name: string; field_type: string }>
}
```

**Process:**

1. Create `custom_customer_fields` if needed
2. Bulk insert `customers`
3. Insert `customer_field_values`
4. Return count

---

## Customer Routes

### GET `/api/customers`

**Purpose:** List all customers for company

**Query Params:**

- `search?: string` (name, email, phone)
- `sort?: 'name' | 'recent' | 'ltv'`
- `limit?: number`
- `offset?: number`

**Response:**

```typescript
{
  customers: Array<Customer>
  total: number
  has_more: boolean
}
```

---

### GET `/api/customers/[id]`

**Purpose:** Get single customer with full details

**Response:**

```typescript
{
  customer: Customer
  custom_field_values: Array<{ field_name: string; value: string }>
  total_jobs: number
  lifetime_value: number
  recent_jobs: Array<Job>
}
```

---

### POST `/api/customers`

**Purpose:** Create new customer

**Request Body:**

```typescript
{
  company_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name?: string
  address?: AddressObject
  notes?: string
  custom_fields?: Record<string, any>
}
```

**Process:**

1. Validate email/phone not duplicate
2. Insert into `customers`
3. If `custom_fields`, insert into `customer_field_values`
4. Return customer

---

### PATCH `/api/customers/[id]`

**Purpose:** Update customer

**Request Body:** Partial<Customer>

---

### DELETE `/api/customers/[id]`

**Purpose:** Delete customer

**Process:**

1. Check if customer has jobs
2. If has jobs: Soft delete (mark inactive) OR require confirmation
3. Delete related `customer_field_values`
4. Delete customer

**Response:**

```typescript
{ success: true, deleted_count: number }
```

---

## Service Routes

### GET `/api/services`

**Purpose:** List all services

**Query Params:**

- `category_id?: string`
- `public_only?: boolean`

**Response:**

```typescript
{
  categories: Array<{
    id: string
    name: string
    services: Array<Service>
  }>
}
```

---

### POST `/api/services`

**Purpose:** Create new service

**Request Body:**

```typescript
{
  company_id: string
  category_id?: string
  name: string
  description?: string
  price: number
  duration_minutes: number
  icon_url?: string
  is_public: boolean
  add_ons?: Array<{
    name: string
    price: number
    duration_minutes: number
  }>
}
```

**Process:**

1. Insert service
2. If `add_ons`, insert into `service_add_ons`
3. Return service with add-ons

---

### PATCH `/api/services/[id]`

**Purpose:** Update service

---

### DELETE `/api/services/[id]`

**Purpose:** Delete service

**Check:** Ensure no active jobs reference this service

---

### POST `/api/services/categories`

**Purpose:** Create service category

---

## Job Routes

### GET `/api/jobs`

**Purpose:** List jobs with filters

**Query Params:**

- `customer_id?: string`
- `team_member_id?: string`
- `service_id?: string`
- `status?: JobStatus`
- `date_from?: string` (ISO date)
- `date_to?: string`
- `limit?: number`
- `offset?: number`

**Response:**

```typescript
{
  jobs: Array<JobWithRelations>
  total: number
}
```

---

### GET `/api/jobs/[id]`

**Purpose:** Get job details

**Response:**

```typescript
{
  job: Job
  customer: Customer
  service: Service
  team_member?: TeamMember
  add_ons: Array<ServiceAddOn>
  tracking?: JobTracking
  invoice?: Invoice
}
```

---

### POST `/api/jobs`

**Purpose:** Create new job

**Request Body:**

```typescript
{
  company_id: string
  customer_id: string
  service_id: string
  assigned_team_member_id?: string
  scheduled_date: string // ISO date
  scheduled_time: string // HH:MM
  duration_minutes: number
  notes?: string
  add_on_ids?: Array<string>
  is_recurring?: boolean
  recurring_config?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    until?: string
  }
}
```

**Process:**

1. Check plan + monthly cap
   - If company plan = Starter, count jobs with `scheduled_date` in current month
   - If count ≥ 50 → return `409` with message "Starter plan allows up to 50 jobs per month"
2. Validate no double-booking (unless enabled)
3. Check team member availability
4. Insert job
5. If `add_on_ids`, insert `job_add_ons`
6. If `is_recurring`, create future job instances (respect Starter cap on initial creation only)
7. Trigger automation: "job_scheduled"
8. Return job

---

### PATCH `/api/jobs/[id]`

**Purpose:** Update job

---

### POST `/api/jobs/[id]/on-my-way`

**Purpose:** Team member clicks "On My Way"

**Process:**

1. Update job status → 'in_progress'
2. Insert `job_tracking` record with GPS coords
3. Calculate ETA based on distance
4. Send SMS to customer: "We're on our way! ETA: X minutes"
5. Return success

**Request Body:**

```typescript
{
  lat?: number
  lng?: number
}
```

---

### POST `/api/jobs/[id]/start`

**Purpose:** Team member starts job

**Process:**

1. Update `job_tracking.started_at`
2. Send SMS: "We've started your service!"
3. Return success

---

### POST `/api/jobs/[id]/complete`

**Purpose:** Team member finishes job

**Process:**

1. Update job status → 'completed'
2. Update `job_tracking.completed_at`
3. Calculate duration
4. Trigger automation: "job_completed" (review request)
5. Update customer LTV
6. Return success

---

### POST `/api/jobs/[id]/media`

**Purpose:** Upload before/after photos or supporting documents for a job

**Plan Gate:** Pro & Scale

**Request:** multipart/form-data

- `files[]`: image or PDF files (max 10MB each)
- `media_type`: `'before' | 'after' | 'document'`
- `caption?`: optional string

**Process:**

1. Validate plan (Starter returns 403)
2. Upload each file to Supabase Storage (`job-media/{company_id}/{job_id}/filename`)
3. Insert rows into `job_media`
4. Return signed URLs + metadata

**Response:**

```typescript
{
  media: Array<{
    id: string
    file_url: string
    media_type: 'before' | 'after' | 'document'
    caption?: string
    uploaded_at: string
  }>
}
```

### DELETE `/api/jobs/[id]/media/[media_id]`

**Purpose:** Remove uploaded media (soft delete + storage cleanup)

---

### POST `/api/jobs/[id]/payment`

**Purpose:** Record payment for job

**Plan Gate:** Pro & Scale only (Starter receives 403 `INVOICE_LOCKED`).

**Request Body:**

```typescript
{
  payment_method: 'cash' | 'card' | 'invoice'
  amount: number
  stripe_payment_intent_id?: string
}
```

**Process:**

1. Update job `payment_status`
2. If `payment_method === 'invoice'`:
   - Create invoice
   - Link to job
3. If `payment_method === 'card'`:
   - Process via Stripe
   - Record payment
4. Return payment record

---

## Task Routes

### GET `/api/tasks`

**Purpose:** List tasks

**Query Params:**

- `status?: 'incomplete' | 'complete'`
- `assigned_to?: string` (team_member_id)

**Response:**

```typescript
{
  incomplete: Array<Task>
  completed: Array<Task>
}
```

---

### POST `/api/tasks`

**Purpose:** Create task

**Request Body:**

```typescript
{
  company_id: string
  title: string
  description?: string
  assigned_to_team_member_id?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  linked_customer_id?: string
  linked_job_id?: string
  reminder_enabled?: boolean
  reminder_frequency?: 'daily' | 'weekly'
}
```

**Plan Gate & Limits:**

- Starter: before insert, increment `task_usage_counters`. If the counter ≥ 3 for the current ISO week, return `429 TASK_LIMIT_REACHED` with `resets_on` (next Monday). Admin override can reset via support tools.
- Pro/Scale: unlimited; ignore counter.

---

### PATCH `/api/tasks/[id]`

**Purpose:** Update task (including mark complete)

---

### DELETE `/api/tasks/[id]`

**Purpose:** Delete task

---

## Inventory Routes

### GET `/api/inventory`

**Purpose:** List inventory items with filters and pagination

**Query Parameters:** `page`, `page_size`, `search`, `category`, `stock_status`, `location_tag`

**Response:**

```typescript
{
  items: Array<InventoryItem>,
  pagination: { page: number; page_size: number; total: number }
}
```

### POST `/api/inventory`

**Purpose:** Create a new inventory item

**Request Body:**

```typescript
{
  name: string
  sku?: string
  category?: string
  unit_cost?: number
  quantity_on_hand?: number
  reorder_point?: number
  location_tag?: string
  track_consumption?: boolean
  notes?: string
}
```

**Process:**

1. Validate plan (Starter allowed but `track_consumption` ignored)
2. Insert row into `inventory_items`
3. Insert initial `inventory_movements` record with `change_type = 'import'`

### PATCH `/api/inventory/[id]`

Update metadata (category, vendor, reorder settings, etc.).

### POST `/api/inventory/[id]/adjust`

**Purpose:** Adjust quantity (manual, job consumption, transfer)

**Request Body:**

```typescript
{
  change_amount: number, // negative for consumption
  change_type: 'manual' | 'job_consumption' | 'transfer' | 'import',
  job_id?: string,
  notes?: string
}
```

**Process:**

1. Update `inventory_items.quantity_on_hand`
2. Insert row into `inventory_movements`
3. If `job_id`, tie movement to job for reporting

### POST `/api/inventory/[id]/attachments`

Upload files for item (images/PDF). Inserts into `inventory_attachments` with storage URL.

### DELETE `/api/inventory/[id]`

Soft deletes an item (sets `archived_at`), prevents deletion if active job consumption exists unless forced by admin.

---

## Estimate Routes

### GET `/api/estimates`

**Purpose:** List estimates

---

### POST `/api/estimates`

**Purpose:** Create estimate

**Request Body:**

```typescript
{
  company_id: string
  customer_id: string
  line_items: Array<{
    service_id?: string
    description: string
    quantity: number
    unit_price: number
  }>
  tax_rate?: number
  discount_amount?: number
  notes?: string
  expiration_date?: string
}
```

**Process:**

1. Insert estimate
2. Insert line items
3. Calculate totals
4. Return estimate

---

### POST `/api/estimates/[id]/send`

**Purpose:** Send estimate to customer

**Process:**

1. Update `sent_at`
2. Generate PDF
3. Send email with PDF attachment
4. Return success

---

### POST `/api/estimates/[id]/approve`

**Purpose:** Customer approves estimate (from email link)

**Process:**

1. Update status → 'approved'
2. Update `approved_at`
3. Optionally: Convert to job
4. Trigger automation
5. Return success

---

## Invoice Routes

### GET `/api/invoices`

**Purpose:** List invoices

**Query Params:**

- `customer_id?: string`
- `status?: InvoiceStatus`

---

### POST `/api/invoices`

**Purpose:** Create invoice

**Options:**

1. From scratch
2. From existing job

**Request Body:**

```typescript
{
  company_id: string
  customer_id: string
  job_id?: string // if from job
  line_items: Array<LineItem>
  tax_rate?: number
  discount_amount?: number
  due_date: string
  payment_terms?: string
}
```

---

### POST `/api/invoices/[id]/send`

**Purpose:** Send invoice to customer

**Process:**

1. Generate PDF
2. Send email with payment link
3. Update `sent_at`
4. Return success

---

### POST `/api/invoices/[id]/payment`

**Purpose:** Record manual payment

**Request Body:**

```typescript
{
  amount: number
  payment_method: 'cash' | 'check' | 'bank_transfer'
  payment_date: string
}
```

**Process:**

1. Insert into `payments`
2. Update invoice `amount_paid`
3. If fully paid: Update status → 'paid', set `paid_at`
4. Return payment

---

## Contract Routes

### GET `/api/contracts`

**Purpose:** List all contracts for company

**Query Params:**

- `customer_id?: string`
- `status?: ContractStatus`
- `search?: string`
- `limit?: number`
- `offset?: number`

**Response:**

```typescript
{
  contracts: Array<ContractWithCustomer>
  total: number
}
```

---

### GET `/api/contracts/[id]`

**Purpose:** Get contract details

**Response:**

```typescript
{
  contract: Contract
  customer: Customer
  signatures: Array<ContractSignature>
  activity_log: Array<ActivityLogEntry>
  linked_job?: Job
  linked_estimate?: Estimate
}
```

---

### POST `/api/contracts`

**Purpose:** Create new contract

**Plan Gate:** Pro/Scale only (Starter = 403)

**Request Body:**

```typescript
{
  company_id: string
  customer_id: string
  title: string
  contract_type: string
  content_json: object
  contract_value?: number
  start_date?: string
  end_date?: string
  template_id?: string
}
```

**Process:**

1. Check plan (Starter = 403)
2. Validate customer exists
3. If `template_id`, load template content
4. Insert contract
5. Log activity: 'created'
6. Return contract

---

### PATCH `/api/contracts/[id]`

**Purpose:** Update contract (draft only)

**Request Body:** Partial<Contract>

**Validation:**

- Can only edit if status = 'draft'

---

### POST `/api/contracts/[id]/send`

**Purpose:** Send contract to customer

**Request Body:**

```typescript
{
  send_via: 'email' | 'sms' | 'email_sms'
  email_subject?: string
  email_message?: string
  sms_message?: string
  require_signature: boolean
  expiration_days?: number
}
```

**Process:**

1. Update status → 'pending'
2. Generate unique signing_token
3. Set signing_token_expires_at
4. Populate merge_fields from database
5. Render final content_html
6. If send_via includes email: Send email with signing link
7. If send_via includes SMS: Send SMS with short link
8. Log activity: 'sent'
9. Return success

---

### GET `/api/contracts/sign/[token]`

**Purpose:** Public page to view and sign contract (no auth required)

**Query Params:** `token` in URL

**Process:**

1. Validate token
2. Check expiration
3. If expired: Return 410 Gone
4. Load contract + customer
5. Populate merge fields
6. Return contract data for rendering

**Response:**

```typescript
{
  contract: {
    title: string
    content_html: string
    company: { name: string, logo_url: string }
    customer: { first_name: string }
    signature_fields: Array<SignatureField>
  }
}
```

---

### POST `/api/contracts/sign/[token]`

**Purpose:** Submit signature

**Request Body:**

```typescript
{
  signature_data: string // Base64 PNG
  signature_method: 'drawn' | 'typed'
  printed_name: string
  agreed_to_terms: boolean
}
```

**Process:**

1. Validate token
2. Check all required fields filled
3. Upload signature PNG to Supabase Storage
4. Insert contract_signatures record
5. Update contract status → 'signed'
6. Update signed_at, signed_by_ip
7. Generate signed PDF
8. Send confirmation email to customer with PDF attached
9. Send notification to owner
10. Trigger automation: 'contract_signed'
11. Log activity: 'signed'
12. Return success

**Response:**

```typescript
{
  success: true
  signed_pdf_url: string
}
```

---

### POST `/api/contracts/[id]/terminate`

**Purpose:** Mark contract as terminated (Pro/Scale only)

**Request Body:**

```typescript
{
  termination_reason: string
}
```

**Process:**

1. Check permissions (Pro/Scale only)
2. Update status → 'terminated'
3. Update terminated_at, terminated_by_user_id, termination_reason
4. Log activity: 'terminated'
5. Send notification to customer (optional)
6. Return success

---

### POST `/api/contracts/[id]/download-pdf`

**Purpose:** Generate and download signed PDF

**Response:** PDF file (binary)

**Process:**

1. Load contract + signatures
2. Render PDF using @react-pdf/renderer
3. Embed signature images
4. Add footer: "Signed on [Date] at [Time] from IP [Address]"
5. Stream PDF to client
6. Log activity: 'downloaded'

---

## Document Routes

### GET `/api/documents`

**Purpose:** List all documents for company

**Query Params:**

- `folder_path?: string`
- `tags?: string[]`
- `linked_entity_type?: 'customer' | 'job' | 'invoice'`
- `linked_entity_id?: string`
- `search?: string`
- `limit?: number`
- `offset?: number`

**Response:**

```typescript
{
  documents: Array<DocumentWithLinks>
  total: number
}
```

---

### GET `/api/documents/[id]`

**Purpose:** Get document details

**Response:**

```typescript
{
  document: Document
  versions?: Array<Document>
  comments?: Array<Comment>
  activity_log?: Array<ActivityLogEntry>
  linked_entities: {
    customer?: Customer
    job?: Job
    invoice?: Invoice
  }
}
```

---

### POST `/api/documents/upload`

**Purpose:** Upload new document(s)

**Plan Gate:**

- Starter: Max 100 docs, 10MB files
- Pro: Unlimited, 50MB files
- Scale: Unlimited, 100MB files

**Request Body:** FormData

- `files`: File[]
- `folder_path`: string
- `tags`: string[]
- `linked_customer_id?: string`
- `linked_job_id?: string`
- `linked_invoice_id?: string`

**Process:**

1. Check plan limits (Starter: 100 docs, file size 10MB)
2. Validate file types
3. Upload to Supabase Storage (bucket: `documents`)
4. Insert into documents table
5. If Pro/Scale + image/PDF: Queue OCR job (Inngest)
6. If Scale: Queue AI smart linking job
7. Log activity: 'uploaded'
8. Return document IDs

**Response:**

```typescript
{
  documents: Array<{
    id: string
    filename: string
    url: string
  }>
}
```

---

### PATCH `/api/documents/[id]`

**Purpose:** Update document metadata

**Request Body:**

```typescript
{
  filename?: string
  folder_path?: string
  tags?: string[]
  linked_customer_id?: string
  linked_job_id?: string
  linked_invoice_id?: string
}
```

---

### POST `/api/documents/[id]/upload-version`

**Purpose:** Upload new version of existing document (Pro/Scale)

**Process:**

1. Mark current document is_latest_version = false
2. Create new document record with incremented version_number
3. Set parent_document_id to previous version
4. Upload file to storage
5. Log activity: 'version_uploaded'

---

### POST `/api/documents/[id]/share`

**Purpose:** Generate public share link

**Request Body:**

```typescript
{
  expires_in_days?: number
  password?: string
}
```

**Process:**

1. Generate unique public_share_token
2. Hash password (if provided)
3. Update document: is_public = true, public_share_token, public_share_expires_at
4. Log activity: 'shared'
5. Return share link

**Response:**

```typescript
{
  share_url: string // maksy.ai/share/documents/[token]
}
```

---

### GET `/api/share/documents/[token]`

**Purpose:** Public document access (no auth required)

**Query Params:** `password?: string` (if password-protected)

**Process:**

1. Validate token
2. Check expiration
3. If password-protected: Verify password
4. Log activity: 'viewed' (external)
5. Return document URL (signed, temporary)

**Response:**

```typescript
{
  document: {
    filename: string
    file_type: string
    file_size_bytes: number
    download_url: string // Temporary signed URL
  }
}
```

---

### DELETE `/api/documents/[id]`

**Purpose:** Delete document

**Process:**

1. Check permissions
2. If has versions: Delete all versions
3. Delete from Supabase Storage
4. Delete from documents table
5. Log activity: 'deleted'
6. Return success

---

### POST `/api/documents/[id]/comments`

**Purpose:** Add comment to document (Pro/Scale only)

**Request Body:**

```typescript
{
  comment_text: string
  parent_comment_id?: string // For replies
}
```

---

## Automation Routes

### GET `/api/automations`

**Purpose:** List all automations

**Response:**

```typescript
{
  stock: Array<Automation>
  custom: Array<Automation>
}
```

---

### POST `/api/automations`

**Purpose:** Create custom automation (Pro only)

**Request Body:**

```typescript
{
  company_id: string
  name: string
  trigger_event: string
  workflow_config: WorkflowConfig
}
```

**Validation:**

- Check plan allows custom automations
- Validate workflow JSON structure
- Limit max 10 nodes
- Return automation

---

### PATCH `/api/automations/[id]`

**Purpose:** Update automation (stock: message only, custom: full)

---

### DELETE `/api/automations/[id]`

**Purpose:** Delete custom automation

---

### POST `/api/automations/[id]/toggle`

**Purpose:** Enable/disable automation

**Request Body:**

```typescript
{
  is_active: boolean
}
```

---

## Maksy AI Routes

### POST `/api/maksy/chat`

**Purpose:** Send message to Maksy AI

**Request Body:**

```typescript
{
  company_id: string
  user_id: string
  message: string
  conversation_history?: Array<ChatMessage>
}
```

**Process:**

1. Determine plan type and load usage context
   - Starter: fetch row from `ai_usage_lifetime`
   - Pro/Scale: fetch (or create) today's `ai_usage_counters` row
2. Enforce limits
   - Starter: if `requests_used >= 15` → 403 (upgrade required)
   - Pro: if `requests_used_today >= 30` → 429 (daily limit)
   - Scale: if `requests_used_today >= 50` → 429 (daily limit)
3. Build conversation context (company + user data)
4. Choose OpenAI model based on plan
   - Pro → standard GPT model
   - Scale → advanced GPT model with extended tokens/function support
5. Call OpenAI API (stream or standard response)
6. If assistant triggers function call, execute and include preview data
7. Insert assistant/user messages into `ai_chat_history`
8. Increment counters (Starter → lifetime table, Pro/Scale → daily table)
9. Return AI response with updated usage summary (daily + lifetime as applicable)

**Response:**

```typescript
{
  message: string
  function_call?: {
    function_name: string
    preview_data: any
    requires_confirmation: boolean
  }
  requests_used_today?: number    // present for Pro/Scale
  daily_limit?: number            // present for Pro/Scale
  lifetime_requests_used?: number // present for Starter
  lifetime_limit?: number         // present for Starter (15)
}
```

**Error Responses:**

- Starter limit reached
  ```typescript
  {
    error: "Maksy AI preview limit reached",
    code: "AI_PREVIEW_LIMIT",
    lifetime_requests_used: number,
    lifetime_limit: number,
    upgrade_message: "Upgrade to Pro to continue using Maksy AI"
  }
  ```
- Pro/Scale daily limit reached
  ```typescript
  {
    error: "Daily Maksy AI limit reached",
    code: "AI_LIMIT_REACHED",
    requests_used_today: number,
    daily_limit: number,
    resets_at: string // ISO timestamp at midnight company-local time
  }
  ```

**Available Functions:**

- `create_task`
- `create_job`
- `send_invoice`
- `add_customer`
- `analyze_revenue`
- `optimize_schedule`

---

### POST `/api/maksy/confirm`

**Purpose:** Confirm AI function execution

**Request Body:**

```typescript
{
  function_name: string
  function_args: any
}
```

**Process:**

1. Execute the function
2. Return result
3. Update AI chat with result

---

## Team Routes

### GET `/api/team`

**Purpose:** List team members

**Response:**

```typescript
{
  team_members: Array<TeamMember>
}
```

---

### POST `/api/team/invite`

**Purpose:** Invite new team member

**Request Body:**

```typescript
{
  company_id: string
  first_name: string
  email: string
  role: 'admin' | 'team_member'
}
```

**Process:**

1. Check plan allows more team members
2. Generate invitation token
3. Create `team_members` record (status: 'invited')
4. Send invitation email
5. Return team member

**Email Content:**

- From: `noreply@maksy.ai`
- Subject: "You've been invited to [Company] on Maksy"
- Link: `/team/join?token=[token]`

---

### GET `/api/team/join`

**Purpose:** Accept team invitation

**Query Params:** `token=xxx`

**Process:**

1. Verify token
2. Check not expired
3. Return team member details

---

### POST `/api/team/join`

**Purpose:** Complete team member signup

**Request Body:**

```typescript
{
  token: string
  full_name: string
  phone: string
  address: AddressObject
  password: string
}
```

**Process:**

1. Create user account (Supabase Auth)
2. Update `team_members` record
3. Link `user_id`
4. Update status → 'active'
5. Return session

---

### PATCH `/api/team/[id]`

**Purpose:** Update team member

---

### DELETE `/api/team/[id]`

**Purpose:** Remove/deactivate team member

---

## Settings Routes

### GET `/api/settings/company`

**Purpose:** Get company settings

---

### PATCH `/api/settings/company`

**Purpose:** Update company settings

---

### GET `/api/settings/booking-page`

**Purpose:** Get booking page config

---

### PATCH `/api/settings/booking-page`

**Purpose:** Update booking page settings

---

### POST `/api/settings/upload`

**Purpose:** Upload logo/cover photo

**Request:** FormData (multipart)

- `file`: Image file
- `type`: 'logo' | 'cover' | 'service_icon'

**Process:**

1. Validate file size/type
2. Upload to Supabase Storage
3. Return public URL

**Response:**

```typescript
{
  url: string
}
```

---

### GET `/api/slugs/check`

**Purpose:** Check if booking page slug is available

**Query Parameters:**

- `slug`: string (required) - The desired slug to check

**Validation:**

- Min 3 chars, max 50 chars
- Lowercase letters, numbers, hyphens only
- Cannot start or end with hyphen
- Regex: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`

**Response:**

```typescript
{
  available: boolean
  slug: string
  suggestion?: string  // If taken, provide alternative
}
```

**Example:**

```
GET /api/slugs/check?slug=abc-plumbing

Response:
{
  "available": false,
  "slug": "abc-plumbing",
  "suggestion": "abc-plumbing-x7f2"
}
```

**Process:**

1. Validate slug format
2. Query `companies` table: `WHERE slug = ?`
3. If exists: Generate alternative (append random 4 chars)
4. Return availability + suggestion

---

### GET `/api/settings/ai-usage`

**Purpose:** Return the current user's Maksy AI usage snapshot (daily and lifetime where applicable)

**Authentication:** Required (user must belong to a company)

**Response:**

```typescript
{
  plan: 'starter' | 'pro' | 'scale'
  requests_used_today?: number
  daily_limit?: number
  resets_at?: string // ISO timestamp at midnight company-local time
  lifetime_requests_used?: number
  lifetime_limit?: number
}
```

**Process:**

1. Determine plan and company timezone from `company_settings`
2. Load usage:
   - Starter → fetch row from `ai_usage_lifetime` (create if missing)
   - Pro/Scale → load today's `ai_usage_counters` row (create if missing) and compute `daily_limit` (Pro=30, Scale=50)
3. Return usage summary including lifetime info for Starter and daily info for Pro/Scale

**Error States:**

- None (Starter receives `lifetime_limit: 15` and recommended upgrade CTA in UI)

---

### POST `/api/settings/ai-usage/reset`

**Purpose:** Admin/support override for AI usage counters (daily or lifetime preview)

**Plan Gate:**

- Starter: Support staff only (internal admin) can grant additional preview requests
- Pro/Scale: Workspace admins can reset today's counter

**Request Body:**

```typescript
{
  user_id: string
  mode?: 'daily' | 'lifetime' // default 'daily'
  usage_date?: string // defaults to today in company timezone (daily mode only)
  add_preview_requests?: number // optional, lifetime mode; defaults to 0 (reset)
}
```

**Process:**

1. Verify permissions based on plan/mode
2. If `mode === 'daily'`:
   - Clamp `usage_date` to today if not provided
   - Upsert row in `ai_usage_counters` with `requests_used = 0`
3. If `mode === 'lifetime'`:
   - Adjust `requests_used` in `ai_usage_lifetime` by negative amount or add preview requests (`add_preview_requests`)
4. Log override in `audit_logs`

**Response:**

```typescript
{
  success: true
}
```

---

## Coupon Routes

### GET `/api/coupons`

**Purpose:** List coupons

---

### POST `/api/coupons`

**Purpose:** Create coupon

---

### POST `/api/coupons/validate`

**Purpose:** Validate coupon code

**Request Body:**

```typescript
{
  code: string
  customer_id: string
  service_ids?: Array<string>
  order_total: number
}
```

**Process:**

1. Find coupon by code
2. Check active, not expired
3. Check usage limits
4. Check restrictions (services, min order)
5. Return discount amount

**Response:**

```typescript
{
  valid: boolean
  coupon?: Coupon
  discount_amount?: number
  error?: string
}
```

---

## Integration Routes

### POST `/api/integrations/stripe/connect`

**Purpose:** Connect Stripe account

**Process:**

1. Generate Stripe OAuth URL
2. Return redirect URL

---

### GET `/api/integrations/stripe/callback`

**Purpose:** OAuth callback from Stripe

**Query Params:** `code=xxx`

**Process:**

1. Exchange code for access token
2. Get Stripe account ID
3. Save to `integrations` table
4. Redirect to settings page

---

### POST `/api/integrations/google/connect`

**Purpose:** Connect Google Business

**Similar flow as Stripe**

---

## Public Booking Routes

### GET `/api/booking/[company-slug]`

**Purpose:** Get booking page data

**Response:**

```typescript
{
  company: Company
  services: Array<Service>
  settings: BookingPageSettings
  branding: {
    ;(logo_url, cover_url, colors)
  }
}
```

---

### GET `/api/booking/[company-slug]/availability`

**Purpose:** Get available time slots

**Query Params:**

- `date: string` (ISO date)
- `service_id: string`
- `team_member_id?: string`

**Process:**

1. Get service duration
2. Get team availability for date
3. Get existing bookings
4. Calculate available slots (respect lead time, slot size)
5. Return slots

**Response:**

```typescript
{
  available_slots: Array<{
    time: string // HH:MM
    available: boolean
  }>
}
```

---

### POST `/api/booking/[company-slug]/submit`

**Purpose:** Submit booking from public page

**Request Body:**

```typescript
{
  service_id: string
  add_on_ids?: Array<string>
  team_member_id?: string
  date: string
  time: string
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address?: AddressObject
    custom_fields?: Record<string, any>
  }
  notes?: string
}
```

**Process:**

1. Validate slot still available
2. Check/create customer
3. Create job
4. Trigger automations (booking confirmation)
5. Send confirmation email/SMS
6. Return booking details

**Response:**

```typescript
{
  job_id: string
  confirmation_number: string
  message: 'Booking confirmed!'
}
```

---

## Webhook Routes

### POST `/api/stripe/webhook`

**Purpose:** Handle Stripe webhook events

**Events Handled:**

- `checkout.session.completed` - Trial started
- `invoice.paid` - Subscription payment successful
- `invoice.payment_failed` - Payment failed
- `customer.subscription.updated` - Plan changed
- `customer.subscription.deleted` - Subscription canceled

**Process:**

1. Verify Stripe signature
2. Parse event
3. Update `subscriptions` table
4. Handle plan changes (lock/unlock features)
5. Return 200 OK

**Signature Verification:**

```typescript
const signature = req.headers['stripe-signature']
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

---

### POST `/api/twilio/webhook`

**Purpose:** Handle Twilio SMS delivery status

**Events:**

- `delivered` - SMS sent successfully
- `failed` - SMS failed to send

**Process:**

1. Parse webhook
2. Log delivery status
3. If failed: Retry or alert
4. Return 200 OK

---

## Inngest Background Jobs

Located in `/apps/web/src/lib/inngest/functions.ts`

### `appointment-reminder`

**Trigger:** Cron (every hour)

**Process:**

1. Find jobs scheduled in next 24hrs
2. Check if reminder already sent
3. Send SMS reminder
4. Mark as sent

---

### `send-review-request`

**Trigger:** Event `job.completed`

**Process:**

1. Wait 30 minutes (step.sleep)
2. Get customer phone
3. Send SMS with Google review link
4. Log execution

---

### `invoice-overdue-reminder`

**Trigger:** Cron (daily at 9am)

**Process:**

1. Find invoices overdue > 3 days
2. Send reminder email/SMS
3. Create task for owner: "Follow up on overdue invoice"

---

### `calculate-daily-metrics`

**Trigger:** Cron (daily at midnight)

**Process:**

1. Calculate revenue for day
2. Update company metrics
3. Generate AI insights (Pro)
4. Send daily summary email to owner

---

### `prime-ai-usage-counters`

**Trigger:** Cron (daily at 12:05am company-local equivalent)

**Process:**

1. For each active company, iterate Pro/Scale users
2. Upsert `ai_usage_counters` row for the new date with `requests_used = 0`
3. Archive rows older than 90 days
4. Log completion (rows processed) to Observability channel

---

### `ai-limit-notification`

**Trigger:** Event `ai.limit_reached`

**Process:**

1. Fired by `/api/maksy/chat` when a user hits their daily limit
2. Check user notification preferences (Settings > Ask Maksy)
3. Send in-app notification + optional email summary
4. If plan = Pro, include CTA to "Upgrade to Scale for 50 requests/day"
5. Record event in `audit_logs`

---

## Error Handling

**Standard Error Responses:**

**400 Bad Request:**

```typescript
{ error: "Invalid request data", code: "VALIDATION_ERROR" }
```

**401 Unauthorized:**

```typescript
{ error: "Authentication required", code: "UNAUTHORIZED" }
```

**403 Forbidden:**

```typescript
{ error: "Plan upgrade required for this feature", code: "FEATURE_LOCKED" }
```

**404 Not Found:**

```typescript
{ error: "Resource not found", code: "NOT_FOUND" }
```

**429 Too Many Requests:**

```typescript
{ error: "Rate limit exceeded", code: "RATE_LIMIT" }
```

**500 Internal Error:**

```typescript
{ error: "Something went wrong", code: "INTERNAL_ERROR" }
```

---

## Rate Limiting

**Implement via Upstash Redis or Vercel Edge Config:**

**Limits:**

- Auth endpoints: 10 requests / 5 min per IP
- AI chat: Plan-based daily/lifetime limits (enforced at endpoint level)
- Public booking: 30 requests / min per IP
- All other: 100 requests / min per company

---

## Authentication Middleware

**Location:** `/apps/web/src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const supabase = createServerClient(...)

  const { data: { session } } = await supabase.auth.getSession()

  // Protect /api routes (except public ones)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const publicRoutes = ['/api/booking/', '/api/auth/']
    const isPublic = publicRoutes.some(route =>
      req.nextUrl.pathname.startsWith(route)
    )

    if (!isPublic && !session) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  return NextResponse.next()
}
```

---

Next: See [05-USER_FLOWS.md](05-USER_FLOWS.md) for complete user journey mappings.
