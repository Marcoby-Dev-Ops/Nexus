-- Migration: Add Company Ownership System
-- This migration adds proper ownership tracking to companies table

-- Add owner_id column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);

-- Add comment for documentation
COMMENT ON COLUMN public.companies.owner_id IS 'The user ID of the company owner/chief admin';

-- Update RLS policies to include owner-based access
DROP POLICY IF EXISTS "Company owners can update company" ON public.companies;
CREATE POLICY "Company owners can update company" ON public.companies
    FOR UPDATE USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.company_id = companies.id 
            AND user_profiles.id = auth.uid()
            AND user_profiles.role IN ('owner', 'admin')
        )
    );

-- Add policy for company owners to manage their companies
CREATE POLICY "Company owners can manage their companies" ON public.companies
    FOR ALL USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.company_id = companies.id 
            AND user_profiles.id = auth.uid()
            AND user_profiles.role IN ('owner', 'admin')
        )
    );

-- Create function to get company owner
CREATE OR REPLACE FUNCTION get_company_owner(company_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT owner_id FROM companies 
        WHERE id = company_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is company owner
CREATE OR REPLACE FUNCTION is_company_owner(company_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM companies 
        WHERE id = company_uuid 
        AND owner_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to transfer company ownership
CREATE OR REPLACE FUNCTION transfer_company_ownership(
    company_uuid UUID,
    new_owner_uuid UUID,
    current_user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is the owner
    IF NOT is_company_owner(company_uuid, current_user_uuid) THEN
        RAISE EXCEPTION 'Only the current owner can transfer ownership';
    END IF;
    
    -- Update company owner
    UPDATE companies 
    SET owner_id = new_owner_uuid, updated_at = NOW()
    WHERE id = company_uuid;
    
    -- Update user profiles to reflect ownership change
    UPDATE user_profiles 
    SET role = 'admin', updated_at = NOW()
    WHERE company_id = company_uuid AND id = current_user_uuid;
    
    UPDATE user_profiles 
    SET role = 'owner', updated_at = NOW()
    WHERE company_id = company_uuid AND id = new_owner_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 