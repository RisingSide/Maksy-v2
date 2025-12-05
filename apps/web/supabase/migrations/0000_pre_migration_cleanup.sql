/**
 * Pre-Migration Cleanup
 * 
 * CRITICAL: Run this BEFORE applying 0000_wandering_hannibal_king.sql
 * 
 * This script:
 * 1. Migrates existing 'starter' plan subscriptions to 'pro'
 * 2. Ensures data integrity before enum modification
 * 3. Logs migration statistics
 */

DO $$
DECLARE
  starter_count INTEGER;
  migrated_count INTEGER;
BEGIN
  -- Check if plan_type enum exists and has 'starter'
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'plan_type' AND e.enumlabel = 'starter'
  ) THEN
    
    -- Count current starter subscriptions
    SELECT COUNT(*) INTO starter_count
    FROM subscriptions 
    WHERE plan_type = 'starter';
    
    RAISE NOTICE 'Found % starter subscriptions to migrate', starter_count;
    
    -- Migrate all starter subscriptions to pro
    UPDATE subscriptions 
    SET plan_type = 'pro',
        updated_at = NOW()
    WHERE plan_type = 'starter';
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    
    RAISE NOTICE 'Successfully migrated % subscriptions from starter to pro', migrated_count;
    
    -- Verify migration
    IF migrated_count != starter_count THEN
      RAISE WARNING 'Migration count mismatch! Expected: %, Actual: %', starter_count, migrated_count;
    ELSE
      RAISE NOTICE '✓ All starter subscriptions successfully migrated to pro';
    END IF;
    
  ELSE
    RAISE NOTICE 'No starter enum value found - migration not needed or already completed';
  END IF;
  
  -- Additional safety check: ensure no orphaned starter references
  IF EXISTS (SELECT 1 FROM subscriptions WHERE plan_type = 'starter') THEN
    RAISE EXCEPTION 'MIGRATION FAILED: Found remaining starter subscriptions after migration!';
  END IF;
  
  RAISE NOTICE '✓ Pre-migration cleanup completed successfully';
  
END $$;

-- Log this migration in audit trail (if audit_logs table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    INSERT INTO audit_logs (
      company_id,
      user_id,
      action,
      entity_type,
      changes,
      created_at
    ) VALUES (
      NULL,
      NULL,
      'SYSTEM_MIGRATION',
      'subscriptions',
      jsonb_build_object(
        'migration', 'pre_cleanup',
        'action', 'starter_to_pro_migration',
        'timestamp', NOW()
      ),
      NOW()
    );
  END IF;
END $$;

