-- Migration: Add onboarding progress tracking
-- Purpose: Track user onboarding completion for Stripe-style setup tracker and Maksy-guided tour
-- Date: 2025-11-30

-- Create onboarding_progress table
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Phase 1: Critical onboarding (blocking)
  critical_completed BOOLEAN NOT NULL DEFAULT FALSE,
  critical_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Phase 2: Setup tasks (non-blocking, progressive)
  tasks_completed JSONB NOT NULL DEFAULT '{
    "add_services": false,
    "import_customers": false,
    "create_first_job": false,
    "connect_stripe": false,
    "customize_booking_page": false,
    "add_team_members": false,
    "setup_automation": false
  }'::jsonb,
  
  -- Progress tracking
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Tour mode preference
  tour_mode TEXT NOT NULL DEFAULT 'pending' 
    CHECK (tour_mode IN ('pending', 'guided', 'checklist', 'completed', 'dismissed')),
  
  -- Timestamps
  dismissed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_onboarding_progress_company_id ON onboarding_progress(company_id);
CREATE INDEX idx_onboarding_progress_critical_completed ON onboarding_progress(critical_completed);
CREATE INDEX idx_onboarding_progress_completion ON onboarding_progress(completion_percentage);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE onboarding_progress IS 'Tracks user onboarding progress for Stripe-style setup tracker and Maksy-guided tour';
COMMENT ON COLUMN onboarding_progress.critical_completed IS 'Whether Phase 1 (required info) is complete';
COMMENT ON COLUMN onboarding_progress.tasks_completed IS 'JSON object tracking completion of optional setup tasks';
COMMENT ON COLUMN onboarding_progress.tour_mode IS 'User preference: pending, guided (Maksy chat), checklist (self-paced), completed, or dismissed';
COMMENT ON COLUMN onboarding_progress.completion_percentage IS 'Overall setup completion (0-100)';

-- Add stripe_connected field to company_settings if it doesn't exist
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN company_settings.stripe_connected IS 'Whether Stripe account is connected for payment processing';

