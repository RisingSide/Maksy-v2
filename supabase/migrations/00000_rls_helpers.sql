/**
 * RLS Helper Functions
 * 
 * CRITICAL: These functions are used by Row Level Security policies.
 * 
 * auth.company_id() - Returns the company_id for the current user
 * - First checks team_members table
 * - Falls back to companies.owner_user_id
 * - This ensures both owners and team members can access their company data
 */

-- Helper function to get company_id for current user
CREATE OR REPLACE FUNCTION auth.company_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    -- First try to find company via team_members
    (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active' LIMIT 1),
    -- Fallback to owner_user_id in companies table
    (SELECT id FROM companies WHERE owner_user_id = auth.uid() LIMIT 1)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if user is company owner
CREATE OR REPLACE FUNCTION auth.is_company_owner(check_company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies 
    WHERE id = check_company_id 
    AND owner_user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if user is admin or owner
CREATE OR REPLACE FUNCTION auth.is_admin_or_owner(check_company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    -- Check if owner
    SELECT 1 FROM companies 
    WHERE id = check_company_id 
    AND owner_user_id = auth.uid()
  ) OR EXISTS (
    -- Check if admin team member
    SELECT 1 FROM team_members
    WHERE company_id = check_company_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if user belongs to company
CREATE OR REPLACE FUNCTION auth.belongs_to_company(check_company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    -- Check if owner
    SELECT 1 FROM companies 
    WHERE id = check_company_id 
    AND owner_user_id = auth.uid()
  ) OR EXISTS (
    -- Check if team member
    SELECT 1 FROM team_members
    WHERE company_id = check_company_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auth.company_id() IS 'Returns the company_id for the current authenticated user. Checks both team_members and company ownership.';
COMMENT ON FUNCTION auth.is_company_owner(uuid) IS 'Returns true if the current user owns the specified company.';
COMMENT ON FUNCTION auth.is_admin_or_owner(uuid) IS 'Returns true if the current user is an owner or admin of the specified company.';
COMMENT ON FUNCTION auth.belongs_to_company(uuid) IS 'Returns true if the current user belongs to the specified company (owner or active team member).';

