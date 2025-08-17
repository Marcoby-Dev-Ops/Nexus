-- User Creation Functions for Complete Signup Flow
-- This script creates functions to handle the complete user creation process

-- ====================================================================
-- 1. CREATE USER IN AUTH SYSTEM
-- ====================================================================

-- Function to create a new user in auth.users table
CREATE OR REPLACE FUNCTION public.create_auth_user(
    user_email text,
    user_password text DEFAULT NULL,
    first_name text DEFAULT NULL,
    last_name text DEFAULT NULL,
    is_verified boolean DEFAULT false,
    is_super_admin boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Generate a new UUID for the user
    user_id := gen_random_uuid();
    
    -- Insert user into auth.users table
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmed_at,
        is_super_admin,
        raw_user_meta_data
    ) VALUES (
        user_id,
        user_email,
        CASE 
            WHEN user_password IS NOT NULL THEN crypt(user_password, gen_salt('bf'))
            ELSE NULL
        END,
        CASE 
            WHEN is_verified THEN now()
            ELSE NULL
        END,
        now(),
        now(),
        CASE 
            WHEN is_verified THEN now()
            ELSE NULL
        END,
        is_super_admin,
        jsonb_build_object(
            'first_name', first_name,
            'last_name', last_name,
            'full_name', CASE 
                WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                THEN first_name || ' ' || last_name
                ELSE first_name OR last_name OR user_email
            END
        )
    );
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 2. CREATE USER PROFILE
-- ====================================================================

-- Function to create a complete user profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id uuid,
    user_email text,
    first_name text DEFAULT NULL,
    last_name text DEFAULT NULL,
    company_id uuid DEFAULT NULL,
    role text DEFAULT 'user'
)
RETURNS void AS $$
DECLARE
    full_name text;
BEGIN
    -- Calculate full name
    full_name := CASE 
        WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
        THEN first_name || ' ' || last_name
        ELSE first_name OR last_name OR user_email
    END;
    
    -- Insert user profile
    INSERT INTO public.user_profiles (
        id,
        user_id,
        first_name,
        last_name,
        company_id,
        role,
        preferences,
        created_at,
        updated_at,
        onboarding_completed
    ) VALUES (
        user_id,
        user_id,
        first_name,
        last_name,
        company_id,
        role,
        jsonb_build_object(
            'theme', 'system',
            'notifications', true,
            'language', 'en',
            'timezone', 'UTC'
        ),
        now(),
        now(),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 3. COMPLETE USER CREATION FLOW
-- ====================================================================

-- Function to handle complete user creation from OAuth
CREATE OR REPLACE FUNCTION public.create_user_from_oauth(
    user_email text,
    first_name text DEFAULT NULL,
    last_name text DEFAULT NULL,
    is_verified boolean DEFAULT true,
    company_id uuid DEFAULT NULL
)
RETURNS TABLE (
    user_id uuid,
    profile_created boolean,
    company_linked boolean
) AS $$
DECLARE
    new_user_id uuid;
    profile_exists boolean;
    company_exists boolean;
BEGIN
    -- Check if user already exists
    SELECT id INTO new_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    -- If user doesn't exist, create them
    IF new_user_id IS NULL THEN
        new_user_id := public.create_auth_user(
            user_email := user_email,
            first_name := first_name,
            last_name := last_name,
            is_verified := is_verified
        );
    END IF;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = new_user_id) INTO profile_exists;
    
    -- Create profile if it doesn't exist
    IF NOT profile_exists THEN
        PERFORM public.create_user_profile(
            user_id := new_user_id,
            user_email := user_email,
            first_name := first_name,
            last_name := last_name,
            company_id := company_id
        );
    END IF;
    
    -- Check if company exists and link if provided
    IF company_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM public.companies WHERE id = company_id) INTO company_exists;
        IF company_exists THEN
            UPDATE public.user_profiles 
            SET company_id = company_id, updated_at = now()
            WHERE id = new_user_id;
        END IF;
    END IF;
    
    -- Return results
    RETURN QUERY SELECT 
        new_user_id,
        NOT profile_exists,
        company_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 4. EMAIL VERIFICATION FUNCTIONS
-- ====================================================================

-- Function to mark user as verified (called after email verification)
CREATE OR REPLACE FUNCTION public.verify_user_email(
    user_email text
)
RETURNS boolean AS $$
DECLARE
    user_exists boolean;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = user_email) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN false;
    END IF;
    
    -- Mark user as verified
    UPDATE auth.users 
    SET 
        email_confirmed_at = now(),
        confirmed_at = now(),
        updated_at = now()
    WHERE email = user_email;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is verified
CREATE OR REPLACE FUNCTION public.is_user_verified(
    user_email text
)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM auth.users 
        WHERE email = user_email 
        AND email_confirmed_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 5. OAUTH CALLBACK USER CREATION
-- ====================================================================

-- Function to handle OAuth callback and create user if needed
CREATE OR REPLACE FUNCTION public.handle_oauth_user_creation(
    oauth_user_id text,
    user_email text,
    first_name text DEFAULT NULL,
    last_name text DEFAULT NULL,
    is_verified boolean DEFAULT true
)
RETURNS TABLE (
    user_id uuid,
    is_new_user boolean,
    profile_created boolean
) AS $$
DECLARE
    existing_user_id uuid;
    new_user_id uuid;
    profile_exists boolean;
BEGIN
    -- Check if user already exists by email
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    -- If user exists, use existing ID
    IF existing_user_id IS NOT NULL THEN
        new_user_id := existing_user_id;
    ELSE
        -- Create new user
        new_user_id := public.create_auth_user(
            user_email := user_email,
            first_name := first_name,
            last_name := last_name,
            is_verified := is_verified
        );
    END IF;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = new_user_id) INTO profile_exists;
    
    -- Create profile if it doesn't exist
    IF NOT profile_exists THEN
        PERFORM public.create_user_profile(
            user_id := new_user_id,
            user_email := user_email,
            first_name := first_name,
            last_name := last_name
        );
    END IF;
    
    -- Return results
    RETURN QUERY SELECT 
        new_user_id,
        existing_user_id IS NULL,
        NOT profile_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 6. GRANT PERMISSIONS
-- ====================================================================

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.create_auth_user(text, text, text, text, boolean, boolean) TO postgres;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text, text, uuid, text) TO postgres;
GRANT EXECUTE ON FUNCTION public.create_user_from_oauth(text, text, text, boolean, uuid) TO postgres;
GRANT EXECUTE ON FUNCTION public.verify_user_email(text) TO postgres;
GRANT EXECUTE ON FUNCTION public.is_user_verified(text) TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_oauth_user_creation(text, text, text, text, boolean) TO postgres;
