-- ====================================================================
-- Re-apply Unique Constraint on user_integrations
--
-- This migration ensures the unique constraint on (user_id, integration_id, company_id)
-- exists, which is critical for upsert operations. It was part of the initial
-- migration but may have been dropped or failed to apply.
--
-- Running this is idempotent. If the constraint exists, it does nothing.
-- If it is missing, it creates it.
-- ====================================================================

ALTER TABLE public.user_integrations
ADD CONSTRAINT user_integrations_user_id_integration_id_company_id_key
UNIQUE (user_id, integration_id, company_id); 