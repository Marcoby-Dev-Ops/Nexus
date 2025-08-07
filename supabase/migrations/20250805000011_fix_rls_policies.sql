-- Re-enable RLS with proper policies
ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all authenticated access to licenses" ON public.user_licenses;
DROP POLICY IF EXISTS "Allow all authenticated access to automations" ON public.personal_automations;
DROP POLICY IF EXISTS "Allow all authenticated access to usage" ON public.chat_usage_tracking;
DROP POLICY IF EXISTS "Allow all authenticated access to thoughts" ON public.personal_thoughts;
DROP POLICY IF EXISTS "Allow all authenticated access to profiles" ON public.user_profiles;

-- Create new, more permissive policies
CREATE POLICY "Enable all access for authenticated users" ON public.user_licenses
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.personal_automations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.chat_usage_tracking
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.personal_thoughts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated'); 