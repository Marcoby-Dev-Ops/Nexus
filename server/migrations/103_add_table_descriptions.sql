-- Migration 103: Add table and column descriptions (defensive)
-- This migration adds documentation comments to key tables and columns.
-- It only applies comments where the target table/column exists.

DO $$
DECLARE
  tbl_list TEXT[][] := ARRAY[
    ARRAY['organizations', 'External business relationships and CRM entities'],
    ARRAY['user_profiles', 'User profile management with business context'],
    ARRAY['companies', 'Internal business entity for billing and operations'],
    ARRAY['ai_conversations', 'AI conversation management system'],
    ARRAY['ckb_documents', 'Company Knowledge Base document storage'],
    ARRAY['playbook_templates', 'Business improvement playbook templates'],
    ARRAY['user_journeys', 'Active user journey instances']
  ];
  
  col_list TEXT[][] := ARRAY[
    ARRAY['user_profiles', 'user_id', 'Authentik user identifier'],
    ARRAY['companies', 'subscription_plan', 'Billing subscription plan'],
    ARRAY['ai_conversations', 'total_tokens', 'Total token usage for cost tracking']
  ];
  
  i INTEGER;
BEGIN
  -- Apply table comments defensively
  FOR i IN 1..array_length(tbl_list, 1) LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_list[i][1]) THEN
      EXECUTE format('COMMENT ON TABLE %I IS %L', tbl_list[i][1], tbl_list[i][2]);
    END IF;
  END LOOP;
  
  -- Apply column comments defensively
  FOR i IN 1..array_length(col_list, 1) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = col_list[i][1] AND column_name = col_list[i][2]
    ) THEN
      EXECUTE format('COMMENT ON COLUMN %I.%I IS %L', col_list[i][1], col_list[i][2], col_list[i][3]);
    END IF;
  END LOOP;
END
$$;
