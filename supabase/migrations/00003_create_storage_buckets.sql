-- Migration: Create Storage Buckets
-- Purpose: Set up Supabase Storage buckets for file uploads
-- Date: 2025-12-02

-- Note: This migration must be run with superuser/service_role permissions
-- Run via Supabase Dashboard > SQL Editor, or supabase db push

-- ============================================
-- PUBLIC BUCKETS (accessible via public URLs)
-- ============================================

-- Company Logos (public, 2MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Company Cover Images (public, 5MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-covers',
  'company-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Service Icons (public, 1MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-icons',
  'service-icons',
  true,
  1048576, -- 1MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- PRIVATE BUCKETS (require signed URLs)
-- ============================================

-- Job Media - photos/videos (private, 10MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-media',
  'job-media',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Inventory Attachments (private, 10MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-attachments',
  'inventory-attachments',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Invoice PDFs (private, 5MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-pdfs',
  'invoice-pdfs',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Contract Signatures (private, 1MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-signatures',
  'contract-signatures',
  false,
  1048576, -- 1MB
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Documents (private, 25MB max, all common types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  26214400, -- 25MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES (RLS for storage)
-- ============================================

-- Policy: Company logos - public read, authenticated write for own company
CREATE POLICY "Public read company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Company members can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM team_members 
    WHERE user_id = auth.uid()::text 
    LIMIT 1
  )
);

CREATE POLICY "Company members can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM team_members 
    WHERE user_id = auth.uid()::text 
    LIMIT 1
  )
);

-- Policy: Service icons - public read, authenticated write for own company
CREATE POLICY "Public read service icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-icons');

CREATE POLICY "Company members can upload service icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-icons'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM team_members 
    WHERE user_id = auth.uid()::text 
    LIMIT 1
  )
);

-- Policy: Job media - company members only
CREATE POLICY "Company members can read job media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'job-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM team_members 
    WHERE user_id = auth.uid()::text 
    LIMIT 1
  )
);

CREATE POLICY "Company members can upload job media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'job-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM team_members 
    WHERE user_id = auth.uid()::text 
    LIMIT 1
  )
);

CREATE POLICY "Company members can delete job media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'job-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM team_members 
    WHERE user_id = auth.uid()::text 
    LIMIT 1
  )
);

-- Policy: Documents - company members only
CREATE POLICY "Company members can read documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM team_members 
    WHERE user_id = auth.uid()::text 
    LIMIT 1
  )
);

CREATE POLICY "Company members can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM team_members 
    WHERE user_id = auth.uid()::text 
    LIMIT 1
  )
);

CREATE POLICY "Company members can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text FROM team_members 
    WHERE user_id = auth.uid()::text 
    LIMIT 1
  )
);

-- Add comment
COMMENT ON SCHEMA storage IS 'Storage buckets configured: company-logos, company-covers, service-icons (public), job-media, inventory-attachments, invoice-pdfs, contract-signatures, documents (private)';

