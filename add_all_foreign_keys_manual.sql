-- ====================================================================
-- MANUAL FOREIGN KEY MIGRATION
-- Run this in your Supabase SQL editor to add all missing foreign keys
-- ====================================================================

-- Add user foreign key constraints (most critical)
-- These ensure data integrity for user relationships

-- Core user tables
DO $$
BEGIN
    -- Add user_profiles user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_integrations user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_integrations_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_integrations 
        ADD CONSTRAINT user_integrations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_billing_plans user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_billing_plans_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_billing_plans 
        ADD CONSTRAINT user_billing_plans_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_licenses user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_licenses_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_licenses 
        ADD CONSTRAINT user_licenses_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add activities user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'activities_user_id_fkey'
    ) THEN
        ALTER TABLE public.activities 
        ADD CONSTRAINT activities_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add analytics_events user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'analytics_events_user_id_fkey'
    ) THEN
        ALTER TABLE public.analytics_events 
        ADD CONSTRAINT analytics_events_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add audit_log_events user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_log_events_user_id_fkey'
    ) THEN
        ALTER TABLE public.audit_log_events 
        ADD CONSTRAINT audit_log_events_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_activity user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_activity_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_activity 
        ADD CONSTRAINT user_activity_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add ai_conversations user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_conversations_user_id_fkey'
    ) THEN
        ALTER TABLE public.ai_conversations 
        ADD CONSTRAINT ai_conversations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add ai_insights user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_insights_user_id_fkey'
    ) THEN
        ALTER TABLE public.ai_insights 
        ADD CONSTRAINT ai_insights_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add business_health user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'business_health_user_id_fkey'
    ) THEN
        ALTER TABLE public.business_health 
        ADD CONSTRAINT business_health_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add chat_usage_tracking user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_usage_tracking_user_id_fkey'
    ) THEN
        ALTER TABLE public.chat_usage_tracking 
        ADD CONSTRAINT chat_usage_tracking_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add conversations user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_user_id_fkey'
    ) THEN
        ALTER TABLE public.conversations 
        ADD CONSTRAINT conversations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add integration_status user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'integration_status_user_id_fkey'
    ) THEN
        ALTER TABLE public.integration_status 
        ADD CONSTRAINT integration_status_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add contacts user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contacts_user_id_fkey'
    ) THEN
        ALTER TABLE public.contacts 
        ADD CONSTRAINT contacts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add debug_logs user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'debug_logs_user_id_fkey'
    ) THEN
        ALTER TABLE public.debug_logs 
        ADD CONSTRAINT debug_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add model_usage user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'model_usage_user_id_fkey'
    ) THEN
        ALTER TABLE public.model_usage 
        ADD CONSTRAINT model_usage_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add realtime_sync_events user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'realtime_sync_events_user_id_fkey'
    ) THEN
        ALTER TABLE public.realtime_sync_events 
        ADD CONSTRAINT realtime_sync_events_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_context_profiles user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_context_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_context_profiles 
        ADD CONSTRAINT user_context_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_interaction_analysis user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_interaction_analysis_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_interaction_analysis 
        ADD CONSTRAINT user_interaction_analysis_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_learning_patterns user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_learning_patterns_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_learning_patterns 
        ADD CONSTRAINT user_learning_patterns_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add notifications user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_id_fkey'
    ) THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add pins user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pins_user_id_fkey'
    ) THEN
        ALTER TABLE public.pins 
        ADD CONSTRAINT pins_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add recents user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'recents_user_id_fkey'
    ) THEN
        ALTER TABLE public.recents 
        ADD CONSTRAINT recents_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add tasks user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_user_id_fkey'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add thoughts user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'thoughts_user_id_fkey'
    ) THEN
        ALTER TABLE public.thoughts 
        ADD CONSTRAINT thoughts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add communication_events user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'communication_events_user_id_fkey'
    ) THEN
        ALTER TABLE public.communication_events 
        ADD CONSTRAINT communication_events_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add component_usages user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'component_usages_user_id_fkey'
    ) THEN
        ALTER TABLE public.component_usages 
        ADD CONSTRAINT component_usages_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add manual_contacts user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'manual_contacts_user_id_fkey'
    ) THEN
        ALTER TABLE public.manual_contacts 
        ADD CONSTRAINT manual_contacts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add manual_documents user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'manual_documents_user_id_fkey'
    ) THEN
        ALTER TABLE public.manual_documents 
        ADD CONSTRAINT manual_documents_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add n8n_configurations user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'n8n_configurations_user_id_fkey'
    ) THEN
        ALTER TABLE public.n8n_configurations 
        ADD CONSTRAINT n8n_configurations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add ai_ab_test_results user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_ab_test_results_user_id_fkey'
    ) THEN
        ALTER TABLE public.ai_ab_test_results 
        ADD CONSTRAINT ai_ab_test_results_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add ai_client_intelligence_alerts user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_client_intelligence_alerts_user_id_fkey'
    ) THEN
        ALTER TABLE public.ai_client_intelligence_alerts 
        ADD CONSTRAINT ai_client_intelligence_alerts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add ai_client_interactions user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_client_interactions_user_id_fkey'
    ) THEN
        ALTER TABLE public.ai_client_interactions 
        ADD CONSTRAINT ai_client_interactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add ai_unified_client_profiles user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_unified_client_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE public.ai_unified_client_profiles 
        ADD CONSTRAINT ai_unified_client_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add ai_user_activity user_id constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_user_activity_user_id_fkey'
    ) THEN
        ALTER TABLE public.ai_user_activity 
        ADD CONSTRAINT ai_user_activity_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
END $$;

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Check how many user foreign key constraints were added
SELECT 
    'User Foreign Key Constraints Added' as status,
    COUNT(*) as count
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'auth'
    AND ccu.table_name = 'users'
    AND kcu.column_name = 'user_id';

-- Check total foreign key constraints
SELECT 
    'Total Foreign Key Constraints' as status,
    COUNT(*) as count
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY';

-- List all user foreign key constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'auth'
    AND ccu.table_name = 'users'
    AND kcu.column_name = 'user_id'
ORDER BY tc.table_name; 