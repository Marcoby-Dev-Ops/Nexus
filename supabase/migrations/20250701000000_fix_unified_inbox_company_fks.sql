-- Drop incorrect ai_companies FKs and re-point to public.companies
BEGIN;

-- Drop old constraints
ALTER TABLE ai_email_accounts
  DROP CONSTRAINT IF EXISTS ai_email_accounts_company_id_fkey;
ALTER TABLE ai_email_messages
  DROP CONSTRAINT IF EXISTS ai_email_messages_company_id_fkey;
ALTER TABLE ai_inbox_items
  DROP CONSTRAINT IF EXISTS ai_inbox_items_company_id_fkey;

-- Add new constraints referencing public.companies
ALTER TABLE ai_email_accounts
  ADD CONSTRAINT ai_email_accounts_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE ai_email_messages
  ADD CONSTRAINT ai_email_messages_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE ai_inbox_items
  ADD CONSTRAINT ai_inbox_items_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

COMMIT; 