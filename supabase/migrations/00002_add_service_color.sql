-- Migration: Add color field to services table
-- Purpose: Allow users to assign custom colors to services for charts/labels/identification
-- Date: 2025-11-15

-- Add color column to services table with default brand orange
ALTER TABLE services 
ADD COLUMN color TEXT NOT NULL DEFAULT '#f4a125';

-- Add comment for documentation
COMMENT ON COLUMN services.color IS 'Hex color code for service identification in charts, labels, and UI elements';

