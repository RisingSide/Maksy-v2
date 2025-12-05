-- Migration: Add cancel_at_period_end column to subscriptions table
-- Purpose: Track user's intent to cancel at period end (different from canceledAt which is actual termination)
-- Date: 2024-12-04

-- Add cancel_at_period_end column with default false
ALTER TABLE subscriptions 
ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Indicates user intent to cancel at period end. True = will cancel at period end (subscription still active). False = subscription continues. Different from canceled_at which is when subscription was actually terminated.';


