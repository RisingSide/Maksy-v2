# USER FLOWS - Complete User Journey Mappings

## Overview

This document maps out every major user journey in the Maksy application, from signup to day-to-day operations.

---

## Table of Contents

1. [New User Onboarding Flow](#new-user-onboarding-flow)
2. [Customer Public Booking Flow](#customer-public-booking-flow)
3. [Job Lifecycle Flow](#job-lifecycle-flow)
4. [Team Member Invitation Flow](#team-member-invitation-flow)
5. [Invoice Generation & Payment Flow](#invoice-generation--payment-flow)
6. [Recurring Job Setup Flow](#recurring-job-setup-flow)
7. [Estimate to Job Conversion Flow](#estimate-to-job-conversion-flow)

---

## New User Onboarding Flow

### Entry Point

User clicks "Start Free Trial" or "Get Started" from landing page

### Step 1: Plan Selection

**Page:** `/pricing`

1. User views 3 pricing tiers (Starter - Free, Pro $47, Scale $97)
2. User clicks plan CTA button
3. Redirect to `/signup?plan=[selected-plan]`

---

### Step 2: Account Creation

**Page:** `/signup`

**Option A: Email/Password**

1. User enters email
2. User creates password (strength meter validates)
3. User confirms password
4. Click "Create Account"
5. System checks email availability
   - If taken: Show error "Email already in use"
   - If available: Create Supabase Auth user

**Option B: Google OAuth**

1. User clicks "Sign up with Google"
2. Google OAuth popup
3. User selects Google account
4. Returns with Google credentials
5. System creates user account

**Result:**

- User account created
- Session established
- User redirected to `/onboarding`

---

### Step 3: Onboarding - Industry

**Page:** `/onboarding` (Step 1/6)

1. Maksy greets: "What industry are you in?"
2. Grid of industry options displays:
   - HVAC
   - Plumbing
   - Landscaping
   - Construction
   - Auto Detailing
   - Carpet Cleaning
   - Pressure Washing
   - Electrical
   - Pool Service
   - Other (text input)
3. User selects industry
4. System saves to `companies.industry`
5. Progress indicator updates (1/6 → 2/6)
6. Screen transitions to Step 4

---

### Step 4: Onboarding - Business Info

**Page:** `/onboarding` (Step 2/6)

**Maksy says:** "Tell me about your business"

**Form Fields:**

- Business Name (required)
  - User types business name
  - **On blur:** System generates slug
    - Example: "ABC Plumbing" → "abc-plumbing"
    - Calls `/api/slugs/check?slug=abc-plumbing`
    - If taken: Appends random chars "abc-plumbing-a3f9"
    - Shows generated slug to user (editable later)
- Business Phone (required, formatted)
- Business Email (pre-filled from signup, editable)
- Business Address (Google Places autocomplete)
  - User starts typing
  - Dropdown shows suggestions
  - User selects address
  - Auto-fills: street, city, state, zip
- Website (optional)

**Validation:**

- Phone: Valid US/international format
- Email: Valid email format
- Address: Must select from autocomplete

**Action:**

- Click "Continue"
- System saves to `companies` table
- Progress: 2/6 → 3/6

---

### Step 5: Onboarding - Personal Info

**Page:** `/onboarding` (Step 3/6)

**Maksy says:** "And a bit about you"

**Form Fields:**

- Full Name (required)
- Personal Phone (pre-filled if same as business, editable)
- Personal Email (pre-filled if same as business, editable)
- Personal Address
  - Checkbox: "Same as business address"
  - If checked: Auto-fill
  - If unchecked: Google Places autocomplete
- Role/Title (optional, e.g., "Owner", "Manager")

**Action:**

- Click "Continue"
- System saves to `user_profiles` table
- Progress: 3/6 → 4/6

---

### Step 6: Onboarding - Payment (Paid Plans Only)

**Page:** `/onboarding` (Step 4/6)

**If Free Plan:** Skip this step entirely

**If Pro/Scale Plan:**

**Maksy says:** "Start your 14-day free trial"

**Info Display:**

- "You won't be charged until [date 14 days from now]"
- "Cancel anytime before trial ends"
- Plan details recap (price, features)

**Stripe Elements Form:**

- Card Number
- Expiry Date (MM/YY)
- CVC
- Billing ZIP Code

**Legal:**

- Checkbox (required): "I agree to Maksy's Terms of Service and Privacy Policy"
  - Links open in modal

**Action:**

- Click "Start Trial"
- System processes:
  1. Create Stripe Customer
  2. Attach PaymentMethod
  3. Create Stripe Subscription (trial_period_days: 14)
  4. Save to `subscriptions` table:
     - plan_type: [selected]
     - status: 'trialing'
     - trial_ends_at: +14 days
  5. If error: Show error message, allow retry
  6. If success: Progress 4/6 → 5/6

---

### Step 7: Onboarding - Data Import (Optional)

**Page:** `/onboarding` (Step 5/6)

**Maksy says:** "Let's get you jump-started! Want to import your existing data?"

**Option 1: Upload Customer CSV**

1. User clicks "Upload Customer CSV"
2. File picker opens
3. User selects CSV file
4. System uploads to server
5. POST `/api/onboarding/import-csv`
   - OpenAI parses CSV
   - Detects columns: first_name, last_name, email, phone, address, etc.
   - Identifies custom columns (e.g., "Vehicle Make")
6. Preview table displays:
   - Shows first 5 rows
   - Column mapping (CSV → Maksy fields)
7. For custom columns detected:
   - Maksy asks: "Would you like to add a custom field 'Vehicle Make'?"
   - User clicks "Yes" or "No"
8. User clicks "Confirm Import"
9. System creates:
   - `custom_customer_fields` records (if approved)
   - `customers` records (bulk insert)
   - `customer_field_values` records
10. Success message: "Imported X customers"

**Option 2: Upload Services List**

1. User clicks "Upload Services" (accepts CSV/PDF/TXT)
2. File picker opens
3. User selects file
4. System uploads
5. OpenAI extracts services:
   - Service name
   - Price (if found)
   - Duration (if found)
6. Preview table displays
7. User edits if needed (inline editing)
8. Click "Confirm Import"
9. System creates:
   - `services` records
10. Success message: "Imported X services"

**Option 3: Skip**

- Button: "Skip for now"
- User can import later from settings

**Action:**

- Regardless of choice, click "Continue"
- Progress: 5/6 → 6/6

---

### Step 8: Onboarding - Team Setup (Pro/Scale Only)

**Page:** `/onboarding` (Step 6/6)

**If Free Plan:** Skip this step

**Maksy says:** "Want to add team members now?"

**Action 1: Add Team Member**

1. Click "+ Add Team Member"
2. Modal opens with form:
   - First Name (required)
   - Email (required)
   - Role: Dropdown (Admin / Team Member)
3. Click "Send Invite"
4. System:
   - Creates `team_members` record (status: 'invited')
   - Generates invitation token
   - Sends email to team member
   - Shows success: "Invitation sent to [email]"
5. User can add more team members (repeat)

**Action 2: Skip**

- Button: "Skip, I'll do this later"

**Final Action:**

- Click "Go to Dashboard"
- System saves onboarding completion flag
- Redirect to `/dashboard`

---

### Step 9: First Dashboard View

**Page:** `/dashboard`

**On first login:**

1. Maksy AI bubble appears (plan-aware)
   - Starter: "You have 15 free Maksy AI requests. Try asking 'What should I do first?'"
   - Pro: Shows daily counter "0 / 30 today"
   - Scale: Highlights advanced GPT insights available
2. Dashboard widgets (empty state):
   - Stats cards showing $0 revenue, 0 jobs, etc.
   - Empty calendar
   - Starter-only banner reminding about 50 jobs/month + 3 tasks/week limits
3. Quick-start checklist cards:
   - "Add your first customer"
   - "Add your first service"
   - "Create your first job"
   - "Set up inventory" (links to `/inventory`)
4. Guided tour tooltips (optional) highlight key UI (Calendar, Inventory, Maksy AI chat)

**User completes onboarding flow ✓**

---

## Customer Public Booking Flow

### Entry Point

Customer receives booking link: `maksy.ai/abc-plumbing` or embedded on website

---

### Step 1: Service Selection

**Page:** `/booking/abc-plumbing`

**Display:**

1. Hero section:
   - Company cover photo (background)
   - Company logo (overlay)
   - Company name
   - Tagline (if set)

2. Sidebar (always visible):
   - Company phone (click-to-call)
   - Company email (mailto link)
   - Business address
   - Social media links
   - Business hours

3. Main content:
   - Services organized by category
   - Each service card shows:
     - Icon/image
     - Service name
     - Price (if enabled in settings)
     - Duration (if enabled)
     - Description (if enabled)
     - "Book Now" button (on hover)

**Customer Action:**

1. Customer browses services
2. Hovers over desired service
3. "Book Now" button appears
4. Customer clicks "Book Now"
5. Service highlighted
6. Form slides in from right
7. Progress indicator: Step 1/4

---

### Step 2: Add-ons & Team Selection (Conditional)

**Page:** Same page, form updates

**If Add-ons Enabled:**

1. Form shows: "Would you like to add any of these?"
2. Displays add-ons for selected service:
   - Checkbox list
   - Each shows: Name, +$Price, +Duration
3. Customer checks desired add-ons

**Option to add another service:**

- Link: "+ Add another service"
- Clicking returns to Step 1 (multi-service booking)

**If Team Selection Enabled:**

1. Form shows: "Do you have a preferred team member?"
2. Grid of team members:
   - Photo
   - Name
   - Rating (future feature)
3. Option: "No Preference" (selected by default)
4. Customer selects team member or keeps default

**Action:**

- Click "Continue"
- Progress: 1/4 → 2/4

---

### Step 3: Date & Time Selection

**Page:** Same page, form updates

**Display:**

1. **Calendar (left side):**
   - Month view
   - Current month displayed
   - Navigation: < Previous | Next > month
   - Available dates: Clickable, highlighted
   - Unavailable dates: Grayed out, not clickable
   - Today: Different highlight color

2. **Availability Logic:**
   - GET `/api/booking/abc-plumbing/availability?date=2024-11-10&service_id=xxx&team_member_id=yyy`
   - Server checks:
     - Team member availability (from `team_availability` table)
     - Existing bookings (from `jobs` table)
     - Lead time settings (can't book within X hours)
     - Scheduling window (can't book beyond X days)
     - Service duration fits in available slot
   - Returns: Array of available dates

**Customer Action:**

1. Customer clicks available date
2. Date selected (highlighted)
3. Time slots display (right side)

**Time Slots Display:**

- List of available times for selected date
- Each slot shows: Time (e.g., "10:00 AM")
- Slots based on:
  - Booking slot size (15min, 30min, 1hr intervals)
  - Service duration
  - Team availability
- Slots grayed out if not available

**Customer Action:**

1. Customer clicks desired time slot
2. Time slot selected (highlighted)
3. Summary updates:
   - Selected service(s)
   - Add-ons (if any)
   - Date & Time
   - Duration
   - Total price
   - Team member (if selected)

**Action:**

- Click "Continue"
- Progress: 2/4 → 3/4

---

### Step 4: Customer Information

**Page:** Same page, form updates

**Form Fields:**

- First Name (required)
- Last Name (required)
- Email (required, validated)
- Phone (required, formatted)
- Address (conditional, based on settings)
  - If enabled: Google Places autocomplete
- **Custom Fields** (if configured):
  - Example: "Vehicle Make & Model" (text)
  - Example: "Lawn Size (sq ft)" (number)
  - Shows only fields marked "show_on_booking_page"
- Notes (optional, textarea)
  - Placeholder: "Any special instructions?"

**Legal Checkbox (required):**

- ☐ "I agree to [Company Name]'s Terms of Service and Privacy Policy"
- Links open in modal or new tab

**Summary Panel (left side):**

- Selected service(s) with prices
- Add-ons with prices
- Date & Time
- Duration
- Subtotal
- Total

**Validation:**

- All required fields must be filled
- Email format validated
- Phone format validated
- Legal checkbox must be checked

**Action:**

- Click "Schedule Appointment"
- Button shows loading spinner
- POST `/api/booking/abc-plumbing/submit`

**System Process:**

1. Validate slot still available (race condition check)
2. Check if customer exists (by email)
   - If exists: Use existing customer_id
   - If new: Create customer record
3. If custom fields provided:
   - Save to `customer_field_values`
4. Create job record:
   - Link to customer
   - Link to service
   - Link to team member (if selected)
   - Set status: 'scheduled'
   - Store add-ons in `job_add_ons`
5. Trigger automation: "booking_confirmation"
   - Send SMS (if phone provided)
   - Send email confirmation
6. If error:
   - Show error message: "Slot no longer available, please select another time"
   - Return to Step 3
7. If success:
   - Generate confirmation number: "CONF-2024-001"
   - Progress: 3/4 → 4/4

---

### Step 5: Confirmation

**Page:** Same page, success view

**Display:**

1. Success animation (checkmark)
2. Heading: "You're all set!"
3. Confirmation details:
   - Confirmation number: CONF-2024-001
   - Service name
   - Date & Time
   - Location (company address)
   - Team member name (if applicable)
   - Total price
4. Message: "We'll send you a reminder before your appointment"
5. Button: "Add to Calendar" (.ics file download)
6. Button: "Done"

**Email Sent:**

- Subject: "Booking Confirmation - [Company Name]"
- Contains all booking details
- Calendar attachment (.ics)
- Contact info if customer needs to reschedule

**SMS Sent (if phone provided):**

- "Your appointment with [Company] is confirmed for [Date] at [Time]. Confirmation #: CONF-2024-001"

**Action:**

- Customer clicks "Done" or closes page
- Booking complete ✓

---

## Job Lifecycle Flow

### Phase 1: Job Creation (Admin Side)

**Page:** `/calendar` or `/jobs`

**Option A: From Calendar**

1. Admin clicks "+ icon" on calendar date
2. Tabs appear: "Add Job" | "Add Task" | "Add Meeting"
3. Admin clicks "Add Job"
4. Modal opens

**Option B: From Jobs Page**

1. Admin clicks "+ Add Job" button
2. Modal opens

**Job Creation Form:**

- Customer (searchable dropdown)
  - Type to search by name/email/phone
  - Option: "+ Add New Customer" (opens nested modal)
- Service (dropdown)
  - Shows all services
  - Displays price & duration
- Date (date picker)
- Time (time picker)
  - Shows suggested time (next available)
- Duration (auto-filled from service, editable)
- Team Member (dropdown)
  - Shows available team members
  - Option: "Unassigned"
- Add-ons (checkboxes)
  - Shows add-ons for selected service
  - Price adjusts in summary
- Recurring? (checkbox)
  - If checked: Expands recurring options →

**Recurring Options (if enabled):**

- Frequency (dropdown):
  - Daily
  - Weekly
  - Bi-weekly (every 2 weeks)
  - Monthly
  - Quarterly
  - Yearly
- Repeat Until (date picker)
  - Max: 2 years from start date
  - Option: "No end date" (checkbox, overrides date picker)
- Summary: "This will create X jobs"

- Notes (textarea)

**Validation:**

- Check no double-booking (unless enabled)
- Check team member availability
- If conflicts: Show warning

**Action:**

- Click "Create Job"
- System:
  1. Insert job record
  2. If recurring: Create future job instances (up to stop date)
  3. Insert job_add_ons (if any)
  4. Trigger automation: "job_scheduled"
  5. If team member assigned: Send notification
  6. Redirect to job detail page or close modal

**Result:**

- Job appears on calendar
- Job appears in jobs list
- Status: 'scheduled'

---

### Phase 2: Job Scheduled (Waiting)

**Status:** `scheduled` → `confirmed`

**24 Hours Before (Automation):**

- Inngest job runs (cron: every hour)
- Finds jobs scheduled in next 24hrs
- Sends SMS reminder to customer:
  - "Reminder: Your [Service] appointment with [Company] is tomorrow at [Time]"
- Updates reminder_sent flag

**Customer Can:**

- Receive reminders
- Contact company to reschedule (manual process for now)

**Admin Can:**

- View job in calendar/jobs list
- Edit job details (date, time, team member, notes)
- If editing recurring job:
  - Modal asks: "Edit this job only" or "Edit all future jobs"
  - If "all future": Updates all future instances
- Cancel job
- Delete job

---

### Phase 3: Job Day - On My Way

**Status:** `scheduled` → `in_progress`

**Team Member Action:**
**Page:** `/jobs/[id]` (team member dashboard)

1. Team member opens job details
2. Button: "On My Way" (prominent, orange)
3. Team member clicks "On My Way"
4. System prompts: "Allow location access?" (if first time)
5. Team member allows location
6. POST `/api/jobs/[id]/on-my-way`
   - Body: `{ lat: 40.7128, lng: -74.0060 }`

**System Process:**

1. Update job status → 'in_progress'
2. Create/update `job_tracking` record:
   - `on_my_way_at`: NOW()
   - `on_my_way_lat`: [latitude]
   - `on_my_way_lng`: [longitude]
3. Calculate ETA (using Google Maps Distance Matrix API):
   - From: Team member current location
   - To: Customer address
   - Get: Duration in minutes
4. Send SMS to customer:
   - "We're on our way! ETA: [X] minutes"
5. Return success

**Result:**

- Job status badge: "In Progress" (orange)
- Admin can see job in "Time & GPS" page
- Location recorded in database

---

### Phase 4: Job Start

**Status:** `in_progress` (already)

**Team Member Action:**
**Page:** `/jobs/[id]`

1. Team member arrives at customer location
2. Button: "Start Job" appears
3. Team member clicks "Start Job"
4. POST `/api/jobs/[id]/start`

**System Process:**

1. Update `job_tracking`:
   - `started_at`: NOW()
   - Record current location (arrived_lat, arrived_lng)
2. Calculate drive time:
   - `drive_time_minutes`: difference between `on_my_way_at` and `started_at`
3. Send SMS to customer (if enabled):
   - "We've started your [Service]! Should be done in [Duration] minutes"
4. Show "Before Photos" prompt (Pro/Scale)
   - Capture via mobile camera or upload
   - Images saved to `job_media` as `media_type = 'before'`
5. Return success

**Result:**

- Job shows "Started at [time]"
- Timer begins (for tracking actual duration)
- Admin can see live status

---

### Phase 5: Job Complete

**Status:** `in_progress` → `completed`

**Team Member Action:**
**Page:** `/jobs/[id]`

1. Team member finishes work
2. Prompt: "Log inventory usage" (Pro/Scale)
   - Select consumed inventory items + quantities (optional)
   - Starter sees info banner explaining upgrade benefits
3. Prompt: "Capture After Photos" (Pro/Scale)
   - Upload photos; stored as `media_type = 'after'`
4. Button: "Finish Job" appears
5. Team member clicks "Finish Job"
6. POST `/api/jobs/[id]/complete`

**System Process:**

1. Update job:
   - `status`: 'completed'
2. Update `job_tracking`:
   - `completed_at`: NOW()
   - Calculate `job_duration_minutes`: difference between `started_at` and `completed_at`
3. Update customer LTV:
   - Add job `total_price` to customer's `lifetime_value`
   - Increment customer's `total_jobs` count
   - Update customer's `last_job_date`
4. Trigger automation: "job_completed"
   - Waits 30 minutes (step.sleep)
   - Sends review request SMS:
     - "Hey [Customer]! Thanks for using [Company]. How did we do? Leave a review: [Google Review Link]"
5. If auto-invoice enabled (Pro/Scale only):
   - Automatically create invoice
   - Link invoice to job
   - Send invoice email
6. Return success (Starter stops after job completion; upgrade modal shown if attempting to generate invoice)

**Result:**

- Job status: "Completed" (green badge)
- Before/after gallery stored (Pro/Scale)
- Inventory deductions logged (Pro/Scale)
- Customer receives review request after 30min
- Job ready for payment/invoicing (Starter sees upgrade modal)

---

### Phase 6: Payment Collection

**Status:** Payment status: `unpaid` → `paid`

**Option A: Collect Payment Immediately**
**Page:** `/jobs/[id]`

1. Admin/Team member clicks "Collect Payment" button (Starter: button disabled with upgrade prompt)
2. Modal opens with options:
   - **Cash:**
     - Input amount
     - Click "Mark as Paid (Cash)"
     - Updates `payment_status`: 'paid'
     - Records payment in `payments` table
   - **Card:**
     - Stripe Terminal (if physical hardware)
     - OR Stripe Payment Link (send to customer)
     - Customer enters card details
     - Stripe processes payment
     - Webhook updates job `payment_status`: 'paid'
     - Records payment
   - **Invoice:**
     - Button: "Send Invoice Later"
     - Updates `payment_method`: 'invoice'
     - User must generate invoice separately

**Option B: Generate Invoice**
**Page:** `/jobs/[id]` or `/invoices/new` (Starter: selecting this option triggers upgrade modal)

1. Admin clicks "Generate Invoice" on job
2. System creates invoice:
   - Auto-fills customer info
   - Pulls service details from job
   - Adds line items (service + add-ons)
   - Calculates tax (if configured)
   - Sets due date (default: +30 days)
3. Invoice saved with status: 'unpaid'
4. Admin can:
   - Edit invoice if needed
   - Click "Send Invoice"
   - Email sent to customer with payment link
5. Customer receives email:
   - Opens invoice
   - Clicks "Pay Now"
   - Stripe checkout page
   - Customer pays
   - Webhook updates invoice status: 'paid'
   - Updates job `payment_status`: 'paid'

**Result:**

- Job fully complete with payment recorded
- Revenue counted in reports
- Customer LTV updated
- Job lifecycle complete ✓

---

## Team Member Invitation Flow

### Admin Side

**Step 1: Send Invitation**
**Page:** `/settings/team`

1. Admin clicks "+ Invite Team Member"
2. Modal opens with form:
   - First Name (required)
   - Email (required)
   - Role (dropdown): Admin or Team Member
3. Admin fills form
4. Admin clicks "Send Invite"
5. POST `/api/team/invite`

**System Process:**

1. Check plan allows more team members:
   - Starter: Block (max 0)
   - Pro: Allow invitations while total team members < 5
   - Scale: Allow (unlimited)
2. Generate unique invitation token: `inv_xxxxx`
3. Create `team_members` record:
   - `status`: 'invited'
   - `invitation_token`: token
   - `invitation_sent_at`: NOW()
4. Send email from `noreply@maksy.ai`:
   - **Subject:** "You've been invited to join [Company Name] on Maksy"
   - **Body:**
     - "[Owner Name] has invited you to join their team on Maksy"
     - "Click below to accept and create your account"
     - **CTA Button:** "Accept Invitation"
     - Link: `https://maksy.ai/team/join?token=inv_xxxxx`
     - Expires in 7 days
5. Show success message: "Invitation sent to [email]"
6. Table updates with pending invitation

**Result:**

- Team member receives email
- Invitation pending

---

### Team Member Side

**Step 2: Accept Invitation**
**Page:** Receives email, clicks link

1. Email client opens link: `/team/join?token=inv_xxxxx`
2. Browser opens Maksy app
3. GET `/api/team/join?token=inv_xxxxx`
4. System verifies:
   - Token exists
   - Token not expired (< 7 days old)
   - Token not already used
5. If valid: Displays join page
6. If invalid: Shows error "Invitation expired or invalid"

**Step 3: Complete Signup**
**Page:** `/team/join?token=inv_xxxxx`

**Display:**

- Company info (logo, name)
- Message: "You've been invited to join [Company Name]"
- Signup form

**Form Fields:**

- Full Name (required)
  - First name pre-filled from invitation
  - Last name field
- Phone Number (required, formatted)
- Email (pre-filled, read-only)
- Password (required, strength meter)
- Confirm Password (required)
- Address (optional, for payroll if Pro)
  - Google Places autocomplete

**Action:**

1. Team member fills form
2. Click "Join Team"
3. POST `/api/team/join`

**System Process:**

1. Create Supabase Auth user account:
   - Email from invitation
   - Password from form
2. Update `team_members` record:
   - Link `user_id`
   - Update `status`: 'active'
   - Save phone, name, address
   - Set `accepted_at`: NOW()
3. Create session
4. Return success

**Step 4: Redirect**

- Team member logged in
- Redirect to `/dashboard` (team member view)
- Show welcome message
- Guided tour (optional)

**Result:**

- Team member account active
- Can log in to dashboard
- Appears in admin's team list
- Can be assigned to jobs

---

## Invoice Generation & Payment Flow

### Manual Invoice Creation

**Step 1: Create Invoice**
**Page:** `/invoices` or `/invoices/new`

**Option A: From Job**

1. Admin navigates to `/jobs/[id]`
2. Clicks "Generate Invoice"
3. Modal/page opens with pre-filled data:
   - Customer (from job)
   - Line item: Service name, price, qty: 1
   - Add-ons as additional line items
   - Total from job
4. Skip to Step 2

**Option B: From Scratch**

1. Admin clicks "+ New Invoice"
2. Form opens:
   - Customer (searchable dropdown)
   - Invoice Date (default: today)
   - Due Date (default: +30 days)
   - Payment Terms (dropdown: Net 30, Due on Receipt, etc.)
   - **Line Items:**
     - Click "+ Add Line Item"
     - For each item:
       - Description (text)
       - Quantity (number)
       - Unit Price ($)
       - Total (auto-calculated)
     - Can add multiple items
   - Subtotal (auto-calculated)
   - Tax (% or $, based on company settings)
   - Discount (optional, $ or %)
   - **Total** (bold, large font)
   - Notes (textarea, customer-visible)
   - Terms & Conditions (auto-filled from company settings)

**Validation:**

- Must have at least 1 line item
- All amounts must be positive
- Due date must be >= invoice date

**Action:**

- Click "Save Draft" (saves without sending)
- OR Click "Save & Send" (saves and proceeds to Step 2)

**System Process:**

1. Generate invoice number: "INV-2024-001"
2. Insert `invoices` record
3. Insert `invoice_line_items` records
4. Calculate totals
5. Set status: 'unpaid'
6. If "Save & Send": Continue to Step 2
7. If "Save Draft": Done, return to invoices list

---

### Step 2: Send Invoice

**Page:** `/invoices/[id]`

1. Admin reviews invoice (preview mode)
2. Admin clicks "Send Invoice"
3. Confirmation modal:
   - "Send invoice to [customer email]?"
   - Preview of email content
4. Admin confirms
5. POST `/api/invoices/[id]/send`

**System Process:**

1. Update invoice:
   - `sent_at`: NOW()
2. Generate PDF:
   - Use @react-pdf/renderer
   - Company logo, branding
   - Invoice details
   - Line items table
   - Total
   - Payment instructions
3. Create Stripe Payment Intent (if card payment):
   - Amount: invoice total
   - Customer: linked Stripe customer
   - Generate payment link
4. Send email to customer:
   - **Subject:** "Invoice #INV-2024-001 from [Company Name]"
   - **Body:**
     - "Hi [Customer],"
     - "Here's your invoice for [services]"
     - Invoice details summary
     - **Attachment:** invoice.pdf
     - **CTA Button:** "Pay Now" (Stripe payment link)
     - Alt: "Pay by check/cash" instructions
     - Contact info if questions
5. Return success

**Result:**

- Email sent to customer
- Invoice status remains 'unpaid'
- Admin sees "Sent on [date]"
- Awaiting payment

---

### Step 3: Customer Pays (Online)

**Page:** Customer's email → Stripe Checkout

1. Customer receives email
2. Customer opens email
3. Customer clicks "Pay Now" button
4. Redirects to Stripe Checkout page
5. Customer enters payment details:
   - Card number
   - Expiry
   - CVC
   - Billing info
6. Customer clicks "Pay $XXX"
7. Stripe processes payment
8. If successful:
   - Stripe shows success page
   - Stripe sends webhook to `/api/stripe/webhook`

**Webhook Process:**

1. Event: `payment_intent.succeeded`
2. Verify signature
3. Extract payment_intent_id
4. Find invoice by payment_intent_id
5. Update invoice:
   - `status`: 'paid'
   - `paid_at`: NOW()
   - `amount_paid`: full amount
6. Create payment record in `payments` table
7. If invoice linked to job:
   - Update job `payment_status`: 'paid'
8. Send confirmation email to customer:
   - "Payment received!"
   - Receipt attached
9. Send notification to admin:
   - "Invoice #INV-2024-001 has been paid"

**Result:**

- Invoice marked as paid
- Revenue recorded
- Customer has receipt
- Job complete (if applicable)

---

### Step 4: Manual Payment (Cash/Check)

**Alternative to Step 3**

**Page:** `/invoices/[id]`

1. Customer pays with cash/check in person
2. Admin opens invoice
3. Admin clicks "Record Payment"
4. Modal opens:
   - Amount (default: remaining balance)
   - Payment Method (dropdown: Cash, Check, Bank Transfer)
   - Payment Date (default: today)
   - Notes (optional: check number, etc.)
5. Admin clicks "Record Payment"
6. POST `/api/invoices/[id]/payment`

**System Process:**

1. Create payment record in `payments` table
2. Update invoice:
   - `amount_paid`: += payment amount
   - If `amount_paid` >= `total`:
     - `status`: 'paid'
     - `paid_at`: NOW()
   - Else:
     - `status`: 'partially_paid'
3. If linked to job:
   - Update job `payment_status`
4. Send receipt email to customer
5. Return success

**Result:**

- Invoice marked as paid
- Payment recorded
- Customer notified

---

## Inventory Management Flow

### Phase 1: Add Inventory Item

1. User goes to `/inventory`
2. Clicks "Add Item"
3. Completes form (Name, SKU, Category, Quantity, Reorder point, Unit cost, optional location tag)
4. Uploads optional image/documents (manuals, receipts)
5. Saves item — initial movement logged as `change_type = 'import'`

### Phase 2: Monitor Stock Levels

- Inventory table highlights low-stock items (red badge)
- Starter: dashboard banner warning
- Pro: email + in-app notifications
- Scale: email + SMS + predictive "days remaining" metric and vendor reminder tasks

### Phase 3: Job Consumption (Pro/Scale)

1. During job completion, technician opens "Inventory Used" panel
2. Searches for items, enters quantities consumed
3. Quantities decrement automatically; `inventory_movements` row created with `job_id`
4. If Starter attempts, show upgrade modal explaining benefit

### Phase 4: Manual Adjustments & Transfers

- Admin selects items → "Adjust Quantity" or "Transfer"
- Modal records amount, reason, notes (Scale: target location)
- Movement recorded in ledger

### Phase 5: Reporting & Export

- Starter: export current inventory CSV
- Pro: usage summary (last 30 days), low-stock report, bulk import template
- Scale: inventory valuation, vendor performance, automation trigger (e.g., create reorder task)

---

## Recurring Job Setup Flow

**Entry Point:** Creating a job with recurring enabled

### Step 1: Enable Recurring

**Page:** Job creation modal (Calendar or Jobs page)

1. Admin fills standard job fields:
   - Customer
   - Service
   - Date & Time
   - Team Member
2. Admin checks checkbox: ☑ "Recurring"
3. Recurring options expand below

---

### Step 2: Configure Recurrence

**Expanded Form Section:**

**Frequency (Dropdown):**

- Daily
- Weekly
- Bi-weekly
- Monthly (same day each month)
- Quarterly (every 3 months)
- Yearly

**Repeat Until (Required):**

- Option A: Date Picker
  - Admin selects end date
  - Validation: Max 2 years from start date
  - If user selects beyond 2 years: Error message
- Option B: Checkbox "No end date"
  - If checked: Grays out date picker
  - Creates jobs for next 2 years (max)

**Auto-Invoice Setting:**

- Checkbox: ☐ "Automatically generate invoice when job completes"
- If checked:
  - When each recurring job marked complete
  - System auto-creates invoice
  - Auto-sends invoice to customer

**Preview:**

- Shows calculation: "This will create X jobs"
- Example:
  - Weekly from Nov 5, 2024 to Nov 5, 2025
  - = 52 jobs

**Action:**

- Click "Create Recurring Jobs"
- Confirmation modal:
  - "Create 52 recurring jobs?"
  - Shows first 5 dates as preview
  - Confirm / Cancel

---

### Step 3: System Creates Jobs

**Process:**

1. System validates:
   - Frequency selected
   - End date valid (if provided)
   - Customer exists
   - Service exists
2. Generate job dates based on frequency:
   - Loop from start_date to end_date
   - Increment by frequency
   - Create array of dates
3. For each date in array:
   - Insert `jobs` record:
     - Copy all fields from parent job
     - Set `scheduled_date`: [calculated date]
     - Set `is_recurring`: true
     - Set `recurring_frequency`: [selected]
     - Set `parent_job_id`: [first job's ID]
     - Set `status`: 'scheduled'
4. Return count of created jobs
5. Show success message: "Created 52 recurring jobs"

**Result:**

- Multiple jobs created
- All appear on calendar (future dates)
- All appear in jobs list
- All tagged as "Recurring" badge
- Automations will trigger for each job (appointment reminders)

---

### Step 4: Managing Recurring Jobs

**Edit Single Job:**

1. Admin opens specific recurring job
2. Makes changes (date, time, team member, notes)
3. System detects: This is a recurring job
4. Modal prompt:
   - "This is a recurring job. Would you like to:"
   - Option A: ○ "Edit only this job"
   - Option B: ○ "Edit all future jobs"
   - (Radio buttons)
5. Admin selects option
6. Admin clicks "Save Changes"
7. System:
   - **If Option A:** Updates only this job
   - **If Option B:**
     - Updates this job + all future jobs
     - Query: `WHERE parent_job_id = [id] AND scheduled_date >= [this job's date]`
     - Bulk update
8. Success message

**Delete Single Job:**

1. Admin clicks "Delete" on recurring job
2. Modal prompt: Same as edit
   - "Delete only this job" or "Delete all future jobs"
3. Admin selects and confirms
4. System:
   - **If single:** Soft delete this job only
   - **If all future:** Soft delete this + all future
5. Jobs removed from calendar/lists

**Cancel Entire Series:**

1. Admin opens any job in series
2. Clicks "Cancel Recurring Series"
3. Confirmation: "This will cancel X upcoming jobs"
4. Admin confirms
5. System:
   - Updates all future jobs: `status`: 'cancelled'
   - Sends cancellation SMS/email to customer (if jobs were within next week)
6. Series cancelled

---

## Estimate to Job Conversion Flow

### Step 1: Customer Requests Estimate

**Page:** Public form or email

1. Customer fills out form (custom form or email)
2. Submits request
3. Appears in admin's Estimates page

---

### Step 2: Admin Creates Estimate

**Page:** `/estimates/new`

1. Admin reviews request
2. Creates estimate:
   - Customer
   - Service(s)
   - Line items with pricing
   - Notes
3. Saves estimate
4. Clicks "Send Estimate"
5. Email sent to customer with PDF

---

### Step 3: Customer Approves

**Option A: Email Link**

1. Customer receives email
2. Email contains link: `/estimates/[id]/approve?token=xxx`
3. Customer clicks link
4. Page displays estimate details
5. Customer clicks "Approve Estimate"
6. POST `/api/estimates/[id]/approve?token=xxx`
7. System updates:
   - Estimate status: 'approved'
   - `approved_at`: NOW()
8. Success page displays

**Option B: Admin Marks Approved**

1. Customer contacts admin (phone/email)
2. Says "yes, let's do it"
3. Admin opens estimate
4. Admin clicks "Mark as Approved"
5. System updates estimate

---

### Step 4: Convert to Job

**Page:** `/estimates/[id]`

**After estimate approved:**

1. Banner appears: "This estimate was approved! ✓"
2. Button: "Convert to Job"
3. Admin clicks button
4. Job creation modal opens:
   - Customer (pre-filled, read-only)
   - Service (pre-filled from estimate)
   - Date & Time (empty, admin selects)
   - Duration (pre-filled from service)
   - Team Member (admin selects)
   - Price (pre-filled from estimate total)
   - Notes (pre-filled from estimate)
5. Admin fills date/time/team
6. Admin clicks "Create Job"
7. System:
   - Creates job
   - Links job to estimate: `job.estimate_id`
   - Estimate gets new field: `converted_to_job_id`
8. Success message: "Job created from estimate"
9. Admin redirected to job detail page

**Result:**

- Job scheduled
- Estimate marked as converted
- Customer will receive appointment confirmation
- Job lifecycle begins (see Job Lifecycle Flow)

---

## Summary

All major user flows documented with step-by-step processes, system logic, and expected outcomes. These flows cover:

✅ New user onboarding (signup → first dashboard)  
✅ Customer public booking (service selection → confirmation)  
✅ Job lifecycle (creation → completion → payment)  
✅ Team member invitation (invite → join → active)  
✅ Invoice generation & payment (create → send → paid)  
✅ Recurring job management (setup → edit → delete)  
✅ Estimate to job conversion (request → approve → schedule)

**Next:** These flows inform UI/UX design, API endpoint specifications, and frontend component requirements.

---

_Last Updated: November 5, 2025_  
_Version: 1.0_
