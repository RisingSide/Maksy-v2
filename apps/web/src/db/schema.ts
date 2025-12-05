/**
 * Maksy v2 - Complete Database Schema
 *
 * This schema defines all 53 tables for the Maksy platform.
 * Based on docs/03-DATABASE_SCHEMA.md
 *
 * CRITICAL FEATURES:
 * - Companies table includes time_zone for proper scheduling
 * - Team members table includes 'owner' role for RLS
 * - All timestamps use timestamptz (timezone aware)
 * - Proper indexes and foreign keys for performance
 *
 * Tables include:
 * - Core: user_profiles, companies, team_members, subscriptions
 * - Customers: customers, custom_customer_fields, customer_field_values
 * - Services: services, service_categories, service_add_ons
 * - Jobs: jobs, job_add_ons, job_tracking, job_media
 * - Financial: estimates, invoices, payments, pricing_rules, pricing_history
 * - Inventory: inventory_items, inventory_movements, inventory_attachments
 * - Tasks: tasks
 * - Automations: automations, automation_templates, automation_executions
 * - Contracts: contracts, contract_signatures
 * - Documents: documents
 * - Forms: custom_forms, form_submissions
 * - AI: maksy_conversations, maksy_messages, financial_insights
 * - Settings: company_settings, notification_preferences
 * - Coupons: coupons
 * - Onboarding: onboarding_progress
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  time,
  date,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// ENUMS
// ============================================================================

export const planTypeEnum = pgEnum('plan_type', ['pro', 'scale', 'team'])
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'paused',
])
export const teamMemberRoleEnum = pgEnum('team_member_role', [
  'owner',
  'admin',
  'team_member',
])
export const teamMemberStatusEnum = pgEnum('team_member_status', [
  'invited',
  'active',
  'deactivated',
])
export const jobStatusEnum = pgEnum('job_status', [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
])
export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid',
  'paid',
  'partial',
])
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'unpaid',
  'paid',
  'partially_paid',
  'overdue',
  'canceled',
])
export const estimateStatusEnum = pgEnum('estimate_status', [
  'draft',
  'sent',
  'approved',
  'declined',
])
export const contractTypeEnum = pgEnum('contract_type', [
  'proposal',
  'service_agreement',
  'waiver',
  'nda',
  'custom',
])
export const contractStatusEnum = pgEnum('contract_status', [
  'draft',
  'pending',
  'signed',
  'active',
  'expired',
  'terminated',
])
export const documentTypeEnum = pgEnum('document_type', [
  'pdf',
  'image',
  'spreadsheet',
  'word',
  'video',
  'other',
])

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * User Profiles - Extended information for Supabase Auth users
 */
export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone'),
    avatarUrl: text('avatar_url'),
    timeZone: text('time_zone').notNull().default('America/New_York'),
    language: text('language').notNull().default('en'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_user_profiles_user_id').on(table.userId),
  })
)

/**
 * Companies - Business/organization data
 * CRITICAL: Includes time_zone for proper scheduling and AI reset jobs
 */
export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: text('owner_user_id').notNull(),
    companyName: text('company_name').notNull(),
    industry: text('industry'),
    slug: text('slug').unique().notNull(),
    timeZone: text('time_zone').notNull().default('America/New_York'), // CRITICAL: Added for timezone support
    businessPhone: text('business_phone'),
    businessEmail: text('business_email'),
    websiteUrl: text('website_url'),
    addressLine1: text('address_line1'),
    addressLine2: text('address_line2'),
    city: text('city'),
    state: text('state'),
    zipCode: text('zip_code'),
    country: text('country').notNull().default('US'),
    logoUrl: text('logo_url'),
    coverPhotoUrl: text('cover_photo_url'),
    termsUrl: text('terms_url'),
    privacyUrl: text('privacy_url'),
    supportEmail: text('support_email'),
    googleReviewLink: text('google_review_link'),
    facebookUrl: text('facebook_url'),
    instagramUrl: text('instagram_url'),
    twitterUrl: text('twitter_url'),
    linkedinUrl: text('linkedin_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    ownerIdx: index('idx_companies_owner').on(table.ownerUserId),
    slugIdx: uniqueIndex('idx_companies_slug').on(table.slug),
  })
)

/**
 * Company Settings - Configuration for each company
 */
export const companySettings = pgTable(
  'company_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .unique()
      .references(() => companies.id, { onDelete: 'cascade' }),
    dateFormat: text('date_format').notNull().default('MM/DD/YYYY'),
    timeFormat: text('time_format').notNull().default('12h'),
    weekStartsOn: text('week_starts_on').notNull().default('sunday'),
    currency: text('currency').notNull().default('USD'),
    taxRate: decimal('tax_rate', { precision: 5, scale: 2 }),
    defaultInvoiceTerms: text('default_invoice_terms'),
    enableDoubleBooking: boolean('enable_double_booking')
      .notNull()
      .default(false),
    bookingLeadTimeHours: integer('booking_lead_time_hours')
      .notNull()
      .default(2),
    bookingSlotSizeMinutes: integer('booking_slot_size_minutes')
      .notNull()
      .default(30),
    schedulingWindowDays: integer('scheduling_window_days')
      .notNull()
      .default(30),
    cancellationHoursBefore: integer('cancellation_hours_before')
      .notNull()
      .default(24),
    enableGpsTracking: boolean('enable_gps_tracking').notNull().default(false),
    enableClockInOut: boolean('enable_clock_in_out').notNull().default(false),
    bookingPagePrimaryColor: text('booking_page_primary_color')
      .notNull()
      .default('#f4a125'),
    bookingPageButtonColor: text('booking_page_button_color')
      .notNull()
      .default('#f4a125'),
    removeMaksyBranding: boolean('remove_maksy_branding')
      .notNull()
      .default(false),
    stripeConnected: boolean('stripe_connected').notNull().default(false),
    // Business hours stored as JSON: { monday: { open: "09:00", close: "17:00", enabled: true }, ... }
    businessHours: jsonb('business_hours'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_company_settings_company_id').on(table.companyId),
  })
)

/**
 * Onboarding Progress - Track user onboarding completion
 */
export const onboardingProgress = pgTable(
  'onboarding_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .unique()
      .references(() => companies.id, { onDelete: 'cascade' }),
    criticalCompleted: boolean('critical_completed').notNull().default(false),
    criticalCompletedAt: timestamp('critical_completed_at', {
      withTimezone: true,
    }),
    tasksCompleted: jsonb('tasks_completed').notNull().default({
      add_services: false,
      import_customers: false,
      create_first_job: false,
      connect_stripe: false,
      customize_booking_page: false,
      add_team_members: false,
      setup_automation: false,
    }),
    completionPercentage: integer('completion_percentage').notNull().default(0),
    tourMode: text('tour_mode').notNull().default('pending'),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_onboarding_progress_company_id').on(
      table.companyId
    ),
    criticalCompletedIdx: index(
      'idx_onboarding_progress_critical_completed'
    ).on(table.criticalCompleted),
    completionIdx: index('idx_onboarding_progress_completion').on(
      table.completionPercentage
    ),
  })
)

/**
 * Subscriptions - Billing and plan management
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .unique()
      .references(() => companies.id, { onDelete: 'cascade' }),
    planType: planTypeEnum('plan_type').notNull(),
    billingCycle: text('billing_cycle').notNull().default('monthly'),
    status: subscriptionStatusEnum('status').notNull(),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    currentPeriodStart: timestamp('current_period_start', {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripePriceId: text('stripe_price_id'),
    // Seat-based billing for Team plan
    seatCount: integer('seat_count').default(1),
    stripeSeatPriceId: text('stripe_seat_price_id'),
    // cancelAtPeriodEnd: true means user intends to cancel at period end (subscription still active)
    // canceledAt: timestamp when subscription was actually terminated
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    featuresOverride: jsonb('features_override'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_subscriptions_company_id').on(table.companyId),
    stripeCustomerIdIdx: index('idx_subscriptions_stripe_customer_id').on(
      table.stripeCustomerId
    ),
  })
)

/**
 * Team Members - Team employees and their info
 * CRITICAL: Includes 'owner' role for proper RLS
 */
export const teamMembers = pgTable(
  'team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: text('user_id').unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name'),
    email: text('email').notNull(),
    phone: text('phone'),
    role: teamMemberRoleEnum('role').notNull(), // CRITICAL: 'owner' added to enum
    status: teamMemberStatusEnum('status').notNull(),
    invitationToken: text('invitation_token'),
    invitationSentAt: timestamp('invitation_sent_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    avatarUrl: text('avatar_url'),
    addressLine1: text('address_line1'),
    addressLine2: text('address_line2'),
    city: text('city'),
    state: text('state'),
    zipCode: text('zip_code'),
    commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }),
    hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_team_members_company_id').on(table.companyId),
    userIdIdx: index('idx_team_members_user_id').on(table.userId),
    emailIdx: index('idx_team_members_email').on(table.email),
  })
)

/**
 * Team Availability - When team members are available to work
 */
export const teamAvailability = pgTable(
  'team_availability',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamMemberId: uuid('team_member_id')
      .notNull()
      .references(() => teamMembers.id, { onDelete: 'cascade' }),
    dayOfWeek: text('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    teamMemberIdIdx: index('idx_team_availability_member_id').on(
      table.teamMemberId
    ),
  })
)

// ============================================================================
// CRM TABLES
// ============================================================================

/**
 * Customers - Client/customer records
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    companyName: text('company_name'),
    addressLine1: text('address_line1'),
    addressLine2: text('address_line2'),
    city: text('city'),
    state: text('state'),
    zipCode: text('zip_code'),
    country: text('country').notNull().default('US'),
    notes: text('notes'),
    tags: text('tags').array(),
    lifetimeValue: decimal('lifetime_value', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    totalJobs: integer('total_jobs').notNull().default(0),
    lastJobDate: timestamp('last_job_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_customers_company_id').on(table.companyId),
    emailIdx: index('idx_customers_email').on(table.email),
    phoneIdx: index('idx_customers_phone').on(table.phone),
    createdAtIdx: index('idx_customers_created_at').on(table.createdAt),
  })
)

/**
 * Custom Customer Fields - Define custom fields per company
 */
export const customCustomerFields = pgTable(
  'custom_customer_fields',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    fieldName: text('field_name').notNull(),
    fieldSlug: text('field_slug').notNull(),
    fieldType: text('field_type').notNull(),
    dropdownOptions: text('dropdown_options').array(),
    isRequired: boolean('is_required').notNull().default(false),
    showOnBookingPage: boolean('show_on_booking_page').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_custom_customer_fields_company_id').on(
      table.companyId
    ),
  })
)

/**
 * Customer Field Values - Store values for custom fields per customer
 */
export const customerFieldValues = pgTable(
  'customer_field_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    customFieldId: uuid('custom_field_id')
      .notNull()
      .references(() => customCustomerFields.id, { onDelete: 'cascade' }),
    value: text('value'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    customerIdIdx: index('idx_customer_field_values_customer_id').on(
      table.customerId
    ),
    customFieldIdIdx: index('idx_customer_field_values_field_id').on(
      table.customFieldId
    ),
    uniqueCustomerField: uniqueIndex('unique_customer_custom_field').on(
      table.customerId,
      table.customFieldId
    ),
  })
)

// ============================================================================
// SERVICE TABLES
// ============================================================================

/**
 * Service Categories - Organize services into categories
 */
export const serviceCategories = pgTable(
  'service_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_service_categories_company_id').on(
      table.companyId
    ),
    uniqueSlug: uniqueIndex('unique_company_category_slug').on(
      table.companyId,
      table.slug
    ),
  })
)

/**
 * Services - Service catalog
 */
export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => serviceCategories.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    iconUrl: text('icon_url'),
    iconCropStyle: text('icon_crop_style'),
    color: text('color').notNull().default('#f4a125'), // Hex color for charts/labels/identification
    isPublic: boolean('is_public').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_services_company_id').on(table.companyId),
    categoryIdIdx: index('idx_services_category_id').on(table.categoryId),
    uniqueSlug: uniqueIndex('unique_company_service_slug').on(
      table.companyId,
      table.slug
    ),
  })
)

/**
 * Service Add-ons - Upsell add-ons for services
 */
export const serviceAddOns = pgTable(
  'service_add_ons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    serviceIdIdx: index('idx_service_add_ons_service_id').on(table.serviceId),
  })
)

// ============================================================================
// JOB TABLES
// ============================================================================

/**
 * Jobs - Service appointments/jobs
 */
export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    assignedTeamMemberId: uuid('assigned_team_member_id').references(
      () => teamMembers.id,
      { onDelete: 'set null' }
    ),
    jobNumber: text('job_number').unique().notNull(),
    scheduledDate: date('scheduled_date').notNull(),
    scheduledTime: time('scheduled_time').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    status: jobStatusEnum('status').notNull(),
    notes: text('notes'),
    customerNotes: text('customer_notes'),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurringFrequency: text('recurring_frequency'),
    recurringUntil: date('recurring_until'),
    parentJobId: uuid('parent_job_id').references((): any => jobs.id, {
      onDelete: 'set null',
    }),
    totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('unpaid'),
    paymentMethod: text('payment_method'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_jobs_company_id').on(table.companyId),
    customerIdIdx: index('idx_jobs_customer_id').on(table.customerId),
    serviceIdIdx: index('idx_jobs_service_id').on(table.serviceId),
    teamMemberIdIdx: index('idx_jobs_team_member_id').on(
      table.assignedTeamMemberId
    ),
    scheduledDateIdx: index('idx_jobs_scheduled_date').on(table.scheduledDate),
    statusIdx: index('idx_jobs_status').on(table.status),
    companyDateIdx: index('idx_jobs_company_date').on(
      table.companyId,
      table.scheduledDate
    ),
  })
)

/**
 * Job Add-ons - Track which add-ons were selected for a job
 */
export const jobAddOns = pgTable(
  'job_add_ons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    serviceAddOnId: uuid('service_add_on_id')
      .notNull()
      .references(() => serviceAddOns.id, { onDelete: 'restrict' }),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    jobIdIdx: index('idx_job_add_ons_job_id').on(table.jobId),
  })
)

/**
 * Job Tracking - GPS and time tracking for jobs
 */
export const jobTracking = pgTable(
  'job_tracking',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .unique()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    onMyWayAt: timestamp('on_my_way_at', { withTimezone: true }),
    onMyWayLat: decimal('on_my_way_lat', { precision: 10, scale: 7 }),
    onMyWayLng: decimal('on_my_way_lng', { precision: 10, scale: 7 }),
    arrivedAt: timestamp('arrived_at', { withTimezone: true }),
    arrivedLat: decimal('arrived_lat', { precision: 10, scale: 7 }),
    arrivedLng: decimal('arrived_lng', { precision: 10, scale: 7 }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    driveTimeMinutes: integer('drive_time_minutes'),
    jobDurationMinutes: integer('job_duration_minutes'),
    milesDriven: decimal('miles_driven', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    jobIdIdx: index('idx_job_tracking_job_id').on(table.jobId),
  })
)

/**
 * Job Media - Before/after photos and documents (NEW)
 */
export const jobMedia = pgTable(
  'job_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    mediaType: text('media_type').notNull(), // 'before', 'after', 'document'
    fileUrl: text('file_url').notNull(),
    uploadedBy: text('uploaded_by'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    caption: text('caption'),
  },
  (table) => ({
    jobIdIdx: index('idx_job_media_job').on(table.jobId),
    companyIdIdx: index('idx_job_media_company').on(table.companyId),
  })
)

// ============================================================================
// TASK & INVENTORY TABLES
// ============================================================================

/**
 * Tasks - To-do items for team
 */
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    createdByUserId: text('created_by_user_id').notNull(),
    assignedToTeamMemberId: uuid('assigned_to_team_member_id').references(
      () => teamMembers.id,
      { onDelete: 'set null' }
    ),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: date('due_date'),
    priority: text('priority').notNull().default('medium'),
    status: text('status').notNull().default('incomplete'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    linkedCustomerId: uuid('linked_customer_id').references(
      () => customers.id,
      { onDelete: 'set null' }
    ),
    linkedJobId: uuid('linked_job_id').references(() => jobs.id, {
      onDelete: 'set null',
    }),
    reminderEnabled: boolean('reminder_enabled').notNull().default(false),
    reminderFrequency: text('reminder_frequency'),
    reminderType: text('reminder_type'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_tasks_company_id').on(table.companyId),
    assignedToIdx: index('idx_tasks_assigned_to').on(
      table.assignedToTeamMemberId
    ),
    statusIdx: index('idx_tasks_status').on(table.status),
    dueDateIdx: index('idx_tasks_due_date').on(table.dueDate),
  })
)

/**
 * Task Usage Counters - Enforce 3 tasks/week limit for Starter (NEW)
 */
export const taskUsageCounters = pgTable(
  'task_usage_counters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    weekStart: date('week_start').notNull(), // Monday of ISO week
    tasksCreated: integer('tasks_created').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueCompanyWeek: uniqueIndex('unique_company_week').on(
      table.companyId,
      table.weekStart
    ),
    companyWeekIdx: index('idx_task_usage_company_week').on(
      table.companyId,
      table.weekStart
    ),
  })
)

/**
 * Inventory Items - Track equipment, chemicals, consumables (NEW)
 */
export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sku: text('sku'),
    category: text('category'),
    unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
    quantityOnHand: decimal('quantity_on_hand', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    reorderPoint: decimal('reorder_point', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    preferredVendor: text('preferred_vendor'),
    locationTag: text('location_tag'),
    trackConsumption: boolean('track_consumption').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => ({
    companyIdx: index('idx_inventory_items_company').on(table.companyId),
    nameIdx: index('idx_inventory_items_name').on(table.companyId, table.name),
  })
)

/**
 * Inventory Movements - Ledger of quantity adjustments (NEW)
 */
export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    changeAmount: decimal('change_amount', {
      precision: 12,
      scale: 2,
    }).notNull(),
    changeType: text('change_type').notNull(), // 'manual', 'job_consumption', 'transfer', 'import'
    notes: text('notes'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    itemIdx: index('idx_inventory_movements_item').on(table.itemId),
    companyIdx: index('idx_inventory_movements_company').on(table.companyId),
    jobIdx: index('idx_inventory_movements_job').on(table.jobId),
  })
)

/**
 * Inventory Attachments - Files attached to inventory items (NEW)
 */
export const inventoryAttachments = pgTable(
  'inventory_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    fileUrl: text('file_url').notNull(),
    fileType: text('file_type'),
    uploadedBy: text('uploaded_by'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    itemIdx: index('idx_inventory_attachments_item').on(table.itemId),
  })
)

// ============================================================================
// FINANCIAL TABLES
// ============================================================================

/**
 * Estimates - Quotes/estimates sent to customers
 */
export const estimates = pgTable(
  'estimates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    estimateNumber: text('estimate_number').unique().notNull(),
    status: estimateStatusEnum('status').notNull().default('draft'),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    notes: text('notes'),
    terms: text('terms'),
    expirationDate: date('expiration_date'),
    expiresAt: timestamp('expires_at', { withTimezone: true }), // Alternative expiration timestamp
    sentAt: timestamp('sent_at', { withTimezone: true }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    declinedAt: timestamp('declined_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_estimates_company_id').on(table.companyId),
    customerIdIdx: index('idx_estimates_customer_id').on(table.customerId),
    statusIdx: index('idx_estimates_status').on(table.status),
  })
)

/**
 * Estimate Line Items - Individual items on an estimate
 */
export const estimateLineItems = pgTable(
  'estimate_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    estimateId: uuid('estimate_id')
      .notNull()
      .references(() => estimates.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id').references(() => services.id, {
      onDelete: 'set null',
    }),
    description: text('description').notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    estimateIdIdx: index('idx_estimate_line_items_estimate_id').on(
      table.estimateId
    ),
  })
)

/**
 * Invoices - Bills sent to customers
 */
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    invoiceNumber: text('invoice_number').unique().notNull(),
    status: invoiceStatusEnum('status').notNull().default('unpaid'),
    issueDate: date('issue_date').notNull(),
    dueDate: date('due_date').notNull(),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    amountPaid: decimal('amount_paid', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    paymentTerms: text('payment_terms'),
    notes: text('notes'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_invoices_company_id').on(table.companyId),
    customerIdIdx: index('idx_invoices_customer_id').on(table.customerId),
    jobIdIdx: index('idx_invoices_job_id').on(table.jobId),
    statusIdx: index('idx_invoices_status').on(table.status),
    dueDateIdx: index('idx_invoices_due_date').on(table.dueDate),
    companyStatusIdx: index('idx_invoices_company_status').on(
      table.companyId,
      table.status
    ),
  })
)

/**
 * Invoice Line Items - Individual items on an invoice
 */
export const invoiceLineItems = pgTable(
  'invoice_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id').references(() => services.id, {
      onDelete: 'set null',
    }),
    description: text('description').notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    invoiceIdIdx: index('idx_invoice_line_items_invoice_id').on(
      table.invoiceId
    ),
  })
)

/**
 * Payments - Track payments received
 */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: text('payment_method').notNull(),
    paymentDate: date('payment_date').notNull(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    invoiceIdIdx: index('idx_payments_invoice_id').on(table.invoiceId),
    companyIdIdx: index('idx_payments_company_id').on(table.companyId),
  })
)

// ============================================================================
// COUPON TABLES
// ============================================================================

/**
 * Coupons - Discount codes
 */
export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title'),
    discountType: text('discount_type').notNull(),
    discountValue: decimal('discount_value', {
      precision: 12,
      scale: 2,
    }).notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    totalUsageLimit: integer('total_usage_limit'),
    usagePerCustomerLimit: integer('usage_per_customer_limit'),
    minimumOrderValue: decimal('minimum_order_value', {
      precision: 12,
      scale: 2,
    }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_coupons_company_id').on(table.companyId),
    codeIdx: index('idx_coupons_code').on(table.code),
    uniqueCompanyCode: uniqueIndex('unique_company_coupon_code').on(
      table.companyId,
      table.code
    ),
  })
)

/**
 * Coupon Service Restrictions - Limit coupons to specific services
 */
export const couponServiceRestrictions = pgTable(
  'coupon_service_restrictions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    couponIdIdx: index('idx_coupon_service_restrictions_coupon_id').on(
      table.couponId
    ),
  })
)

/**
 * Coupon Usages - Track coupon usage
 */
export const couponUsages = pgTable(
  'coupon_usages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').references(() => invoices.id, {
      onDelete: 'set null',
    }),
    discountApplied: decimal('discount_applied', {
      precision: 12,
      scale: 2,
    }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    couponIdIdx: index('idx_coupon_usages_coupon_id').on(table.couponId),
    customerIdIdx: index('idx_coupon_usages_customer_id').on(table.customerId),
  })
)

// ============================================================================
// AUTOMATION TABLES
// ============================================================================

/**
 * Automations - Workflow automation rules
 */
export const automations = pgTable(
  'automations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    stockType: text('stock_type'),
    isActive: boolean('is_active').notNull().default(true),
    triggerEvent: text('trigger_event').notNull(),
    workflowConfig: jsonb('workflow_config').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_automations_company_id').on(table.companyId),
    isActiveIdx: index('idx_automations_is_active').on(table.isActive),
  })
)

/**
 * Automation Executions - Log of automation runs
 */
export const automationExecutions = pgTable(
  'automation_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    automationId: uuid('automation_id')
      .notNull()
      .references(() => automations.id, { onDelete: 'cascade' }),
    triggeredByEntityType: text('triggered_by_entity_type').notNull(),
    triggeredByEntityId: uuid('triggered_by_entity_id').notNull(),
    status: text('status').notNull(),
    errorMessage: text('error_message'),
    executedAt: timestamp('executed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    automationIdIdx: index('idx_automation_executions_automation_id').on(
      table.automationId
    ),
    statusIdx: index('idx_automation_executions_status').on(table.status),
  })
)

/**
 * Automation Templates - Pre-built automation workflows (Scale tier)
 */
export const automationTemplates = pgTable(
  'automation_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    category: text('category').notNull(), // 'follow_up', 'onboarding', 'workflow', 'reactivation', 'upsell'
    icon: text('icon'), // Lucide icon name
    workflowConfig: jsonb('workflow_config').notNull(),
    isSystemTemplate: boolean('is_system_template').default(true),
    usageCount: integer('usage_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    categoryIdx: index('idx_automation_templates_category').on(table.category),
  })
)

// ============================================================================
// FORM TABLES
// ============================================================================

/**
 * Custom Forms - Custom form definitions
 */
export const customForms = pgTable(
  'custom_forms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    formName: text('form_name').notNull(),
    formTitle: text('form_title').notNull(),
    formDescription: text('form_description'),
    submitButtonText: text('submit_button_text').notNull().default('Submit'),
    successMessage: text('success_message'),
    redirectUrl: text('redirect_url'),
    notificationEmail: text('notification_email'),
    fieldsConfig: jsonb('fields_config').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_custom_forms_company_id').on(table.companyId),
  })
)

/**
 * Form Submissions - Store form submission data
 */
export const formSubmissions = pgTable(
  'form_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    formId: uuid('form_id')
      .notNull()
      .references(() => customForms.id, { onDelete: 'cascade' }),
    submissionData: jsonb('submission_data').notNull(),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    formIdIdx: index('idx_form_submissions_form_id').on(table.formId),
    createdAtIdx: index('idx_form_submissions_created_at').on(table.createdAt),
  })
)

// ============================================================================
// SETTINGS & AI TABLES
// ============================================================================

/**
 * Integrations - Store OAuth tokens and integration settings
 */
export const integrations = pgTable(
  'integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    integrationType: text('integration_type').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    integrationAccountId: text('integration_account_id'),
    integrationAccountEmail: text('integration_account_email'),
    settings: jsonb('settings'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_integrations_company_id').on(table.companyId),
    typeIdx: index('idx_integrations_type').on(table.integrationType),
    uniqueCompanyType: uniqueIndex('unique_company_integration_type').on(
      table.companyId,
      table.integrationType
    ),
  })
)

/**
 * Notification Preferences - User notification settings
 */
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    enableEmail: boolean('enable_email').notNull().default(true),
    enableSms: boolean('enable_sms').notNull().default(true),
    enablePush: boolean('enable_push').notNull().default(true),
    notifyNewBooking: boolean('notify_new_booking').notNull().default(true),
    notifyInvoicePaid: boolean('notify_invoice_paid').notNull().default(true),
    notifyInvoiceOverdue: boolean('notify_invoice_overdue')
      .notNull()
      .default(true),
    notifyEstimateRequest: boolean('notify_estimate_request')
      .notNull()
      .default(true),
    notifyJobCompleted: boolean('notify_job_completed').notNull().default(true),
    notifyReviewReceived: boolean('notify_review_received')
      .notNull()
      .default(false),
    quietHoursStart: time('quiet_hours_start'),
    quietHoursEnd: time('quiet_hours_end'),
    quietDays: text('quiet_days').array(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_notification_preferences_user_id').on(table.userId),
  })
)

/**
 * AI Chat History - Store Maksy AI conversations
 */
export const aiChatHistory = pgTable(
  'ai_chat_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: text('role').notNull(),
    message: text('message').notNull(),
    functionCalled: text('function_called'),
    functionArgs: jsonb('function_args'),
    functionResult: jsonb('function_result'),
    tokensUsed: integer('tokens_used'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_ai_chat_history_company_id').on(table.companyId),
    userIdIdx: index('idx_ai_chat_history_user_id').on(table.userId),
    createdAtIdx: index('idx_ai_chat_history_created_at').on(table.createdAt),
  })
)

/**
 * AI Usage Counters - Daily request limits (NEW)
 * Pro: 30 requests/user/day, Scale: 50 requests/user/day
 */
export const aiUsageCounters = pgTable(
  'ai_usage_counters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    usageDate: date('usage_date').notNull(),
    requestsUsed: integer('requests_used').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueUserDate: uniqueIndex('unique_company_user_date').on(
      table.companyId,
      table.userId,
      table.usageDate
    ),
    companyIdIdx: index('idx_ai_usage_counters_company_id').on(table.companyId),
  })
)

/**
 * AI Usage Lifetime - Starter preview limits (NEW)
 * Starter: 15 lifetime preview requests
 */
export const aiUsageLifetime = pgTable(
  'ai_usage_lifetime',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    requestsUsed: integer('requests_used').notNull().default(0),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  },
  (table) => ({
    uniqueCompanyUser: uniqueIndex('unique_company_user').on(
      table.companyId,
      table.userId
    ),
    companyIdIdx: index('idx_ai_usage_lifetime_company_id').on(table.companyId),
  })
)

// ============================================================================
// AUDIT TABLES
// ============================================================================

/**
 * Audit Logs - Track important actions
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: text('user_id'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    changes: jsonb('changes'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_audit_logs_company_id').on(table.companyId),
    entityTypeIdx: index('idx_audit_logs_entity_type').on(table.entityType),
    createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
  })
)

/**
 * Reviews - Store customer reviews
 */
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    reviewText: text('review_text'),
    source: text('source'),
    externalReviewUrl: text('external_review_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_reviews_company_id').on(table.companyId),
    customerIdIdx: index('idx_reviews_customer_id').on(table.customerId),
  })
)

// ============================================================================
// CONTRACTS & DOCUMENTS TABLES
// ============================================================================

/**
 * Contracts - Digital agreements and proposals
 */
export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    contractType: contractTypeEnum('contract_type').notNull(),
    status: contractStatusEnum('status').notNull().default('draft'),

    contentJson: jsonb('content_json').notNull(),
    contentHtml: text('content_html').notNull(),
    mergeFields: jsonb('merge_fields'),

    contractValue: decimal('contract_value', { precision: 12, scale: 2 }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    expirationDate: date('expiration_date'),
    autoRenew: boolean('auto_renew').default(false),

    linkedJobId: uuid('linked_job_id').references(() => jobs.id, {
      onDelete: 'set null',
    }),
    linkedEstimateId: uuid('linked_estimate_id').references(
      () => estimates.id,
      { onDelete: 'set null' }
    ),
    templateId: uuid('template_id').references(() => contractTemplates.id, {
      onDelete: 'set null',
    }),

    sentAt: timestamp('sent_at', { withTimezone: true }),
    sentVia: text('sent_via'),
    signingToken: text('signing_token').unique(),
    signingTokenExpiresAt: timestamp('signing_token_expires_at', {
      withTimezone: true,
    }),

    viewedAt: timestamp('viewed_at', { withTimezone: true }),
    viewedByIp: text('viewed_by_ip'),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    signedByIp: text('signed_by_ip'),

    terminatedAt: timestamp('terminated_at', { withTimezone: true }),
    terminatedByUserId: text('terminated_by_user_id'),
    terminationReason: text('termination_reason'),

    createdByUserId: text('created_by_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_contracts_company_id').on(table.companyId),
    customerIdIdx: index('idx_contracts_customer_id').on(table.customerId),
    statusIdx: index('idx_contracts_status').on(table.status),
    signingTokenIdx: index('idx_contracts_signing_token').on(
      table.signingToken
    ),
  })
)

/**
 * Contract Signatures - E-signature data
 */
export const contractSignatures = pgTable(
  'contract_signatures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),

    signerType: text('signer_type').notNull(),
    signerName: text('signer_name').notNull(),
    signerEmail: text('signer_email'),
    signerRole: text('signer_role'),

    signatureImageUrl: text('signature_image_url').notNull(),
    signatureMethod: text('signature_method').notNull(),

    signedAt: timestamp('signed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    signedByIp: text('signed_by_ip'),
    signedByUserAgent: text('signed_by_user_agent'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    contractIdIdx: index('idx_contract_signatures_contract_id').on(
      table.contractId
    ),
  })
)

/**
 * Contract Templates - Reusable templates
 */
export const contractTemplates = pgTable(
  'contract_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    templateType: text('template_type').notNull(),
    isSystemTemplate: boolean('is_system_template').default(false),

    contentJson: jsonb('content_json').notNull(),
    contentHtml: text('content_html').notNull(),
    thumbnailUrl: text('thumbnail_url'),

    usageCount: integer('usage_count').default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_contract_templates_company_id').on(
      table.companyId
    ),
  })
)

/**
 * Contract Activity Log - Audit trail
 */
export const contractActivityLog = pgTable(
  'contract_activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),

    action: text('action').notNull(),
    actorType: text('actor_type').notNull(),
    actorId: uuid('actor_id'),
    actorName: text('actor_name'),
    actorIp: text('actor_ip'),

    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    contractIdIdx: index('idx_contract_activity_log_contract_id').on(
      table.contractId
    ),
  })
)

/**
 * Documents - File storage and management
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),

    filename: text('filename').notNull(),
    fileType: documentTypeEnum('file_type').notNull(),
    fileExtension: text('file_extension').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    storagePath: text('storage_path').notNull(),
    storageUrl: text('storage_url').notNull(),

    folderPath: text('folder_path').default('/'),
    tags: text('tags').array(),

    linkedCustomerId: uuid('linked_customer_id').references(
      () => customers.id,
      { onDelete: 'set null' }
    ),
    linkedJobId: uuid('linked_job_id').references(() => jobs.id, {
      onDelete: 'set null',
    }),
    linkedInvoiceId: uuid('linked_invoice_id').references(() => invoices.id, {
      onDelete: 'set null',
    }),
    linkedEstimateId: uuid('linked_estimate_id').references(
      () => estimates.id,
      { onDelete: 'set null' }
    ),
    linkedContractId: uuid('linked_contract_id').references(
      () => contracts.id,
      { onDelete: 'set null' }
    ),

    extractedText: text('extracted_text'),
    aiSuggestedTags: text('ai_suggested_tags').array(),

    versionNumber: integer('version_number').default(1),
    parentDocumentId: uuid('parent_document_id').references(
      (): any => documents.id,
      { onDelete: 'set null' }
    ),
    isLatestVersion: boolean('is_latest_version').default(true),

    isPublic: boolean('is_public').default(false),
    publicShareToken: text('public_share_token').unique(),
    publicShareExpiresAt: timestamp('public_share_expires_at', {
      withTimezone: true,
    }),
    publicSharePasswordHash: text('public_share_password_hash'),

    uploadedByUserId: text('uploaded_by_user_id').notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastModifiedAt: timestamp('last_modified_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  },
  (table) => ({
    companyIdIdx: index('idx_documents_company_id').on(table.companyId),
    linkedCustomerIdIdx: index('idx_documents_linked_customer_id').on(
      table.linkedCustomerId
    ),
    linkedJobIdIdx: index('idx_documents_linked_job_id').on(table.linkedJobId),
    linkedInvoiceIdIdx: index('idx_documents_linked_invoice_id').on(
      table.linkedInvoiceId
    ),
    folderPathIdx: index('idx_documents_folder_path').on(table.folderPath),
    publicShareTokenIdx: index('idx_documents_public_share_token').on(
      table.publicShareToken
    ),
  })
)

/**
 * Document Shares - Sharing permissions
 */
export const documentShares = pgTable(
  'document_shares',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),

    sharedWithUserId: text('shared_with_user_id'),
    sharedWithEmail: text('shared_with_email'),
    accessLevel: text('access_level').default('view'),

    sharedByUserId: text('shared_by_user_id').notNull(),
    sharedAt: timestamp('shared_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => ({
    documentIdIdx: index('idx_document_shares_document_id').on(
      table.documentId
    ),
  })
)

/**
 * Document Comments - Team discussion
 */
export const documentComments = pgTable(
  'document_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),

    commentText: text('comment_text').notNull(),
    parentCommentId: uuid('parent_comment_id').references(
      (): any => documentComments.id,
      { onDelete: 'cascade' }
    ),

    authorUserId: text('author_user_id').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    documentIdIdx: index('idx_document_comments_document_id').on(
      table.documentId
    ),
  })
)

/**
 * Document Activity Log - Audit trail
 */
export const documentActivityLog = pgTable(
  'document_activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),

    action: text('action').notNull(),
    actorType: text('actor_type').notNull(),
    actorId: uuid('actor_id'),
    actorName: text('actor_name'),
    actorIp: text('actor_ip'),

    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    documentIdIdx: index('idx_document_activity_log_document_id').on(
      table.documentId
    ),
  })
)

// ============================================================================
// FINANCIAL AI & PRICING TABLES (Scale tier)
// ============================================================================

/**
 * Financial Insights - AI-generated financial analysis and recommendations
 */
export const financialInsights = pgTable(
  'financial_insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    insightType: text('insight_type').notNull(), // 'margin_alert', 'pricing_suggestion', 'forecast', 'cost_analysis', 'cash_flow'
    title: text('title').notNull(),
    content: text('content').notNull(),
    data: jsonb('data'), // Supporting metrics and calculations
    priority: text('priority').default('medium'), // 'low', 'medium', 'high', 'critical'
    isRead: boolean('is_read').default(false),
    isDismissed: boolean('is_dismissed').default(false),
    generatedAt: timestamp('generated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => ({
    companyIdIdx: index('idx_financial_insights_company_id').on(
      table.companyId
    ),
    insightTypeIdx: index('idx_financial_insights_insight_type').on(
      table.insightType
    ),
    priorityIdx: index('idx_financial_insights_priority').on(table.priority),
  })
)

/**
 * Pricing Rules - Dynamic pricing rules and conditions
 */
export const pricingRules = pgTable(
  'pricing_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    ruleType: text('rule_type').notNull(), // 'surge', 'discount', 'multiplier', 'seasonal'
    conditions: jsonb('conditions').notNull(), // When to apply this rule
    adjustment: jsonb('adjustment').notNull(), // { type: 'percentage' | 'fixed', value: number }
    isActive: boolean('is_active').default(true),
    priority: integer('priority').default(0), // Higher priority rules apply first
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_pricing_rules_company_id').on(table.companyId),
    isActiveIdx: index('idx_pricing_rules_is_active').on(table.isActive),
  })
)

/**
 * Pricing History - Track AI price suggestions and outcomes
 */
export const pricingHistory = pgTable(
  'pricing_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    estimateId: uuid('estimate_id').references(() => estimates.id, {
      onDelete: 'set null',
    }),
    basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
    suggestedPrice: decimal('suggested_price', {
      precision: 10,
      scale: 2,
    }).notNull(),
    finalPrice: decimal('final_price', { precision: 10, scale: 2 }),
    factors: jsonb('factors').notNull(), // What influenced the suggested price
    wasAccepted: boolean('was_accepted'), // Did they use the suggested price?
    acceptanceRate: decimal('acceptance_rate', { precision: 5, scale: 2 }), // % difference from suggestion
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_pricing_history_company_id').on(table.companyId),
    estimateIdIdx: index('idx_pricing_history_estimate_id').on(
      table.estimateId
    ),
  })
)

// ============================================================================
// PLACEHOLDER FOR SUPABASE AUTH.USERS
// This is managed by Supabase Auth, we just reference it
// ============================================================================
