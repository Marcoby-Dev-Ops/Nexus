-- Create n8n_workflow_configs table to match current usage
CREATE TABLE IF NOT EXISTS public.n8n_workflow_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    workflow_name text NOT NULL,
    workflow_id text NOT NULL,
    webhook_url text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    company_id uuid NOT NULL,
    CONSTRAINT n8n_workflow_configs_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    CONSTRAINT n8n_workflow_configs_company_workflow_unique 
        UNIQUE (company_id, workflow_name)
);

-- Enable Row-Level Security
ALTER TABLE public.n8n_workflow_configs ENABLE ROW LEVEL SECURITY;

-- Create policies similar to n8n_configurations
CREATE POLICY "Allow users to access their own company's workflow configs"
ON public.n8n_workflow_configs
FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT p.company_id
  FROM public.user_profiles p
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Allow users to insert their own company's workflow configs"
ON public.n8n_workflow_configs
FOR INSERT
TO authenticated
WITH CHECK (company_id IN (
  SELECT p.company_id
  FROM public.user_profiles p
  WHERE p.user_id = auth.uid()
));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.n8n_workflow_configs TO authenticated;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_n8n_workflow_configs_updated_at
    BEFORE UPDATE ON public.n8n_workflow_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.n8n_workflow_configs IS 'Configuration and metadata for n8n workflow integrations with Nexus automation systems';
COMMENT ON COLUMN public.n8n_workflow_configs.workflow_name IS 'Unique identifier for the workflow within Nexus ecosystem';
COMMENT ON COLUMN public.n8n_workflow_configs.webhook_url IS 'Full webhook URL for triggering the n8n workflow from Nexus components';
COMMENT ON COLUMN public.n8n_workflow_configs.description IS 'Human-readable description of workflow purpose and functionality'; 