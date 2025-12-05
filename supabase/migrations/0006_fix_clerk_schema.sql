/**
 * Migration: Fix Schema for Clerk Integration
 * 
 * 1. Change owner_user_id from UUID to TEXT (for Clerk user IDs)
 * 2. Add 'team' plan type to enum (remove 'starter')
 * 
 * CRITICAL: This migration modifies the plan_type enum and owner_user_id type
 * to support Clerk authentication (string user IDs instead of UUIDs)
 */

-- Step 1: Add 'team' value to plan_type enum
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'team';

-- Step 2: Change owner_user_id from UUID to TEXT in companies table
-- This is safe because:
-- - Clerk user IDs are strings (e.g., "user_2abc123xyz")
-- - We're converting UUID to TEXT which is always valid
-- - The column is NOT NULL so no data loss
ALTER TABLE companies 
  ALTER COLUMN owner_user_id TYPE text 
  USING owner_user_id::text;

-- Step 3: Update user_id in user_profiles to TEXT (if not already)
-- This ensures consistency across all user ID columns
ALTER TABLE user_profiles 
  ALTER COLUMN user_id TYPE text 
  USING user_id::text;

-- Step 4: Update user_id in team_members to TEXT (if not already)
ALTER TABLE team_members 
  ALTER COLUMN user_id TYPE text 
  USING user_id::text;

-- Step 5: Update any other user_id references
ALTER TABLE notification_preferences 
  ALTER COLUMN user_id TYPE text 
  USING user_id::text;

ALTER TABLE ai_chat_history 
  ALTER COLUMN user_id TYPE text 
  USING user_id::text;

ALTER TABLE ai_usage_counters 
  ALTER COLUMN user_id TYPE text 
  USING user_id::text;

ALTER TABLE ai_usage_lifetime 
  ALTER COLUMN user_id TYPE text 
  USING user_id::text;

ALTER TABLE audit_logs 
  ALTER COLUMN user_id TYPE text 
  USING user_id::text;

ALTER TABLE tasks 
  ALTER COLUMN created_by_user_id TYPE text 
  USING created_by_user_id::text;

ALTER TABLE contracts 
  ALTER COLUMN created_by_user_id TYPE text 
  USING created_by_user_id::text;

ALTER TABLE contracts 
  ALTER COLUMN terminated_by_user_id TYPE text 
  USING terminated_by_user_id::text;

ALTER TABLE documents 
  ALTER COLUMN uploaded_by_user_id TYPE text 
  USING uploaded_by_user_id::text;

ALTER TABLE document_shares 
  ALTER COLUMN shared_with_user_id TYPE text 
  USING shared_with_user_id::text;

ALTER TABLE document_shares 
  ALTER COLUMN shared_by_user_id TYPE text 
  USING shared_by_user_id::text;

ALTER TABLE document_comments 
  ALTER COLUMN author_user_id TYPE text 
  USING author_user_id::text;

-- Note: We cannot remove 'starter' from the enum if any data uses it
-- If you need to remove 'starter', you must:
-- 1. Update all existing 'starter' subscriptions to another plan
-- 2. Then create a new migration to rebuild the enum without 'starter'

COMMENT ON COLUMN companies.owner_user_id IS 'Clerk user ID (text format like user_2abc123xyz)';
COMMENT ON COLUMN user_profiles.user_id IS 'Clerk user ID (text format like user_2abc123xyz)';
COMMENT ON COLUMN team_members.user_id IS 'Clerk user ID (text format like user_2abc123xyz)';

