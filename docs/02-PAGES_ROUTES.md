# PAGES & ROUTES - Complete Application Structure

## Route Structure

```
/ (root)
├── /                          # Landing page (public)
├── /pricing                   # Pricing tiers (public)
├── /login                     # Sign in (public)
├── /signup                    # Create account (public)
├── /onboarding                # Multi-step setup (protected)
│
├── /dashboard                 # Main dashboard (protected)
├── /calendar                  # Schedule view (protected)
├── /jobs                      # Job management (protected)
│   ├── /jobs/[id]            # Job detail view
│   └── /jobs/new             # Create new job
├── /tasks                     # Task list (protected)
├── /services                  # Service catalog (protected)
│   └── /services/[id]        # Service detail
├── /customers                 # CRM (protected)
│   ├── /customers/[id]       # Customer profile
│   └── /customers/new        # Add customer
├── /estimates                 # Quote management (protected)
│   └── /estimates/[id]       # Estimate detail
├── /invoices                  # Billing (protected)
│   ├── /invoices/[id]        # Invoice detail
│   └── /invoices/new         # Create invoice
├── /time-gps                  # Team tracking (protected)
├── /automations               # Workflow builder (protected)
├── /reports                   # Reports & analytics (protected, Pro tier)
├── /contracts                # Contract management (protected, Pro tier)
│   ├── /contracts/[id]      # Contract detail view
│   ├── /contracts/new       # Create new contract
│   └── /contracts/sign/[token] # Public signing page
├── /documents                # Document management (protected)
│   ├── /documents/[id]      # Document detail view
│   └── /documents/share/[token] # Public document view
│
├── /settings                  # Settings hub (protected)
│   ├── /settings/profile     # Personal info
│   ├── /settings/company     # Business details
│   ├── /settings/team        # Team management
│   ├── /settings/booking     # Booking page editor
│   ├── /settings/ask-maksy   # AI configuration
│   ├── /settings/fields      # Custom customer fields
│   ├── /settings/forms       # Form builder
│   ├── /settings/coupons     # Discount codes
│   ├── /settings/integrations # External services
│   ├── /settings/notifications # Alert preferences
│   ├── /settings/reports     # Report settings (also accessible from main sidebar)
│   ├── /settings/security    # 2FA, backups
│   └── /settings/billing     # Plan & payment
│
├── /booking/[company]         # Public booking page
└── /forms/[formId]            # Custom form submissions

API Routes:
├── /api/clerk/webhook         # Clerk auth sync (user.created, user.updated)
├── /api/stripe/webhook        # Stripe events
├── /api/twilio/webhook        # SMS delivery status
├── /api/inngest               # Background jobs
├── /api/maksy/chat            # AI assistant
├── /api/maksy/usage           # AI usage tracking
├── /api/jobs/*                # Job CRUD
├── /api/customers/*           # Customer CRUD
├── /api/services/*            # Service CRUD
├── /api/service-categories/*  # Service category CRUD
├── /api/estimates/*           # Estimate CRUD
├── /api/invoices/*            # Invoice CRUD
├── /api/tasks/*               # Task CRUD
├── /api/team/*                # Team member CRUD
├── /api/dashboard/*           # Dashboard stats, revenue, activity, services, metrics, upcoming
├── /api/company/*             # Company profile & settings
├── /api/upload/*              # File uploads (logos, icons, media)
├── /api/onboarding/*          # Onboarding progress tracking
├── /api/subscription          # Current subscription info
├── /api/slugs/check           # Slug availability check
├── /api/automations/*         # Automation CRUD (Phase 2)
├── /api/contracts/*           # Contract CRUD (Phase 2)
├── /api/documents/*           # Document CRUD (Phase 2)
└── /api/booking/*             # Public booking submission (Phase 2)
```

---

## PUBLIC PAGES

### 1. Landing Page (`/`)

**Purpose:** Marketing page, explain Maksy, drive signups

**Sections:**

1. **Hero**
   - Headline: "The All-in-One Platform for Service Businesses"
   - Subheading: "Schedule, invoice, and grow—powered by AI"
   - CTA: "Start Free Trial" / "View Pricing"
   - Background: Animated gradient (from theme)

2. **Features Grid**
   - AI Assistant
   - Smart Scheduling
   - Team Management
   - Automated Invoicing
   - Customer Portal
   - Analytics

3. **How It Works** (3 steps)
   - Set up your business
   - Let customers book online
   - Maksy handles the rest

4. **Pricing Preview**
   - Show 3 tiers (Pro, Scale, Maksy Team)
   - Link to `/pricing`

5. **Social Proof**
   - Testimonials (placeholder)
   - "Join 1,000+ service businesses"

6. **Footer**
   - Links: Pricing, Login, Help, Terms, Privacy
   - Social icons

**State:**

- If logged in: Show "Go to Dashboard" button instead of signup

---

### 2. Pricing Page (`/pricing`)

**Layout:** 3-tier comparison

**Components:**

1. **Header**
   - Headline: "Plans that grow with your crew"

2. **Tier Cards** (Pro, Scale, Maksy Team)
   - Each card shows:
     - Price & billing toggle
     - Who it's for (service businesses, scaling operations, team management)
     - Key highlights (3 bullet callouts)
     - CTA button ("Start 14-Day Trial")
   - Highlight Pro as "Most Popular"
   - Maksy Team is for non-service businesses (team/task focused)

3. **Comparison Table** (expandable)
   - Feature rows grouped by category (Users, AI, Operations, Financial)
   - Checkmarks / text inline with limitations (e.g., "50 jobs/mo")

4. **FAQ**
   - What happens after trial?
   - Can I change plans?
   - Do you offer refunds?
   - Is my data secure?

**CTAs:**

- All buttons → `/signup?plan=pro|scale|team`

---

### 3. Login Page (`/login`)

**Layout:** Centered card on gradient background

**Form Fields:**

- Email (required)
- Password (required, show/hide toggle)
- "Remember me" checkbox
- "Forgot password?" link

**Actions:**

- "Sign In" button
- Divider: "Or continue with"
- "Sign in with Google" (OAuth)

**Links:**

- "Don't have an account? Sign up"

**Validation:**

- Email format
- Password min 8 characters
- Show errors inline

**API:** Clerk Authentication

---

### 4. Signup Page (`/signup`)

**URL Parameters:**

- `?plan=pro|scale|team` (pre-select tier)

**Layout:** Multi-step form (1 page, progressive reveal)

**Step 1: Choose Plan** (if not in URL)

- Show 4 tier cards (simplified)
- Select one → proceed

**Step 2: Account Creation**

- Email (required)
- Password (required, strength meter)
- Confirm password
- "Sign up with Google" option (skips this step)

**Validation:**

- Email not already registered
- Password requirements:
  - Min 8 characters
  - 1 uppercase
  - 1 number
  - 1 special char
- Passwords match

**Actions:**

- "Continue" → Next step

---

### 5. Onboarding (`/onboarding`)

**Access:** Only after signup, before dashboard

**Layout:** Full-screen chat-style interface

**Flow:**

**Step 1: Industry Selection**

```
Maksy: "What industry is your business in?"
Options (grid):
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
```

**Step 2: Business Info**

```
Maksy: "Tell me about your business"
Form:
- Business Name (required)
  - On blur: Auto-generates URL slug
  - Shows: "Your booking page will be: maksy.ai/[slug]"
  - Calls API: GET /api/slugs/check?slug=[generated-slug]
  - If taken: Appends random chars (e.g., "abc-plumbing-x7f2")
  - User can edit slug manually (re-checks on change)
- Business Phone (required)
- Business Email (pre-filled from signup, editable)
- Business Address (autocomplete via Google Places)
- Website (optional)
```

**Step 3: Personal Info**

```
Maksy: "And a bit about you"
Form:
- Full Name (required)
- Personal Phone (pre-filled if same, or new)
- Personal Email (pre-filled if same, or new)
- Personal Address (same as business option checkbox)
- Role/Title (optional)
```

**Step 4: Payment (Pro/Scale plans only)**

```
Maksy: "Start your 14-day free trial"
Info:
- "You won't be charged until [date]"
- "Cancel anytime before trial ends"

Stripe Elements:
- Card number
- Expiry
- CVC
- Billing ZIP

Legal:
- Checkbox: "I agree to Terms of Service and Privacy Policy"
```

**Step 5: Initial Data Import (Optional)**

```
Maksy: "Let's get you jump-started!"

Option 1: Upload Customer CSV
- File upload
- Maksy parses & shows preview
- User confirms import
- If extra columns detected: "Add custom field [name]?"

Option 2: Upload Services List
- File upload (CSV/PDF/TXT)
- Maksy extracts services
- Shows preview
- User confirms

Option 3: Skip
- "Skip for now" button
```

**Step 6: Team Setup (Pro/Scale plans only)**

```
Maksy: "Want to add team members now?"
- "Add Team Member" button
- Or "Skip, I'll do this later"

If adding:
- First Name
- Email
- Role (Admin / Team Member)
- Sends invitation email
```

**Completion:**

- Success animation
- "You're all set!" message
- Redirect to `/dashboard` with welcome tour

**Progress Indicator:**

- Stepper: 1 → 2 → 3 → 4 → 5 → 6
- Current step highlighted

**Data Saved:**

- All to database on each step
- If user drops off, data persists (can resume)

---

## PROTECTED PAGES (Main App)

### Layout Structure (All Protected Pages)

**Components:**

1. **Sidebar** (left, fixed)
   - Logo + "Maksy"
   - Navigation links
     - Dashboard
     - Calendar
     - Jobs
     - Customers
     - Services
     - Inventory
     - Invoices (Pro/Scale)
     - Estimates (Pro/Scale)
     - Automations (Scale)
     - Reports (Pro tier, also in Settings)
   - Settings at bottom
   - Help & Support
   - User avatar (bottom)

2. **Top Bar** (sticky)
   - Search bar (global)
   - **Maksy Intel** button (purple gradient, opens AI insights dropdown)
   - "+ New" button (quick create menu)
   - Notification bell (with count badge)
   - Theme toggle (dark mode is default for new accounts; preference saved in localStorage)
   - User avatar dropdown

3. **Main Content Area**
   - Page content
   - Scrollable

4. **Maksy AI Assistant** (bottom-right)
   - Floating chat bubble (orange)
   - Expandable chat window
   - Always accessible

5. **Upgrade Banner** (Trial users, top)
   - "Upgrade to unlock full access"
   - Dismissible (reappears next session)

---

### 6. Dashboard (`/dashboard`)

**Purpose:** Overview of business metrics and activity

**Architecture:** Server Component (`page.tsx`) + Client Component (`DashboardContent.tsx`)

**Why Split?**

- `recharts` uses `createContext` which only works in Client Components
- Server Component fetches auth context and onboarding progress
- Client Component handles all interactive UI and charts

**Onboarding Checklist Integration:**
When a new user completes critical onboarding but hasn't finished all setup tasks, a `SetupProgressBanner` appears at the top of the dashboard:

```
┌──────────────────────────────────────────────────────────────┐
│  ✨ Get Maksy Ready for Your Business                    [X] │
│  Complete these steps to unlock the full power of Maksy       │
│                                                              │
│  ████████████████░░░░░░░░░░░░░░  40% Complete (2 of 5)      │
│                                                              │
│  ✅ Add Your Services (Complete)                             │
│  ⚪ Import Customer List           [Go →]                    │
│  ⚪ Create Your First Job          [Go →]                    │
│  ⚪ Send Your First Invoice        [Go →]                    │
│  ⚪ Explore Maksy AI Chat          [Go →]                    │
│                                                              │
│  [Dismiss for now]                    [Ask Maksy for Help →] │
└──────────────────────────────────────────────────────────────┘
```

**Banner Behavior:**

- Shows when: `criticalCompleted = true` AND `dismissedAt = null` AND `completedAt = null`
- Hides when: User clicks "Dismiss" (sets `dismissedAt`) or completes all tasks (sets `completedAt`)
- Clicking "Dismiss" → Calls `POST /api/onboarding/set-tour-mode` with `{ tourMode: 'dismissed' }`
- Clicking a task → Navigates to target route and shows spotlight on action element
- Once dismissed, the full upgraded dashboard (with Tips section) is shown

**Files Involved:**

- `apps/web/src/app/(protected)/dashboard/page.tsx` - Server component, data fetching
- `apps/web/src/components/dashboard/DashboardContent.tsx` - Client component, all UI
- `apps/web/src/components/dashboard/DashboardWithOnboarding.tsx` - Wrapper for banner
- `apps/web/src/components/onboarding/SetupProgressBanner.tsx` - The checklist UI
- `apps/web/src/lib/onboarding/tasks.client.ts` - Task definitions (client-safe)
- `apps/web/src/lib/onboarding/tasks.server.ts` - Task completion checks (server-side)

**Sections:**

**1. Greeting with Inline Tip**

```
"Good Morning, Alex"
"Here's what's happening with your business today"
```

Plus an inline AI tip on the right (visible on xl screens):

```
✨ Tip: Encourage your team this week  [Next →]
```

**2. Stat Cards** (4 across)

- **Revenue Today**
  - Amount
  - % vs yesterday
  - Icon: Dollar sign (orange)
- **Active Jobs**
  - Count
  - Change from last week
  - Icon: Briefcase
- **New Leads**
  - Count
  - % this month
  - Icon: Contact mail
- **Overdue Invoices**
  - Count
  - Total amount
  - Icon: Hourglass

**3. Charts** (2 columns)

- **Monthly Revenue Trends** (large, left, lg:col-span-4)
  - Line chart (Recharts)
  - Last 6 months actual data from `/api/dashboard/revenue`
  - Tabbed view: This Week, This Month, 6-Month View, Forecast (AI - Coming Soon)
  - Button: "View Report"
- **Top Services** (smaller, right, lg:col-span-3)
  - Dual visualization: Pie chart + Bar chart
  - Data from `/api/dashboard/services`
  - Pie chart shows service distribution by job count
  - Bar chart shows average revenue per service
  - Center text displays total jobs

**Note:** Maksy Intel insights are accessible via the TopBar button (purple gradient), not displayed on the dashboard for a cleaner first impression.

**Card Interactions:**

- All cards use `glass-card` styling for consistency
- Stat cards have NO hover shadow or cursor-pointer (not interactive)
- Subtle transitions preserved for button hovers only

**4. Performance Metrics Row** (5 cards)

- Data from `/api/dashboard/metrics`
- **Avg Duration**: Average job duration in hours/minutes
- **Completion**: Job completion rate percentage
- **Jobs This Month**: Total jobs this month
- **Revenue/Job**: Average revenue per job
- **Daily Revenue**: Average daily revenue

**7. Upcoming Appointments** (card with table)

- Data from `/api/dashboard/upcoming`
- Shows next 7 days of scheduled jobs
- Each row displays:
  - Customer avatar (initials)
  - Customer name
  - Service name
  - Date & Time (formatted)
  - Assigned technician
  - Status badge (scheduled/confirmed/in_progress)
- Click row → Job detail
- "View All" button links to Jobs page
- Empty state shown when no upcoming appointments

**8. Activity Feed** (sidebar, optional)

- Data from `/api/dashboard/activity`
- Recent events:
  - "New customer acquired: John Doe"
  - "Job completed by Mike"
  - "Invoice paid: $450"
- Real-time updates (via Supabase Realtime)

**9. Business Tips** (bottom)

- Maksy AI-generated tips
  - "Encourage your team this week"
  - "Follow up with Jane—hasn't booked in 6 months"
- Refresh weekly

---

### 7. Calendar (`/calendar`)

**Purpose:** Visual schedule management

**Views:**

- Day
- Week (default)
- Month

**View Toggle:** Buttons at top-right

**Week View:**

- 7 columns (days)
- Time slots (30min intervals, 6am-10pm)
- Jobs displayed as colored blocks
- Team member names on blocks
- Hover: Quick preview
- Click: Job detail modal

**Month View:**

- Calendar grid
- Dots/counts for jobs per day
- Click day → Day view

**Day View:**

- Single column
- Detailed timeline
- Precise times & durations
- All job details visible

**Actions:**

- **+ Icon on each day**
  - Opens popup menu
  - Tabs: "Add Job" | "Add Task" | "Add Meeting"
- **Add Job Form:**
  - Customer (searchable dropdown)
  - Service (dropdown)
  - Date & Time (with suggested time)
  - Duration (auto-filled from service)
  - Team member (dropdown)
  - Recurring? (checkbox → settings)
  - Notes (textarea)
  - **Maksy Team guard:** Jobs feature is hidden for Team plan users (team management focused).
- **Add Task:**
  - Title
  - Assigned to
  - Due date
  - Priority
- **Add Meeting:**
  - Title
  - Attendees (multi-select team)
  - Duration
  - Location (online/in-person)
  - Meeting link (if online)

**AI Features:**

- **"Optimize Week" button**
  - Maksy analyzes schedule
  - Suggests route optimizations
  - Proposes moving jobs to minimize drive time
  - User reviews & approves changes

**Drag & Drop:**

- Move jobs between days/times
- Resize to change duration
- Shows conflicts in red

---

### 8. Jobs (`/jobs`)

**Purpose:** Manage all service appointments

**Layout:** Vertical list (table view)

**Filters (top):**

- Search bar (customer, service, notes)
- Date range picker
- Service dropdown
- Status dropdown
- Team member dropdown
- "Clear Filters" button

**Columns:**

- Customer Name (linked to profile)
- Service
- Date & Time
- Team Member (with avatar)
- Status Badge
- Actions (⋮ menu)

**Status Options:**

- Scheduled (blue)
- Confirmed (green)
- In Progress (orange)
- Completed (gray)
- Cancelled (red)

**Actions Menu (⋮):**

- View Details
- Edit Job
- Duplicate
- Cancel Job
- Delete

**"+ Add Job" Button (top-right):**

- Opens modal with form (same as calendar)

**Job Detail View** (`/jobs/[id]`):

**Layout:** Full page or side panel

**Sections:**

1. **Header**
   - Customer name (linked)
   - Service name
   - Date & Time
   - Status badge

2. **Job Details**
   - Service details
   - Duration
   - Team member assigned
   - Location (map integration future)
   - Notes

3. **Action Buttons:**
   - **"On My Way"**
     - Sends SMS to customer: "We're on our way! ETA: XX minutes"
     - Starts GPS tracking (Pro/Scale)
     - Updates status → In Progress
   - **"Start Job"**
     - Sends SMS: "We've started your [service]! Should be done in XX minutes"
     - Records start time
   - **"Finish Job"**
     - Sends SMS: "Your [service] is complete! How did we do?"
     - Records completion time
     - Triggers review request automation
     - Updates status → Completed
   - **"Collect Payment / Send Invoice"**
     - Available on Pro/Scale plans.
     - Opens payment modal
     - Options: Cash, Card (Stripe), Send Invoice
     - If card: Stripe Elements
     - Updates job payment status

4. **Customer Info** (sidebar)
   - Name, phone, email
   - Address
   - Past jobs count
   - Link to customer profile

5. **Timeline** (if job started)
   - Created at
   - Confirmed at
   - Started at (with GPS location)
   - Completed at
   - Duration

6. **Job Media (Pro/Scale)**
   - Upload "Before" and "After" image sets
   - Accepts multiple photos per stage (drag/drop or mobile camera capture)
   - Displays side-by-side comparison with annotations
   - Supports customer share link (Scale adds branded gallery)
   - Files stored in Supabase Storage with signed URLs and job_id metadata

**Recurring Jobs:**

- Checkbox on job form: "Recurring"
- Opens settings:
  - Frequency: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Yearly
  - Repeat until: [date] or Never
  - Which team member
- Creates series of jobs in database
- Edit one: "Edit this instance" or "Edit all future"

---

### 9. Tasks (`/tasks`)

**Purpose:** To-do list for team

**Layout:** Kanban or list view toggle

**List View (default):**

**Sections:**

1. **Incomplete Tasks** (top)
   - Checkbox, Title, Assigned To, Due Date, Priority
   - Click to expand details
   - Drag to reorder

2. **Completed Tasks** (bottom, collapsible)
   - Grayed out
   - Completion date shown

**"+ Add Task" Button:**

**Form:**

- Title (required)
- Description (textarea)
- Assigned to (dropdown: team members + self)
- Due date (date picker)
- Priority (Low, Medium, High)
- Link to customer (optional)
- Link to job (optional)
- Reminder settings:
  - Toggle: Enable reminders
  - Frequency: Daily, Weekly
  - Notification type: Push, SMS, Email

**Plan-specific behavior:**

- Pro: Unlimited tasks with reminders.
- Scale: Unlimited tasks plus automation triggers (e.g., auto-create tasks from AI or workflows).
- Team: Unlimited tasks (core feature for team management).

**Task Detail Modal:**

- All fields above
- Comments section (team discussion)
- Activity log
- "Mark Complete" button

**Kanban View:**

- Columns: To Do, In Progress, Done
- Drag tasks between columns
- Cards show: Title, Assignee, Due date

---

### 10. Services (`/services`)

**Purpose:** Service catalog management

**Layout:** Grid view with categories

**Structure:**

- **Categories** (collapsible sections)
  - Each category shows its services
  - Example categories:
    - HVAC Repair
    - HVAC Maintenance
    - HVAC Installation

**Service Card:**

- Service icon/image (circle or square crop)
- Service name
- Price
- Duration
- Public/Private toggle
- ⋮ Menu: Edit, Duplicate, Share, Delete

**"+ Add Service" Button:**

**Form:**

- Service Name (required)
- Category (dropdown + quick add category)
- Price (number, $ auto-prepend)
- Duration (hours/minutes)
- Description (textarea)
- **Color Picker** - Select color for charts/reports (default: #f4a125)
  - Color swatch preview
  - Common preset colors shown (blue, green, purple, amber, red, etc.)
  - Custom hex input option
  - Used for dashboard charts, service labels, and visual identification
- Icon/Image upload
  - Max size: 2MB
  - Crop options: Circle, Square (rounded)
- Public/Private toggle
  - Public: Shows on booking page
  - Private: Internal only
- **Add-ons section** (Pro/Scale)
  - Add additional services to upsell
  - Each add-on has:
    - Name
    - Price
    - Duration
  - "+ Add Another Add-on" button

**Share Link:**

- Each service gets unique URL:
  - `maksy.ai/booking/[company]/service/[service-id]`
- Direct link to book that service
- Share via SMS, email, social

**Service Detail** (`/services/[id]`):

- Full details
- Usage stats:
  - Times booked this month
  - Total revenue
  - Average rating (if reviews collected)
- Recent jobs using this service

---

### 10a. Inventory (`/inventory`)

**Purpose:** Track tools, chemicals, vehicles, consumables, and any other resources that need stock control.

**Plan Access:**

- Pro: Basic inventory, bulk import/export, job consumption integration, low-stock email alerts.
- Scale: Advanced analytics, vendor tracking, storage-location tagging, predictive restock suggestions.
- Team: Not available (service business feature).

**Layout:**

1. **Toolbar**
   - Search bar (accepts name, SKU, category)
   - Filters: Category, Stock status (In Stock, Low, Out), Location tag (Scale)
   - Bulk actions: Adjust quantity, Archive, Export CSV
   - "Add Item" button (opens modal)

2. **Inventory Table**
   - Columns: Item, Category, Quantity on Hand, Reserved/Allocated (Scale), Unit Cost, Reorder Point, Vendor, Last Updated, Attachments icon
   - Low stock items flagged with warning badge
   - Row click opens item drawer

3. **Item Drawer**
   - Overview: Description, SKU, Category, Preferred Vendor, Unit Cost, Notes
   - Stock controls: Adjust quantity (+/-), Transfer between locations (Scale)
   - Reorder settings: Reorder point, Target quantity, Lead time
   - Attachments: upload receipts, manuals, safety sheets (images/PDF)
   - Activity feed: manual adjustments, auto-decrements from jobs, comments

4. **"Add Item" Modal**
   - Fields: Name\*, SKU, Category (create inline), Unit cost, Quantity, Reorder point, Location (Scale), Notes
   - Upload item photo/documents (drag & drop, max 5 files 10MB each)
   - Toggle: "Track consumption on jobs" → prompts for default quantity decrement when selected during job completion (Pro/Scale)

**Integration with Jobs:**

- Pro: On job completion modal, add "Inventory Used" section allowing selection of items and quantities. Decrements stock and logs to item activity.
- Scale: Option to enforce required inventory for specific services (pre-populated list in job form).
- Team: Not applicable (no jobs feature).

**Notifications:**

- Pro: Email + in-app alert when quantity ≤ reorder point.
- Scale: Email/SMS notifications plus predictive suggestions (based on last 30 days usage) and automation triggers (e.g., create task to reorder).

**Reporting & Export:**

- CSV import template download and validated upload (all plans).
- CSV export for current inventory (all plans) and PDF/Excel inventory valuation (Scale).
- Inventory usage report (Scale) showing consumption per service/team.

**Permissions:** Admins manage everything; team members (Pro/Scale) can view inventory and perform job consumption but cannot adjust counts unless granted permission.

---

### 11. Customers (`/customers`)

**Purpose:** CRM and contact management

**Layout:** Table view with search/filters

**Filters:**

- Search (name, email, phone)
- Date added range
- Tags (if implemented)
- Sort: Name (A-Z), Recent, LTV (High-Low)

**Columns:**

- Name (with avatar or initials)
- Email
- Phone
- Address
- Jobs Count
- LTV (Lifetime Value)
- Last Booking
- Actions (⋮)

**"+ Add Customer" Button:**

**Form:**

- First Name (required)
- Last Name (required)
- Email (required, validated)
- Phone (required, formatted)
- Company (optional)
- Address (Google Places autocomplete)
- **Custom Fields** (if configured in Settings)
  - Examples: Vehicle Make/Model, Lawn Size, Pool Type
  - Dynamic based on company settings

**Import CSV:**

- Button: "Import from CSV"
- File upload
- Maksy parses & shows preview table
- Map CSV columns → Customer fields
- Detect extra columns: "Create custom field?"
- Confirm → Import

**Customer Profile** (`/customers/[id]`):

**Sections:**

1. **Header**
   - Name, contact info
   - Edit button
   - Send message (SMS/Email)

2. **Details**
   - All customer fields
   - Tags
   - Notes (private, internal)

3. **Job History** (table)
   - All past jobs
   - Columns: Service, Date, Team Member, Status, Payment
   - Click → Job detail

4. **Invoices** (table)
   - All invoices sent to this customer
   - Status: Paid, Unpaid, Overdue

5. **Lifetime Value**
   - Total spent
   - Average job value
   - Jobs per year

6. **Activity Timeline**
   - Created date
   - Last booking
   - Communications sent
   - Notes added

**Actions:**

- Edit customer
- Send estimate
- Schedule job
- Delete customer (confirmation required)

---

### 12. Estimates (`/estimates`)

**Purpose:** Quote management and generation

**Layout:** List view

**Columns:**

- Estimate # (auto-generated)
- Customer
- Service(s)
- Total Amount
- Created Date
- Status (Draft, Sent, Approved, Declined)
- Actions (⋮)

**"+ Create Estimate" Button:**

**Form:**

- Customer (searchable dropdown or create new)
- Service(s) (multi-select)
  - Each service shows default price
  - Editable (custom pricing for this estimate)
  - Add-ons checkboxes
- Additional line items:
  - Description
  - Quantity
  - Price
  - "+ Add Line Item" button
- Subtotal (auto-calculated)
- Tax (% configurable in settings)
- Discount (optional, $ or %)
- Total
- Notes (customer-visible)
- Terms & Conditions (default from company settings)
- Expiration Date (optional)

**Actions:**

- Save as Draft
- Send to Customer (via email)
- Download PDF
- Convert to Invoice (if approved)

**AI-Powered Estimates (Pro only):**

- **Auto-Quote feature:**
  - Customer sends request via form or email
  - Maksy AI reads description
  - Looks at similar past jobs
  - Suggests services + pricing
  - User reviews & approves before sending

- **Training Box** (side panel):
  - Shows recent quotes
  - User can input actual costs/fees
  - Trains AI on pricing patterns
  - Improves suggestions over time

**Estimate Detail** (`/estimates/[id]`):

- Full preview (customer view)
- Actions:
  - Edit
  - Send Reminder
  - Mark as Approved/Declined
  - Convert to Invoice
  - Duplicate

---

### 13. Invoices (`/invoices`)

**Purpose:** Billing and payment tracking

**Plan Gate:**

- Pro/Scale: Full access to create, send, and automate invoices.
- Team: Not available (service business feature).

**Layout:** Table view

**Columns:**

- Invoice # (auto-generated)
- Customer
- Amount
- Issue Date
- Due Date
- Status (Paid, Unpaid, Overdue, Partially Paid)
- Actions (⋮)

**"+ New Invoice" Button:**

- Available on Pro/Scale plans.

**Options:**

1. **From Existing Job**
   - Select job from list
   - Auto-fills services, customer, amounts
   - Job linked to invoice

2. **From Scratch**
   - Manual entry (same fields as estimate)

**Invoice Form:**

- Customer (required)
- Invoice Date (default: today)
- Due Date (default: +30 days)
- Line Items:
  - Service/Description
  - Quantity
  - Rate
  - Amount
  - "+ Add Item" button
- Subtotal
- Tax
- Discount
- Total
- Payment Terms (Net 30, Due on Receipt, etc.)
- Notes

**Payment Options:**

- Mark as Paid (manual: cash, check)
- Send Payment Link (Stripe)
- Record Partial Payment

**Invoice Detail** (`/invoices/[id]`):

- Customer preview (how they see it)
- Payment status
- Payment history (if partial payments)
- Send options:
  - Email
  - SMS with link
  - Download PDF
- If unpaid & overdue: "Send Reminder" button

**Auto-Invoice from Job:**

- When job marked complete
- Option: "Generate & Send Invoice"
- Pre-filled from job details
- One-click send

---

### 14. Time & GPS (`/time-gps`)

**Purpose:** Track team members in the field

**Access:** Pro/Scale plans only (Team plan has GPS-less tracking)

**Layout:** Map + List

**Map View (left, large):**

- Live map (Google Maps or Mapbox)
- Pins for team members currently "On The Way"
- Click pin → Team member details

**Team List (right sidebar):**

- Each team member card shows:
  - Name + avatar
  - Current status:
    - Available (gray)
    - On The Way (orange) - shows ETA
    - At Job (green) - shows timer
    - Finished (blue)
  - Current/next job details

**Team Member Detail:**

- Job they're on
- Route taken (if GPS tracked)
- Time metrics:
  - Time to arrive
  - Miles driven
  - Job duration
  - Clock-in/out (if enabled)

**Settings:**

- Enable "Clock In/Out" feature
  - Team members clock in at start of day
  - Clock out at end
  - Tracks total hours worked

**Reports:**

- Mileage per team member (for reimbursement)
- Average job completion time
- On-time arrival rate

---

### 15. Automations (`/automations`)

**Purpose:** Workflow automation builder

**Layout:** Two sections

**Section 1: Stock Automations** (available on Pro & Scale)

**List of Pre-built Automations:**

1. **Appointment Reminder**
   - Trigger: Job scheduled
   - Action: Send SMS X hours before
   - Configuration: Edit message template, timing

2. **Booking Confirmation**
   - Trigger: Customer books via booking page
   - Action: Send confirmation SMS/Email
   - Configuration: Edit message

3. **Review Request**
   - Trigger: Job marked complete
   - Action: Send SMS with review link
   - Configuration: Edit message, delay timing

4. **Assignment Notice**
   - Trigger: Team member assigned to job
   - Action: Send notification (push/SMS)
   - Configuration: Edit message

5. **Payment Reminder**
   - Trigger: Invoice overdue
   - Action: Send reminder SMS/Email
   - Configuration: Frequency, message

**Each Stock Automation:**

- On/Off toggle
- "Configure" button → Opens modal:
  - Message template editor
  - Token picker (dropdown):
    - {{Customer_FirstName}}
    - {{Customer_LastName}}
    - {{Service_Name}}
    - {{Job_Date}}
    - {{Job_Time}}
    - {{Team_Member_Name}}
    - {{Company_Name}}
    - {{Company_Phone}}
    - Custom tokens from customer fields
  - Copy token button
  - Preview pane

**Node View (when configuring):**

- Shows automation flow
- First node (locked): Trigger
- Middle nodes: Actions
- Last node (locked): End
- Cannot add/remove nodes on stock automations
- Can only edit messages

---

**Section 2: Custom Automations** (Pro only)

**"+ Create Automation" Button:**

**Node Builder:**

- Drag-and-drop interface (guard-railed)
- **Available Trigger Nodes:**
  - Job Created
  - Job Completed
  - Job Cancelled
  - Customer Added
  - Invoice Sent
  - Invoice Paid
  - Invoice Overdue
  - Estimate Approved
  - Review Left
  - Form Submitted

- **Available Action Nodes:**
  - Send SMS
  - Send Email
  - Create Task
  - Send Notification (push)
  - Delay (wait X time)
  - Conditional (if/then)
  - Update Job Status
  - Add Tag to Customer

- **Node Configuration:**
  - Each node has settings panel
  - SMS/Email nodes: Message template + tokens
  - Delay nodes: Duration
  - Conditional nodes: Field, Operator, Value

**Example Custom Automation:**

```
[Trigger: Invoice Overdue]
  ↓
[Delay: 3 days]
  ↓
[Send SMS: Reminder message]
  ↓
[Conditional: Still unpaid?]
  ├─ Yes → [Create Task: Follow up call]
  └─ No → [End]
```

**Limits:**

- Max 10 nodes per automation
- Max 3 conditional branches
- Max 5 custom automations per account

**Legal Notice (bottom of page):**

- _"Ensure your Terms & Privacy Policy include SMS opt-in compliance. Maksy is not liable for misuse."_

---

### 16. Settings Hub (`/settings`)

**Layout:** Left sidebar (sub-navigation) + Main content area

**Sidebar Links:**

- Profile
- Company
- Team
- Booking Page
- Ask Maksy
- Customer Fields
- Forms
- Coupons
- Integrations
- Notifications
- Reports
- Security
- Plan & Billing

---

#### 16a. Settings > Profile (`/settings/profile`)

**Purpose:** Personal user account info

**Sections:**

1. **Account Details**
   - Full Name
   - Email (login email)
     - Show "Change Email" button → Requires email verification
   - Phone
   - Profile Photo Upload
   - Time Zone

2. **Password**
   - Current password (hidden)
   - "Reset Password" button
     - Sends reset email
     - Or inline form:
       - Current password
       - New password
       - Confirm new password

3. **Preferences**
   - Language (English, Spanish, etc.)
   - Date Format (MM/DD/YYYY, DD/MM/YYYY)
   - Time Format (12hr, 24hr)
   - Week Starts On (Sunday, Monday)

**Save Button** (bottom)

---

#### 16b. Settings > Company (`/settings/company`)

**Purpose:** Business information

**Sections:**

1. **Business Details**
   - Company Name
   - Industry (dropdown)
   - Business Phone
   - Business Email
   - Website URL
   - Address (Google Places autocomplete)

2. **Branding**
   - Logo Upload
     - Max 2MB
     - Recommended: 500x500px
     - Used on booking page, invoices
   - Cover Photo Upload
     - Max 5MB
     - Recommended: 1920x600px
     - Used on booking page

3. **Legal & Policies**
   - Terms of Service URL
   - Privacy Policy URL
   - Help/Support Email

4. **Social Media**
   - Facebook URL
   - Instagram URL
   - Twitter/X URL
   - LinkedIn URL
   - Google Business Profile (integrated)

**Save Button**

---

#### 16c. Settings > Team (`/settings/team`)

**Purpose:** Manage team members and invitations

**Access:** Pro/Scale only

**Layout:** Table + Invite button

**Table Columns:**

- Photo/Avatar
- Name
- Email
- Role (Admin, Team Member)
- Status (Active, Pending Invitation)
- Pay Rate/Commission (Pro only)
- Actions (⋮)

**"+ Invite Team Member" Button:**

**Form:**

- First Name (required)
- Email (required)
- Role (Admin or Team Member)
  - Admin: Full dashboard access
  - Team Member: Mobile app only (restricted)

**Actions:**

- Click "Send Invite"
- Email sent from `noreply@maksy.ai`
- Email contains:
  - "You've been invited to join [Company] on Maksy"
  - CTA: "Accept Invitation" (link)
  - Link → `/team/join?token=[unique]`

**Team Join Flow:**

- Team member clicks link
- Lands on signup page
- Fills in:
  - Full Name
  - Phone Number
  - Personal Address (for payroll if Pro)
  - Password (if not using SSO)
- Submits → Account created
- Redirect: "Download the Maksy mobile app"
- iOS App Store link

**Team Member Detail (click row):**

- Edit role
- Edit availability (calendar of working days/hours)
- Edit pay (Pro only):
  - Commission per completed job (%)
  - Hourly rate ($)
  - Salary (optional)
- Deactivate/Remove team member

**Availability Settings:**

- Weekly schedule grid
- Check boxes for days/times available
- Used for booking page availability
- Used for job assignment suggestions

---

#### 16d. Settings > Booking Page (`/settings/booking`)

**Purpose:** Configure public booking page

**Layout:** Split screen

**Left: Live Preview**

- Shows real-time preview of booking page
- Updates as user edits settings

**Right: Editor Panel**

**Sections:**

**1. Booking Flow Settings**

- ☑ Enable double booking (if >= 2 team members)
- ☑ Allow team member selection (customer chooses)
- ☑ Show add-on services
- ☑ Show service prices
- ☑ Show service descriptions

**2. Booking Preferences**

- Lead time needed (e.g., 2 hours, 1 day)
  - "Customers must book at least X in advance"
- Booking slot size (15min, 30min, 1hr)
- Scheduling window (how far in advance can book)
  - 7 days, 30 days, 60 days, 90 days
- Cancellation policy
  - Allow cancellations up to X before appointment
  - No cancellations allowed
- Reschedule policy (same as above)

**3. Contact Form Fields**

- Checkboxes to enable/disable default fields:
  - ☑ Name (required, locked)
  - ☑ Email (required, locked)
  - ☑ Phone (required, locked)
  - ☑ Address
  - ☑ Notes
- Custom fields (from Customer Fields settings)
  - Toggle which ones appear on booking form

**4. Appearance**

- Primary Color (color picker)
- Button Color (color picker)
- Font (dropdown: default, sans-serif, serif)
- Upload cover photo (hero image)
- Upload logo

**5. Language & Format**

- Language (English, Spanish)
- Time format (12hr, 24hr)
- Week starts on (Sunday, Monday)

**6. Advanced (Pro & Scale only)**

- Remove Maksy branding (toggle)
- Custom booking slug controls
  - All plans: `maksy.ai/[custom-slug]` (editable with live availability check)
    - Input field with live validation
    - Shows green checkmark if available, red X if taken
    - API call: `GET /api/slugs/check?slug=[value]`
    - Min 3 chars, max 50 chars
    - Allows lowercase letters, numbers, hyphens only
    - Cannot start/end with hyphen
- Optional embed widget (copy/paste `<iframe>` code into a website)
  - Toggle to enable/disable
  - Regenerate embed snippet button
  - Note: uses same Maksy-hosted page inside iframe (no custom domains)

**Save Button** (bottom)

---

#### 16e. Settings > Ask Maksy (`/settings/ask-maksy`)

**Purpose:** Configure Maksy AI and monitor daily request usage

**Sections:**

**1. Usage Summary (Prominent Card)**

- Large card at the top showing plan-specific counters:
  - Pro: "Requests used today: 18 / 30" with subtext "Resets at midnight"
  - Scale: "Requests used today: 24 / 50 (Advanced GPT)"
  - Team: "Requests used today: 15 / 25"
- Status chip: Green (<70%), Yellow (70-99%), Red (limit reached)
- If limit reached:
  - Pro: Banner "You've used all Maksy AI requests for today" + CTA "Upgrade to Scale for advanced insights"
  - Scale: Banner "You've used all Maksy AI requests for today" with tips on scheduling advanced reports
  - Team: Banner "You've used all Maksy AI requests for today"

**2. Recent Activity (Expandable List)**

- Collapsible list showing the last 10 AI requests for context
  - Timestamp | Request preview | Outcome (success/error) | Counter impact (e.g., "Daily +1")
- "View full history" button opens modal with pagination (no exports required in MVP)
- Admin-only controls:
  - "Reset today's counter" (Pro/Scale/Team)

**3. Data Access Consent**

- Explanation:
  - "Maksy AI needs access to your data to help you"
  - "We analyze jobs, customers, revenue to provide insights"
  - "Your data is never shared with third parties"
- Checkbox: "I agree to allow Maksy AI to access my business data"
  - Required to use AI features

**4. AI Preferences**

- ☑ Auto-greet on login ("How can I help today?")
- ☑ Proactive tips (weekly business suggestions)
- ☑ Allow Maksy to suggest optimizations

**5. Import Historical Data (Pro & Scale)**

- Upload existing reports/data
- File types: CSV, XLSX, PDF
- Maksy extracts data and adds to database
- Use case: Migrating from another system

**6. Notifications**

- ☑ Notify me when I'm within 5 requests of the limit (daily or lifetime)
- ☑ Notify me when the limit is reached (in-app + email)
- ☑ Daily AI usage summary email (admins only, Pro/Scale)

---

#### 16f. Settings > Customer Fields (`/settings/fields`)

**Purpose:** Manage custom customer data fields

**Layout:** Two panels

**Left: Field Manager**

- List of all custom fields
- Each field shows:
  - Field Name
  - Field Type (Text, Number, Dropdown, Date)
  - Token (e.g., {{Customer_VehicleMake}})
  - Actions: Edit, Delete

**"+ Add Custom Field" Button:**

**Form:**

- Field Label (e.g., "Vehicle Make & Model")
- Field Type (dropdown):
  - Text (single line)
  - Text Area (multi-line)
  - Number
  - Dropdown (provide options)
  - Date
  - Checkbox
- Required? (toggle)
- Show on booking page? (toggle)

**Right: Token Reference**

- Shows all available tokens:
  - **Customer Tokens:**
    - {{Customer_FirstName}}
    - {{Customer_LastName}}
    - {{Customer_Email}}
    - {{Customer_Phone}}
    - {{Customer_Address}}
    - {{Customer_Company}}
  - **Custom Tokens** (from fields added):
    - {{Customer_VehicleMake}}
    - {{Customer_LawnSize}}
    - (etc.)
  - **Job Tokens:**
    - {{Job_Service}}
    - {{Job_Date}}
    - {{Job_Time}}
    - {{Job_Duration}}
  - **Company Tokens:**
    - {{Company_Name}}
    - {{Company_Phone}}
    - {{Company_Email}}
    - {{Company_Address}}
    - {{Company_GoogleReviewLink}}

- Each token has "Copy" button

**Usage:**

- These tokens are used in automations, email templates, SMS messages, invoices, etc.

---

#### 16g. Settings > Forms (`/settings/forms`)

**Purpose:** Create custom forms for lead capture

**Access:**

- Pro: 1 custom form
- Scale: Unlimited forms
- Team: 1 custom form

**Layout:** List of forms + preview

**Form List:**

- Form Name
- Submissions Count
- Embed Code button
- Preview button
- Edit/Delete

**Pre-built Form (included):**

- "Get a Quote" form
  - Fields: Name, Email, Phone, Service interested in, Message
  - Submissions go to Estimates page

**"+ Create Form" Button:**

**Form Builder:**

- Drag-and-drop fields:
  - Text Input
  - Email Input
  - Phone Input
  - Textarea
  - Dropdown
  - Checkbox
  - Radio Buttons
  - File Upload

- Each field configurable:
  - Label
  - Placeholder
  - Required?
  - Validation rules

**Form Settings:**

- Form Name (internal)
- Form Title (displayed to user)
- Description (optional)
- Submit Button Text
- Success Message
- Redirect URL (after submit, optional)
- Notification Email (where to send submissions)

**Save & Get Embed Code:**

- Generates unique form ID
- Provides `<script>` tag to embed
- Submissions appear in Estimates page (or new "Forms" inbox)

---

#### 16h. Settings > Coupons (`/settings/coupons`)

**Purpose:** Create discount codes

**Access:** Pro/Scale only

**Layout:** Table

**Columns:**

- Coupon Code
- Discount (%, $)
- Start Date
- End Date
- Total Uses / Limit
- Uses Per Customer
- Status (Active, Expired, Disabled)
- Actions (⋮)

**"+ Create Coupon" Button:**

**Form:**

- Coupon Code (required, uppercase)
  - Auto-generate option
- Coupon Title (internal, e.g., "Summer Sale")
- Discount Type:
  - Percentage (%)
  - Fixed Amount ($)
- Discount Value (number)
- Start Date (optional, defaults to today)
- End Date (optional, blank = no expiration)
- Usage Limits:
  - Total uses allowed (optional, blank = unlimited)
  - Uses per customer (1, 2, 3, unlimited)
- Restrictions:
  - Minimum order value ($)
  - Specific service(s) only (multi-select)
- Active? (toggle)

**Apply Coupon:**

- Used in invoicing or booking page
- Customer enters code at checkout
- System validates & applies discount

---

#### 16i. Settings > Integrations (`/settings/integrations`)

**Purpose:** Connect external services

**Layout:** Grid of integration cards

**Available Integrations:**

**1. Payment Processors**

- **Stripe** (recommended)
  - Connect/Disconnect button
  - Status: Connected / Not Connected
  - Shows account email if connected
  - OAuth flow to connect

- **Square**
  - Same as above
  - Alternative to Stripe

**2. Accounting**

- **QuickBooks**
  - Pro: Basic sync (invoices only)
  - Scale: Full sync (invoices, payments, customers)
  - Connect via OAuth

**3. Google Business**

- **Google Business Profile**
  - Goal: Add "Schedule Appointment" button on Google listing
  - Connect via OAuth
  - Instructions/setup guide

**4. Advertising (Pro only)**

- **Google Ads**
  - Connect ad account
  - Track ad spend & conversions
  - Maksy AI correlates ad data with bookings

- **Facebook/Meta Ads**
  - Same as Google Ads

**5. Coming Soon**

- Zapier
- Facebook/Instagram (organic posting)
- Mailchimp

**Each Integration Card:**

- Logo
- Description
- "Connect" button
- Required plan badge (if locked)

---

#### 16j. Settings > Notifications (`/settings/notifications`)

**Purpose:** Configure alert preferences

**Layout:** Toggle list

**Sections:**

**1. Notification Channels**

- ☑ Email notifications
- ☑ SMS notifications (if plan allows)
- ☑ Push notifications (browser/mobile)

**2. What to be notified about:**

**For Owner/Admin:**

- ☑ New customer booking
- ☑ Invoice paid
- ☑ Invoice overdue
- ☑ New estimate request
- ☑ Team member completes job
- ☑ Review received
- ☑ Low on available time slots

**For Team Members:**

- ☑ Assigned to new job
- ☑ Job reminder (X hours before)
- ☑ New task assigned
- ☑ Task due soon
- ☑ Schedule change

**3. Quiet Hours**

- Do Not Disturb from [time] to [time]
- Days: Weekdays, Weekends, Specific days

---

#### 16k. Settings > Reports (`/settings/reports`)

**Note:** Reports is also accessible from the main sidebar navigation for quick access. This settings page provides additional configuration options.

**Purpose:** Report configuration & data import

**Sections:**

**1. Report Preferences**

- Default date range (Last 7 days, 30 days, etc.)
- Include tax in revenue? (toggle)
- Show team member earnings? (Pro only)

**2. Upload Existing Data (Pro only)**

- Purpose: Import historical data from other systems
- File upload (CSV, XLSX, PDF)
- Maksy AI extracts data:
  - Past jobs
  - Revenue
  - Customers
  - Adds to database for analysis

**3. Scheduled Reports (future)**

- Email reports weekly/monthly
- Select which reports
- Recipients

---

#### 16l. Settings > Security (`/settings/security`)

**Purpose:** Account security

**Sections:**

**1. Two-Factor Authentication (2FA)**

- Toggle: Enable/Disable
- Setup flow:
  - QR code (authenticator app)
  - Backup codes (download)

**2. Database Backups**

- Toggle: Enable weekly backup emails
- Sends CSV export of all data to email
- On: Every Monday at 3am

**3. Login History**

- Table of recent logins:
  - Date/Time
  - IP Address
  - Device
  - Location (city, country)

**4. Active Sessions**

- List of devices currently logged in
- "Log out all other sessions" button

---

#### 16m. Settings > Plan & Billing (`/settings/billing`)

**Purpose:** Manage subscription

**Sections:**

**1. Current Plan**

- Plan name (Pro, Scale, Team)
- Price (monthly)
- Seat count (Team plan only)
- Next billing date
- Trial countdown (if applicable)

**2. Upgrade Options**

- If Pro → Show Scale card
- If Scale → Show "You're on Scale" success banner
- If Team → Show Pro/Scale upgrade options
- "Upgrade Now" buttons trigger Stripe Checkout or Portal

**3. Downgrade**

- No UI button
- Text: "To downgrade, contact support@maksy.ai"
- Reason: Prevent accidental data loss

**4. Payment Method**

- Card on file (last 4 digits)
- Expiry date
- "Update Payment Method" button
  - Opens Stripe Customer Portal

**5. Billing History**

- Table of invoices:
  - Date
  - Amount
  - Status
  - Download PDF

**6. Cancel Subscription**

- Link at bottom: "Cancel my subscription"
- Opens modal:
  - "Are you sure?"
  - Explain what happens (data kept 30 days, then deleted)
  - Feedback form: "Why are you cancelling?"
  - Confirm button

---

### 17. Contracts (`/contracts`)

**Purpose:** Create, send, track, and manage legally binding agreements

**Access:** Pro/Scale only (service business feature)

**Layout:** Table view with search/filters

**Filters:**

- Search (customer, contract title)
- Status (Draft, Pending, Signed, Active, Expired, Terminated)
- Date range (created, signed, expiration)
- Customer dropdown
- Contract type (Proposal, Service Agreement, Waiver, NDA, Custom)

**Columns:**

- Contract Title (clickable)
- Customer Name (with avatar)
- Type (badge)
- Status (colored badge)
- Value ($)
- Created Date
- Signed Date
- Expiration Date
- Actions (⋮)

**"+ New Contract" Button (Pro/Scale only):**
Opens contract editor

**Empty State (New Users):**

- Icon: 📝
- Heading: "Professional contracts & proposals"
- Description: "Create, send, and track legally binding agreements with e-signatures"
- CTA: "Create your first contract"

---

#### Contract Detail View (`/contracts/[id]`)

**Layout:** Two-column

**Left Column: Live Preview**

- PDF-style rendering
- Signature fields highlighted
- Download PDF button

**Right Column: Details & Actions**

**Section 1: Header**

- Contract Title (editable if draft)
- Status badge
- Customer (linked)
- Created by + date

**Section 2: Key Info**

- Contract Type: Dropdown
- Contract Value: $ input
- Start Date: Date picker
- End Date: Date picker
- Auto-Renew: Toggle
- Linked Job: Dropdown
- Linked Estimate: Dropdown

**Section 3: Signature Status**

- Your Signature: ✅ / ❌
- Customer Signature: ✅ / ⏳ / ❌
- Witness Signature: ✅ / ❌ (Scale only)

**Section 4: Actions**

- If Draft: Edit, Preview & Send
- If Pending: Resend, Copy Link, Cancel
- If Signed: Download PDF, Duplicate, Terminate (Pro/Scale)

**Section 5: Activity Timeline**

- Created, Edited, Sent, Viewed, Signed, Downloaded, Terminated

---

#### Contract Editor (`/contracts/[id]/edit` or `/contracts/new`)

**Rich Text Editor (Tiptap):**

- Text formatting, headings, lists, tables
- Insert image, signature field, merge fields
- AI Assist button (Pro/Scale)

**Merge Fields:**

- Customer: `{{Customer_FirstName}}`, `{{Customer_LastName}}`, etc.
- Company: `{{Company_Name}}`, `{{Company_Address}}`, etc.
- Contract: `{{Contract_StartDate}}`, `{{Contract_Value}}`, etc.
- Job/Service: `{{Job_Service}}`, `{{Job_Date}}`, etc.

**AI Assist (Pro/Scale):**

- Draft from Template
- Ask AI to Improve
- Generate from Estimate
- Compliance Check (Scale only)

**Signature Fields:**

- Insert draggable signature boxes
- Configure: Signer (Customer/Owner/Witness), Required, Type

---

#### Send Contract Modal

**Tab 1: Preview**

- Live preview with populated merge fields

**Tab 2: Delivery Options**

- Send via Email: Toggle + subject + message
- Send via SMS: Toggle + message (Pro/Scale)
- Copy Link: Clipboard button

**Tab 3: Options**

- Require signature: Toggle
- Notify me when: Checkboxes (viewed, signed, expired)
- Expiration: Date picker

---

#### Customer Signing Page (`/contracts/sign/[token]`)

**Public page (no login):**

- Company logo + "You've received a contract from {{Company_Name}}"
- Full contract preview (scrollable)
- Signature section:
  - Checkbox: "I have read and agree"
  - Signature field (draw or type)
  - Printed Name input
  - Date (auto-filled)
- "Sign & Submit" button
- Security: Unique token, IP logging, timestamp

---

#### Contract Templates Library

**Accessible via:** Settings → Contracts

**Pre-built Templates:**

- Basic Service Agreement
- Recurring Maintenance Contract
- Proposal Template
- Waiver/Release
- NDA

**User Templates (Pro/Scale):**

- Create, edit, duplicate, delete
- Max 3 custom templates (Pro), unlimited (Scale)

---

### 18. Documents (`/documents`)

**Purpose:** Centralized file management for all business documents

**Access:** All plans

**Layout:** Grid view (default) | List view

**Top Toolbar:**

- Search bar
- View toggle
- Filters: Type, Uploaded by, Linked to, Date, Tags
- Sort: Recent, A-Z, Size, Type
- "+ Upload Document" button
- "Create Folder" button

**Left Sidebar: Folder Tree**

```
📁 All Documents
├── 📁 Customers
├── 📁 Jobs
├── 📁 Invoices
├── 📁 Company Files
│   ├── 📁 Licenses & Permits
│   ├── 📁 Insurance
│   └── 📁 Training Manuals
├── 📁 Team Files
└── 📁 Uncategorized
```

---

#### Document Grid View

**Document Card:**

- Thumbnail (preview for images/PDFs, icon for others)
- Filename (truncated)
- File type badge
- File size
- Linked entity (Customer/Job/Invoice)
- Tags (colored badges)
- Uploaded by (avatar)
- Uploaded date
- Actions (⋮): View, Download, Share, Move, Edit Tags, Link, Delete

---

#### Document Detail View (`/documents/[id]`)

**Layout:** Three-column

**Left: Preview**

- Images: Zoomable viewer
- PDFs: Embedded reader
- Videos: Player (Scale only)
- Others: "No preview, download to view"

**Middle: Details**

- File Info: Filename (editable), type, size, uploaded by
- Organization: Folder (dropdown), Tags (multi-select), Linked Entities (dropdowns)
- Sharing: Public Link toggle, expiration, password, shared with team
- Version History (Pro/Scale): Previous versions, restore

**Right: Activity & Comments**

- Activity Timeline: Uploaded, renamed, moved, shared, downloaded
- Comments (Pro/Scale): Team discussion, threaded replies

---

#### Upload Document Modal

**Tab 1: Upload Files**

- Drag & drop zone
- Multiple files supported
- Max: 50MB (Pro/Team), 100MB (Scale)
- Folder: Dropdown

**Tab 2: Details**

- Tags: Multi-select
- Link to Entity: Customer/Job/Invoice dropdowns
- Notes: Textarea

---

#### Public Document Sharing (`/share/documents/[token]`)

**Public page (no login):**

- Document preview (if supported)
- Filename, type, size
- Download button
- Optional: Password protection
- Security: Unique token, expiration, IP logging

---

#### AI-Powered Features (Pro/Scale)

**1. Auto-Tagging (Pro/Scale):**

- AI analyzes filename + content, suggests tags

**2. OCR & Text Extraction (Pro/Scale):**

- Extracts text from image-based PDFs
- Makes searchable by content

**3. Smart Linking (Scale):**

- AI detects customer names, job numbers
- Auto-links to entities

**4. Document Compliance Check (Scale):**

- Checks expiration dates on licenses/insurance
- Sends reminders 30 days before expiration

---

## PUBLIC BOOKING PAGE

### 19. Booking Page (`/booking/[company]`)

**Purpose:** Customer-facing booking portal

**URL Examples:**

- Pro: `maksy.ai/custom-name`
- Scale: `maksy.ai/custom-name` (with advanced styling options)
- Team: Not available (service business feature)

**Layout:** Multi-step flow (single page, progressive reveal)

**Step 1: Service Selection**

**Hero Section:**

- Cover photo (from settings)
- Logo
- Company name
- Tagline (optional, from settings)

**Company Info (sidebar, always visible):**

- Phone number (click-to-call)
- Email
- Address
- Social links
- Hours of operation

**Service Grid:**

- Services organized by category
- Each service card:
  - Icon/Image
  - Service name
  - Price (if enabled in settings)
  - Duration
  - Description (if enabled)
  - "Book Now" button (on hover)

**Click "Book Now":**

- Service highlighted
- Form slides in from right

---

**Step 2: Add-ons & Team Selection** (optional, configurable)

**Add-ons (if enabled):**

- "Would you like to add any of these?"
- Checkbox list of add-ons for selected service
- Each shows: Name, Price, Duration
- "Add another service" link (goes back to Step 1)

**Team Member Selection (if enabled):**

- "Do you have a preferred team member?"
- Grid of team members (photos, names)
- "No Preference" option (default)

**"Continue" button** → Step 3

---

**Step 3: Date & Time Selection**

**Calendar:**

- Month view initially
- Only available dates are clickable
- Availability logic:
  - Check team member availability (from settings)
  - Check existing bookings (no double-booking unless enabled)
  - Respect lead time settings
  - Respect scheduling window (max days in advance)

**Time Slots (after date selected):**

- Shows available times for selected date
- Slots based on:
  - Booking slot size (15min, 30min, etc.)
  - Service duration
  - Team availability
- Click time → Selected

**"Continue" button** → Step 4

---

**Step 4: Customer Information**

**Form (right side):**

- First Name (required)
- Last Name (required)
- Email (required)
- Phone (required, formatted)
- Address (if enabled)
- **Custom fields** (if enabled on booking page settings)
  - E.g., "Vehicle Make & Model", "Lawn Size"
- Notes (textarea, optional)

**Legal:**

- Checkbox (required): "I agree to [Company Name]'s Terms of Service and Privacy Policy"
  - Links open in modal or new tab

**Summary (left side):**

- Selected service
- Add-ons (if any)
- Date & Time
- Duration
- Total price
- Team member (if selected)

**"Schedule Appointment" Button:**

- Submits booking
- Triggers:
  - Creates job in owner's system
  - Sends confirmation email/SMS to customer
  - Sends assignment notice to team member
  - Initiates automations (if configured)

---

**Step 5: Confirmation**

**Success message:**

- "You're all set!"
- Booking details recap
- "We'll send you a reminder before your appointment"
- "Add to Calendar" button (generates .ics file)

**What happens next:**

- Owner sees job in dashboard
- Customer receives confirmation
- Reminders sent per automation settings

---

## PUBLIC FORM PAGE

### 18. Custom Form (`/forms/[formId]`)

**Purpose:** Embedded or standalone lead capture

**Layout:** Simple form page

**Elements:**

- Form title (from settings)
- Form description
- Fields (configured in settings)
- Submit button
- Company branding (optional)

**Submission:**

- Saves to database
- Appears in Estimates or dedicated Forms inbox
- Sends notification to owner
- Triggers automation (if configured)

---

Next: Continue to [03-DATABASE_SCHEMA.md](03-DATABASE_SCHEMA.md) for complete database design.
