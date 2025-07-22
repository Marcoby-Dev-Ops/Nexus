-- Create integration_ninjarmm_device_data table for storing device health data
CREATE TABLE IF NOT EXISTS public.integration_ninjarmm_device_data (
    id BIGSERIAL PRIMARY KEY,
    user_integration_id UUID NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    cpu_usage DOUBLE PRECISION,
    memory_usage DOUBLE PRECISION,
    disk_usage_gb DOUBLE PRECISION,
    last_seen TIMESTAMPTZ,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate device records per integration
    UNIQUE(user_integration_id, device_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.integration_ninjarmm_device_data IS 'Stores raw device health data ingested from NinjaRMM integrations.';
COMMENT ON COLUMN public.integration_ninjarmm_device_data.user_integration_id IS 'FK to the user_integrations table.';
COMMENT ON COLUMN public.integration_ninjarmm_device_data.device_id IS 'The unique identifier for the device in NinjaRMM.';
COMMENT ON COLUMN public.integration_ninjarmm_device_data.raw_payload IS 'Raw JSON payload from the NinjaRMM API for extensibility.';

-- Enable RLS
ALTER TABLE public.integration_ninjarmm_device_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integration_ninjarmm_device_data
CREATE POLICY "Users can view own device data" ON public.integration_ninjarmm_device_data
    FOR SELECT USING (
        user_integration_id IN (
            SELECT id FROM public.user_integrations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all device data" ON public.integration_ninjarmm_device_data
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_integration_ninjarmm_device_data_user_integration_id 
    ON public.integration_ninjarmm_device_data(user_integration_id);

CREATE INDEX idx_integration_ninjarmm_device_data_device_id 
    ON public.integration_ninjarmm_device_data(device_id);

CREATE INDEX idx_integration_ninjarmm_device_data_status 
    ON public.integration_ninjarmm_device_data(status);

CREATE INDEX idx_integration_ninjarmm_device_data_last_seen 
    ON public.integration_ninjarmm_device_data(last_seen); 