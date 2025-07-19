-- Create the table to store n8n configurations
CREATE TABLE public.n8n_configurations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    company_id uuid NOT NULL,
    workflow_name text NOT NULL,
    webhook_url text NOT NULL,
    CONSTRAINT n8n_configurations_pkey PRIMARY KEY (id),
    CONSTRAINT n8n_configurations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    CONSTRAINT n8n_configurations_company_workflow_unique UNIQUE (company_id, workflow_name)
);

-- Enable Row-Level Security
ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see configurations for their own company
CREATE POLICY "Allow users to access their own company's n8n configs"
ON public.n8n_configurations
FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT p.company_id
  FROM public.user_profiles p
  WHERE p.id = auth.uid()
));

-- Create policy to allow users to insert configurations for their own company
CREATE POLICY "Allow users to insert their own company's n8n configs"
ON public.n8n_configurations
FOR INSERT
TO authenticated
WITH CHECK (company_id IN (
  SELECT p.company_id
  FROM public.user_profiles p
  WHERE p.id = auth.uid()
));

-- Add comments for clarity
COMMENT ON TABLE public.n8n_configurations IS 'Stores n8n workflow configurations, including webhook URLs.';
COMMENT ON COLUMN public.n8n_configurations.workflow_name IS 'A unique name/slug for the n8n workflow.';
COMMENT ON COLUMN public.n8n_configurations.webhook_url IS 'The secure webhook URL provided by n8n to trigger the workflow.';

-- Grant access to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.n8n_configurations TO authenticated; 