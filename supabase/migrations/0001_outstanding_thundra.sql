CREATE TYPE "public"."contract_status" AS ENUM('draft', 'pending', 'signed', 'active', 'expired', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('proposal', 'service_agreement', 'waiver', 'nda', 'custom');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('pdf', 'image', 'spreadsheet', 'word', 'video', 'other');--> statement-breakpoint
CREATE TABLE "contract_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" uuid,
	"actor_name" text,
	"actor_ip" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"signer_type" text NOT NULL,
	"signer_name" text NOT NULL,
	"signer_email" text,
	"signer_role" text,
	"signature_image_url" text NOT NULL,
	"signature_method" text NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"signed_by_ip" text,
	"signed_by_user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"template_type" text NOT NULL,
	"is_system_template" boolean DEFAULT false,
	"content_json" jsonb NOT NULL,
	"content_html" text NOT NULL,
	"thumbnail_url" text,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"title" text NOT NULL,
	"contract_type" "contract_type" NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"content_json" jsonb NOT NULL,
	"content_html" text NOT NULL,
	"merge_fields" jsonb,
	"contract_value" numeric(12, 2),
	"start_date" date,
	"end_date" date,
	"expiration_date" date,
	"auto_renew" boolean DEFAULT false,
	"linked_job_id" uuid,
	"linked_estimate_id" uuid,
	"template_id" uuid,
	"sent_at" timestamp with time zone,
	"sent_via" text,
	"signing_token" text,
	"signing_token_expires_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"viewed_by_ip" text,
	"signed_at" timestamp with time zone,
	"signed_by_ip" text,
	"terminated_at" timestamp with time zone,
	"terminated_by_user_id" uuid,
	"termination_reason" text,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contracts_signing_token_unique" UNIQUE("signing_token")
);
--> statement-breakpoint
CREATE TABLE "document_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" uuid,
	"actor_name" text,
	"actor_ip" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"comment_text" text NOT NULL,
	"parent_comment_id" uuid,
	"author_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"shared_with_user_id" uuid,
	"shared_with_email" text,
	"access_level" text DEFAULT 'view',
	"shared_by_user_id" uuid NOT NULL,
	"shared_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"file_type" "document_type" NOT NULL,
	"file_extension" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"storage_path" text NOT NULL,
	"storage_url" text NOT NULL,
	"folder_path" text DEFAULT '/',
	"tags" text[],
	"linked_customer_id" uuid,
	"linked_job_id" uuid,
	"linked_invoice_id" uuid,
	"linked_estimate_id" uuid,
	"linked_contract_id" uuid,
	"extracted_text" text,
	"ai_suggested_tags" text[],
	"version_number" integer DEFAULT 1,
	"parent_document_id" uuid,
	"is_latest_version" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"public_share_token" text,
	"public_share_expires_at" timestamp with time zone,
	"public_share_password_hash" text,
	"uploaded_by_user_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp with time zone,
	CONSTRAINT "documents_public_share_token_unique" UNIQUE("public_share_token")
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "color" text DEFAULT '#f4a125' NOT NULL;--> statement-breakpoint
ALTER TABLE "contract_activity_log" ADD CONSTRAINT "contract_activity_log_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_linked_job_id_jobs_id_fk" FOREIGN KEY ("linked_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_linked_estimate_id_estimates_id_fk" FOREIGN KEY ("linked_estimate_id") REFERENCES "public"."estimates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_template_id_contract_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."contract_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_terminated_by_user_id_users_id_fk" FOREIGN KEY ("terminated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_activity_log" ADD CONSTRAINT "document_activity_log_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_parent_comment_id_document_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."document_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_by_user_id_users_id_fk" FOREIGN KEY ("shared_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_linked_customer_id_customers_id_fk" FOREIGN KEY ("linked_customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_linked_job_id_jobs_id_fk" FOREIGN KEY ("linked_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_linked_invoice_id_invoices_id_fk" FOREIGN KEY ("linked_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_linked_estimate_id_estimates_id_fk" FOREIGN KEY ("linked_estimate_id") REFERENCES "public"."estimates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_linked_contract_id_contracts_id_fk" FOREIGN KEY ("linked_contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_parent_document_id_documents_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contract_activity_log_contract_id" ON "contract_activity_log" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_contract_signatures_contract_id" ON "contract_signatures" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_contract_templates_company_id" ON "contract_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_company_id" ON "contracts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_customer_id" ON "contracts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_status" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contracts_signing_token" ON "contracts" USING btree ("signing_token");--> statement-breakpoint
CREATE INDEX "idx_document_activity_log_document_id" ON "document_activity_log" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_document_comments_document_id" ON "document_comments" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_document_shares_document_id" ON "document_shares" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_documents_company_id" ON "documents" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_documents_linked_customer_id" ON "documents" USING btree ("linked_customer_id");--> statement-breakpoint
CREATE INDEX "idx_documents_linked_job_id" ON "documents" USING btree ("linked_job_id");--> statement-breakpoint
CREATE INDEX "idx_documents_linked_invoice_id" ON "documents" USING btree ("linked_invoice_id");--> statement-breakpoint
CREATE INDEX "idx_documents_folder_path" ON "documents" USING btree ("folder_path");--> statement-breakpoint
CREATE INDEX "idx_documents_public_share_token" ON "documents" USING btree ("public_share_token");