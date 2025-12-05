CREATE TABLE "onboarding_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"critical_completed" boolean DEFAULT false NOT NULL,
	"critical_completed_at" timestamp with time zone,
	"tasks_completed" jsonb DEFAULT '{"add_services":false,"import_customers":false,"create_first_job":false,"connect_stripe":false,"customize_booking_page":false,"add_team_members":false,"setup_automation":false}'::jsonb NOT NULL,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"tour_mode" text DEFAULT 'pending' NOT NULL,
	"dismissed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_progress_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "stripe_connected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_onboarding_progress_company_id" ON "onboarding_progress" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_onboarding_progress_critical_completed" ON "onboarding_progress" USING btree ("critical_completed");--> statement-breakpoint
CREATE INDEX "idx_onboarding_progress_completion" ON "onboarding_progress" USING btree ("completion_percentage");