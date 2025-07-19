-- Enable RLS on tables that are showing warnings
-- This fixes the RLS NOT ENABLED warnings

-- Enable RLS on service_health_logs
ALTER TABLE public.service_health_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on realtime_events
ALTER TABLE public.realtime_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create basic policies for service_health_logs
DROP POLICY IF EXISTS "Allow service health log inserts" ON public.service_health_logs;
DROP POLICY IF EXISTS "Allow service health log reads" ON public.service_health_logs;

CREATE POLICY "Allow service health log inserts" ON public.service_health_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service health log reads" ON public.service_health_logs
    FOR SELECT USING (true);

-- Create basic policies for realtime_events
DROP POLICY IF EXISTS "Users can view realtime events" ON public.realtime_events;
DROP POLICY IF EXISTS "Users can create realtime events" ON public.realtime_events;

CREATE POLICY "Users can view realtime events" ON public.realtime_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create realtime events" ON public.realtime_events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create basic policies for documents
DROP POLICY IF EXISTS "Users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents" ON public.documents;

CREATE POLICY "Users can view documents" ON public.documents
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update documents" ON public.documents
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete documents" ON public.documents
    FOR DELETE USING (auth.uid() IS NOT NULL); 