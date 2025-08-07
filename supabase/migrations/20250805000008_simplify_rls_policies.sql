-- Drop all existing policies and create simple ones for development
-- personal_thoughts
DROP POLICY IF EXISTS "Authenticated users can view thoughts" ON public.personal_thoughts;
DROP POLICY IF EXISTS "Users can insert their own thoughts" ON public.personal_thoughts;
DROP POLICY IF EXISTS "Users can update their own thoughts" ON public.personal_thoughts;
DROP POLICY IF EXISTS "Users can delete their own thoughts" ON public.personal_thoughts;

CREATE POLICY "Allow all authenticated access to thoughts" ON public.personal_thoughts
  FOR ALL USING (auth.role() = 'authenticated');

-- personal_automations
DROP POLICY IF EXISTS "Authenticated users can view automations" ON public.personal_automations;
DROP POLICY IF EXISTS "Users can insert their own automations" ON public.personal_automations;
DROP POLICY IF EXISTS "Users can update their own automations" ON public.personal_automations;
DROP POLICY IF EXISTS "Users can delete their own automations" ON public.personal_automations;

CREATE POLICY "Allow all authenticated access to automations" ON public.personal_automations
  FOR ALL USING (auth.role() = 'authenticated');

-- user_licenses
DROP POLICY IF EXISTS "Authenticated users can view licenses" ON public.user_licenses;
DROP POLICY IF EXISTS "Users can insert their own licenses" ON public.user_licenses;
DROP POLICY IF EXISTS "Users can update their own licenses" ON public.user_licenses;
DROP POLICY IF EXISTS "Users can delete their own licenses" ON public.user_licenses;

CREATE POLICY "Allow all authenticated access to licenses" ON public.user_licenses
  FOR ALL USING (auth.role() = 'authenticated');

-- chat_usage_tracking
DROP POLICY IF EXISTS "Authenticated users can view usage" ON public.chat_usage_tracking;
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.chat_usage_tracking;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.chat_usage_tracking;
DROP POLICY IF EXISTS "Users can delete their own usage" ON public.chat_usage_tracking;

CREATE POLICY "Allow all authenticated access to usage" ON public.chat_usage_tracking
  FOR ALL USING (auth.role() = 'authenticated');

-- user_profiles - clean up conflicting policies
DROP POLICY IF EXISTS "Allow user to view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow user to update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow user to insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_secure" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_secure" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_secure" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_service_role" ON public.user_profiles;

CREATE POLICY "Allow all authenticated access to profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'authenticated'); 