-- Migration to extend user_profiles table with comprehensive profile fields
-- This adds all the fields expected by the UserProfile interface

-- Add personal information fields
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add contact information fields
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS work_phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS personal_email TEXT;

-- Add work information fields
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS direct_reports UUID[];

-- Add location information fields
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS work_location TEXT CHECK (work_location IN ('office', 'remote', 'hybrid'));
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}';

-- Add professional information fields
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]';

-- Add emergency contact field
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}';

-- Add status and metadata fields
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended'));
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Update the role constraint to match the interface
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('owner', 'admin', 'manager', 'user'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager_id ON public.user_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON public.user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_work_location ON public.user_profiles(work_location);

-- Add company table extensions
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description TEXT;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_profile_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    completion_count INTEGER := 0;
    total_fields INTEGER := 10; -- Number of important fields to track
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record
    FROM public.user_profiles 
    WHERE id = user_profile_id;
    
    IF profile_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Count completed important fields
    IF profile_record.first_name IS NOT NULL AND profile_record.first_name != '' THEN
        completion_count := completion_count + 1;
    END IF;
    
    IF profile_record.last_name IS NOT NULL AND profile_record.last_name != '' THEN
        completion_count := completion_count + 1;
    END IF;
    
    IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN
        completion_count := completion_count + 1;
    END IF;
    
    IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
        completion_count := completion_count + 1;
    END IF;
    
    IF profile_record.phone IS NOT NULL AND profile_record.phone != '' THEN
        completion_count := completion_count + 1;
    END IF;
    
    IF profile_record.job_title IS NOT NULL AND profile_record.job_title != '' THEN
        completion_count := completion_count + 1;
    END IF;
    
    IF profile_record.department IS NOT NULL AND profile_record.department != '' THEN
        completion_count := completion_count + 1;
    END IF;
    
    IF profile_record.location IS NOT NULL AND profile_record.location != '' THEN
        completion_count := completion_count + 1;
    END IF;
    
    IF profile_record.timezone IS NOT NULL AND profile_record.timezone != '' THEN
        completion_count := completion_count + 1;
    END IF;
    
    IF profile_record.work_location IS NOT NULL THEN
        completion_count := completion_count + 1;
    END IF;
    
    RETURN ROUND((completion_count::DECIMAL / total_fields) * 100);
END;
$$;

-- Trigger to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_profile_completion(NEW.id);
    RETURN NEW;
END;
$$;

-- Create trigger for profile completion calculation
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON public.user_profiles;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- Update existing records to calculate their completion percentage
UPDATE public.user_profiles 
SET profile_completion_percentage = calculate_profile_completion(id); 