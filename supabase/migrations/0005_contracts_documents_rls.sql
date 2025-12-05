-- ============================================================================
-- RLS POLICIES FOR CONTRACTS & DOCUMENTS
-- ============================================================================
-- This migration adds Row Level Security policies for the new Contracts and 
-- Documents features, ensuring users can only access their company's data.
-- ============================================================================

-- ======================
-- CONTRACTS
-- ======================

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Users can view their company's contracts
CREATE POLICY "Users can view their company's contracts"
  ON contracts FOR SELECT
  USING (company_id = auth.company_id());

-- Users can create contracts for their company (Pro/Scale only - enforced in app layer)
CREATE POLICY "Users can create contracts for their company"
  ON contracts FOR INSERT
  WITH CHECK (company_id = auth.company_id());

-- Users can update their company's draft contracts
CREATE POLICY "Users can update their company's draft contracts"
  ON contracts FOR UPDATE
  USING (company_id = auth.company_id() AND status = 'draft');

-- Users can delete their company's draft contracts
CREATE POLICY "Users can delete their company's draft contracts"
  ON contracts FOR DELETE
  USING (company_id = auth.company_id() AND status = 'draft');

-- ======================
-- CONTRACT TEMPLATES
-- ======================

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Users can view templates (company-specific + system templates)
CREATE POLICY "Users can view templates (company + system)"
  ON contract_templates FOR SELECT
  USING (company_id = auth.company_id() OR is_system_template = true);

-- Users can create templates for their company
CREATE POLICY "Users can create templates for their company"
  ON contract_templates FOR INSERT
  WITH CHECK (company_id = auth.company_id());

-- Users can update their own templates (not system templates)
CREATE POLICY "Users can update their own templates"
  ON contract_templates FOR UPDATE
  USING (company_id = auth.company_id() AND is_system_template = false);

-- Users can delete their own templates (not system templates)
CREATE POLICY "Users can delete their own templates"
  ON contract_templates FOR DELETE
  USING (company_id = auth.company_id() AND is_system_template = false);

-- ======================
-- CONTRACT SIGNATURES
-- ======================

ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

-- Users can view signatures for their company's contracts
CREATE POLICY "Users can view signatures for their company's contracts"
  ON contract_signatures FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts WHERE company_id = auth.company_id()
    )
  );

-- Signatures are inserted by the system (public signing flow)
-- Users can also manually insert signatures for their contracts
CREATE POLICY "Users can insert signatures for their company's contracts"
  ON contract_signatures FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM contracts WHERE company_id = auth.company_id()
    )
  );

-- ======================
-- CONTRACT ACTIVITY LOG
-- ======================

ALTER TABLE contract_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view activity logs for their company's contracts
CREATE POLICY "Users can view activity logs for their contracts"
  ON contract_activity_log FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts WHERE company_id = auth.company_id()
    )
  );

-- System can insert activity logs
CREATE POLICY "System can insert contract activity logs"
  ON contract_activity_log FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM contracts WHERE company_id = auth.company_id()
    )
  );

-- ======================
-- DOCUMENTS
-- ======================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can view their company's documents
CREATE POLICY "Users can view their company's documents"
  ON documents FOR SELECT
  USING (company_id = auth.company_id());

-- Users can upload documents for their company
CREATE POLICY "Users can upload documents for their company"
  ON documents FOR INSERT
  WITH CHECK (company_id = auth.company_id());

-- Users can update their company's documents
CREATE POLICY "Users can update their company's documents"
  ON documents FOR UPDATE
  USING (company_id = auth.company_id());

-- Users can delete their company's documents
CREATE POLICY "Users can delete their company's documents"
  ON documents FOR DELETE
  USING (company_id = auth.company_id());

-- ======================
-- DOCUMENT SHARES
-- ======================

ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Users can view shares for their company's documents
CREATE POLICY "Users can view shares for their documents"
  ON document_shares FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE company_id = auth.company_id()
    )
  );

-- Users can create shares for their company's documents
CREATE POLICY "Users can create shares for their documents"
  ON document_shares FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE company_id = auth.company_id()
    )
  );

-- Users can update shares for their company's documents
CREATE POLICY "Users can update shares for their documents"
  ON document_shares FOR UPDATE
  USING (
    document_id IN (
      SELECT id FROM documents WHERE company_id = auth.company_id()
    )
  );

-- Users can delete shares for their company's documents
CREATE POLICY "Users can delete shares for their documents"
  ON document_shares FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM documents WHERE company_id = auth.company_id()
    )
  );

-- ======================
-- DOCUMENT COMMENTS
-- ======================

ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on their company's documents
CREATE POLICY "Users can view comments on their documents"
  ON document_comments FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE company_id = auth.company_id()
    )
  );

-- Users can add comments to their company's documents
CREATE POLICY "Users can add comments to their documents"
  ON document_comments FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE company_id = auth.company_id()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON document_comments FOR UPDATE
  USING (author_user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON document_comments FOR DELETE
  USING (author_user_id = auth.uid());

-- ======================
-- DOCUMENT ACTIVITY LOG
-- ======================

ALTER TABLE document_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view activity logs for their company's documents
CREATE POLICY "Users can view activity logs for their documents"
  ON document_activity_log FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE company_id = auth.company_id()
    )
  );

-- System can insert activity logs
CREATE POLICY "System can insert document activity logs"
  ON document_activity_log FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE company_id = auth.company_id()
    )
  );

