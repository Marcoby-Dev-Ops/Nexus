-- Add service role policies for integration_ninjarmm_device_data table
-- This migration runs after the table is created

-- Policy for service role to read all device data
CREATE POLICY "Service role can read all device data" ON public.integration_ninjarmm_device_data
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy for service role to insert device data
CREATE POLICY "Service role can insert device data" ON public.integration_ninjarmm_device_data
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Policy for service role to update device data
CREATE POLICY "Service role can update device data" ON public.integration_ninjarmm_device_data
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy for service role to delete device data
CREATE POLICY "Service role can delete device data" ON public.integration_ninjarmm_device_data
    FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role'); 