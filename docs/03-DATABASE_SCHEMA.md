# DATABASE SCHEMA - Complete Data Model

## Overview

**Database:** PostgreSQL (hosted on Supabase)  
**ORM:** Drizzle  
**Naming Convention:** `snake_case`  
**Timestamps:** All tables have `created_at` and `updated_at`

---

## Entity Relationship Diagram (Conceptual)

```
users (Supabase Auth)
  ├─ 1:1 → user_profiles
  ├─ 1:1 → company_settings
  └─ 1:N → team_memberships

companies
  ├─ 1:N → customers
  ├─ 1:N → services
  ├─ 1:N → service_categories
  ├─ 1:N → jobs
  ├─ 1:N → tasks
  ├─ 1:N → estimates
  ├─ 1:N → invoices
  ├─ 1:N → automations
  ├─ 1:N → custom_forms
  ├─ 1:N → coupons
  ├─ 1:N → custom_customer_fields
  └─ 1:N → team_members

customers
  ├─ 1:N → jobs
  ├─ 1:N → estimates
  ├─ 1:N → invoices
  └─ 1:N → customer_field_values

jobs
  ├─ N:1 → customers
  ├─ N:1 → services
  ├─ N:1 → team_members (assigned)
  ├─ 1:N → job_add_ons
  ├─ 1:1 → job_tracking (GPS/time)
  └─ 1:1 → invoices (optional)

services
  ├─ N:1 → service_categories
  └─ 1:N → service_add_ons

automations
  ├─ 1:N → automation_executions (log)

subscriptions
  ├─ 1:1 → companies
  └─ 1:N → subscription_invoices
```

---

## Tables

### 1. `users` (Supabase Auth - Read Only)

**Purpose:** Managed by Supabase Auth

**Columns:**

- `id` (uuid, PK)
- `email` (text)
- `encrypted_password` (text)
- `email_confirmed_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Note:** We reference this table but don't directly modify it

---

### 2. `user_profiles`

**Purpose:** Extended user information

**Columns:**

- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id, UNIQUE)
- `first_name` (text, NOT NULL)
- `last_name` (text, NOT NULL)
- `phone` (text)
- `avatar_url` (text)
- `time_zone` (text, default 'America/New_York')
- `language` (text, default 'en')
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_user_profiles_user_id` on `user_id`

**RLS (Row Level Security):**

- Users can only read/update their own profile

---

### 3. `companies`

**Purpose:** Business/organization data

**Columns:**

- `id` (uuid, PK)
- `owner_user_id` (uuid, FK → users.id, NOT NULL)
- `company_name` (text, NOT NULL)
- `industry` (text)
- `slug` (text, UNIQUE) - for booking page URL
- `business_phone` (text)
- `business_email` (text)
- `website_url` (text)
- `address_line1` (text)
- `address_line2` (text)
- `city` (text)
- `state` (text)
- `zip_code` (text)
- `country` (text, default 'US')
- `logo_url` (text)
- `cover_photo_url` (text)
- `terms_url` (text)
- `privacy_url` (text)
- `support_email` (text)
- `google_review_link` (text)
- `facebook_url` (text)
- `instagram_url` (text)
- `twitter_url` (text)
- `linkedin_url` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_companies_owner` on `owner_user_id`
- `idx_companies_slug` on `slug` (UNIQUE)

**Constraints:**

- `slug` must be lowercase, alphanumeric + hyphens only

---

### 4. `company_settings`

**Purpose:** Configuration for each company

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, UNIQUE)
- `date_format` (text, default 'MM/DD/YYYY')
- `time_format` (text, default '12h') - '12h' or '24h'
- `week_starts_on` (text, default 'sunday')
- `currency` (text, default 'USD')
- `tax_rate` (decimal)
- `default_invoice_terms` (text)
- `enable_double_booking` (boolean, default false)
- `booking_lead_time_hours` (integer, default 2)
- `booking_slot_size_minutes` (integer, default 30)
- `scheduling_window_days` (integer, default 30)
- `cancellation_hours_before` (integer, default 24)
- `enable_gps_tracking` (boolean, default false)
- `enable_clock_in_out` (boolean, default false)
- `booking_page_primary_color` (text, default '#f4a125')
- `booking_page_button_color` (text, default '#f4a125')
- `remove_maksy_branding` (boolean, default false)
- `business_hours` (jsonb) - Per-day business hours configuration
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_company_settings_company_id` on `company_id`

**Business Hours Example:**

```json
{
  "monday": { "open": "09:00", "close": "17:00", "enabled": true },
  "tuesday": { "open": "09:00", "close": "17:00", "enabled": true },
  "wednesday": { "open": "09:00", "close": "17:00", "enabled": true },
  "thursday": { "open": "09:00", "close": "17:00", "enabled": true },
  "friday": { "open": "09:00", "close": "17:00", "enabled": true },
  "saturday": { "open": "09:00", "close": "13:00", "enabled": false },
  "sunday": { "open": "09:00", "close": "13:00", "enabled": false }
}
```

---

### 5. `subscriptions`

**Purpose:** Billing and plan management

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, UNIQUE)
- `plan_type` (text, NOT NULL) - 'starter', 'pro', 'scale'
- `billing_cycle` (text, default 'monthly')
- `status` (text, NOT NULL) - 'trialing', 'active', 'past_due', 'canceled'
- `trial_ends_at` (timestamp)
- `current_period_start` (timestamp)
- `current_period_end` (timestamp)
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text)
- `stripe_price_id` (text)
- `seat_count` (integer, default 1) - Number of seats for Team plan
- `stripe_seat_price_id` (text) - Price ID for additional seats
- `canceled_at` (timestamp) - When subscription was actually terminated
- `cancel_at_period_end` (boolean, default false) - Intent to cancel at period end (not yet terminated)
- `features_override` (jsonb) - for custom feature flags
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_subscriptions_company_id` on `company_id`
- `idx_subscriptions_stripe_customer_id` on `stripe_customer_id`

**Important:** `canceled_at` vs `cancel_at_period_end`:

- `canceled_at` = timestamp when subscription was fully terminated (past event)
- `cancel_at_period_end` = boolean indicating subscription will cancel at period end (future intent)

**Features Override Example:**

```json
{
  "ai_enabled": true,
  "max_team_members": 10,
  "custom_automations": false
}
```

---

### 6. `team_members`

**Purpose:** Team employees and their info

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `user_id` (uuid, FK → users.id, UNIQUE) - if they've accepted invite
- `first_name` (text, NOT NULL)
- `last_name` (text)
- `email` (text, NOT NULL)
- `phone` (text)
- `role` (text, NOT NULL) - 'admin', 'team_member'
- `status` (text, NOT NULL) - 'invited', 'active', 'deactivated'
- `invitation_token` (text)
- `invitation_sent_at` (timestamp)
- `accepted_at` (timestamp)
- `avatar_url` (text)
- `address_line1` (text)
- `address_line2` (text)
- `city` (text)
- `state` (text)
- `zip_code` (text)
- `commission_rate` (decimal) - percentage per job
- `hourly_rate` (decimal)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_team_members_company_id` on `company_id`
- `idx_team_members_user_id` on `user_id`
- `idx_team_members_email` on `email`

---

### 7. `team_availability`

**Purpose:** When team members are available to work

**Columns:**

- `id` (uuid, PK)
- `team_member_id` (uuid, FK → team_members.id, NOT NULL)
- `day_of_week` (text, NOT NULL) - 'monday', 'tuesday', etc.
- `start_time` (time, NOT NULL)
- `end_time` (time, NOT NULL)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_team_availability_member_id` on `team_member_id`

**Example:**

```
team_member_id: uuid-123
day_of_week: 'monday'
start_time: '08:00:00'
end_time: '17:00:00'
```

---

### 8. `customers`

**Purpose:** Client/customer records

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `first_name` (text, NOT NULL)
- `last_name` (text, NOT NULL)
- `email` (text, NOT NULL)
- `phone` (text, NOT NULL)
- `company_name` (text)
- `address_line1` (text)
- `address_line2` (text)
- `city` (text)
- `state` (text)
- `zip_code` (text)
- `country` (text, default 'US')
- `notes` (text) - internal notes
- `tags` (text[]) - array of tags
- `lifetime_value` (decimal, default 0) - calculated field
- `total_jobs` (integer, default 0) - calculated field
- `last_job_date` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_customers_company_id` on `company_id`
- `idx_customers_email` on `email`
- `idx_customers_phone` on `phone`
- `idx_customers_created_at` on `created_at`

---

### 9. `custom_customer_fields`

**Purpose:** Define custom fields per company

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `field_name` (text, NOT NULL) - e.g., "Vehicle Make"
- `field_slug` (text, NOT NULL) - e.g., "vehicle_make"
- `field_type` (text, NOT NULL) - 'text', 'textarea', 'number', 'dropdown', 'date', 'checkbox'
- `dropdown_options` (text[]) - if field_type = 'dropdown'
- `is_required` (boolean, default false)
- `show_on_booking_page` (boolean, default false)
- `sort_order` (integer, default 0)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_custom_customer_fields_company_id` on `company_id`

**Example:**

```
field_name: "Vehicle Make & Model"
field_slug: "vehicle_make_model"
field_type: "text"
```

---

### 10. `customer_field_values`

**Purpose:** Store values for custom fields per customer

**Columns:**

- `id` (uuid, PK)
- `customer_id` (uuid, FK → customers.id, NOT NULL)
- `custom_field_id` (uuid, FK → custom_customer_fields.id, NOT NULL)
- `value` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_customer_field_values_customer_id` on `customer_id`
- `idx_customer_field_values_field_id` on `custom_field_id`

**Composite Unique:**

- `UNIQUE(customer_id, custom_field_id)`

---

### 11. `service_categories`

**Purpose:** Organize services into categories

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `name` (text, NOT NULL)
- `slug` (text, NOT NULL)
- `sort_order` (integer, default 0)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_service_categories_company_id` on `company_id`

**Composite Unique:**

- `UNIQUE(company_id, slug)`

---

### 12. `services`

**Purpose:** Service catalog

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `category_id` (uuid, FK → service_categories.id)
- `name` (text, NOT NULL)
- `slug` (text, NOT NULL)
- `description` (text)
- `price` (decimal, NOT NULL)
- `duration_minutes` (integer, NOT NULL)
- `icon_url` (text)
- `icon_crop_style` (text) - 'circle', 'square'
- `color` (text, default '#f4a125') - hex color for charts/labels/identification
- `is_public` (boolean, default true) - show on booking page
- `sort_order` (integer, default 0)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_services_company_id` on `company_id`
- `idx_services_category_id` on `category_id`

**Composite Unique:**

- `UNIQUE(company_id, slug)`

---

### 13. `service_add_ons`

**Purpose:** Upsell add-ons for services

**Columns:**

- `id` (uuid, PK)
- `service_id` (uuid, FK → services.id, NOT NULL)
- `name` (text, NOT NULL)
- `price` (decimal, NOT NULL)
- `duration_minutes` (integer, default 0)
- `sort_order` (integer, default 0)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_service_add_ons_service_id` on `service_id`

---

### 14. `jobs`

**Purpose:** Service appointments/jobs

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `customer_id` (uuid, FK → customers.id, NOT NULL)
- `service_id` (uuid, FK → services.id, NOT NULL)
- `assigned_team_member_id` (uuid, FK → team_members.id)
- `job_number` (text, UNIQUE) - auto-generated (e.g., "JOB-2024-001")
- `scheduled_date` (date, NOT NULL)
- `scheduled_time` (time, NOT NULL)
- `duration_minutes` (integer, NOT NULL)
- `status` (text, NOT NULL) - 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'
- `notes` (text)
- `customer_notes` (text) - notes from customer
- `is_recurring` (boolean, default false)
- `recurring_frequency` (text) - 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
- `recurring_until` (date)
- `parent_job_id` (uuid, FK → jobs.id) - if part of recurring series
- `total_price` (decimal, NOT NULL)
- `payment_status` (text, default 'unpaid') - 'unpaid', 'paid', 'partial'
- `payment_method` (text) - 'cash', 'card', 'invoice'
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_jobs_company_id` on `company_id`
- `idx_jobs_customer_id` on `customer_id`
- `idx_jobs_service_id` on `service_id`
- `idx_jobs_team_member_id` on `assigned_team_member_id`
- `idx_jobs_scheduled_date` on `scheduled_date`
- `idx_jobs_status` on `status`

---

### 15. `job_add_ons`

**Purpose:** Track which add-ons were selected for a job

**Columns:**

- `id` (uuid, PK)
- `job_id` (uuid, FK → jobs.id, NOT NULL)
- `service_add_on_id` (uuid, FK → service_add_ons.id, NOT NULL)
- `price` (decimal, NOT NULL) - price at time of booking
- `created_at` (timestamp)

**Indexes:**

- `idx_job_add_ons_job_id` on `job_id`

---

### 16. `job_tracking`

**Purpose:** GPS and time tracking for jobs

**Columns:**

- `id` (uuid, PK)
- `job_id` (uuid, FK → jobs.id, UNIQUE)
- `on_my_way_at` (timestamp)
- `on_my_way_lat` (decimal)
- `on_my_way_lng` (decimal)
- `arrived_at` (timestamp)
- `arrived_lat` (decimal)
- `arrived_lng` (decimal)
- `started_at` (timestamp)
- `completed_at` (timestamp)
- `drive_time_minutes` (integer) - calculated
- `job_duration_minutes` (integer) - calculated
- `miles_driven` (decimal)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_job_tracking_job_id` on `job_id`

---

### 17. `tasks`

**Purpose:** To-do items for team

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `created_by_user_id` (uuid, FK → users.id, NOT NULL)
- `assigned_to_team_member_id` (uuid, FK → team_members.id)
- `title` (text, NOT NULL)
- `description` (text)
- `due_date` (date)
- `priority` (text, default 'medium') - 'low', 'medium', 'high'
- `status` (text, default 'incomplete') - 'incomplete', 'complete'
- `completed_at` (timestamp)
- `linked_customer_id` (uuid, FK → customers.id)
- `linked_job_id` (uuid, FK → jobs.id)
- `reminder_enabled` (boolean, default false)
- `reminder_frequency` (text) - 'daily', 'weekly'
- `reminder_type` (text) - 'push', 'sms', 'email'
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_tasks_company_id` on `company_id`
- `idx_tasks_assigned_to` on `assigned_to_team_member_id`
- `idx_tasks_status` on `status`
- `idx_tasks_due_date` on `due_date`

**Notes:**

- Starter plan enforcement uses `task_usage_counters` to ensure no more than 3 tasks are created per company each week. Application logic increments the counter before insert and blocks the transaction if the cap is reached.

---

### 18. `estimates`

**Purpose:** Quotes/estimates sent to customers

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `customer_id` (uuid, FK → customers.id, NOT NULL)
- `estimate_number` (text, UNIQUE) - auto-generated (e.g., "EST-2024-001")
- `status` (text, default 'draft') - 'draft', 'sent', 'approved', 'declined'
- `subtotal` (decimal, NOT NULL)
- `tax_amount` (decimal, default 0)
- `discount_amount` (decimal, default 0)
- `total` (decimal, NOT NULL)
- `notes` (text) - customer-visible
- `terms` (text)
- `expiration_date` (date)
- `sent_at` (timestamp)
- `approved_at` (timestamp)
- `declined_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_estimates_company_id` on `company_id`
- `idx_estimates_customer_id` on `customer_id`
- `idx_estimates_status` on `status`

---

### 19. `estimate_line_items`

**Purpose:** Individual items on an estimate

**Columns:**

- `id` (uuid, PK)
- `estimate_id` (uuid, FK → estimates.id, NOT NULL)
- `service_id` (uuid, FK → services.id) - if related to a service
- `description` (text, NOT NULL)
- `quantity` (integer, default 1)
- `unit_price` (decimal, NOT NULL)
- `total_price` (decimal, NOT NULL)
- `sort_order` (integer, default 0)
- `created_at` (timestamp)

**Indexes:**

- `idx_estimate_line_items_estimate_id` on `estimate_id`

---

### 20. `invoices`

**Purpose:** Bills sent to customers

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `customer_id` (uuid, FK → customers.id, NOT NULL)
- `job_id` (uuid, FK → jobs.id) - if generated from a job
- `invoice_number` (text, UNIQUE) - auto-generated (e.g., "INV-2024-001")
- `status` (text, default 'unpaid') - 'unpaid', 'paid', 'partially_paid', 'overdue', 'canceled'
- `issue_date` (date, NOT NULL)
- `due_date` (date, NOT NULL)
- `subtotal` (decimal, NOT NULL)
- `tax_amount` (decimal, default 0)
- `discount_amount` (decimal, default 0)
- `total` (decimal, NOT NULL)
- `amount_paid` (decimal, default 0)
- `payment_terms` (text) - e.g., "Net 30"
- `notes` (text)
- `sent_at` (timestamp)
- `paid_at` (timestamp)
- `stripe_payment_intent_id` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_invoices_company_id` on `company_id`
- `idx_invoices_customer_id` on `customer_id`
- `idx_invoices_job_id` on `job_id`
- `idx_invoices_status` on `status`
- `idx_invoices_due_date` on `due_date`

---

### 21. `invoice_line_items`

**Purpose:** Individual items on an invoice

**Columns:**

- `id` (uuid, PK)
- `invoice_id` (uuid, FK → invoices.id, NOT NULL)
- `service_id` (uuid, FK → services.id)
- `description` (text, NOT NULL)
- `quantity` (integer, default 1)
- `unit_price` (decimal, NOT NULL)
- `total_price` (decimal, NOT NULL)
- `sort_order` (integer, default 0)
- `created_at` (timestamp)

**Indexes:**

- `idx_invoice_line_items_invoice_id` on `invoice_id`

---

### 22. `payments`

**Purpose:** Track payments received

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `invoice_id` (uuid, FK → invoices.id, NOT NULL)
- `amount` (decimal, NOT NULL)
- `payment_method` (text, NOT NULL) - 'cash', 'card', 'check', 'bank_transfer'
- `payment_date` (date, NOT NULL)
- `stripe_payment_intent_id` (text)
- `notes` (text)
- `created_at` (timestamp)

**Indexes:**

- `idx_payments_invoice_id` on `invoice_id`
- `idx_payments_company_id` on `company_id`

---

### 23. `coupons`

**Purpose:** Discount codes

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `code` (text, NOT NULL) - uppercase
- `title` (text) - internal name
- `discount_type` (text, NOT NULL) - 'percentage', 'fixed'
- `discount_value` (decimal, NOT NULL)
- `start_date` (date)
- `end_date` (date)
- `total_usage_limit` (integer) - null = unlimited
- `usage_per_customer_limit` (integer)
- `minimum_order_value` (decimal)
- `is_active` (boolean, default true)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_coupons_company_id` on `company_id`
- `idx_coupons_code` on `code`

**Composite Unique:**

- `UNIQUE(company_id, code)`

---

### 24. `coupon_service_restrictions`

**Purpose:** Limit coupons to specific services

**Columns:**

- `id` (uuid, PK)
- `coupon_id` (uuid, FK → coupons.id, NOT NULL)
- `service_id` (uuid, FK → services.id, NOT NULL)
- `created_at` (timestamp)

**Indexes:**

- `idx_coupon_service_restrictions_coupon_id` on `coupon_id`

---

### 25. `coupon_usages`

**Purpose:** Track coupon usage

**Columns:**

- `id` (uuid, PK)
- `coupon_id` (uuid, FK → coupons.id, NOT NULL)
- `customer_id` (uuid, FK → customers.id, NOT NULL)
- `invoice_id` (uuid, FK → invoices.id)
- `discount_applied` (decimal, NOT NULL)
- `used_at` (timestamp, default NOW())

**Indexes:**

- `idx_coupon_usages_coupon_id` on `coupon_id`
- `idx_coupon_usages_customer_id` on `customer_id`

---

### 26. `automations`

**Purpose:** Workflow automation rules

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `name` (text, NOT NULL)
- `type` (text, NOT NULL) - 'stock', 'custom'
- `stock_type` (text) - if type='stock': 'appointment_reminder', 'booking_confirmation', 'review_request', 'assignment_notice'
- `is_active` (boolean, default true)
- `trigger_event` (text, NOT NULL) - 'job_scheduled', 'job_completed', 'customer_added', etc.
- `workflow_config` (jsonb, NOT NULL) - stores node structure
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_automations_company_id` on `company_id`
- `idx_automations_is_active` on `is_active`

**Workflow Config Example:**

```json
{
  "trigger": {
    "type": "job_completed",
    "conditions": {}
  },
  "actions": [
    {
      "type": "delay",
      "duration_minutes": 30
    },
    {
      "type": "send_sms",
      "template": "Hey {{Customer_FirstName}}! Thanks for using us. Leave a review: {{Company_GoogleReviewLink}}",
      "to": "customer_phone"
    }
  ]
}
```

---

### 27. `automation_executions`

**Purpose:** Log of automation runs

**Columns:**

- `id` (uuid, PK)
- `automation_id` (uuid, FK → automations.id, NOT NULL)
- `triggered_by_entity_type` (text, NOT NULL) - 'job', 'customer', 'invoice', etc.
- `triggered_by_entity_id` (uuid, NOT NULL)
- `status` (text, NOT NULL) - 'pending', 'running', 'completed', 'failed'
- `error_message` (text)
- `executed_at` (timestamp, default NOW())
- `completed_at` (timestamp)

**Indexes:**

- `idx_automation_executions_automation_id` on `automation_id`
- `idx_automation_executions_status` on `status`

---

### 28. `custom_forms`

**Purpose:** Custom form definitions

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `form_name` (text, NOT NULL) - internal
- `form_title` (text, NOT NULL) - displayed to user
- `form_description` (text)
- `submit_button_text` (text, default 'Submit')
- `success_message` (text)
- `redirect_url` (text)
- `notification_email` (text) - where to send submissions
- `fields_config` (jsonb, NOT NULL) - array of field definitions
- `is_active` (boolean, default true)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_custom_forms_company_id` on `company_id`

**Fields Config Example:**

```json
[
  {
    "type": "text",
    "label": "Full Name",
    "placeholder": "John Doe",
    "required": true,
    "validation": "text"
  },
  {
    "type": "email",
    "label": "Email Address",
    "placeholder": "john@example.com",
    "required": true,
    "validation": "email"
  },
  {
    "type": "textarea",
    "label": "Message",
    "rows": 5,
    "required": false
  }
]
```

---

### 29. `form_submissions`

**Purpose:** Store form submission data

**Columns:**

- `id` (uuid, PK)
- `form_id` (uuid, FK → custom_forms.id, NOT NULL)
- `submission_data` (jsonb, NOT NULL) - key-value pairs
- `customer_id` (uuid, FK → customers.id) - if matched/created
- `ip_address` (text)
- `user_agent` (text)
- `created_at` (timestamp)

**Indexes:**

- `idx_form_submissions_form_id` on `form_id`
- `idx_form_submissions_created_at` on `created_at`

**Submission Data Example:**

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "message": "I need a quote for lawn mowing"
}
```

---

### 30. `integrations`

**Purpose:** Store OAuth tokens and integration settings

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `integration_type` (text, NOT NULL) - 'stripe', 'quickbooks', 'google_business', 'google_ads', 'meta_ads'
- `is_active` (boolean, default true)
- `access_token` (text) - encrypted
- `refresh_token` (text) - encrypted
- `token_expires_at` (timestamp)
- `integration_account_id` (text) - e.g., Stripe account ID
- `integration_account_email` (text)
- `settings` (jsonb) - integration-specific settings
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_integrations_company_id` on `company_id`
- `idx_integrations_type` on `integration_type`

**Composite Unique:**

- `UNIQUE(company_id, integration_type)`

---

### 31. `notification_preferences`

**Purpose:** User notification settings

**Columns:**

- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id, UNIQUE)
- `company_id` (uuid, FK → companies.id)
- `enable_email` (boolean, default true)
- `enable_sms` (boolean, default true)
- `enable_push` (boolean, default true)
- `notify_new_booking` (boolean, default true)
- `notify_invoice_paid` (boolean, default true)
- `notify_invoice_overdue` (boolean, default true)
- `notify_estimate_request` (boolean, default true)
- `notify_job_completed` (boolean, default true)
- `notify_review_received` (boolean, default false)
- `quiet_hours_start` (time)
- `quiet_hours_end` (time)
- `quiet_days` (text[]) - ['saturday', 'sunday']
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**

- `idx_notification_preferences_user_id` on `user_id`

---

### 32. `ai_chat_history`

**Purpose:** Store Maksy AI conversations

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `user_id` (uuid, FK → users.id, NOT NULL)
- `role` (text, NOT NULL) - 'user', 'assistant', 'system'
- `message` (text, NOT NULL)
- `function_called` (text) - if AI called a function (e.g., 'create_task')
- `function_args` (jsonb) - arguments passed
- `function_result` (jsonb) - result returned
- `tokens_used` (integer)
- `created_at` (timestamp)

**Indexes:**

- `idx_ai_chat_history_company_id` on `company_id`
- `idx_ai_chat_history_user_id` on `user_id`
- `idx_ai_chat_history_created_at` on `created_at`

**Note:** Implement retention policy (delete messages older than 90 days)

---

### 33. `ai_usage_counters`

**Purpose:** Track the number of Maksy AI requests each user makes per day.

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `user_id` (uuid, FK → users.id, NOT NULL)
- `usage_date` (date, NOT NULL) — stored in UTC, derived from the company's timezone
- `requests_used` (integer, NOT NULL, default 0)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

**Indexes:**

- UNIQUE (`company_id`, `user_id`, `usage_date`)
- `idx_ai_usage_counters_company_id` on `company_id`

**Usage Rules:**

- Row is created on first request for the day; subsequent requests increment `requests_used`
- Daily reset job inserts the next day's row at 00:00 (company timezone)
- Admin/support override can manually set `requests_used` to a lower value if necessary

---

### 34. `ai_usage_lifetime`

**Purpose:** Track the total number of Maksy AI preview requests used by Starter-plan users.

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `user_id` (uuid, FK → users.id, NOT NULL)
- `requests_used` (integer, NOT NULL, default 0)
- `last_used_at` (timestamp with time zone)

**Indexes:**

- UNIQUE (`company_id`, `user_id`)
- `idx_ai_usage_lifetime_company_id` on `company_id`

**Usage Notes:**

- Incremented every time a Starter user sends an AI request.
- Once `requests_used >= 15`, API returns 403 and UI prompts upgrade.
- Support override can reset count (record change in `audit_logs`).

---

### 35. `task_usage_counters`

**Purpose:** Enforce the "3 tasks per company per week" limit on Starter plans.

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `week_start` (date, NOT NULL) — Monday start of ISO week
- `tasks_created` (integer, NOT NULL, default 0)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**Indexes:**

- UNIQUE (`company_id`, `week_start`)
- `idx_task_usage_company_week` on (`company_id`, `week_start`)

**Usage Notes:**

- Starter plan increments counter on each task creation; when `>=3`, UI blocks new tasks until next week.
- Pro/Scale ignore this table (counter optional).
- Weekly reset job ensures upcoming week rows exist (optional convenience).

---

### 36. `inventory_items`

**Purpose:** Store canonical list of inventory resources.

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `name` (text, NOT NULL)
- `sku` (text)
- `category` (text)
- `unit_cost` (numeric(12,2))
- `quantity_on_hand` (numeric(12,2), default 0)
- `reorder_point` (numeric(12,2), default 0)
- `preferred_vendor` (text)
- `location_tag` (text) -- optional bin/shelf identifier (Scale usage)
- `track_consumption` (boolean, default false)
- `notes` (text)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `archived_at` (timestamptz)

**Indexes:**

- `idx_inventory_items_company` on `company_id`
- `idx_inventory_items_name` on (`company_id`, `name`)

---

### 37. `inventory_movements`

**Purpose:** Ledger of quantity adjustments (manual, job consumption, transfers).

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `item_id` (uuid, FK → inventory_items.id, NOT NULL)
- `job_id` (uuid, FK → jobs.id) -- nullable, set when consumption comes from a job
- `change_amount` (numeric(12,2), NOT NULL)
- `change_type` (text, NOT NULL) -- 'manual', 'job_consumption', 'transfer', 'import'
- `notes` (text)
- `created_by` (uuid, FK → users.id)
- `created_at` (timestamptz, default now())

**Indexes:**

- `idx_inventory_movements_item` on `item_id`
- `idx_inventory_movements_company` on `company_id`
- `idx_inventory_movements_job` on `job_id`

---

### 38. `inventory_attachments`

**Purpose:** Track files (photos, receipts, SDS sheets) attached to inventory items.

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `item_id` (uuid, FK → inventory_items.id, NOT NULL)
- `file_url` (text, NOT NULL)
- `file_type` (text)
- `uploaded_by` (uuid, FK → users.id)
- `uploaded_at` (timestamptz, default now())

**Indexes:**

- `idx_inventory_attachments_item` on `item_id`

---

### 39. `job_media`

**Purpose:** Store before/after photos and documents attached to jobs.

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `job_id` (uuid, FK → jobs.id, NOT NULL)
- `media_type` (text, NOT NULL) -- 'before', 'after', 'document'
- `file_url` (text, NOT NULL)
- `uploaded_by` (uuid, FK → users.id)
- `uploaded_at` (timestamptz, default now())
- `caption` (text)

**Indexes:**

- `idx_job_media_job` on `job_id`
- `idx_job_media_company` on `company_id`

**Usage Notes:**

- Only available on Pro/Scale (Starter UI hides uploader).
- API ensures maximum 20 files per job by default.

---

### 40. `contracts`

**Purpose:** Store contract/agreement data

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `customer_id` (uuid, FK → customers.id, NOT NULL)
- `title` (text, NOT NULL)
- `contract_type` (text, NOT NULL) - 'proposal', 'service_agreement', 'waiver', 'nda', 'custom'
- `status` (text, NOT NULL, default 'draft') - 'draft', 'pending', 'signed', 'active', 'expired', 'terminated'
- `content_json` (jsonb, NOT NULL) - Tiptap JSON
- `content_html` (text, NOT NULL) - Rendered HTML
- `merge_fields` (jsonb) - Populated values
- `contract_value` (decimal(12,2))
- `start_date` (date)
- `end_date` (date)
- `expiration_date` (date) - For signing link
- `auto_renew` (boolean, default false)
- `linked_job_id` (uuid, FK → jobs.id)
- `linked_estimate_id` (uuid, FK → estimates.id)
- `template_id` (uuid, FK → contract_templates.id)
- `sent_at` (timestamptz)
- `sent_via` (text) - 'email', 'sms', 'link', 'email_sms'
- `signing_token` (text, UNIQUE)
- `signing_token_expires_at` (timestamptz)
- `viewed_at` (timestamptz)
- `viewed_by_ip` (text)
- `signed_at` (timestamptz)
- `signed_by_ip` (text)
- `terminated_at` (timestamptz)
- `terminated_by_user_id` (uuid, FK → users.id)
- `termination_reason` (text)
- `created_by_user_id` (uuid, FK → users.id, NOT NULL)
- `created_at` (timestamptz, default NOW())
- `updated_at` (timestamptz, default NOW())

**Indexes:**

- `idx_contracts_company_id` on `company_id`
- `idx_contracts_customer_id` on `customer_id`
- `idx_contracts_status` on `status`
- `idx_contracts_signing_token` on `signing_token`

---

### 41. `contract_signatures`

**Purpose:** Store signature data for contracts

**Columns:**

- `id` (uuid, PK)
- `contract_id` (uuid, FK → contracts.id, NOT NULL)
- `signer_type` (text, NOT NULL) - 'customer', 'owner', 'witness'
- `signer_name` (text, NOT NULL)
- `signer_email` (text)
- `signer_role` (text)
- `signature_image_url` (text, NOT NULL) - PNG in Storage
- `signature_method` (text, NOT NULL) - 'drawn', 'typed', 'uploaded'
- `signed_at` (timestamptz, default NOW())
- `signed_by_ip` (text)
- `signed_by_user_agent` (text)
- `created_at` (timestamptz, default NOW())

**Indexes:**

- `idx_contract_signatures_contract_id` on `contract_id`

---

### 42. `contract_templates`

**Purpose:** Store reusable contract templates

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `name` (text, NOT NULL)
- `template_type` (text, NOT NULL)
- `is_system_template` (boolean, default false)
- `content_json` (jsonb, NOT NULL)
- `content_html` (text, NOT NULL)
- `thumbnail_url` (text)
- `usage_count` (integer, default 0)
- `created_at` (timestamptz, default NOW())
- `updated_at` (timestamptz, default NOW())

**Indexes:**

- `idx_contract_templates_company_id` on `company_id`

---

### 43. `contract_activity_log`

**Purpose:** Audit trail for contracts

**Columns:**

- `id` (uuid, PK)
- `contract_id` (uuid, FK → contracts.id, NOT NULL)
- `action` (text, NOT NULL) - 'created', 'edited', 'sent', 'viewed', 'signed', 'downloaded', 'terminated'
- `actor_type` (text, NOT NULL) - 'user', 'customer', 'system'
- `actor_id` (uuid)
- `actor_name` (text)
- `actor_ip` (text)
- `metadata` (jsonb)
- `created_at` (timestamptz, default NOW())

**Indexes:**

- `idx_contract_activity_log_contract_id` on `contract_id`

---

### 44. `documents`

**Purpose:** Centralized file storage and management

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `filename` (text, NOT NULL)
- `file_type` (text, NOT NULL) - 'pdf', 'image', 'spreadsheet', 'word', 'video', 'other'
- `file_extension` (text, NOT NULL)
- `file_size_bytes` (bigint, NOT NULL)
- `storage_path` (text, NOT NULL)
- `storage_url` (text, NOT NULL)
- `folder_path` (text, default '/')
- `tags` (text[])
- `linked_customer_id` (uuid, FK → customers.id)
- `linked_job_id` (uuid, FK → jobs.id)
- `linked_invoice_id` (uuid, FK → invoices.id)
- `linked_estimate_id` (uuid, FK → estimates.id)
- `linked_contract_id` (uuid, FK → contracts.id)
- `extracted_text` (text) - OCR text
- `ai_suggested_tags` (text[])
- `version_number` (integer, default 1)
- `parent_document_id` (uuid, FK → documents.id)
- `is_latest_version` (boolean, default true)
- `is_public` (boolean, default false)
- `public_share_token` (text, UNIQUE)
- `public_share_expires_at` (timestamptz)
- `public_share_password_hash` (text)
- `uploaded_by_user_id` (uuid, FK → users.id, NOT NULL)
- `uploaded_at` (timestamptz, default NOW())
- `last_modified_at` (timestamptz, default NOW())
- `last_accessed_at` (timestamptz)

**Indexes:**

- `idx_documents_company_id` on `company_id`
- `idx_documents_linked_customer_id` on `linked_customer_id`
- `idx_documents_linked_job_id` on `linked_job_id`
- `idx_documents_linked_invoice_id` on `linked_invoice_id`
- `idx_documents_folder_path` on `folder_path`
- `idx_documents_tags` on `tags` (GIN index)
- `idx_documents_public_share_token` on `public_share_token`

---

### 45. `document_shares`

**Purpose:** Track document sharing permissions

**Columns:**

- `id` (uuid, PK)
- `document_id` (uuid, FK → documents.id, NOT NULL)
- `shared_with_user_id` (uuid, FK → users.id)
- `shared_with_email` (text)
- `access_level` (text, default 'view') - 'view', 'download', 'edit'
- `shared_by_user_id` (uuid, FK → users.id, NOT NULL)
- `shared_at` (timestamptz, default NOW())
- `expires_at` (timestamptz)
- `revoked_at` (timestamptz)

**Indexes:**

- `idx_document_shares_document_id` on `document_id`

---

### 46. `document_comments`

**Purpose:** Team comments on documents (Pro/Scale)

**Columns:**

- `id` (uuid, PK)
- `document_id` (uuid, FK → documents.id, NOT NULL)
- `comment_text` (text, NOT NULL)
- `parent_comment_id` (uuid, FK → document_comments.id)
- `author_user_id` (uuid, FK → users.id, NOT NULL)
- `created_at` (timestamptz, default NOW())
- `updated_at` (timestamptz, default NOW())

**Indexes:**

- `idx_document_comments_document_id` on `document_id`

---

### 47. `document_activity_log`

**Purpose:** Audit trail for documents

**Columns:**

- `id` (uuid, PK)
- `document_id` (uuid, FK → documents.id, NOT NULL)
- `action` (text, NOT NULL) - 'uploaded', 'downloaded', 'viewed', 'renamed', 'moved', 'shared', 'deleted', 'restored'
- `actor_type` (text, NOT NULL) - 'user', 'customer', 'system'
- `actor_id` (uuid)
- `actor_name` (text)
- `actor_ip` (text)
- `metadata` (jsonb)
- `created_at` (timestamptz, default NOW())

**Indexes:**

- `idx_document_activity_log_document_id` on `document_id`

---

### 48. `audit_logs`

**Purpose:** Track important actions (Pro plan only)

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `user_id` (uuid, FK → users.id)
- `action` (text, NOT NULL) - 'created', 'updated', 'deleted'
- `entity_type` (text, NOT NULL) - 'customer', 'job', 'invoice', etc.
- `entity_id` (uuid)
- `changes` (jsonb) - before/after values
- `ip_address` (text)
- `created_at` (timestamp)

**Indexes:**

- `idx_audit_logs_company_id` on `company_id`
- `idx_audit_logs_entity_type` on `entity_type`
- `idx_audit_logs_created_at` on `created_at`

**Changes Example:**

```json
{
  "before": { "status": "scheduled" },
  "after": { "status": "completed" }
}
```

---

### 49. `reviews`

**Purpose:** Store customer reviews (future feature)

**Columns:**

- `id` (uuid, PK)
- `company_id` (uuid, FK → companies.id, NOT NULL)
- `customer_id` (uuid, FK → customers.id)
- `job_id` (uuid, FK → jobs.id)
- `rating` (integer, NOT NULL) - 1-5 stars
- `review_text` (text)
- `source` (text) - 'google', 'internal', 'facebook'
- `external_review_url` (text)
- `created_at` (timestamp)

**Indexes:**

- `idx_reviews_company_id` on `company_id`
- `idx_reviews_customer_id` on `customer_id`

---

## Relationships Summary

**Total Tables:** 49 (includes Contracts, Documents, AI lifetime/task counters, inventory module, and job media support)

**One-to-Many:**

- companies → customers
- companies → services
- companies → jobs
- companies → team_members
- companies → automations
- companies → contracts
- companies → documents
- companies → ai_usage_counters
- companies → ai_usage_lifetime
- companies → task_usage_counters
- companies → inventory_items
- inventory_items → inventory_movements
- inventory_items → inventory_attachments
- customers → jobs
- customers → invoices
- customers → contracts
- services → service_add_ons
- jobs → job_add_ons
- jobs → job_media
- contracts → contract_signatures
- contracts → contract_activity_log
- documents → document_shares
- documents → document_comments
- documents → document_activity_log

**One-to-One:**

- users ↔ user_profiles
- companies ↔ subscriptions
- jobs ↔ job_tracking
- jobs ↔ invoices (optional)

**Many-to-Many:**

- coupons ↔ services (via coupon_service_restrictions)

---

## Indexes Strategy

**High-Traffic Queries:**

1. Get all jobs for a company on a specific date:
   - Index: `company_id + scheduled_date`
2. Get customer's job history:
   - Index: `customer_id + created_at`
3. Find team member availability:
   - Index: `team_member_id + day_of_week`
4. Check if booking slot is available:
   - Composite: `company_id + scheduled_date + scheduled_time`

**Composite Indexes to Add:**

```sql
CREATE INDEX idx_jobs_company_date ON jobs(company_id, scheduled_date);
CREATE INDEX idx_jobs_team_date ON jobs(assigned_team_member_id, scheduled_date);
CREATE INDEX idx_invoices_company_status ON invoices(company_id, status);
```

---

## Migrations Strategy

**Migration Files Location:** `/supabase/migrations/`

**Naming Convention:** `YYYYMMDDHHMMSS_description.sql`

**Recommended Migration Order:**

1. `20241105000001_create_core_tables.sql` - users, companies, subscriptions
2. `20241105000002_create_team_tables.sql` - team_members, team_availability
3. `20241105000003_create_customer_tables.sql` - customers, custom_fields, field_values
4. `20241105000004_create_service_tables.sql` - categories, services, add-ons
5. `20241105000005_create_job_tables.sql` - jobs, job_add_ons, job_tracking
6. `20241105000006_create_task_tables.sql` - tasks
7. `20241105000007_create_financial_tables.sql` - estimates, invoices, payments
8. `20241105000008_create_coupon_tables.sql` - coupons, usages
9. `20241105000009_create_automation_tables.sql` - automations, executions
10. `20241105000010_create_form_tables.sql` - custom_forms, submissions
11. `20241105000011_create_integration_tables.sql` - integrations
12. `20241105000012_create_notification_tables.sql` - notification_preferences
13. `20241105000013_create_ai_tables.sql` - ai_chat_history, ai_usage_counters, ai_usage_lifetime
14. `20241105000014_create_task_usage.sql` - task_usage_counters
15. `20241105000015_create_inventory_tables.sql` - inventory_items, inventory_movements, inventory_attachments
16. `20241105000016_create_media_tables.sql` - job_media
17. `20241105000017_create_audit_tables.sql` - audit_logs, reviews
18. `20241105000018_add_indexes.sql` - all indexes
19. `20241105000019_add_rls_policies.sql` - Row Level Security

---

## Row Level Security (RLS) Policies

**Principle:** Users can only access data for their company

**Example Policies:**

```sql
-- Customers: Users can only see customers from their company
CREATE POLICY "Users can view their company's customers"
  ON customers FOR SELECT
  USING (company_id = auth.company_id());

-- Jobs: Team members can only see jobs assigned to them or their company
CREATE POLICY "Team members can view relevant jobs"
  ON jobs FOR SELECT
  USING (
    company_id = auth.company_id() OR
    assigned_team_member_id = auth.team_member_id()
  );
```

**Helper Functions:**

```sql
-- Get current user's company_id
CREATE FUNCTION auth.company_id()
RETURNS uuid AS $$
  SELECT company_id FROM team_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE;
```

---

## Database Triggers

**Auto-Update `updated_at`:**

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Auto-Calculate LTV:**

```sql
CREATE OR REPLACE FUNCTION update_customer_ltv()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET lifetime_value = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM jobs
    WHERE customer_id = NEW.customer_id
      AND status = 'completed'
      AND payment_status = 'paid'
  )
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_ltv_on_job
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_ltv();
```

**Auto-Generate Job Number:**

```sql
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  year_part TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_num
  FROM jobs
  WHERE company_id = NEW.company_id
    AND job_number LIKE 'JOB-' || year_part || '-%';

  NEW.job_number := 'JOB-' || year_part || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

Next: See [04-API_ENDPOINTS.md](04-API_ENDPOINTS.md) for all API routes and webhooks.
