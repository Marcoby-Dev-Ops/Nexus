-- Migration: Create Auth Schema Compatibility Functions
-- Date: 2025-09-29
-- Description: Creates auth schema and functions for compatibility with Supabase-style RLS policies
-- This allows existing migration scripts to work without modification

-- ============================================================================
-- CREATE AUTH SCHEMA
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS auth;

-- ============================================================================
-- CREATE COMPATIBILITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
DECLARE
    v_claims_json JSONB := '{}'::jsonb;
    v_external_user_id TEXT;
    v_internal_user_id UUID;
BEGIN
    -- Safely capture JWT claims (Authentik subject is the external user identifier)
    BEGIN
        v_claims_json := COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb;
    EXCEPTION WHEN OTHERS THEN
        v_claims_json := '{}'::jsonb;
    END;

    v_external_user_id := NULLIF(v_claims_json->>'sub', '');

    -- No subject means unauthenticated request
    IF v_external_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Look up the internal UUID from user_profiles (primary identifier)
    SELECT id INTO v_internal_user_id
    FROM public.user_profiles
    WHERE user_id = v_external_user_id
    LIMIT 1;

    IF v_internal_user_id IS NOT NULL THEN
        RETURN v_internal_user_id;
    END IF;

    -- Fallback: preserve historic behaviour by deterministically mapping
    BEGIN
        RETURN v_external_user_id::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN uuid_generate_v5(uuid_ns_dns(), v_external_user_id);
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT AS $$
DECLARE
    v_claims_json JSONB := '{}'::jsonb;
    v_role TEXT;
    v_profile_role TEXT;
    v_user_id UUID;
BEGIN
    -- Attempt to read role from JWT claims (if Authentik embeds it)
    BEGIN
        v_claims_json := COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb;
        v_role := NULLIF(v_claims_json->>'role', '');
    EXCEPTION WHEN OTHERS THEN
        v_claims_json := '{}'::jsonb;
        v_role := NULL;
    END;

    -- Derive role from persisted profile when missing/empty in claims
    IF v_role IS NULL THEN
        v_user_id := auth.uid();

        IF v_user_id IS NULL THEN
            RETURN 'anon';
        END IF;

        SELECT role INTO v_profile_role
        FROM public.user_profiles
        WHERE id = v_user_id
        LIMIT 1;

        v_role := NULLIF(v_profile_role, '');
    END IF;

    IF v_role IS NULL THEN
        -- Authenticated user without explicit role
        IF auth.uid() IS NOT NULL THEN
            RETURN 'authenticated';
        END IF;
        RETURN 'anon';
    END IF;

    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS JSONB AS $$
DECLARE
    v_claims_json JSONB := '{}'::jsonb;
    v_profile RECORD;
BEGIN
    -- Load JWT claims if present
    BEGIN
        v_claims_json := COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb;
    EXCEPTION WHEN OTHERS THEN
        v_claims_json := '{}'::jsonb;
    END;

    -- Merge persisted profile context to keep policy helpers consistent
    SELECT
        id,
        user_id,
        company_id,
        role,
        status,
        email,
        business_email
    INTO v_profile
    FROM public.user_profiles
    WHERE id = auth.uid()
    LIMIT 1;

    IF FOUND THEN
        v_claims_json := v_claims_json || jsonb_build_object(
            'profile_id', v_profile.id,
            'user_id', v_profile.user_id,
            'role', COALESCE(v_profile.role, 'authenticated'),
            'company_id', v_profile.company_id,
            'status', v_profile.status,
            'email', COALESCE(v_profile.business_email, v_profile.email)
        );
    END IF;

    RETURN v_claims_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE EXTENSION IF NOT EXISTS
-- ============================================================================

-- Ensure uuid-ossp extension is available for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on auth functions to public role
GRANT EXECUTE ON FUNCTION auth.uid() TO public;
GRANT EXECUTE ON FUNCTION auth.role() TO public;
GRANT EXECUTE ON FUNCTION auth.jwt() TO public;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test the functions (this will show warnings if JWT claims are not set)
DO $$
BEGIN
    RAISE NOTICE 'Auth compatibility functions created successfully';
    RAISE NOTICE 'auth.uid() test: %', auth.uid();
    RAISE NOTICE 'auth.role() test: %', auth.role();
    RAISE NOTICE 'auth.jwt() test: %', auth.jwt();
END $$;
