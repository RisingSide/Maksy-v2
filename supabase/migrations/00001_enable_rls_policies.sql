/**
 * Row Level Security Policies
 * 
 * This migration enables RLS on all tables and creates policies
 * that ensure users can only access their own company's data.
 * 
 * Policy Pattern:
 * - SELECT: Users can view data from their company
 * - INSERT: Users can insert data for their company
 * - UPDATE: Users can update data from their company
 * - DELETE: Usually restricted to owners/admins only
 */

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_customer_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_service_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_lifetime ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COMPANIES
-- ============================================================================

CREATE POLICY "Users can view their company"
  ON companies FOR SELECT
  USING (auth.belongs_to_company(id));

CREATE POLICY "Owners can update their company"
  ON companies FOR UPDATE
  USING (auth.is_company_owner(id));

CREATE POLICY "Owners can insert companies"
  ON companies FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

-- ============================================================================
-- COMPANY SETTINGS
-- ============================================================================

CREATE POLICY "Users can view their company settings"
  ON company_settings FOR SELECT
  USING (auth.belongs_to_company(company_id));

CREATE POLICY "Admins can update company settings"
  ON company_settings FOR UPDATE
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Owners can insert company settings"
  ON company_settings FOR INSERT
  WITH CHECK (auth.belongs_to_company(company_id));

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

CREATE POLICY "Users can view their subscription"
  ON subscriptions FOR SELECT
  USING (auth.belongs_to_company(company_id));

CREATE POLICY "Owners can manage subscription"
  ON subscriptions FOR ALL
  USING (auth.is_company_owner(company_id));

-- ============================================================================
-- TEAM MEMBERS
-- ============================================================================

CREATE POLICY "Users can view team members in their company"
  ON team_members FOR SELECT
  USING (auth.belongs_to_company(company_id));

CREATE POLICY "Admins can invite team members"
  ON team_members FOR INSERT
  WITH CHECK (auth.is_admin_or_owner(company_id));

CREATE POLICY "Admins can update team members"
  ON team_members FOR UPDATE
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Owners can delete team members"
  ON team_members FOR DELETE
  USING (auth.is_company_owner(company_id));

-- ============================================================================
-- TEAM AVAILABILITY
-- ============================================================================

CREATE POLICY "Users can view team availability"
  ON team_availability FOR SELECT
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE auth.belongs_to_company(company_id)
    )
  );

CREATE POLICY "Team members can manage own availability"
  ON team_availability FOR ALL
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CUSTOMERS
-- ============================================================================

CREATE POLICY "Users can view company customers"
  ON customers FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can insert company customers"
  ON customers FOR INSERT
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "Users can update company customers"
  ON customers FOR UPDATE
  USING (company_id = auth.company_id());

CREATE POLICY "Admins can delete company customers"
  ON customers FOR DELETE
  USING (auth.is_admin_or_owner(company_id));

-- ============================================================================
-- CUSTOM CUSTOMER FIELDS
-- ============================================================================

CREATE POLICY "Users can view custom fields"
  ON custom_customer_fields FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Admins can manage custom fields"
  ON custom_customer_fields FOR ALL
  USING (auth.is_admin_or_owner(company_id));

-- ============================================================================
-- CUSTOMER FIELD VALUES
-- ============================================================================

CREATE POLICY "Users can view field values"
  ON customer_field_values FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE company_id = auth.company_id()
    )
  );

CREATE POLICY "Users can manage field values"
  ON customer_field_values FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE company_id = auth.company_id()
    )
  );

-- ============================================================================
-- SERVICES
-- ============================================================================

CREATE POLICY "Users can view company services"
  ON services FOR SELECT
  USING (company_id = auth.company_id() OR is_public = true);

CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Admins can manage service categories"
  ON service_categories FOR ALL
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Users can view service categories"
  ON service_categories FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Admins can manage service add-ons"
  ON service_add_ons FOR ALL
  USING (
    service_id IN (
      SELECT id FROM services WHERE auth.is_admin_or_owner(company_id)
    )
  );

CREATE POLICY "Users can view service add-ons"
  ON service_add_ons FOR SELECT
  USING (
    service_id IN (
      SELECT id FROM services WHERE company_id = auth.company_id()
    )
  );

-- ============================================================================
-- JOBS
-- ============================================================================

CREATE POLICY "Users can view company jobs"
  ON jobs FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can create company jobs"
  ON jobs FOR INSERT
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "Users can update company jobs"
  ON jobs FOR UPDATE
  USING (company_id = auth.company_id());

CREATE POLICY "Admins can delete jobs"
  ON jobs FOR DELETE
  USING (auth.is_admin_or_owner(company_id));

-- Job-related tables
CREATE POLICY "Users can view job add-ons"
  ON job_add_ons FOR SELECT
  USING (job_id IN (SELECT id FROM jobs WHERE company_id = auth.company_id()));

CREATE POLICY "Users can manage job add-ons"
  ON job_add_ons FOR ALL
  USING (job_id IN (SELECT id FROM jobs WHERE company_id = auth.company_id()));

CREATE POLICY "Users can view job tracking"
  ON job_tracking FOR SELECT
  USING (job_id IN (SELECT id FROM jobs WHERE company_id = auth.company_id()));

CREATE POLICY "Users can manage job tracking"
  ON job_tracking FOR ALL
  USING (job_id IN (SELECT id FROM jobs WHERE company_id = auth.company_id()));

CREATE POLICY "Users can view job media"
  ON job_media FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can upload job media"
  ON job_media FOR INSERT
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "Users can delete job media"
  ON job_media FOR DELETE
  USING (company_id = auth.company_id());

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE POLICY "Users can view company tasks"
  ON tasks FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  USING (company_id = auth.company_id());

CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE
  USING (company_id = auth.company_id());

CREATE POLICY "Company can view task usage counters"
  ON task_usage_counters FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Company can manage task usage counters"
  ON task_usage_counters FOR ALL
  USING (company_id = auth.company_id());

-- ============================================================================
-- INVENTORY
-- ============================================================================

CREATE POLICY "Users can view inventory items"
  ON inventory_items FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can manage inventory items"
  ON inventory_items FOR ALL
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Users can view inventory movements"
  ON inventory_movements FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can create inventory movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "Users can view inventory attachments"
  ON inventory_attachments FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can manage inventory attachments"
  ON inventory_attachments FOR ALL
  USING (company_id = auth.company_id());

-- ============================================================================
-- FINANCIAL (Estimates, Invoices, Payments)
-- ============================================================================

CREATE POLICY "Users can view estimates"
  ON estimates FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can manage estimates"
  ON estimates FOR ALL
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Users can view estimate line items"
  ON estimate_line_items FOR SELECT
  USING (estimate_id IN (SELECT id FROM estimates WHERE company_id = auth.company_id()));

CREATE POLICY "Users can manage estimate line items"
  ON estimate_line_items FOR ALL
  USING (estimate_id IN (SELECT id FROM estimates WHERE company_id = auth.company_id()));

CREATE POLICY "Users can view invoices"
  ON invoices FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can manage invoices"
  ON invoices FOR ALL
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Users can view invoice line items"
  ON invoice_line_items FOR SELECT
  USING (invoice_id IN (SELECT id FROM invoices WHERE company_id = auth.company_id()));

CREATE POLICY "Users can manage invoice line items"
  ON invoice_line_items FOR ALL
  USING (invoice_id IN (SELECT id FROM invoices WHERE company_id = auth.company_id()));

CREATE POLICY "Users can view payments"
  ON payments FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can record payments"
  ON payments FOR INSERT
  WITH CHECK (company_id = auth.company_id());

-- ============================================================================
-- COUPONS
-- ============================================================================

CREATE POLICY "Users can view coupons"
  ON coupons FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Users can view coupon restrictions"
  ON coupon_service_restrictions FOR SELECT
  USING (coupon_id IN (SELECT id FROM coupons WHERE company_id = auth.company_id()));

CREATE POLICY "Admins can manage coupon restrictions"
  ON coupon_service_restrictions FOR ALL
  USING (coupon_id IN (SELECT id FROM coupons WHERE auth.is_admin_or_owner(company_id)));

CREATE POLICY "Users can view coupon usages"
  ON coupon_usages FOR SELECT
  USING (coupon_id IN (SELECT id FROM coupons WHERE company_id = auth.company_id()));

CREATE POLICY "System can record coupon usages"
  ON coupon_usages FOR INSERT
  WITH CHECK (coupon_id IN (SELECT id FROM coupons WHERE company_id = auth.company_id()));

-- ============================================================================
-- AUTOMATIONS
-- ============================================================================

CREATE POLICY "Users can view automations"
  ON automations FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Admins can manage automations"
  ON automations FOR ALL
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Users can view automation executions"
  ON automation_executions FOR SELECT
  USING (automation_id IN (SELECT id FROM automations WHERE company_id = auth.company_id()));

CREATE POLICY "System can log automation executions"
  ON automation_executions FOR INSERT
  WITH CHECK (automation_id IN (SELECT id FROM automations WHERE company_id = auth.company_id()));

-- ============================================================================
-- FORMS
-- ============================================================================

CREATE POLICY "Users can view custom forms"
  ON custom_forms FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Admins can manage custom forms"
  ON custom_forms FOR ALL
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Users can view form submissions"
  ON form_submissions FOR SELECT
  USING (form_id IN (SELECT id FROM custom_forms WHERE company_id = auth.company_id()));

-- Public can submit forms (handled at API level)
CREATE POLICY "Anyone can submit forms"
  ON form_submissions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- INTEGRATIONS & NOTIFICATIONS
-- ============================================================================

CREATE POLICY "Users can view integrations"
  ON integrations FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Admins can manage integrations"
  ON integrations FOR ALL
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- AI FEATURES
-- ============================================================================

CREATE POLICY "Users can view company AI chat history"
  ON ai_chat_history FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "Users can create AI chat messages"
  ON ai_chat_history FOR INSERT
  WITH CHECK (company_id = auth.company_id() AND user_id = auth.uid());

CREATE POLICY "Users can view own AI usage counters"
  ON ai_usage_counters FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "System can manage AI usage counters"
  ON ai_usage_counters FOR ALL
  USING (company_id = auth.company_id());

CREATE POLICY "Users can view own AI usage lifetime"
  ON ai_usage_lifetime FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "System can manage AI usage lifetime"
  ON ai_usage_lifetime FOR ALL
  USING (company_id = auth.company_id());

-- ============================================================================
-- AUDIT & REVIEWS
-- ============================================================================

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth.is_admin_or_owner(company_id));

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY "Users can view reviews"
  ON reviews FOR SELECT
  USING (company_id = auth.company_id());

CREATE POLICY "System can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (company_id = auth.company_id());

