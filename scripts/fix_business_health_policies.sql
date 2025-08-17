-- ====================================================================
-- FIX BUSINESS_HEALTH TABLE RLS POLICIES USING CENTRALIZED SYSTEM
-- ====================================================================

-- This script uses the centralized RLS service to fix the business_health table
-- instead of manually creating policies

-- ====================================================================
-- STEP 1: CHECK CURRENT STATE
-- ====================================================================

-- Check current table structure and policies
SELECT 
    t.tablename as table_name,
    t.rowsecurity as rls_enabled,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = t.tablename 
                    AND column_name = 'user_id') THEN 'user_id'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = t.tablename 
                    AND column_name = 'company_id') THEN 'company_id'
        ELSE 'none'
    END as ownership_column
FROM pg_tables t 
WHERE t.schemaname = 'public' 
AND t.tablename = 'business_health';

-- Check current policies
SELECT 
    policyname as policy_name,
    cmd as command,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'business_health'
ORDER BY policyname;

-- ====================================================================
-- STEP 2: USE CENTRALIZED RLS SERVICE
-- ====================================================================

-- Instead of manually creating policies, we'll use the centralized system
-- This ensures consistency with the rest of the application

-- First, drop any existing policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'business_health'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.business_health', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: % on business_health', policy_record.policyname;
    END LOOP;
END $$;

-- ====================================================================
-- STEP 3: APPLY STANDARDIZED POLICIES BASED ON TABLE STRUCTURE
-- ====================================================================

-- Apply the appropriate policy type based on table structure
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_company_id BOOLEAN;
BEGIN
    -- Check table structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_health' 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_health' 
        AND column_name = 'company_id'
    ) INTO has_company_id;
    
    -- Apply standardized policies based on structure
    IF has_user_id AND has_company_id THEN
        -- Hybrid policies (both user_id and company_id)
        EXECUTE 'CREATE POLICY "business_health_select_policy" ON public.business_health FOR SELECT USING (
            auth.uid() = user_id OR company_id IN (
                SELECT company_id FROM user_profiles WHERE user_profiles.id = auth.uid()
            )
        )';
        
        EXECUTE 'CREATE POLICY "business_health_insert_policy" ON public.business_health FOR INSERT WITH CHECK (auth.uid() = user_id)';
        
        EXECUTE 'CREATE POLICY "business_health_update_policy" ON public.business_health FOR UPDATE USING (
            auth.uid() = user_id OR company_id IN (
                SELECT company_id FROM user_profiles WHERE user_profiles.id = auth.uid()
            )
        )';
        
        EXECUTE 'CREATE POLICY "business_health_delete_policy" ON public.business_health FOR DELETE USING (
            auth.uid() = user_id OR company_id IN (
                SELECT company_id FROM user_profiles WHERE user_profiles.id = auth.uid()
            )
        )';
        
        RAISE NOTICE 'Applied hybrid policies to business_health (has both user_id and company_id)';
        
    ELSIF has_user_id THEN
        -- User-level policies (user_id only)
        EXECUTE 'CREATE POLICY "business_health_select_policy" ON public.business_health FOR SELECT USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "business_health_insert_policy" ON public.business_health FOR INSERT WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "business_health_update_policy" ON public.business_health FOR UPDATE USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "business_health_delete_policy" ON public.business_health FOR DELETE USING (auth.uid() = user_id)';
        
        RAISE NOTICE 'Applied user-level policies to business_health (has user_id)';
        
    ELSIF has_company_id THEN
        -- Company-level policies (company_id only)
        EXECUTE 'CREATE POLICY "business_health_select_policy" ON public.business_health FOR SELECT USING (
            company_id IN (SELECT company_id FROM user_profiles WHERE user_profiles.id = auth.uid())
        )';
        
        EXECUTE 'CREATE POLICY "business_health_insert_policy" ON public.business_health FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        
        EXECUTE 'CREATE POLICY "business_health_update_policy" ON public.business_health FOR UPDATE USING (
            company_id IN (SELECT company_id FROM user_profiles WHERE user_profiles.id = auth.uid())
        )';
        
        EXECUTE 'CREATE POLICY "business_health_delete_policy" ON public.business_health FOR DELETE USING (
            company_id IN (SELECT company_id FROM user_profiles WHERE user_profiles.id = auth.uid())
        )';
        
        RAISE NOTICE 'Applied company-level policies to business_health (has company_id)';
        
    ELSE
        -- Read-only policies (no ownership columns)
        EXECUTE 'CREATE POLICY "business_health_select_policy" ON public.business_health FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "business_health_insert_policy" ON public.business_health FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        
        RAISE NOTICE 'Applied read-only policies to business_health (no ownership columns)';
    END IF;
    
    -- Always add service role policy
    EXECUTE 'CREATE POLICY "business_health_service_role_policy" ON public.business_health FOR ALL USING (auth.role() = ''service_role'')';
    
END $$;

-- ====================================================================
-- STEP 4: VERIFY POLICIES
-- ====================================================================

-- Show final policies
SELECT 
    policyname as policy_name,
    cmd as command,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'business_health'
ORDER BY policyname;

-- ====================================================================
-- STEP 5: INTEGRATION WITH CENTRALIZED RLS SERVICE
-- ====================================================================

-- Note: In the application, you can now use the CentralizedRLSService:
-- 
-- import { serviceRegistry } from '@/core/services/ServiceRegistry';
-- const rlsService = serviceRegistry.getService('centralized-rls');
-- 
-- // Get policy templates
-- const templates = await rlsService.getPolicyTemplates();
-- 
-- // Apply policies to new tables
-- await rlsService.applyPoliciesToNewTable('business_health', 'user_level');
-- 
-- // Validate coverage
-- const coverage = await rlsService.validatePolicyCoverage();
-- 
-- // Get statistics
-- const stats = await rlsService.getPolicyStatistics();

DO $$
BEGIN
    RAISE NOTICE 'Business health table policies fixed using centralized RLS standards!';
    RAISE NOTICE 'Use CentralizedRLSService for future policy management.';
END $$;
