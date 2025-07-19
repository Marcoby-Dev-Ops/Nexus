-- Create ai_models table
CREATE TABLE IF NOT EXISTS public.ai_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_name text NOT NULL,
    provider text NOT NULL,
    display_name text,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_models_pkey PRIMARY KEY (id)
);

-- Add RLS policies
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.ai_models
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.ai_models
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.ai_models
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert some default AI models
INSERT INTO public.ai_models (model_name, provider, display_name, description) VALUES
    ('gpt-4o', 'openai', 'GPT-4o', 'OpenAI GPT-4o model'),
    ('gpt-4-turbo', 'openai', 'GPT-4 Turbo', 'OpenAI GPT-4 Turbo model'),
    ('gpt-3.5-turbo-0125', 'openai', 'GPT-3.5 Turbo', 'OpenAI GPT-3.5 Turbo model'),
    ('claude-3-5-sonnet-20241022', 'anthropic', 'Claude 3.5 Sonnet', 'Anthropic Claude 3.5 Sonnet model'),
    ('claude-3-opus-20240229', 'anthropic', 'Claude 3 Opus', 'Anthropic Claude 3 Opus model'),
    ('gemini-1.5-pro', 'google', 'Gemini 1.5 Pro', 'Google Gemini 1.5 Pro model'),
    ('gemini-1.5-flash', 'google', 'Gemini 1.5 Flash', 'Google Gemini 1.5 Flash model'); 