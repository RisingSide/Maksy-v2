CREATE TYPE "public"."estimate_status" AS ENUM('draft', 'sent', 'approved', 'declined');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'unpaid', 'paid', 'partially_paid', 'overdue', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid', 'partial');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('starter', 'pro', 'scale');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'paused');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('owner', 'admin', 'team_member');--> statement-breakpoint
CREATE TYPE "public"."team_member_status" AS ENUM('invited', 'active', 'deactivated');--> statement-breakpoint
CREATE TABLE "ai_chat_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"message" text NOT NULL,
	"function_called" text,
	"function_args" jsonb,
	"function_result" jsonb,
	"tokens_used" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"usage_date" date NOT NULL,
	"requests_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_lifetime" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"requests_used" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"changes" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"triggered_by_entity_type" text NOT NULL,
	"triggered_by_entity_id" uuid NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"stock_type" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"trigger_event" text NOT NULL,
	"workflow_config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"company_name" text NOT NULL,
	"industry" text,
	"slug" text NOT NULL,
	"time_zone" text DEFAULT 'America/New_York' NOT NULL,
	"business_phone" text,
	"business_email" text,
	"website_url" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text DEFAULT 'US' NOT NULL,
	"logo_url" text,
	"cover_photo_url" text,
	"terms_url" text,
	"privacy_url" text,
	"support_email" text,
	"google_review_link" text,
	"facebook_url" text,
	"instagram_url" text,
	"twitter_url" text,
	"linkedin_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"date_format" text DEFAULT 'MM/DD/YYYY' NOT NULL,
	"time_format" text DEFAULT '12h' NOT NULL,
	"week_starts_on" text DEFAULT 'sunday' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"tax_rate" numeric(5, 2),
	"default_invoice_terms" text,
	"enable_double_booking" boolean DEFAULT false NOT NULL,
	"booking_lead_time_hours" integer DEFAULT 2 NOT NULL,
	"booking_slot_size_minutes" integer DEFAULT 30 NOT NULL,
	"scheduling_window_days" integer DEFAULT 30 NOT NULL,
	"cancellation_hours_before" integer DEFAULT 24 NOT NULL,
	"enable_gps_tracking" boolean DEFAULT false NOT NULL,
	"enable_clock_in_out" boolean DEFAULT false NOT NULL,
	"booking_page_primary_color" text DEFAULT '#f4a125' NOT NULL,
	"booking_page_button_color" text DEFAULT '#f4a125' NOT NULL,
	"remove_maksy_branding" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_settings_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_service_restrictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_id" uuid,
	"discount_applied" numeric(12, 2) NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text,
	"discount_type" text NOT NULL,
	"discount_value" numeric(12, 2) NOT NULL,
	"start_date" date,
	"end_date" date,
	"total_usage_limit" integer,
	"usage_per_customer_limit" integer,
	"minimum_order_value" numeric(12, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_customer_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"field_name" text NOT NULL,
	"field_slug" text NOT NULL,
	"field_type" text NOT NULL,
	"dropdown_options" text[],
	"is_required" boolean DEFAULT false NOT NULL,
	"show_on_booking_page" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"form_name" text NOT NULL,
	"form_title" text NOT NULL,
	"form_description" text,
	"submit_button_text" text DEFAULT 'Submit' NOT NULL,
	"success_message" text,
	"redirect_url" text,
	"notification_email" text,
	"fields_config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"custom_field_id" uuid NOT NULL,
	"value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"company_name" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text DEFAULT 'US' NOT NULL,
	"notes" text,
	"tags" text[],
	"lifetime_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"last_job_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"service_id" uuid,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"estimate_number" text NOT NULL,
	"status" "estimate_status" DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"notes" text,
	"terms" text,
	"expiration_date" date,
	"sent_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"declined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estimates_estimate_number_unique" UNIQUE("estimate_number")
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"submission_data" jsonb NOT NULL,
	"customer_id" uuid,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"integration_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"integration_account_id" text,
	"integration_account_email" text,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"category" text,
	"unit_cost" numeric(12, 2),
	"quantity_on_hand" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reorder_point" numeric(12, 2) DEFAULT '0' NOT NULL,
	"preferred_vendor" text,
	"location_tag" text,
	"track_consumption" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"job_id" uuid,
	"change_amount" numeric(12, 2) NOT NULL,
	"change_type" text NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"service_id" uuid,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"job_id" uuid,
	"invoice_number" text NOT NULL,
	"status" "invoice_status" DEFAULT 'unpaid' NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payment_terms" text,
	"notes" text,
	"sent_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"stripe_payment_intent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "job_add_ons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"service_add_on_id" uuid NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"media_type" text NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"caption" text
);
--> statement-breakpoint
CREATE TABLE "job_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"on_my_way_at" timestamp with time zone,
	"on_my_way_lat" numeric(10, 7),
	"on_my_way_lng" numeric(10, 7),
	"arrived_at" timestamp with time zone,
	"arrived_lat" numeric(10, 7),
	"arrived_lng" numeric(10, 7),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"drive_time_minutes" integer,
	"job_duration_minutes" integer,
	"miles_driven" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_tracking_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"assigned_team_member_id" uuid,
	"job_number" text NOT NULL,
	"scheduled_date" date NOT NULL,
	"scheduled_time" time NOT NULL,
	"duration_minutes" integer NOT NULL,
	"status" "job_status" NOT NULL,
	"notes" text,
	"customer_notes" text,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_frequency" text,
	"recurring_until" date,
	"parent_job_id" uuid,
	"total_price" numeric(12, 2) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"payment_method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_job_number_unique" UNIQUE("job_number")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"enable_email" boolean DEFAULT true NOT NULL,
	"enable_sms" boolean DEFAULT true NOT NULL,
	"enable_push" boolean DEFAULT true NOT NULL,
	"notify_new_booking" boolean DEFAULT true NOT NULL,
	"notify_invoice_paid" boolean DEFAULT true NOT NULL,
	"notify_invoice_overdue" boolean DEFAULT true NOT NULL,
	"notify_estimate_request" boolean DEFAULT true NOT NULL,
	"notify_job_completed" boolean DEFAULT true NOT NULL,
	"notify_review_received" boolean DEFAULT false NOT NULL,
	"quiet_hours_start" time,
	"quiet_hours_end" time,
	"quiet_days" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_date" date NOT NULL,
	"stripe_payment_intent_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid,
	"job_id" uuid,
	"rating" integer NOT NULL,
	"review_text" text,
	"source" text,
	"external_review_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_add_ons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"icon_url" text,
	"icon_crop_style" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"plan_type" "plan_type" NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"status" "subscription_status" NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"canceled_at" timestamp with time zone,
	"features_override" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "task_usage_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"tasks_created" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"assigned_to_team_member_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"due_date" date,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'incomplete' NOT NULL,
	"completed_at" timestamp with time zone,
	"linked_customer_id" uuid,
	"linked_job_id" uuid,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"reminder_frequency" text,
	"reminder_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" uuid NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"role" "team_member_role" NOT NULL,
	"status" "team_member_status" NOT NULL,
	"invitation_token" text,
	"invitation_sent_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"avatar_url" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"commission_rate" numeric(5, 2),
	"hourly_rate" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"avatar_url" text,
	"time_zone" text DEFAULT 'America/New_York' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_chat_history" ADD CONSTRAINT "ai_chat_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_counters" ADD CONSTRAINT "ai_usage_counters_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_lifetime" ADD CONSTRAINT "ai_usage_lifetime_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_service_restrictions" ADD CONSTRAINT "coupon_service_restrictions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_service_restrictions" ADD CONSTRAINT "coupon_service_restrictions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_customer_fields" ADD CONSTRAINT "custom_customer_fields_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_forms" ADD CONSTRAINT "custom_forms_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_field_values" ADD CONSTRAINT "customer_field_values_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_field_values" ADD CONSTRAINT "customer_field_values_custom_field_id_custom_customer_fields_id_fk" FOREIGN KEY ("custom_field_id") REFERENCES "public"."custom_customer_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD CONSTRAINT "estimate_line_items_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD CONSTRAINT "estimate_line_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_custom_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."custom_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_attachments" ADD CONSTRAINT "inventory_attachments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_attachments" ADD CONSTRAINT "inventory_attachments_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_add_ons" ADD CONSTRAINT "job_add_ons_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_add_ons" ADD CONSTRAINT "job_add_ons_service_add_on_id_service_add_ons_id_fk" FOREIGN KEY ("service_add_on_id") REFERENCES "public"."service_add_ons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_media" ADD CONSTRAINT "job_media_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_media" ADD CONSTRAINT "job_media_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tracking" ADD CONSTRAINT "job_tracking_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_team_member_id_team_members_id_fk" FOREIGN KEY ("assigned_team_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_parent_job_id_jobs_id_fk" FOREIGN KEY ("parent_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_add_ons" ADD CONSTRAINT "service_add_ons_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_usage_counters" ADD CONSTRAINT "task_usage_counters_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_team_member_id_team_members_id_fk" FOREIGN KEY ("assigned_to_team_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_linked_customer_id_customers_id_fk" FOREIGN KEY ("linked_customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_linked_job_id_jobs_id_fk" FOREIGN KEY ("linked_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_availability" ADD CONSTRAINT "team_availability_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_chat_history_company_id" ON "ai_chat_history" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_ai_chat_history_user_id" ON "ai_chat_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_chat_history_created_at" ON "ai_chat_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_company_user_date" ON "ai_usage_counters" USING btree ("company_id","user_id","usage_date");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_counters_company_id" ON "ai_usage_counters" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_company_user" ON "ai_usage_lifetime" USING btree ("company_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_lifetime_company_id" ON "ai_usage_lifetime" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_company_id" ON "audit_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity_type" ON "audit_logs" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_automation_executions_automation_id" ON "automation_executions" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "idx_automation_executions_status" ON "automation_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_automations_company_id" ON "automations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_automations_is_active" ON "automations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_companies_owner" ON "companies" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_companies_slug" ON "companies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_company_settings_company_id" ON "company_settings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_service_restrictions_coupon_id" ON "coupon_service_restrictions" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_usages_coupon_id" ON "coupon_usages" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_usages_customer_id" ON "coupon_usages" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_coupons_company_id" ON "coupons" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_coupons_code" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_company_coupon_code" ON "coupons" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "idx_custom_customer_fields_company_id" ON "custom_customer_fields" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_custom_forms_company_id" ON "custom_forms" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_customer_field_values_customer_id" ON "customer_field_values" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_field_values_field_id" ON "customer_field_values" USING btree ("custom_field_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_customer_custom_field" ON "customer_field_values" USING btree ("customer_id","custom_field_id");--> statement-breakpoint
CREATE INDEX "idx_customers_company_id" ON "customers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_customers_email" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_customers_phone" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_customers_created_at" ON "customers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_estimate_line_items_estimate_id" ON "estimate_line_items" USING btree ("estimate_id");--> statement-breakpoint
CREATE INDEX "idx_estimates_company_id" ON "estimates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_estimates_customer_id" ON "estimates" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_estimates_status" ON "estimates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_form_submissions_form_id" ON "form_submissions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_form_submissions_created_at" ON "form_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_integrations_company_id" ON "integrations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_integrations_type" ON "integrations" USING btree ("integration_type");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_company_integration_type" ON "integrations" USING btree ("company_id","integration_type");--> statement-breakpoint
CREATE INDEX "idx_inventory_attachments_item" ON "inventory_attachments" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_company" ON "inventory_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_name" ON "inventory_items" USING btree ("company_id","name");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_item" ON "inventory_movements" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_company" ON "inventory_movements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_job" ON "inventory_movements" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_line_items_invoice_id" ON "invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_company_id" ON "invoices" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_customer_id" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_job_id" ON "invoices" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_due_date" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_invoices_company_status" ON "invoices" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_job_add_ons_job_id" ON "job_add_ons" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_media_job" ON "job_media" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_media_company" ON "job_media" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_job_tracking_job_id" ON "job_tracking" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_company_id" ON "jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_customer_id" ON "jobs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_service_id" ON "jobs" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_team_member_id" ON "jobs" USING btree ("assigned_team_member_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_scheduled_date" ON "jobs" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_jobs_status" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_jobs_company_date" ON "jobs" USING btree ("company_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_notification_preferences_user_id" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payments_invoice_id" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_payments_company_id" ON "payments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_company_id" ON "reviews" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_customer_id" ON "reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_service_add_ons_service_id" ON "service_add_ons" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_service_categories_company_id" ON "service_categories" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_company_category_slug" ON "service_categories" USING btree ("company_id","slug");--> statement-breakpoint
CREATE INDEX "idx_services_company_id" ON "services" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_services_category_id" ON "services" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_company_service_slug" ON "services" USING btree ("company_id","slug");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_company_id" ON "subscriptions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_stripe_customer_id" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_company_week" ON "task_usage_counters" USING btree ("company_id","week_start");--> statement-breakpoint
CREATE INDEX "idx_task_usage_company_week" ON "task_usage_counters" USING btree ("company_id","week_start");--> statement-breakpoint
CREATE INDEX "idx_tasks_company_id" ON "tasks" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_assigned_to" ON "tasks" USING btree ("assigned_to_team_member_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_team_availability_member_id" ON "team_availability" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_company_id" ON "team_members" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_user_id" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_email" ON "team_members" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles" USING btree ("user_id");