-- Migration: Add business_hours column to company_settings table
-- Purpose: Store per-day business hours configuration for booking page
-- Date: 2024-12-04

-- Add business_hours column as JSONB with default business hours
ALTER TABLE company_settings 
ADD COLUMN business_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "17:00", "enabled": true},
  "tuesday": {"open": "09:00", "close": "17:00", "enabled": true},
  "wednesday": {"open": "09:00", "close": "17:00", "enabled": true},
  "thursday": {"open": "09:00", "close": "17:00", "enabled": true},
  "friday": {"open": "09:00", "close": "17:00", "enabled": true},
  "saturday": {"open": "09:00", "close": "17:00", "enabled": false},
  "sunday": {"open": "09:00", "close": "17:00", "enabled": false}
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN company_settings.business_hours IS 'Per-day business hours configuration. Each day has open/close times and enabled flag.';


