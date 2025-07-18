-- Migration: Add robust RLS policies and triggers for canonical business tables

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['contacts','deals','emails','tasks','notes','tickets','var_leads','users','companies']
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    -- Add updated_at trigger
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl, tbl);
    -- Add table comment
    EXECUTE format('COMMENT ON TABLE %I IS ''Business data table: %s''', tbl, tbl);
  END LOOP;
END$$;

-- Example: contacts (company-level ownership)
-- Only allow users to access contacts from their company
CREATE POLICY contacts_select_own_company ON contacts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.company_id = contacts.company_id
  ));

CREATE POLICY contacts_modify_own_company ON contacts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.company_id = contacts.company_id
  ));

-- Service role bypass
CREATE POLICY contacts_service_role_bypass ON contacts
  FOR ALL TO service_role USING (true);

-- Repeat for other tables (deals, emails, tasks, notes, tickets, var_leads)
-- Example: deals (company-level)
CREATE POLICY deals_select_own_company ON deals
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.company_id = deals.company_id
  ));

CREATE POLICY deals_modify_own_company ON deals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.company_id = deals.company_id
  ));

CREATE POLICY deals_service_role_bypass ON deals
  FOR ALL TO service_role USING (true);

-- Example: tasks (user-level)
CREATE POLICY tasks_select_own ON tasks
  FOR SELECT USING (tasks.user_id = auth.uid());

CREATE POLICY tasks_modify_own ON tasks
  FOR ALL USING (tasks.user_id = auth.uid());

CREATE POLICY tasks_service_role_bypass ON tasks
  FOR ALL TO service_role USING (true);

-- Repeat similar for notes, tickets, var_leads, emails
-- Example: notes (user-level)
CREATE POLICY notes_select_own ON notes
  FOR SELECT USING (notes.user_id = auth.uid());

CREATE POLICY notes_modify_own ON notes
  FOR ALL USING (notes.user_id = auth.uid());

CREATE POLICY notes_service_role_bypass ON notes
  FOR ALL TO service_role USING (true);

-- Example: tickets (user-level)
CREATE POLICY tickets_select_own ON tickets
  FOR SELECT USING (tickets.user_id = auth.uid());

CREATE POLICY tickets_modify_own ON tickets
  FOR ALL USING (tickets.user_id = auth.uid());

CREATE POLICY tickets_service_role_bypass ON tickets
  FOR ALL TO service_role USING (true);

-- Example: var_leads (user-level)
CREATE POLICY var_leads_select_own ON var_leads
  FOR SELECT USING (var_leads.user_id = auth.uid());

CREATE POLICY var_leads_modify_own ON var_leads
  FOR ALL USING (var_leads.user_id = auth.uid());

CREATE POLICY var_leads_service_role_bypass ON var_leads
  FOR ALL TO service_role USING (true);

-- Example: emails (user-level)
CREATE POLICY emails_select_own ON emails
  FOR SELECT USING (emails.user_id = auth.uid());

CREATE POLICY emails_modify_own ON emails
  FOR ALL USING (emails.user_id = auth.uid());

CREATE POLICY emails_service_role_bypass ON emails
  FOR ALL TO service_role USING (true);

-- Example: users (self-access)
CREATE POLICY users_select_self ON users
  FOR SELECT USING (users.id = auth.uid());

CREATE POLICY users_modify_self ON users
  FOR ALL USING (users.id = auth.uid());

CREATE POLICY users_service_role_bypass ON users
  FOR ALL TO service_role USING (true);

-- Example: companies (admin/service role only)
CREATE POLICY companies_service_role_bypass ON companies
  FOR ALL TO service_role USING (true);

COMMENT ON TABLE companies IS 'Business data table: companies (admin/service role access only)'; 