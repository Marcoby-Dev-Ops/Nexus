-- Add service role policy for user_integrations table
-- This allows n8n workflows to access the table with service role authentication

-- Policy for service role to read all user_integrations
CREATE POLICY "Service role can read all user_integrations" ON public.user_integrations
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy for service role to insert user_integrations
CREATE POLICY "Service role can insert user_integrations" ON public.user_integrations
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Policy for service role to update user_integrations
CREATE POLICY "Service role can update user_integrations" ON public.user_integrations
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy for service role to delete user_integrations
CREATE POLICY "Service role can delete user_integrations" ON public.user_integrations
    FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- Add similar policies for integration_ninjarmm_device_data table
CREATE POLICY "Service role can read all device data" ON public.integration_ninjarmm_device_data
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can insert device data" ON public.integration_ninjarmm_device_data
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can update device data" ON public.integration_ninjarmm_device_data
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can delete device data" ON public.integration_ninjarmm_device_data
    FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role'); 