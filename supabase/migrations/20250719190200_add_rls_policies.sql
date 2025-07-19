-- Migration: Add RLS policies for public tables
-- This migration adds Row Level Security policies to allow anonymous access to public tables

-- Enable RLS on all tables
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_billing_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous read access to public tables
CREATE POLICY "Allow anonymous read access to integration_status" ON public.integration_status
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to billing_plans" ON public.billing_plans
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to business_health" ON public.business_health
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to ai_insights" ON public.ai_insights
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to ai_action_card_templates" ON public.ai_action_card_templates
    FOR SELECT USING (true);

-- Create policies for authenticated users on user-specific tables
CREATE POLICY "Allow authenticated users to manage their billing plans" ON public.user_billing_plans
    FOR ALL USING (auth.uid() = user_id);

-- Create policies for authenticated users on all tables
CREATE POLICY "Allow authenticated users to read integration_status" ON public.integration_status
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read billing_plans" ON public.billing_plans
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read business_health" ON public.business_health
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read ai_insights" ON public.ai_insights
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read ai_action_card_templates" ON public.ai_action_card_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update their own data
CREATE POLICY "Allow authenticated users to insert integration_status" ON public.integration_status
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update integration_status" ON public.integration_status
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert business_health" ON public.business_health
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update business_health" ON public.business_health
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert ai_insights" ON public.ai_insights
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update ai_insights" ON public.ai_insights
    FOR UPDATE USING (auth.role() = 'authenticated'); 