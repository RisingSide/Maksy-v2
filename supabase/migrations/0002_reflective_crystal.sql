ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_terminated_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_created_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "document_comments" DROP CONSTRAINT "document_comments_author_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "document_shares" DROP CONSTRAINT "document_shares_shared_with_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "document_shares" DROP CONSTRAINT "document_shares_shared_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploaded_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_chat_history" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ai_usage_counters" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ai_usage_lifetime" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "owner_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "terminated_by_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "created_by_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "document_comments" ALTER COLUMN "author_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "document_shares" ALTER COLUMN "shared_with_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "document_shares" ALTER COLUMN "shared_by_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "uploaded_by_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "inventory_attachments" ALTER COLUMN "uploaded_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "inventory_movements" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "job_media" ALTER COLUMN "uploaded_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notification_preferences" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "created_by_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "user_id" SET DATA TYPE text;