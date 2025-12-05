-- Migration: Add deleted_at columns for soft delete functionality
-- Purpose: Add soft delete columns that are defined in Drizzle schema but missing from database
-- Date: 2025-12-04

-- Add deleted_at column to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at column to services table  
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN jobs.deleted_at IS 'Soft delete timestamp - records with this set are considered deleted';
COMMENT ON COLUMN services.deleted_at IS 'Soft delete timestamp - records with this set are considered deleted';
COMMENT ON COLUMN customers.deleted_at IS 'Soft delete timestamp - records with this set are considered deleted';
COMMENT ON COLUMN tasks.deleted_at IS 'Soft delete timestamp - records with this set are considered deleted';

-- Create indexes for soft delete queries (filtering out deleted records)
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON services(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL;

