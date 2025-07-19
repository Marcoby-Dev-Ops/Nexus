-- Fix security issue: Set secure search_path for update_updated_at_column function
-- This addresses the "Function Search Path Mutable" security warning

-- First drop the triggers that depend on the function
DROP TRIGGER IF EXISTS update_n8n_configurations_updated_at ON public.n8n_configurations;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Create the secure version of the function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Recreate the triggers with the secure function
CREATE TRIGGER update_n8n_configurations_updated_at
    BEFORE UPDATE ON public.n8n_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 