# GLOSSARY - Terms & Definitions

## Overview

This glossary defines all technical terms, business concepts, and Maksy-specific terminology used throughout the application and documentation.

---

## General Terms

### **Maksy**

The name of the application. An all-in-one scheduling, booking, CRM, and communications platform for service businesses.

### **Service Business**

A business that provides services (not physical products) to customers. Examples: HVAC, plumbing, landscaping, auto detailing, cleaning services.

### **CRM (Customer Relationship Management)**

Software for managing customer data, interactions, and relationships. In Maksy, this includes customer profiles, contact info, job history, and notes.

---

## User Roles

### **Owner**

The first user who created the company account. Has full access to everything, including billing and company deletion. Cannot be removed (only ownership can be transferred).

### **Admin**

A user with full access to app features but cannot manage billing or delete the company. Can be added by the Owner. Typically a manager or office staff member.

### **Team Member**

A field worker or technician with limited access. Can only view assigned jobs, update job status, and add notes. Cannot access settings, financials, or CRM. Typically accessed via mobile.

### **Customer**

An end-user who books services or receives services from the company. Not a user of the Maksy app itself (unless booking via public booking page).

---

## Company & Business Terms

### **Company**

A business entity in Maksy. Each company has one owner, optional team members, and customers. Data is isolated per company.

### **Industry**

The type of service business (e.g., HVAC, Plumbing, Landscaping). Selected during onboarding, used for AI insights and templates.

### **Slug**

A URL-safe version of the company name used for the public booking page. Example: "ABC Plumbing" → slug: `abc-plumbing` → URL: `maksy.ai/abc-plumbing`

### **Booking Page**

A public-facing page (no login required) where customers can browse services and book appointments. Customizable based on plan tier.

### **Inventory**

Centralized list of a company's tools, equipment, consumables, and other resources. Tracks quantity on hand, reorder point, vendor, cost, and attachments. Integrated with jobs (Pro/Scale) for automatic consumption logging.

---

## Services & Jobs

### **Service**

A type of work the company offers. Examples: "HVAC Inspection", "Lawn Mowing", "Carpet Cleaning". Has a name, price, duration, and optional add-ons.

### **Service Category**

A grouping of related services. Example category: "HVAC" → Services: "AC Repair", "Furnace Maintenance", "Duct Cleaning".

### **Add-On**

An optional extra service that can be added to a main service during booking or job creation. Example: "AC Repair" + Add-on: "Clean Air Filter (+$25)".

### **Job**

A scheduled service appointment with a customer. Includes date/time, assigned team member, service details, and status tracking (scheduled → in progress → completed).

### **Recurring Job**

A job that repeats on a schedule (weekly, monthly, etc.). Creates multiple job instances in the database.

### **Job Status**

The current state of a job:

- **Scheduled:** Future job, not yet started
- **In Progress:** Team member is en route or working
- **Completed:** Work finished, awaiting payment
- **Canceled:** Job canceled by customer or company
- **No Show:** Customer was not present at scheduled time

### **Job Tracking**

GPS and time tracking for jobs. Records when team member clicked "On My Way", "Start Job", "Finish Job", plus their location at each step.

### **Before/After Photos**

Media captured during job workflow to showcase work done. Available on Pro/Scale. Stored in `job_media` with `before`/`after` tags and displayed side-by-side in the job detail view.

---

## Tasks

### **Task**

A to-do item (not customer-facing). Can be assigned to team members or owner. Examples: "Call back prospect", "Order supplies", "Follow up on estimate".

### **Task Status**

- **Open:** Not yet started
- **In Progress:** Currently working on
- **Completed:** Done
- **Canceled:** No longer needed

### **Task Weekly Limit**

Starter-plan restriction that caps companies at three active task creations per ISO week. Enforced by the `task_usage_counters` table; resets every Monday in the company timezone. Pro/Scale plans do not have this limit.

---

## Financial Terms

### **Estimate (Quote)**

A proposed price for services before work begins. Customer can approve/reject. If approved, can be converted to a job.

### **Invoice**

A bill sent to a customer after work is completed (or before, for upfront payment). Contains line items, totals, tax, and payment instructions.

### **Line Item**

A single row on an invoice or estimate. Includes description, quantity, unit price, and total. Example: "AC Repair | Qty: 1 | $150"

### **Payment**

A transaction where money is received from a customer. Can be cash, check, credit card (via Stripe), or invoice payment.

### **Payment Method**

How payment was received:

- **Cash:** Physical cash
- **Check:** Paper check
- **Card:** Credit/debit card via Stripe
- **Invoice:** Payment sent online via Stripe link
- **Bank Transfer:** ACH or wire (future)

### **Payment Status**

- **Unpaid:** No payment received
- **Partially Paid:** Some payment received, balance remaining
- **Paid:** Full payment received
- **Refunded:** Payment returned to customer

### **LTV (Lifetime Value)**

Total revenue generated from a single customer across all jobs. Used for reporting and customer prioritization.

---

## Coupons & Discounts

### **Coupon**

A discount code customers can enter during booking or that admins can apply to invoices. Can be percentage-based or fixed amount.

### **Coupon Restrictions**

Limits on where a coupon can be used:

- Specific services only
- Minimum purchase amount
- Max number of uses
- Expiration date

---

## Automations

### **Automation**

A workflow that triggers automatically based on events. Example: "When job is completed → wait 30 min → send review request SMS"

### **Trigger**

The event that starts an automation. Examples: "Job completed", "Invoice overdue", "New customer added".

### **Action**

What happens when an automation triggers. Examples: "Send SMS", "Send email", "Create task", "Update job status".

### **Stock Automation**

Pre-built automation templates included with Pro & Scale plans. Messages can be customized, but workflow steps are fixed. Examples: appointment reminders, review requests.

### **Custom Automation**

(Scale plan only) User-created automation using the visual workflow builder. Can have multiple triggers, conditions, and actions.

---

## AI Usage Terms

### **Maksy AI**

The AI assistant built into Maksy. Starter users get a limited preview (15 lifetime requests). Pro and Scale users unlock full chat functionality to answer questions, extract data from uploads, create tasks/jobs, and provide business insights. Powered by OpenAI.

### **Daily Request Limit**

Maximum number of Maksy AI prompts a single user can send in a calendar day. Limits are plan-based (Pro 30/day, Scale 50/day). Once reached, the chat input locks until the counter resets at midnight.

### **Daily Reset**

Automatic reset of AI usage counters at midnight in the company's configured timezone. Implemented via the `prime-ai-usage-counters` background job.

### **Usage Summary Card**

UI component in Settings → Ask Maksy showing "Requests used today" with progress meter, reset time, and upgrade CTA when near the limit.

### **AI Limit Banner**

Banner displayed inside the chat window when the daily limit is reached. Reads "You've used all Maksy AI requests for today" and disables the composer.

### **AI Override**

Admin-only action (Pro/Scale) that resets a user's counter for the current day via `POST /api/settings/ai-usage/reset`. Logged in `audit_logs` for accountability.

### **Lifetime Preview Limit**

Starter-plan allowance of 15 total Maksy AI requests. Once exhausted, the chat composer locks and the user sees an upgrade prompt.

### **Advanced GPT Model**

Enhanced OpenAI model used for Scale plan requests, enabling deeper analysis, longer context windows, and higher-quality automation suggestions.

---

## Subscription & Billing

### **Plan (Subscription Tier)**

The pricing level a company is subscribed to:

- **Starter:** $0/month. Solo owner, 50 jobs/month cap, 3 tasks/week, 15 lifetime Maksy AI preview requests, basic inventory.
- **Pro:** $47/month. Up to 5 team members, Maksy AI (30 requests/day), invoices, automations (stock), inventory job consumption, before/after gallery.
- **Scale:** $97/month. Unlimited team, Maksy AI (50 requests/day via advanced GPT), automation builder, predictive inventory, advanced reports/support.

### **Trial Period**

14-day free trial for Pro and Scale. No credit card required to start; payment method must be added before the trial expires to continue on the paid plan.

### **Subscription Anniversary Date**

The day of the month when the subscription renews. Example: Signed up on Nov 15 → anniversary is 15th of every month.

### **Prorated Billing**

When upgrading mid-month, the user is charged a prorated amount for the remainder of the billing period. Example: Upgrade from Pro to Scale on day 15 of 30 → charged 50% of the price difference.

### **Feature Gate**

A restriction that blocks access to features based on plan tier. Example: Starter users see a lock icon 🔒 on AI features with "Upgrade to Pro" modal.

---

## Booking & Scheduling Terms

### **Lead Time**

Minimum time required before a booking. Example: "Lead time: 2 hours" means customers cannot book appointments starting within the next 2 hours.

### **Scheduling Window**

How far in advance customers can book. Example: "Scheduling window: 30 days" means customers can only book appointments up to 30 days from today.

### **Booking Slot Size**

The time increment for available booking times. Example: "30-minute slots" means available times are 10:00, 10:30, 11:00, etc.

### **Double Booking**

Allowing multiple jobs to be scheduled at the same time. Disabled by default (prevents conflicts). Can be enabled if company has multiple team members who can work simultaneously.

### **Team Member Selection**

Feature that allows customers to choose which team member they prefer when booking. Optional setting.

### **Availability**

Days/times when a team member can work. Set in Settings > Team > [Member] > Availability. Used to show only available slots on booking page.

---

## Communication Terms

### **SMS (Text Message)**

Text-based message sent via Twilio. Used for appointment reminders, confirmations, review requests.

### **Email**

Email message sent via Resend (planned) or SMTP. Used for invoices, receipts, team invitations.

### **Review Request**

Automated message sent after job completion asking customer to leave a review (typically on Google). Sent 30 minutes after job marked "Completed".

### **Appointment Reminder**

Automated SMS sent 24 hours before a scheduled job. Example: "Reminder: Your AC Repair appointment with ABC Plumbing is tomorrow at 2:00 PM."

---

## Technical Terms

### **RLS (Row Level Security)**

Supabase's security feature that restricts database access based on user authentication. Ensures users can only access data from their own company.

### **Middleware**

Code that runs before API routes to check authentication, permissions, and rate limits.

### **Webhook**

An HTTP callback that sends data to Maksy when an external event occurs. Example: Stripe sends a webhook when a payment succeeds.

### **Background Job (Inngest)**

A task that runs asynchronously (not during an API request). Examples: sending reminder SMS, priming AI usage counters, calculating daily metrics.

### **ORM (Object-Relational Mapping)**

Tool for interacting with databases using code instead of raw SQL. Maksy uses Drizzle ORM.

### **Migration**

A script that modifies the database schema (add tables, columns, indexes). Used to keep database structure in sync with code changes.

### **Soft Delete**

Marking a record as deleted (with a `deleted_at` timestamp) instead of permanently removing it. Allows data recovery and historical reporting.

### **UUID (Universally Unique Identifier)**

A 128-bit identifier used as primary keys in Maksy's database. Example: `550e8400-e29b-41d4-a716-446655440000`

### **JWT (JSON Web Token)**

Token used for authentication. Issued by Supabase Auth after login. Sent with every API request to verify user identity.

### **API Route**

Server-side endpoint that handles HTTP requests. Example: `POST /api/jobs` creates a new job. Maksy uses Next.js Route Handlers.

### **Protected Route**

A page or API endpoint that requires authentication. Redirects to login if user is not authenticated.

---

## UI/UX Terms

### **Glassmorphism**

A design style using frosted-glass effects (semi-transparent backgrounds with blur). Used throughout Maksy's UI for cards and panels.

### **Toast Notification**

A small popup message (success, error, info) that appears briefly (3-5 seconds) and auto-dismisses. Example: "Job created successfully ✓"

### **Modal**

A popup dialog that appears over the main content, requiring user interaction before proceeding. Example: "Are you sure you want to delete this customer?"

### **Progress Bar**

Visual indicator showing completion percentage. Used for AI credit usage, onboarding steps, file uploads.

### **Badge**

A small label showing status or count. Examples: "Pro" plan badge, "New" tag, "3" unread tasks badge.

### **Skeleton Loader**

Animated placeholder shown while content is loading. Example: Gray rectangles that pulse before customer list loads.

---

## Integrations

### **Stripe**

Payment processor used for subscription billing and customer payments. Handles credit card processing, invoicing, webhooks.

### **Supabase**

Backend platform providing PostgreSQL database, authentication, and file storage. Self-hosted alternative to Firebase.

### **Twilio**

SMS provider for sending text messages (reminders, confirmations, review requests).

### **OpenAI**

AI provider powering Maksy AI assistant. Uses GPT-4 for natural language processing and data extraction.

### **Inngest**

Background job processor for running scheduled tasks (cron jobs) and event-driven workflows.

### **Sentry**

Error monitoring and performance tracking. Captures exceptions and alerts developers.

### **Vercel**

Hosting platform for Next.js apps. Provides automatic deployments, edge functions, and analytics.

---

## Status & State Terms

### **Active**

Currently in use and available. Opposite of "Inactive" or "Canceled".

### **Pending**

Waiting for action or approval. Example: "Pending payment" means invoice sent but not yet paid.

### **Draft**

Saved but not sent/published. Example: Draft invoice can be edited before sending to customer.

### **Archived**

Hidden from main views but not deleted. Can be restored if needed.

### **Verified**

Confirmed as valid. Example: Verified custom domain means DNS is correctly configured and SSL cert issued.

---

## Metrics & Analytics

### **MRR (Monthly Recurring Revenue)**

Total predictable revenue per month from active subscriptions. Example: 100 customers × $47/month = $4,700 MRR (for Maksy).

### **Churn Rate**

Percentage of customers who cancel subscriptions per month. Lower is better.

### **ARPU (Average Revenue Per User)**

Total revenue ÷ number of customers. Measures how much each customer is worth on average.

### **Conversion Rate**

Percentage of visitors who complete a desired action. Example: Booking page conversion = (Bookings ÷ Page Views) × 100.

---

## Miscellaneous

### **Public URL**

A web address accessible without login. Examples: Booking page, public forms, review links.

### **Embed Code**

HTML/JavaScript snippet that can be pasted into a website to display Maksy content (e.g., booking widget).

### **CNAME Record**

DNS record that points one domain to another. Used for custom domain setup. Example: `booking.yourcompany.com` → `maksy-booking.vercel.app`

### **SSL Certificate**

Security certificate that enables HTTPS (encrypted connections). Automatically provisioned for custom domains.

### **CSV (Comma-Separated Values)**

File format for spreadsheets. Used for importing customers, exporting reports.

### **JSONB**

PostgreSQL data type for storing JSON (JavaScript Object Notation) documents. Used for flexible data like automation configs, custom field values.

---

## Common Abbreviations

- **AI:** Artificial Intelligence
- **API:** Application Programming Interface
- **CRM:** Customer Relationship Management
- **CSV:** Comma-Separated Values
- **DNS:** Domain Name System
- **ETA:** Estimated Time of Arrival
- **GPS:** Global Positioning System
- **HTTPS:** Hypertext Transfer Protocol Secure
- **JSON:** JavaScript Object Notation
- **JWT:** JSON Web Token
- **LTV:** Lifetime Value
- **MVP:** Minimum Viable Product
- **MRR:** Monthly Recurring Revenue
- **ORM:** Object-Relational Mapping
- **PWA:** Progressive Web App
- **RLS:** Row Level Security
- **SMS:** Short Message Service
- **SQL:** Structured Query Language
- **SSL:** Secure Sockets Layer
- **UI:** User Interface
- **URL:** Uniform Resource Locator
- **UX:** User Experience
- **UUID:** Universally Unique Identifier

---

## Maksy-Specific Terminology

### **On My Way**

Button/action where team member indicates they're en route to a job. Captures GPS location and sends ETA to customer.

### **Start Job**

Button/action to mark job as actively in progress. Captures arrival time and location.

### **Finish Job**

Button/action to mark job as completed. Captures completion time, calculates job duration, triggers post-job automations (review request, invoice generation).

### **Time & GPS Page**

Dashboard page showing real-time job status, team member locations, and time tracking data. Used for monitoring field operations.

### **Ask Maksy**

The AI chat interface. Named conversationally to make AI feel approachable. Alternative names considered: "Maksy Assistant", "AI Helper".

### **Booking Link**

The public URL for a company's booking page. Example: `maksy.ai/abc-plumbing`. Can be shared on social media, websites, business cards.

---

_Last Updated: November 5, 2025_  
_Version: 1.0_
