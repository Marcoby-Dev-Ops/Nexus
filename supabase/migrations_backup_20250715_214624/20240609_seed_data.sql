-- Migration: Seed minimal data for MVP testing and onboarding

-- 1. Companies
INSERT INTO companies (id, name, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Globex Inc', NOW(), NOW());

-- 2. Users
INSERT INTO users (id, company_id, email, full_name, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'alice@acme.com', 'Alice Example', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'bob@acme.com', 'Bob Example', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'carol@globex.com', 'Carol Example', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'dave@globex.com', 'Dave Example', NOW(), NOW());

-- 3. Contacts
INSERT INTO contacts (id, company_id, user_id, email, first_name, last_name, created_at, updated_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'contact1@acme.com', 'Contact', 'One', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'contact2@globex.com', 'Contact', 'Two', NOW(), NOW());

-- 4. Deals
INSERT INTO deals (id, company_id, user_id, name, amount, stage, created_at, updated_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Big Deal', 10000, 'prospecting', NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Huge Deal', 20000, 'negotiation', NOW(), NOW());

-- 5. Emails
INSERT INTO emails (id, user_id, subject, body, created_at, updated_at)
VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Welcome!', 'Welcome to Acme Corp!', NOW(), NOW()),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Hello!', 'Hello from Globex Inc!', NOW(), NOW());

-- 6. Tasks
INSERT INTO tasks (id, user_id, title, status, created_at, updated_at)
VALUES
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Follow up with Contact One', 'open', NOW(), NOW()),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Prepare proposal', 'in_progress', NOW(), NOW());

-- 7. Notes
INSERT INTO notes (id, user_id, content, created_at, updated_at)
VALUES
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Met with Contact One.', NOW(), NOW()),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Globex kickoff call scheduled.', NOW(), NOW());

-- 8. Tickets
INSERT INTO tickets (id, user_id, subject, status, created_at, updated_at)
VALUES
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Login issue', 'open', NOW(), NOW()),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Feature request', 'closed', NOW(), NOW());

-- 9. VAR Leads
INSERT INTO var_leads (id, user_id, lead_name, created_at, updated_at)
VALUES
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'VAR Lead Alpha', NOW(), NOW()),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'VAR Lead Beta', NOW(), NOW()); 