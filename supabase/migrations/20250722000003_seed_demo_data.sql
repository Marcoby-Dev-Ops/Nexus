-- Seed Demo Data Migration
-- This migration adds comprehensive demo data for testing and demonstration

-- Enable demo mode in environment
INSERT INTO public.environment_config (key, value, description)
VALUES 
  ('demo_mode_enabled', 'true', 'Enable demo mode for testing'),
  ('demo_accounts_enabled', 'true', 'Enable demo account access')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Insert demo users (if they don't exist)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  email, 
  crypt('demo123', gen_salt('bf')), 
  NOW(), 
  NOW(), 
  NOW()
FROM (VALUES 
  ('admin@nexus-demo.com'),
  ('manager@nexus-demo.com'),
  ('user@nexus-demo.com')
) AS demo_users(email)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.email = demo_users.email
);

-- Insert demo user profiles (using the user IDs from above)
INSERT INTO public.user_profiles (id, full_name, avatar_url, role, created_at, updated_at)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'admin@nexus-demo.com' THEN 'Sarah Johnson'
    WHEN u.email = 'manager@nexus-demo.com' THEN 'Michael Chen'
    WHEN u.email = 'user@nexus-demo.com' THEN 'Emily Rodriguez'
  END,
  CASE 
    WHEN u.email = 'admin@nexus-demo.com' THEN '👩‍💼'
    WHEN u.email = 'manager@nexus-demo.com' THEN '👨‍💼'
    WHEN u.email = 'user@nexus-demo.com' THEN '👩‍💻'
  END,
  CASE 
    WHEN u.email = 'admin@nexus-demo.com' THEN 'admin'
    WHEN u.email = 'manager@nexus-demo.com' THEN 'manager'
    WHEN u.email = 'user@nexus-demo.com' THEN 'member'
  END,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN ('admin@nexus-demo.com', 'manager@nexus-demo.com', 'user@nexus-demo.com')
ON CONFLICT (id) DO NOTHING;

-- Insert demo company
INSERT INTO public.companies (id, name, industry, size, employee_count, founded, headquarters, mrr, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Nexus Technologies',
  'Technology',
  'medium',
  85,
  '2018',
  'San Francisco, CA',
  2500000.00,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies WHERE name = 'Nexus Technologies'
);

-- Insert demo company memberships (using the actual user and company IDs)
INSERT INTO public.company_members (id, company_id, user_id, role, permissions, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  u.id,
  CASE 
    WHEN u.email = 'admin@nexus-demo.com' THEN 'admin'
    WHEN u.email = 'manager@nexus-demo.com' THEN 'manager'
    WHEN u.email = 'user@nexus-demo.com' THEN 'member'
  END,
  CASE 
    WHEN u.email = 'admin@nexus-demo.com' THEN ARRAY['admin', 'manage_users', 'view_analytics', 'manage_integrations']
    WHEN u.email = 'manager@nexus-demo.com' THEN ARRAY['view_analytics', 'manage_team', 'view_reports']
    WHEN u.email = 'user@nexus-demo.com' THEN ARRAY['view_dashboard', 'use_ai', 'view_own_data']
  END,
  NOW(),
  NOW()
FROM auth.users u
CROSS JOIN public.companies c
WHERE u.email IN ('admin@nexus-demo.com', 'manager@nexus-demo.com', 'user@nexus-demo.com')
  AND c.name = 'Nexus Technologies'
ON CONFLICT (company_id, user_id) DO NOTHING;

-- Insert demo integrations
INSERT INTO public.integrations (id, name, slug, category, description, is_active, created_at)
SELECT 
  gen_random_uuid(),
  integration_name,
  integration_slug,
  integration_category,
  integration_description,
  integration_active,
  NOW()
FROM (
  VALUES 
    ('HubSpot CRM', 'hubspot', 'crm', 'Customer relationship management platform', true),
    ('Salesforce', 'salesforce', 'crm', 'Enterprise CRM solution', true),
    ('Google Analytics', 'google-analytics', 'analytics', 'Web analytics platform', true),
    ('Slack', 'slack', 'communication', 'Team communication platform', false)
) AS demo_integrations(integration_name, integration_slug, integration_category, integration_description, integration_active)
ON CONFLICT (slug) DO NOTHING;

-- Insert demo analytics data (using the actual company and user IDs)
INSERT INTO public.analytics_events (id, company_id, event_type, event_data, user_id, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  demo_events.event_type,
  demo_events.event_data::jsonb,
  u.id,
  demo_events.created_at
FROM public.companies c
CROSS JOIN auth.users u
CROSS JOIN (
  VALUES 
    ('page_view', '{"page": "/dashboard", "duration": 120}', NOW() - INTERVAL '1 day'),
    ('ai_conversation', '{"agent": "business_assistant", "duration": 300}', NOW() - INTERVAL '2 hours'),
    ('integration_sync', '{"integration": "hubspot", "records_synced": 150}', NOW() - INTERVAL '30 minutes')
) AS demo_events(event_type, event_data, created_at)
WHERE c.name = 'Nexus Technologies'
  AND u.email = 'admin@nexus-demo.com'
ON CONFLICT DO NOTHING;

-- Insert demo AI conversations (using the actual user IDs)
INSERT INTO public.ai_conversations (id, user_id, title, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  'Business Process Improvement Discussion',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
FROM auth.users u
WHERE u.email = 'admin@nexus-demo.com'
ON CONFLICT DO NOTHING;

-- Insert demo tasks (using the actual user IDs)
INSERT INTO public.tasks (id, assigned_to, created_by, title, description, status, priority, due_date, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  u.id,
  task_title,
  task_description,
  task_status,
  task_priority,
  task_due_date,
  NOW(),
  NOW()
FROM auth.users u
CROSS JOIN (
  VALUES 
    ('admin@nexus-demo.com', 'Review Q4 Analytics', 'Analyze performance metrics and prepare quarterly report', 'in_progress', 'high', NOW() + INTERVAL '3 days'),
    ('manager@nexus-demo.com', 'Update Integration Settings', 'Configure new HubSpot integration settings', 'todo', 'medium', NOW() + INTERVAL '1 week'),
    ('user@nexus-demo.com', 'Complete Onboarding', 'Finish new user onboarding process', 'completed', 'low', NOW() - INTERVAL '1 day')
) AS demo_tasks(user_email, task_title, task_description, task_status, task_priority, task_due_date)
WHERE u.email = demo_tasks.user_email
ON CONFLICT DO NOTHING;

-- Insert demo business metrics (using the actual company ID)
INSERT INTO public.business_metrics (id, company_id, metric_type, value, period, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  metric_type,
  metric_value,
  'monthly',
  NOW()
FROM public.companies c
CROSS JOIN (
  VALUES 
    ('revenue', 2500000),
    ('growth_rate', 15.2),
    ('efficiency_score', 87),
    ('health_score', 92)
) AS demo_metrics(metric_type, metric_value)
WHERE c.name = 'Nexus Technologies'
ON CONFLICT DO NOTHING; 