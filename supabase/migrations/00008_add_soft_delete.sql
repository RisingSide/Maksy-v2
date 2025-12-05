-- Migration: Add soft delete support to core entities
-- Purpose: Allow soft deletion (archiving) instead of permanent deletion
-- Date: 2025-12-04

-- Add deleted_at column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to estimates table
ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create indexes for efficient filtering of non-deleted records
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_deleted_at ON estimates(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON services(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON contracts(deleted_at) WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN customers.deleted_at IS 'Timestamp when the record was soft deleted. NULL means active.';
COMMENT ON COLUMN jobs.deleted_at IS 'Timestamp when the record was soft deleted. NULL means active.';
COMMENT ON COLUMN invoices.deleted_at IS 'Timestamp when the record was soft deleted. NULL means active.';
COMMENT ON COLUMN estimates.deleted_at IS 'Timestamp when the record was soft deleted. NULL means active.';
COMMENT ON COLUMN services.deleted_at IS 'Timestamp when the record was soft deleted. NULL means active.';
COMMENT ON COLUMN tasks.deleted_at IS 'Timestamp when the record was soft deleted. NULL means active.';
COMMENT ON COLUMN contracts.deleted_at IS 'Timestamp when the record was soft deleted. NULL means active.';

