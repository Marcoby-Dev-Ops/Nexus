

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "private"."get_company_id_from_user_id"("user_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select company_id from public.user_profiles where id = user_id;
$$;


ALTER FUNCTION "private"."get_company_id_from_user_id"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."analyze_ab_test"("test_id_param" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
    variant_a_stats JSONB;
    variant_b_stats JSONB;
    significance DECIMAL;
BEGIN
    -- Get variant A statistics
    SELECT jsonb_build_object(
        'count', COUNT(*),
        'mean', AVG(metric_value),
        'stddev', STDDEV(metric_value)
    ) INTO variant_a_stats
    FROM ai_ab_test_results
    WHERE test_id = test_id_param AND variant = 'A';

    -- Get variant B statistics
    SELECT jsonb_build_object(
        'count', COUNT(*),
        'mean', AVG(metric_value),
        'stddev', STDDEV(metric_value)
    ) INTO variant_b_stats
    FROM ai_ab_test_results
    WHERE test_id = test_id_param AND variant = 'B';

    -- Calculate statistical significance (simplified)
    significance := ABS((variant_a_stats->>'mean')::DECIMAL - (variant_b_stats->>'mean')::DECIMAL) / 
                   SQRT(POWER((variant_a_stats->>'stddev')::DECIMAL, 2) + POWER((variant_b_stats->>'stddev')::DECIMAL, 2));

    result := jsonb_build_object(
        'variants', jsonb_build_object('A', variant_a_stats, 'B', variant_b_stats),
        'significance', significance,
        'recommendation', CASE 
            WHEN significance > 1.96 THEN 'Significant difference detected'
            ELSE 'No significant difference'
        END,
        'confidence', CASE 
            WHEN significance > 1.96 THEN 0.95
            ELSE 0.50
        END
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."analyze_ab_test"("test_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_inbox_rules"("p_inbox_item_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    item_record ai_inbox_items%ROWTYPE;
    rule_record ai_inbox_rules%ROWTYPE;
    condition_key TEXT;
    condition_value TEXT;
    action_key TEXT;
    action_value TEXT;
    rule_matches BOOLEAN;
BEGIN
    -- Get the inbox item
    SELECT * INTO item_record FROM ai_inbox_items WHERE id = p_inbox_item_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Loop through active rules for this user, ordered by priority
    FOR rule_record IN 
        SELECT * FROM ai_inbox_rules 
        WHERE user_id = item_record.user_id 
        AND is_active = true 
        ORDER BY priority ASC
    LOOP
        rule_matches := true;
        
        -- Check if all conditions match
        FOR condition_key, condition_value IN 
            SELECT key, value FROM jsonb_each_text(rule_record.conditions)
        LOOP
            CASE condition_key
                WHEN 'sender_contains' THEN
                    IF item_record.sender_email NOT ILIKE '%' || condition_value || '%' THEN
                        rule_matches := false;
                        EXIT;
                    END IF;
                WHEN 'subject_contains' THEN
                    IF item_record.subject NOT ILIKE '%' || condition_value || '%' THEN
                        rule_matches := false;
                        EXIT;
                    END IF;
                WHEN 'sender_equals' THEN
                    IF item_record.sender_email != condition_value THEN
                        rule_matches := false;
                        EXIT;
                    END IF;
                ELSE
                    -- Unknown condition, skip rule
                    rule_matches := false;
                    EXIT;
            END CASE;
        END LOOP;
        
        -- If rule matches, apply actions
        IF rule_matches THEN
            FOR action_key, action_value IN 
                SELECT key, value FROM jsonb_each_text(rule_record.actions)
            LOOP
                CASE action_key
                    WHEN 'set_priority' THEN
                        UPDATE ai_inbox_items 
                        SET ai_priority_score = action_value::INTEGER
                        WHERE id = p_inbox_item_id;
                    WHEN 'set_category' THEN
                        UPDATE ai_inbox_items 
                        SET ai_category = action_value
                        WHERE id = p_inbox_item_id;
                    WHEN 'mark_important' THEN
                        UPDATE ai_inbox_items 
                        SET is_important = (action_value::BOOLEAN)
                        WHERE id = p_inbox_item_id;
                    WHEN 'mark_flagged' THEN
                        UPDATE ai_inbox_items 
                        SET is_flagged = (action_value::BOOLEAN)
                        WHERE id = p_inbox_item_id;
                    -- Add more actions as needed
                END CASE;
            END LOOP;
            
            -- Update rule statistics
            UPDATE ai_inbox_rules 
            SET times_triggered = times_triggered + 1,
                last_triggered_at = NOW()
            WHERE id = rule_record.id;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."apply_inbox_rules"("p_inbox_item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_waitlist_position"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_max_position INTEGER;
    referrer_record RECORD;
BEGIN
    -- Get current max position
    SELECT COALESCE(MAX(position), 0) INTO current_max_position FROM public.waitlist_signups;
    
    -- If this is a new signup
    IF TG_OP = 'INSERT' THEN
        -- Generate referral code if not provided
        IF NEW.referral_code IS NULL THEN
            NEW.referral_code := generate_referral_code(NEW.email);
        END IF;
        
        -- Assign position
        NEW.position := current_max_position + 1;
        
        -- If referred by someone, update their referral count and improve their position
        IF NEW.referred_by_code IS NOT NULL THEN
            SELECT * INTO referrer_record 
            FROM public.waitlist_signups 
            WHERE referral_code = NEW.referred_by_code;
            
            IF FOUND THEN
                -- Update referrer's referral count
                UPDATE public.waitlist_signups 
                SET referral_count = referral_count + 1,
                    position = GREATEST(1, position - 3) -- Move up 3 positions per referral
                WHERE referral_code = NEW.referred_by_code;
            END IF;
        END IF;
        
        -- Assign tier based on position
        IF NEW.position <= 100 THEN
            NEW.tier := 'founder';
        ELSIF NEW.position <= 500 THEN
            NEW.tier := 'vip';
        ELSE
            NEW.tier := 'early-bird';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."assign_waitlist_position"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calc_ops_score"("p_org" "uuid") RETURNS numeric
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with kpi as (
    select kpi_score, weight
    from public.department_metrics_view
    where org_id = p_org
      and recorded_at > now() - interval '24 hours'
  )
  select coalesce(sum(kpi_score) / nullif(sum(weight), 0), 0) from kpi;
$$;


ALTER FUNCTION "public"."calc_ops_score"("p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_migration_status"("migration_name" "text") RETURNS TABLE("table_exists" boolean, "columns_missing" "text"[], "constraints_missing" "text"[], "indexes_missing" "text"[])
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    expected_columns TEXT[] := ARRAY[]::TEXT[];
    expected_constraints TEXT[] := ARRAY[]::TEXT[];
    expected_indexes TEXT[] := ARRAY[]::TEXT[];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    missing_constraints TEXT[] := ARRAY[]::TEXT[];
    missing_indexes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- This would be populated based on the specific migration
    -- For now, return empty arrays
    RETURN QUERY SELECT 
        true as table_exists,
        missing_columns as columns_missing,
        missing_constraints as constraints_missing,
        missing_indexes as indexes_missing;
END;
$$;


ALTER FUNCTION "public"."check_migration_status"("migration_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rls_security"() RETURNS TABLE("check_name" "text", "status" "text", "details" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check 1: RLS enabled on all tables
    RETURN QUERY
    SELECT 
        'RLS_ENABLED' as check_name,
        CASE 
            WHEN COUNT(*) FILTER (WHERE NOT rowsecurity) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        CASE 
            WHEN COUNT(*) FILTER (WHERE NOT rowsecurity) = 0 
            THEN 'All tables have RLS enabled'
            ELSE 'Tables without RLS: ' || string_agg(tablename, ', ') FILTER (WHERE NOT rowsecurity)
        END as details
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%';

    -- Check 2: No overly permissive policies
    RETURN QUERY
    SELECT 
        'NO_PERMISSIVE_POLICIES' as check_name,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        CASE 
            WHEN COUNT(*) = 0 
            THEN 'No overly permissive policies found'
            ELSE 'Permissive policies found: ' || COUNT(*)::TEXT
        END as details
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual IS NULL OR qual = 'true' OR qual = '(true)' 
         OR with_check IS NULL OR with_check = 'true' OR with_check = '(true)');

    -- Check 3: Auth functions available
    RETURN QUERY
    SELECT 
        'AUTH_FUNCTIONS' as check_name,
        CASE 
            WHEN COUNT(*) >= 2 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'Auth functions available: ' || COUNT(*)::TEXT as details
    FROM information_schema.routines 
    WHERE routine_schema = 'auth' 
    AND routine_name IN ('is_company_admin', 'get_user_company_id');

END;
$$;


ALTER FUNCTION "public"."check_rls_security"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_data"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old audit logs (keep 1 year)
    DELETE FROM security_audit_log 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old usage tracking (keep 2 years)
    DELETE FROM chat_usage_tracking 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    -- Log cleanup activity
    PERFORM log_security_event(
        NULL,
        'data_cleanup',
        jsonb_build_object(
            'deleted_audit_logs', deleted_count,
            'cleanup_date', NOW()
        )
    );
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_user_onboarding"("user_uuid" "uuid", "onboarding_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Update user profile to mark onboarding as completed
    INSERT INTO public.user_profiles (
        id,
        onboarding_completed,
        onboarding_chat_completed,
        executive_assistant_introduced,
        onboarding_context,
        updated_at
    ) VALUES (
        user_uuid,
        true,
        true,
        true,
        onboarding_data,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        onboarding_completed = true,
        onboarding_chat_completed = true,
        executive_assistant_introduced = true,
        onboarding_context = onboarding_data,
        updated_at = NOW();
    
    -- Update onboarding progress record
    INSERT INTO public.user_onboarding_progress (
        user_id,
        onboarding_completed,
        onboarding_completed_at,
        updated_at
    ) VALUES (
        user_uuid,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        onboarding_completed = true,
        onboarding_completed_at = NOW(),
        updated_at = NOW();
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."complete_user_onboarding"("user_uuid" "uuid", "onboarding_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."conversations_with_messages"("limit_param" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "title" "text", "updated_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select c.id, c.title, c.updated_at
  from ai_conversations c
  where exists (
    select 1 from ai_messages m where m.conversation_id = c.id
  )
  order by c.updated_at desc
  limit limit_param;
$$;


ALTER FUNCTION "public"."conversations_with_messages"("limit_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_inbox_folders"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO ai_inbox_folders (user_id, name, color, icon, is_system, sort_order) VALUES
    (p_user_id, 'Inbox', '#3B82F6', 'inbox', true, 1),
    (p_user_id, 'Sent', '#10B981', 'send', true, 2),
    (p_user_id, 'Drafts', '#F59E0B', 'edit', true, 3),
    (p_user_id, 'Archive', '#6B7280', 'archive', true, 4),
    (p_user_id, 'Spam', '#EF4444', 'shield-alert', true, 5),
    (p_user_id, 'Trash', '#DC2626', 'trash', true, 6)
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."create_default_inbox_folders"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "encryption_key" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        encryption_key
    );
EXCEPTION
    WHEN others THEN
        RETURN NULL; -- Return NULL if decryption fails
END;
$$;


ALTER FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "encryption_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "encryption_key" "text") IS 'Secure decryption with error handling';



CREATE OR REPLACE FUNCTION "public"."encrypt_sensitive_data"("data" "text", "encryption_key" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(data, encryption_key, 'compress-algo=1, cipher-algo=aes256'),
        'base64'
    );
END;
$$;


ALTER FUNCTION "public"."encrypt_sensitive_data"("data" "text", "encryption_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."encrypt_sensitive_data"("data" "text", "encryption_key" "text") IS 'AES-256 encryption for sensitive data fields';



CREATE OR REPLACE FUNCTION "public"."generate_billing_analytics"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "organization_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
    total_revenue DECIMAL;
    total_costs DECIMAL;
    customer_count INTEGER;
    usage_stats JSONB;
    cost_breakdown JSONB;
BEGIN
    -- Calculate total revenue
    SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue
    FROM ai_billing_records
    WHERE billing_period_start >= start_date::DATE
    AND billing_period_end <= end_date::DATE
    AND (organization_id IS NULL OR ai_billing_records.organization_id = organization_id);

    -- Calculate total costs
    SELECT COALESCE(SUM(cost), 0) INTO total_costs
    FROM ai_cost_allocations
    WHERE timestamp >= start_date
    AND timestamp <= end_date
    AND (organization_id IS NULL OR ai_cost_allocations.organization_id = organization_id);

    -- Get customer count
    SELECT COUNT(DISTINCT user_id) INTO customer_count
    FROM ai_cost_allocations
    WHERE timestamp >= start_date
    AND timestamp <= end_date
    AND (organization_id IS NULL OR ai_cost_allocations.organization_id = organization_id);

    -- Get usage statistics
    SELECT jsonb_build_object(
        'total_tokens', COALESCE(SUM(tokens_used), 0),
        'total_requests', COUNT(*),
        'avg_tokens_per_request', COALESCE(AVG(tokens_used), 0)
    ) INTO usage_stats
    FROM ai_cost_allocations
    WHERE timestamp >= start_date
    AND timestamp <= end_date
    AND (organization_id IS NULL OR ai_cost_allocations.organization_id = organization_id);

    -- Get cost breakdown
    SELECT jsonb_build_object(
        'openai_costs', COALESCE(SUM(CASE WHEN provider = 'openai' THEN cost ELSE 0 END), 0),
        'openrouter_costs', COALESCE(SUM(CASE WHEN provider = 'openrouter' THEN cost ELSE 0 END), 0),
        'infrastructure_costs', total_costs * 0.1,
        'operational_costs', total_costs * 0.05
    ) INTO cost_breakdown
    FROM ai_cost_allocations
    WHERE timestamp >= start_date
    AND timestamp <= end_date
    AND (organization_id IS NULL OR ai_cost_allocations.organization_id = organization_id);

    -- Build result
    result := jsonb_build_object(
        'total_revenue', total_revenue,
        'total_costs', total_costs,
        'gross_margin', (total_revenue - total_costs) / NULLIF(total_revenue, 0),
        'customer_metrics', jsonb_build_object(
            'total_customers', customer_count,
            'average_revenue_per_user', total_revenue / NULLIF(customer_count, 0)
        ),
        'usage_metrics', usage_stats,
        'cost_breakdown', cost_breakdown
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_billing_analytics"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_referral_code"("email_input" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base code from email
    base_code := UPPER(SUBSTRING(encode(email_input::bytea, 'base64'), 1, 8));
    -- Remove non-alphanumeric characters
    base_code := REGEXP_REPLACE(base_code, '[^A-Z0-9]', '', 'g');
    -- Ensure it's exactly 8 characters
    base_code := RPAD(base_code, 8, '0');
    
    final_code := base_code;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.waitlist_signups WHERE referral_code = final_code) LOOP
        counter := counter + 1;
        final_code := base_code || counter::TEXT;
    END LOOP;
    
    RETURN final_code;
END;
$$;


ALTER FUNCTION "public"."generate_referral_code"("email_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ai_budget_status"("user_uuid" "uuid", "target_month" "text" DEFAULT NULL::"text") RETURNS TABLE("budget_limit" numeric, "current_spend" numeric, "remaining_budget" numeric, "utilization_percent" numeric, "request_count" integer, "is_over_budget" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  month_key TEXT;
BEGIN
  -- Use current month if not specified
  month_key := COALESCE(target_month, TO_CHAR(NOW(), 'YYYY-MM'));
  
  RETURN QUERY
  SELECT 
    bt.budget_limit,
    bt.current_spend,
    (bt.budget_limit - bt.current_spend) as remaining_budget,
    ROUND((bt.current_spend / bt.budget_limit * 100)::DECIMAL, 2) as utilization_percent,
    bt.request_count,
    (bt.current_spend > bt.budget_limit) as is_over_budget
  FROM ai_budget_tracking bt
  WHERE bt.user_id = user_uuid AND bt.month_year = month_key
  UNION ALL
  SELECT 
    100.00::DECIMAL(10, 2) as budget_limit,
    0.00::DECIMAL(10, 2) as current_spend,
    100.00::DECIMAL(10, 2) as remaining_budget,
    0.00::DECIMAL(5, 2) as utilization_percent,
    0 as request_count,
    false as is_over_budget
  WHERE NOT EXISTS (
    SELECT 1 FROM ai_budget_tracking 
    WHERE user_id = user_uuid AND month_year = month_key
  )
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_ai_budget_status"("user_uuid" "uuid", "target_month" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ai_model_analytics"("user_uuid" "uuid" DEFAULT NULL::"uuid", "days_back" integer DEFAULT 30) RETURNS TABLE("model" "text", "provider" "text", "total_requests" bigint, "total_cost" numeric, "average_latency" numeric, "success_rate" numeric, "last_used" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    usage.model,
    usage.provider,
    COUNT(*)::BIGINT as total_requests,
    SUM(usage.cost)::DECIMAL(10, 6) as total_cost,
    AVG(usage.latency)::DECIMAL(8, 2) as average_latency,
    (COUNT(CASE WHEN usage.success THEN 1 END)::DECIMAL / COUNT(*))::DECIMAL(5, 4) as success_rate,
    MAX(usage.timestamp) as last_used
  FROM ai_model_usage usage
  WHERE 
    (user_uuid IS NULL OR usage.user_id = user_uuid)
    AND usage.timestamp >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY usage.model, usage.provider
  ORDER BY total_requests DESC;
END;
$$;


ALTER FUNCTION "public"."get_ai_model_analytics"("user_uuid" "uuid", "days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_business_health"("p_company_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    -- Overall results
    result jsonb;
    overall_score integer;

    -- Company and user records
    company_rec record;
    profile_rec record;
    primary_user_email text;

    -- Integration checks
    has_centralized_storage boolean := false;
    has_endpoint_management boolean := false;
    
    -- Dimension scores
    business_foundations_score integer := 0;
    tech_foundations_score integer := 0;

    -- Gaps and recommendations
    gaps jsonb[] := array[]::jsonb[];

    -- Calculation helpers
    foundations_fields text[] := array['tagline','mission_statement','vision_statement','motto','about_md'];
    foundations_filled_count integer := 0;
    field text;

    tech_foundations_checks integer := 5; -- Total number of tech checks
    tech_foundations_passed integer := 0;

begin
    -- 1. Fetch core records
    select * into company_rec from public.companies where id = p_company_id;
    select * into profile_rec from public.ai_company_profiles where company_id = p_company_id;
    
    -- Get an owner/admin email to check for professional email
    select u.email into primary_user_email
    from public.users u
    join public.user_profiles up on u.id = up.user_id
    where up.company_id = p_company_id
    and up.role in ('Owner', 'Admin')
    limit 1;
    
    if primary_user_email is null then
        select u.email into primary_user_email
        from public.users u
        join public.user_profiles up on u.id = up.user_id
        where up.company_id = p_company_id
        limit 1;
    end if;

    -- 2. Check for key integrations
    select exists(select 1 from public.user_integrations where company_id = p_company_id and type in ('google-drive', 'onedrive', 'dropbox', 'microsoft-365')) into has_centralized_storage;
    select exists(select 1 from public.user_integrations where company_id = p_company_id and type in ('ninjarmm', 'microsoft-intune')) into has_endpoint_management;

    -- 3. Calculate Business Foundations Score
    if profile_rec is not null then
        declare profile_json jsonb := to_jsonb(profile_rec);
        begin
            foreach field in array foundations_fields loop
                if profile_json->>field is not null and profile_json->>field <> '' then
                    foundations_filled_count := foundations_filled_count + 1;
                else
                    gaps := array_append(gaps, jsonb_build_object(
                        'category', 'business_foundations',
                        'slug', 'complete_profile',
                        'title', 'Complete Your Business Profile',
                        'description', 'A complete profile helps us understand your business. Fill out your ' || field || '.'
                    ));
                end if;
            end loop;
        end;
    else
        foundations_filled_count := 0;
        gaps := array_append(gaps, jsonb_build_object(
            'category', 'business_foundations',
            'slug', 'create_profile',
            'title', 'Create Your Company Profile',
            'description', 'Your company profile is missing. Creating it is the first step to understanding your business health.'
        ));
    end if;

    if array_length(foundations_fields, 1) > 0 then
      business_foundations_score := round((foundations_filled_count::numeric / array_length(foundations_fields, 1)) * 100);
    else
      business_foundations_score := 100;
    end if;

    -- 4. Calculate Technical Foundations Score
    if company_rec.website is not null and company_rec.website <> '' then
        tech_foundations_passed := tech_foundations_passed + 1;
    else
        gaps := array_append(gaps, jsonb_build_object('category', 'tech_foundations', 'slug', 'add_website', 'title', 'Add Your Company Website', 'description', 'A website is crucial for modern business. Marcoby can help build and host a professional site.', 'upsell', 'website-services'));
    end if;

    if company_rec.domain is not null and company_rec.domain <> '' then
        tech_foundations_passed := tech_foundations_passed + 1;
    else
        gaps := array_append(gaps, jsonb_build_object('category', 'tech_foundations', 'slug', 'add_domain', 'title', 'Add Your Company Domain', 'description', 'A professional domain builds trust and brand identity.', 'upsell', 'domain-registration'));
    end if;

    if primary_user_email is not null and primary_user_email not like '%@gmail.com' and primary_user_email not like '%@yahoo.com' and primary_user_email not like '%@outlook.com' then
        tech_foundations_passed := tech_foundations_passed + 1;
    else
        gaps := array_append(gaps, jsonb_build_object('category', 'tech_foundations', 'slug', 'get_business_email', 'title', 'Set Up Professional Business Email', 'description', 'Using a professional email (e.g., you@yourcompany.com) builds credibility. We can set this up for you with Microsoft 365 or Google Workspace.', 'upsell', 'email-services'));
    end if;

    if has_centralized_storage then
        tech_foundations_passed := tech_foundations_passed + 1;
    else
        gaps := array_append(gaps, jsonb_build_object('category', 'tech_foundations', 'slug', 'setup_centralized_storage', 'title', 'Implement Centralized Cloud Storage', 'description', 'Centralized storage (like OneDrive or Google Drive) improves collaboration and security. Connect an integration or let us help you set it up.', 'upsell', 'storage-setup'));
    end if;

    if has_endpoint_management then
        tech_foundations_passed := tech_foundations_passed + 1;
    else
        gaps := array_append(gaps, jsonb_build_object('category', 'tech_foundations', 'slug', 'setup_endpoint_management', 'title', 'Secure Your Devices with Endpoint Management', 'description', 'Endpoint management (like NinjaRMM or Microsoft Intune) is key for securing company devices. Marcoby is a VAR and can get you set up.', 'upsell', 'endpoint-management'));
    end if;

    tech_foundations_score := round((tech_foundations_passed::numeric / tech_foundations_checks) * 100);

    -- 5. Calculate Overall Score
    overall_score := (business_foundations_score + tech_foundations_score) / 2;

    -- 6. Construct the final JSONB object
    result := jsonb_build_object(
        'score', overall_score,
        'dimensions', jsonb_build_array(
            jsonb_build_object('id', 'business_foundations', 'label', 'Business Foundations', 'score', business_foundations_score),
            jsonb_build_object('id', 'tech_foundations', 'label', 'Technical Foundations', 'score', tech_foundations_score)
        ),
        'gaps', coalesce(array_to_json(gaps)::jsonb, '[]'::jsonb)
    );

    return result;
end;
$$;


ALTER FUNCTION "public"."get_business_health"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_business_health_score"() RETURNS TABLE("score" integer, "breakdown" "jsonb", "last_updated" timestamp with time zone, "data_sources" "text"[], "completeness_percentage" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  current_user_id uuid;
  current_company_id uuid;
  sales_score integer := 0;
  marketing_score integer := 0;
  finance_score integer := 0;
  operations_score integer := 0;
  support_score integer := 0;
  overall_score integer := 0;
  sources_used text[] := ARRAY[]::text[];
  total_data_points integer := 0;
  available_data_points integer := 0;
  
  -- Data variables
  hubspot_data jsonb;
  apollo_data jsonb;
  marcoby_data jsonb;
  kpi_data jsonb;
BEGIN
  -- Get current user and company
  current_user_id := auth.uid();
  
  -- Get user's company
  SELECT company_id INTO current_company_id
  FROM user_profiles 
  WHERE user_id = current_user_id;
  
  IF current_company_id IS NULL THEN
    -- Return minimal data for users without companies
    RETURN QUERY
    SELECT 
      0 as score,
      jsonb_build_object(
        'sales', 0,
        'marketing', 0,
        'finance', 0,
        'operations', 0,
        'support', 0,
        'message', 'No company profile found'
      ) as breakdown,
      NOW() as last_updated,
      ARRAY[]::text[] as data_sources,
      0 as completeness_percentage;
    RETURN;
  END IF;
  
  -- 1. SALES METRICS (HubSpot + Apollo integration)
  BEGIN
    -- Get latest HubSpot metrics
    SELECT 
      jsonb_build_object(
        'deals_count', COUNT(CASE WHEN status = 'open' THEN 1 END),
        'deals_value', COALESCE(SUM(CASE WHEN status = 'open' THEN amount ELSE 0 END), 0),
        'closed_deals', COUNT(CASE WHEN status = 'closed_won' THEN 1 END),
        'conversion_rate', CASE 
          WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'closed_won' THEN 1 END) * 100.0 / COUNT(*))
          ELSE 0 
        END
      ) INTO hubspot_data
    FROM deals 
    WHERE company_id = current_company_id 
      AND created_at >= NOW() - INTERVAL '90 days';
    
    -- Get Apollo outreach metrics
    SELECT 
      jsonb_build_object(
        'contacts_added', COUNT(*),
        'email_opens', COALESCE(SUM((metadata->>'email_opens')::integer), 0),
        'responses', COALESCE(SUM((metadata->>'responses')::integer), 0)
      ) INTO apollo_data
    FROM contacts 
    WHERE company_id = current_company_id 
      AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate sales score
    sales_score := LEAST(100, GREATEST(0, 
      COALESCE((hubspot_data->>'conversion_rate')::numeric, 0) + 
      CASE WHEN (apollo_data->>'contacts_added')::integer > 50 THEN 20 ELSE 0 END +
      CASE WHEN (hubspot_data->>'deals_count')::integer > 10 THEN 30 ELSE 0 END
    ));
    
    IF hubspot_data IS NOT NULL OR apollo_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'CRM');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Handle errors gracefully
    sales_score := 0;
  END;
  
  -- 2. MARKETING METRICS (Website analytics + lead generation)
  BEGIN
    -- Get marketing KPIs from snapshots
    SELECT 
      jsonb_build_object(
        'website_traffic', COALESCE(MAX(CASE WHEN kpi_key = 'website_traffic' THEN (value->>'value')::integer END), 0),
        'lead_conversion', COALESCE(MAX(CASE WHEN kpi_key = 'lead_conversion_rate' THEN (value->>'value')::numeric END), 0),
        'social_engagement', COALESCE(MAX(CASE WHEN kpi_key = 'social_engagement' THEN (value->>'value')::integer END), 0)
      ) INTO kpi_data
    FROM ai_kpi_snapshots 
    WHERE org_id = current_company_id 
      AND department_id = 'marketing'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    marketing_score := LEAST(100, GREATEST(0,
      CASE WHEN (kpi_data->>'website_traffic')::integer > 1000 THEN 30 ELSE 0 END +
      CASE WHEN (kpi_data->>'lead_conversion')::numeric > 2.0 THEN 40 ELSE 0 END +
      CASE WHEN (kpi_data->>'social_engagement')::integer > 100 THEN 30 ELSE 0 END
    ));
    
    IF kpi_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'Marketing KPIs');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    marketing_score := 0;
  END;
  
  -- 3. FINANCE METRICS (Revenue + profitability)
  BEGIN
    -- Get financial KPIs
    SELECT 
      jsonb_build_object(
        'monthly_revenue', COALESCE(MAX(CASE WHEN kpi_key = 'monthly_revenue' THEN (value->>'value')::numeric END), 0),
        'profit_margin', COALESCE(MAX(CASE WHEN kpi_key = 'profit_margin' THEN (value->>'value')::numeric END), 0),
        'cash_flow', COALESCE(MAX(CASE WHEN kpi_key = 'cash_flow' THEN (value->>'value')::numeric END), 0)
      ) INTO kpi_data
    FROM ai_kpi_snapshots 
    WHERE org_id = current_company_id 
      AND department_id = 'finance'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    finance_score := LEAST(100, GREATEST(0,
      CASE WHEN (kpi_data->>'monthly_revenue')::numeric > 10000 THEN 40 ELSE 0 END +
      CASE WHEN (kpi_data->>'profit_margin')::numeric > 20 THEN 30 ELSE 0 END +
      CASE WHEN (kpi_data->>'cash_flow')::numeric > 0 THEN 30 ELSE 0 END
    ));
    
    IF kpi_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'Financial KPIs');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    finance_score := 0;
  END;
  
  -- 4. OPERATIONS METRICS (Marcoby Cloud + automation)
  BEGIN
    -- Get operational KPIs
    SELECT 
      jsonb_build_object(
        'uptime', COALESCE(MAX(CASE WHEN kpi_key = 'service_uptime' THEN (value->>'value')::numeric END), 99.0),
        'automation_coverage', COALESCE(MAX(CASE WHEN kpi_key = 'automation_coverage' THEN (value->>'value')::numeric END), 0),
        'asset_utilization', COALESCE(MAX(CASE WHEN kpi_key = 'asset_utilization' THEN (value->>'value')::numeric END), 0)
      ) INTO marcoby_data
    FROM ai_kpi_snapshots 
    WHERE org_id = current_company_id 
      AND department_id = 'operations'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    operations_score := LEAST(100, GREATEST(0,
      CASE WHEN (marcoby_data->>'uptime')::numeric > 99.5 THEN 40 ELSE 0 END +
      CASE WHEN (marcoby_data->>'automation_coverage')::numeric > 50 THEN 30 ELSE 0 END +
      CASE WHEN (marcoby_data->>'asset_utilization')::numeric BETWEEN 60 AND 90 THEN 30 ELSE 0 END
    ));
    
    IF marcoby_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'Marcoby Cloud');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    operations_score := 0;
  END;
  
  -- 5. SUPPORT METRICS (Customer satisfaction + response times)
  BEGIN
    -- Get support KPIs
    SELECT 
      jsonb_build_object(
        'response_time', COALESCE(MAX(CASE WHEN kpi_key = 'avg_response_time' THEN (value->>'value')::numeric END), 24),
        'satisfaction_score', COALESCE(MAX(CASE WHEN kpi_key = 'customer_satisfaction' THEN (value->>'value')::numeric END), 0),
        'ticket_resolution', COALESCE(MAX(CASE WHEN kpi_key = 'ticket_resolution_rate' THEN (value->>'value')::numeric END), 0)
      ) INTO kpi_data
    FROM ai_kpi_snapshots 
    WHERE org_id = current_company_id 
      AND department_id = 'support'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    support_score := LEAST(100, GREATEST(0,
      CASE WHEN (kpi_data->>'response_time')::numeric < 2 THEN 30 ELSE 0 END +
      CASE WHEN (kpi_data->>'satisfaction_score')::numeric > 8 THEN 40 ELSE 0 END +
      CASE WHEN (kpi_data->>'ticket_resolution')::numeric > 90 THEN 30 ELSE 0 END
    ));
    
    IF kpi_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'Support KPIs');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    support_score := 0;
  END;
  
  -- Calculate overall score (weighted average)
  total_data_points := 5; -- sales, marketing, finance, operations, support
  overall_score := ROUND(
    (sales_score * 0.25) + 
    (marketing_score * 0.20) + 
    (finance_score * 0.25) + 
    (operations_score * 0.20) + 
    (support_score * 0.10)
  );
  
  -- Return comprehensive results
  RETURN QUERY
  SELECT 
    overall_score as score,
    jsonb_build_object(
      'sales', sales_score,
      'marketing', marketing_score,
      'finance', finance_score,
      'operations', operations_score,
      'support', support_score,
      'details', jsonb_build_object(
        'hubspot_data', hubspot_data,
        'apollo_data', apollo_data,
        'marcoby_data', marcoby_data,
        'company_id', current_company_id
      )
    ) as breakdown,
    NOW() as last_updated,
    sources_used as data_sources,
    CASE 
      WHEN total_data_points > 0 THEN ROUND((available_data_points * 100.0) / total_data_points)
      ELSE 0 
    END as completeness_percentage;
END;
$$;


ALTER FUNCTION "public"."get_business_health_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_client_engagement_summary"("company_uuid" "uuid") RETURNS TABLE("total_clients" bigint, "high_engagement_clients" bigint, "at_risk_clients" bigint, "avg_engagement_score" numeric, "total_estimated_value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_clients,
        COUNT(CASE WHEN engagement_score >= 0.7 THEN 1 END)::BIGINT as high_engagement_clients,
        COUNT(CASE WHEN engagement_score < 0.3 THEN 1 END)::BIGINT as at_risk_clients,
        ROUND(AVG(engagement_score), 3) as avg_engagement_score,
        ROUND(COALESCE(SUM(estimated_value), 0), 2) as total_estimated_value
    FROM public.ai_unified_client_profiles 
    WHERE company_id = company_uuid;
END;
$$;


ALTER FUNCTION "public"."get_client_engagement_summary"("company_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_communication_health_score"("p_user_id" "uuid", "p_days_back" integer DEFAULT 7) RETURNS TABLE("platform" "text", "health_score" numeric, "metrics" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH recent_analytics AS (
        SELECT 
            ca.platform,
            AVG(CAST(ca.metric_value->>'response_time_avg' AS DECIMAL)) as avg_response_time,
            AVG(CAST(ca.metric_value->>'engagement_score' AS DECIMAL)) as avg_engagement,
            COUNT(*) as metric_count
        FROM public.communication_analytics ca
        WHERE ca.user_id = p_user_id
        AND ca.created_at >= NOW() - INTERVAL '1 day' * p_days_back
        GROUP BY ca.platform
    )
    SELECT 
        ra.platform,
        CASE 
            WHEN ra.avg_response_time <= 15 AND ra.avg_engagement >= 0.8 THEN 95.0
            WHEN ra.avg_response_time <= 30 AND ra.avg_engagement >= 0.7 THEN 85.0
            WHEN ra.avg_response_time <= 60 AND ra.avg_engagement >= 0.6 THEN 75.0
            WHEN ra.avg_response_time <= 120 AND ra.avg_engagement >= 0.5 THEN 65.0
            ELSE 45.0
        END as health_score,
        jsonb_build_object(
            'avg_response_time', ra.avg_response_time,
            'avg_engagement', ra.avg_engagement,
            'metric_count', ra.metric_count
        ) as metrics
    FROM recent_analytics ra;
END;
$$;


ALTER FUNCTION "public"."get_communication_health_score"("p_user_id" "uuid", "p_days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cost_allocation_breakdown"("user_id_param" "uuid", "start_date" timestamp with time zone, "end_date" timestamp with time zone, "group_by_param" "text") RETURNS TABLE("category" "text", "total_cost" numeric, "total_tokens" integer, "request_count" integer, "avg_cost_per_request" numeric, "top_models" "jsonb", "trend" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            CASE 
                WHEN %L = ''department'' THEN COALESCE(department_id, ''unassigned'')
                WHEN %L = ''agent'' THEN agent_id
                WHEN %L = ''model'' THEN model || '' ('' || provider || '')''
                WHEN %L = ''project'' THEN COALESCE(project_id, ''unassigned'')
                WHEN %L = ''cost_center'' THEN COALESCE(cost_center, ''unassigned'')
                ELSE ''other''
            END as category,
            SUM(cost)::DECIMAL as total_cost,
            SUM(tokens_used)::INTEGER as total_tokens,
            COUNT(*)::INTEGER as request_count,
            (SUM(cost) / COUNT(*))::DECIMAL as avg_cost_per_request,
            jsonb_agg(DISTINCT jsonb_build_object(''model'', model, ''provider'', provider)) as top_models,
            ''stable''::TEXT as trend
        FROM ai_cost_allocations
        WHERE user_id = %L
        AND timestamp >= %L
        AND timestamp <= %L
        GROUP BY category
        ORDER BY total_cost DESC
    ', group_by_param, group_by_param, group_by_param, group_by_param, group_by_param, user_id_param, start_date, end_date);
END;
$$;


ALTER FUNCTION "public"."get_cost_allocation_breakdown"("user_id_param" "uuid", "start_date" timestamp with time zone, "end_date" timestamp with time zone, "group_by_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_demo_business_health_score"() RETURNS TABLE("score" integer, "breakdown" "jsonb", "last_updated" timestamp with time zone, "data_sources" "text"[], "completeness_percentage" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  demo_company_id uuid := '37071762-9079-4f40-bcca-49822e38db0f';
  sales_score integer := 0;
  marketing_score integer := 0;
  finance_score integer := 0;
  operations_score integer := 0;
  support_score integer := 0;
  overall_score integer := 0;
  sources_used text[] := ARRAY[]::text[];
  available_data_points integer := 0;
  completeness_pct integer := 0;
  
  -- Data variables
  hubspot_data jsonb;
  apollo_data jsonb;
  marcoby_data jsonb;
  kpi_data jsonb;
BEGIN
  -- 1. SALES METRICS (HubSpot deals + contacts)
  BEGIN
    -- Get latest HubSpot metrics from deals table
    SELECT 
      jsonb_build_object(
        'deals_count', COUNT(CASE WHEN stage NOT ILIKE '%closed%' THEN 1 END),
        'deals_value', COALESCE(SUM(CASE WHEN stage NOT ILIKE '%closed%' THEN amount ELSE 0 END), 0),
        'closed_deals', COUNT(CASE WHEN stage ILIKE '%closed%' AND stage ILIKE '%won%' THEN 1 END),
        'conversion_rate', CASE 
          WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN stage ILIKE '%closed%' AND stage ILIKE '%won%' THEN 1 END) * 100.0 / COUNT(*))
          ELSE 0 
        END
      ) INTO hubspot_data
    FROM deals 
    WHERE "lastSyncedAt" >= NOW() - INTERVAL '90 days';
    
    -- Get Apollo outreach metrics from contacts table
    SELECT 
      jsonb_build_object(
        'contacts_added', COUNT(*),
        'email_opens', COALESCE(SUM((properties->>'email_opens')::integer), 0),
        'responses', COALESCE(SUM((properties->>'responses')::integer), 0)
      ) INTO apollo_data
    FROM contacts 
    WHERE "companyId" = demo_company_id 
      AND "lastSyncedAt" >= NOW() - INTERVAL '30 days';
    
    -- Calculate sales score
    sales_score := LEAST(100, GREATEST(0, 
      COALESCE((hubspot_data->>'conversion_rate')::numeric, 0)::integer + 
      CASE WHEN (apollo_data->>'contacts_added')::integer > 3 THEN 20 ELSE 0 END +
      CASE WHEN (hubspot_data->>'deals_count')::integer > 2 THEN 30 ELSE 0 END
    ));
    
    sources_used := array_append(sources_used, 'CRM');
    available_data_points := available_data_points + 1;
    
  EXCEPTION WHEN OTHERS THEN
    sales_score := 0;
  END;
  
  -- 2. MARKETING METRICS
  BEGIN
    SELECT 
      jsonb_build_object(
        'website_traffic', COALESCE(MAX(CASE WHEN kpi_id = 'website_traffic' THEN (value->>'value')::integer END), 0),
        'lead_conversion', COALESCE(MAX(CASE WHEN kpi_id = 'lead_conversion_rate' THEN (value->>'value')::numeric END), 0),
        'social_engagement', COALESCE(MAX(CASE WHEN kpi_id = 'social_engagement' THEN (value->>'value')::integer END), 0)
      ) INTO kpi_data
    FROM ai_kpi_snapshots 
    WHERE org_id = demo_company_id 
      AND department_id = 'marketing'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    marketing_score := LEAST(100, GREATEST(0,
      CASE WHEN (kpi_data->>'website_traffic')::integer > 1000 THEN 30 ELSE 0 END +
      CASE WHEN (kpi_data->>'lead_conversion')::numeric > 2.0 THEN 40 ELSE 0 END +
      CASE WHEN (kpi_data->>'social_engagement')::integer > 100 THEN 30 ELSE 0 END
    ));
    
    sources_used := array_append(sources_used, 'Marketing KPIs');
    available_data_points := available_data_points + 1;
    
  EXCEPTION WHEN OTHERS THEN
    marketing_score := 0;
  END;
  
  -- 3. FINANCE METRICS
  BEGIN
    SELECT 
      jsonb_build_object(
        'monthly_revenue', COALESCE(MAX(CASE WHEN kpi_id = 'monthly_revenue' THEN (value->>'value')::numeric END), 0),
        'profit_margin', COALESCE(MAX(CASE WHEN kpi_id = 'profit_margin' THEN (value->>'value')::numeric END), 0),
        'cash_flow', COALESCE(MAX(CASE WHEN kpi_id = 'cash_flow' THEN (value->>'value')::numeric END), 0)
      ) INTO kpi_data
    FROM ai_kpi_snapshots 
    WHERE org_id = demo_company_id 
      AND department_id = 'finance'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    finance_score := LEAST(100, GREATEST(0,
      CASE WHEN (kpi_data->>'monthly_revenue')::numeric > 10000 THEN 40 ELSE 0 END +
      CASE WHEN (kpi_data->>'profit_margin')::numeric > 20 THEN 30 ELSE 0 END +
      CASE WHEN (kpi_data->>'cash_flow')::numeric > 0 THEN 30 ELSE 0 END
    ));
    
    sources_used := array_append(sources_used, 'Financial KPIs');
    available_data_points := available_data_points + 1;
    
  EXCEPTION WHEN OTHERS THEN
    finance_score := 0;
  END;
  
  -- 4. OPERATIONS METRICS
  BEGIN
    SELECT 
      jsonb_build_object(
        'uptime', COALESCE(MAX(CASE WHEN kpi_id = 'service_uptime' THEN (value->>'value')::numeric END), 99.0),
        'automation_coverage', COALESCE(MAX(CASE WHEN kpi_id = 'automation_coverage' THEN (value->>'value')::numeric END), 0),
        'asset_utilization', COALESCE(MAX(CASE WHEN kpi_id = 'asset_utilization' THEN (value->>'value')::numeric END), 0)
      ) INTO marcoby_data
    FROM ai_kpi_snapshots 
    WHERE org_id = demo_company_id 
      AND department_id = 'operations'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    operations_score := LEAST(100, GREATEST(0,
      CASE WHEN (marcoby_data->>'uptime')::numeric > 99.5 THEN 40 ELSE 0 END +
      CASE WHEN (marcoby_data->>'automation_coverage')::numeric > 50 THEN 30 ELSE 0 END +
      CASE WHEN (marcoby_data->>'asset_utilization')::numeric BETWEEN 60 AND 90 THEN 30 ELSE 0 END
    ));
    
    sources_used := array_append(sources_used, 'Marcoby Cloud');
    available_data_points := available_data_points + 1;
    
  EXCEPTION WHEN OTHERS THEN
    operations_score := 0;
  END;
  
  -- 5. SUPPORT METRICS
  BEGIN
    SELECT 
      jsonb_build_object(
        'response_time', COALESCE(MAX(CASE WHEN kpi_id = 'avg_response_time' THEN (value->>'value')::numeric END), 24),
        'satisfaction_score', COALESCE(MAX(CASE WHEN kpi_id = 'customer_satisfaction' THEN (value->>'value')::numeric END), 0),
        'ticket_resolution', COALESCE(MAX(CASE WHEN kpi_id = 'ticket_resolution_rate' THEN (value->>'value')::numeric END), 0)
      ) INTO kpi_data
    FROM ai_kpi_snapshots 
    WHERE org_id = demo_company_id 
      AND department_id = 'support'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    support_score := LEAST(100, GREATEST(0,
      CASE WHEN (kpi_data->>'response_time')::numeric < 2 THEN 30 ELSE 0 END +
      CASE WHEN (kpi_data->>'satisfaction_score')::numeric > 8 THEN 40 ELSE 0 END +
      CASE WHEN (kpi_data->>'ticket_resolution')::numeric > 90 THEN 30 ELSE 0 END
    ));
    
    sources_used := array_append(sources_used, 'Support KPIs');
    available_data_points := available_data_points + 1;
    
  EXCEPTION WHEN OTHERS THEN
    support_score := 0;
  END;
  
  -- Calculate overall score and completeness
  overall_score := ROUND(
    (sales_score * 0.25) + 
    (marketing_score * 0.20) + 
    (finance_score * 0.25) + 
    (operations_score * 0.20) + 
    (support_score * 0.10)
  )::integer;
  
  completeness_pct := CASE 
    WHEN available_data_points > 0 THEN ROUND((available_data_points * 100.0) / 5)::integer
    ELSE 0 
  END;
  
  -- Return comprehensive results
  RETURN QUERY
  SELECT 
    overall_score as score,
    jsonb_build_object(
      'sales', sales_score,
      'marketing', marketing_score,
      'finance', finance_score,
      'operations', operations_score,
      'support', support_score,
      'details', jsonb_build_object(
        'hubspot_data', hubspot_data,
        'apollo_data', apollo_data,
        'marcoby_data', marcoby_data,
        'company_id', demo_company_id
      )
    ) as breakdown,
    NOW() as last_updated,
    sources_used as data_sources,
    completeness_pct as completeness_percentage;
END;
$$;


ALTER FUNCTION "public"."get_demo_business_health_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inbox_stats"("p_user_id" "uuid") RETURNS TABLE("total_items" bigint, "unread_count" bigint, "high_priority_count" bigint, "flagged_count" bigint, "today_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE status = 'unread') as unread_count,
        COUNT(*) FILTER (WHERE ai_priority_score >= 80) as high_priority_count,
        COUNT(*) FILTER (WHERE is_flagged = true) as flagged_count,
        COUNT(*) FILTER (WHERE received_at >= CURRENT_DATE) as today_count
    FROM ai_inbox_items 
    WHERE user_id = p_user_id 
    AND status != 'deleted';
END;
$$;


ALTER FUNCTION "public"."get_inbox_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_items', COUNT(*),
        'unread_count', COUNT(*) FILTER (WHERE status = 'unread'),
        'important_count', COUNT(*) FILTER (WHERE is_important = true),
        'high_priority_count', COUNT(*) FILTER (WHERE ai_priority_score >= 80),
        'flagged_count', COUNT(*) FILTER (WHERE is_flagged = true),
        'categories', json_agg(DISTINCT ai_category) FILTER (WHERE ai_category IS NOT NULL),
        'last_updated', MAX(updated_at)
    ) INTO result
    FROM ai_inbox_items
    WHERE user_id = p_user_id AND status != 'deleted';
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_jwt_claims"("uid" "uuid", "email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  company_id uuid;
begin
  -- Get the user's company_id
  select private.get_company_id_from_user_id(uid) into company_id;

  -- Return the custom claims as a JSON object
  return jsonb_build_object(
    'org_id', company_id
  );
end;
$$;


ALTER FUNCTION "public"."get_jwt_claims"("uid" "uuid", "email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_onboarding_progress"("user_uuid" "uuid") RETURNS TABLE("needs_onboarding" boolean, "current_step" "text", "steps_completed" "jsonb", "progress_percentage" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    step_count INTEGER;
    total_steps INTEGER := 6;
BEGIN
    RETURN QUERY
    SELECT 
        public.user_needs_onboarding(user_uuid) as needs_onboarding,
        COALESCE(uop.current_step, 'introduction') as current_step,
        COALESCE(uop.steps_completed, '[]'::jsonb) as steps_completed,
        CASE 
            WHEN uop.onboarding_completed THEN 100
            ELSE COALESCE((jsonb_array_length(uop.steps_completed) * 100 / total_steps), 0)
        END as progress_percentage
    FROM public.user_onboarding_progress uop
    WHERE uop.user_id = user_uuid
    UNION ALL
    SELECT 
        true as needs_onboarding,
        'introduction' as current_step,
        '[]'::jsonb as steps_completed,
        0 as progress_percentage
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_onboarding_progress WHERE user_id = user_uuid
    )
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_onboarding_progress"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_performance_trends"("metric_name" "text", "timeframe_type" "text", "agent_filter" "text" DEFAULT NULL::"text") RETURNS TABLE("timestamp" timestamp with time zone, "value" numeric, "count" integer, "agent_id" "text", "model" "text", "provider" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.timestamp,
        pm.metric_value as value,
        1 as count,
        pm.agent_id,
        pm.model,
        pm.provider
    FROM ai_performance_metrics pm
    WHERE pm.metric_type = metric_name
    AND pm.timeframe = timeframe_type
    AND (agent_filter IS NULL OR pm.agent_id = agent_filter)
    ORDER BY pm.timestamp DESC
    LIMIT 100;
END;
$$;


ALTER FUNCTION "public"."get_performance_trends"("metric_name" "text", "timeframe_type" "text", "agent_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_personal_context_for_ai"("user_uuid" "uuid" DEFAULT "auth"."uid"(), "business_context_filter" "jsonb" DEFAULT NULL::"jsonb", "recent_days" integer DEFAULT 30, "limit_count" integer DEFAULT 20) RETURNS TABLE("thought_content" "text", "category" "text", "tags" "text"[], "business_context" "jsonb", "days_ago" integer, "has_business_impact" boolean)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    pt.content as thought_content,
    pt.category,
    pt.tags,
    pt.business_context,
    EXTRACT(days FROM NOW() - pt.created_at)::INTEGER as days_ago,
    EXISTS(
      SELECT 1 FROM insight_business_connections ibc 
      WHERE ibc.personal_thought_id = pt.id
    ) as has_business_impact
  FROM personal_thoughts pt
  WHERE 
    pt.user_id = user_uuid
    AND pt.created_at >= NOW() - (recent_days || ' days')::INTERVAL
    AND (business_context_filter IS NULL OR pt.business_context @> business_context_filter)
  ORDER BY pt.created_at DESC
  LIMIT limit_count;
$$;


ALTER FUNCTION "public"."get_personal_context_for_ai"("user_uuid" "uuid", "business_context_filter" "jsonb", "recent_days" integer, "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_platform_comparison"("p_user_id" "uuid", "p_days_back" integer DEFAULT 30) RETURNS TABLE("comparison_data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH platform_stats AS (
        SELECT 
            ca.platform,
            AVG(CAST(ca.metric_value->>'response_time_avg' AS DECIMAL)) as avg_response_time,
            AVG(CAST(ca.metric_value->>'message_count' AS DECIMAL)) as avg_messages,
            AVG(CAST(ca.metric_value->>'engagement_score' AS DECIMAL)) as avg_engagement,
            COUNT(DISTINCT DATE(ca.created_at)) as active_days
        FROM public.communication_analytics ca
        WHERE ca.user_id = p_user_id
        AND ca.created_at >= NOW() - INTERVAL '1 day' * p_days_back
        GROUP BY ca.platform
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'platform', ps.platform,
            'avg_response_time', ps.avg_response_time,
            'avg_messages', ps.avg_messages,
            'avg_engagement', ps.avg_engagement,
            'active_days', ps.active_days
        )
    ) as comparison_data
    FROM platform_stats ps;
END;
$$;


ALTER FUNCTION "public"."get_platform_comparison"("p_user_id" "uuid", "p_days_back" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_learning_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "context" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_learning_events" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_learning_events"("p_limit" integer DEFAULT 100) RETURNS SETOF "public"."ai_learning_events"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT *
    FROM public.ai_learning_events
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT COALESCE(p_limit, 100);
$$;


ALTER FUNCTION "public"."get_recent_learning_events"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_scheduled_syncs"() RETURNS TABLE("user_integration_id" "uuid", "user_id" "uuid", "company_id" "uuid", "integration_id" "uuid", "sync_frequency" "text")
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
    SELECT 
        id,
        user_id,
        company_id,
        integration_id,
        sync_frequency
    FROM public.user_integrations
    WHERE status = 'active'
    AND next_sync_at <= NOW();
$$;


ALTER FUNCTION "public"."get_scheduled_syncs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_client_opportunities"("company_uuid" "uuid", "limit_count" integer DEFAULT 10) RETURNS TABLE("client_id" "text", "client_name" "text", "estimated_value" numeric, "engagement_score" numeric, "relationship_strength" "text", "last_interaction" timestamp with time zone, "opportunity_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ucp.client_id,
        COALESCE(ucp.profile_data->>'basic_info'->>'name', ucp.client_id) as client_name,
        ucp.estimated_value,
        ucp.engagement_score,
        ucp.relationship_strength,
        (SELECT MAX(ci.interaction_timestamp) 
         FROM public.ai_client_interactions ci 
         WHERE ci.client_profile_id = ucp.id) as last_interaction,
        (ucp.engagement_score * 0.4 + 
         LEAST(ucp.estimated_value / 100000.0, 1.0) * 0.6) as opportunity_score
    FROM public.ai_unified_client_profiles ucp
    WHERE ucp.company_id = company_uuid
    AND ucp.engagement_score > 0.5
    ORDER BY opportunity_score DESC, estimated_value DESC
    LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_top_client_opportunities"("company_uuid" "uuid", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_billing_status"("p_user_id" "text") RETURNS TABLE("tier" "text", "has_active_subscription" boolean, "subscription_status" "text", "current_period_end" timestamp with time zone, "stripe_customer_id" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.tier,
    CASE 
      WHEN ul.subscription_status = 'active' THEN TRUE
      ELSE FALSE
    END as has_active_subscription,
    ul.subscription_status,
    ul.current_period_end,
    ul.stripe_customer_id
  FROM user_licenses ul
  WHERE ul.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_billing_status"("p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_integration_analytics"("user_uuid" "uuid") RETURNS TABLE("total_integrations" bigint, "active_integrations" bigint, "integrations_in_error" bigint, "total_synced_data" bigint)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    SELECT 
        COUNT(*) as total_integrations,
        COUNT(*) FILTER (WHERE ui.status = 'active') as active_integrations,
        COUNT(*) FILTER (WHERE ui.status = 'error') as integrations_in_error,
        (SELECT COUNT(*) FROM public.integration_data id WHERE id.user_integration_id IN (SELECT i.id FROM public.user_integrations i WHERE i.user_id = user_uuid)) as total_synced_data
    FROM public.user_integrations ui
    WHERE ui.user_id = user_uuid;
$$;


ALTER FUNCTION "public"."get_user_integration_analytics"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_integration_details"("user_integration_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "status" "text", "last_sync_at" timestamp with time zone, "total_syncs" integer, "integration_name" "text", "integration_icon" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        ui.name,
        ui.status,
        ui.last_sync_at,
        ui.total_syncs,
        i.name,
        i.icon_url
    FROM public.user_integrations ui
    JOIN public.integrations i ON ui.integration_id = i.id
    WHERE ui.id = user_integration_id;
END;
$$;


ALTER FUNCTION "public"."get_user_integration_details"("user_integration_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_quota_status"("p_user_id" "text") RETURNS TABLE("tier" "text", "messages_today" integer, "messages_this_hour" integer, "files_uploaded_today" integer, "max_messages_per_day" integer, "max_messages_per_hour" integer, "max_file_uploads_per_day" integer, "streaming_enabled" boolean, "advanced_agents_enabled" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_tier TEXT;
  hour_start TIMESTAMPTZ;
BEGIN
  -- Get user's tier
  SELECT ul.tier INTO user_tier
  FROM user_licenses ul
  WHERE ul.user_id = p_user_id;
  
  -- Default to free if no license found
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Calculate hour start
  hour_start := date_trunc('hour', NOW());
  
  RETURN QUERY
  SELECT 
    user_tier,
    COALESCE(usage.message_count, 0) as messages_today,
    COALESCE(
      (SELECT COUNT(*) 
       FROM chat_messages cm 
       WHERE cm.user_id::text = p_user_id 
       AND cm.created_at >= hour_start), 0
    )::INTEGER as messages_this_hour,
    COALESCE(usage.files_uploaded, 0) as files_uploaded_today,
    CASE user_tier
      WHEN 'pro' THEN 500
      WHEN 'enterprise' THEN 2000
      ELSE 20
    END as max_messages_per_day,
    CASE user_tier
      WHEN 'pro' THEN 100
      WHEN 'enterprise' THEN 500
      ELSE 10
    END as max_messages_per_hour,
    CASE user_tier
      WHEN 'pro' THEN 20
      WHEN 'enterprise' THEN 100
      ELSE 0
    END as max_file_uploads_per_day,
    CASE user_tier
      WHEN 'free' THEN FALSE
      ELSE TRUE
    END as streaming_enabled,
    CASE user_tier
      WHEN 'free' THEN FALSE
      ELSE TRUE
    END as advanced_agents_enabled
  FROM (
    SELECT 
      COALESCE(SUM(message_count), 0) as message_count,
      COALESCE(SUM(files_uploaded), 0) as files_uploaded
    FROM chat_usage_tracking
    WHERE user_id = p_user_id AND date = CURRENT_DATE
  ) usage;
END;
$$;


ALTER FUNCTION "public"."get_user_quota_status"("p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_with_company"("user_uuid" "uuid") RETURNS TABLE("user_id" "uuid", "email" "text", "first_name" "text", "last_name" "text", "display_name" "text", "avatar_url" "text", "role" "text", "department" "text", "company_name" "text", "company_id" "uuid", "company_domain" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        au.email,
        up.first_name,
        up.last_name,
        up.display_name,
        up.avatar_url,
        up.role,
        up.department,
        c.name,
        c.id,
        c.domain
    FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    LEFT JOIN public.companies c ON c.id = up.company_id
    WHERE up.id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."get_user_with_company"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_assessment_response_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Call the recalculation function for the company that was affected.
    -- This works for INSERT, UPDATE, and DELETE.
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.update_assessment_scores(OLD.company_id);
        RETURN OLD;
    ELSE
        PERFORM public.update_assessment_scores(NEW.company_id);
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."handle_assessment_response_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment"("x" numeric) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN x + 1;
END;
$$;


ALTER FUNCTION "public"."increment"("x" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_learning_event"("p_event_type" "text", "p_data" "jsonb" DEFAULT '{}'::"jsonb", "p_context" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.ai_learning_events(user_id, event_type, data, context)
    VALUES (auth.uid(), p_event_type, p_data, p_context);
END;
$$;


ALTER FUNCTION "public"."log_learning_event"("p_event_type" "text", "p_data" "jsonb", "p_context" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_event_type" "text", "p_event_details" "jsonb" DEFAULT '{}'::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO security_audit_log (
        user_id, event_type, event_details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_event_type, p_event_details, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;


ALTER FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_event_type" "text", "p_event_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_event_type" "text", "p_event_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") IS 'Standardized security event logging function';



CREATE OR REPLACE FUNCTION "public"."mark_inbox_items_read"("p_user_id" "uuid", "p_item_ids" "uuid"[]) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE ai_inbox_items 
    SET status = 'read', updated_at = NOW()
    WHERE user_id = p_user_id 
    AND id = ANY(p_item_ids)
    AND status = 'unread';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."mark_inbox_items_read"("p_user_id" "uuid", "p_item_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer) RETURNS TABLE("id" bigint, "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_ops_docs"("query_embedding" "extensions"."vector", "match_threshold" real DEFAULT 0.80, "match_count" integer DEFAULT 8, "p_org" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("chunk" "text", "similarity" real)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select chunk,
         1 - (embedding <=> query_embedding) as similarity
  from ai_operations_docs
  where (org_id is null or org_id = coalesce(p_org,
        ((current_setting('request.jwt.claims',true)::jsonb)->>'org_id')::uuid))
    and embedding <#> query_embedding < (1 - match_threshold)
  order by embedding <#> query_embedding
  limit match_count;
$$;


ALTER FUNCTION "public"."match_ops_docs"("query_embedding" "extensions"."vector", "match_threshold" real, "match_count" integer, "p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_personal_thoughts"("query_embedding" "extensions"."vector", "user_uuid" "uuid", "match_threshold" real DEFAULT 0.5, "match_count" integer DEFAULT 5) RETURNS TABLE("thought_id" "uuid", "content" "text", "category" "text", "tags" "text"[], "similarity" real)
    LANGUAGE "sql" STABLE
    AS $$
select ptv.thought_id,
       pt.content,
       pt.category,
       pt.tags,
       1 - (ptv.content_embedding <=> query_embedding) as similarity
from public.ai_personal_thought_vectors ptv
join public.personal_thoughts pt on pt.id = ptv.thought_id
where pt.user_id = user_uuid
  and (1 - (ptv.content_embedding <=> query_embedding)) > match_threshold
order by ptv.content_embedding <=> query_embedding
limit match_count;
$$;


ALTER FUNCTION "public"."match_personal_thoughts"("query_embedding" "extensions"."vector", "user_uuid" "uuid", "match_threshold" real, "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_business_health_snapshot"("p_user_id" "uuid", "p_overall_score" integer, "p_connected_sources" integer, "p_verified_sources" integer, "p_category_scores" "jsonb", "p_data_quality_score" integer, "p_completion_percentage" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO business_health (
    user_id,
    overall_score,
    connected_sources,
    verified_sources,
    category_scores,
    data_quality_score,
    completion_percentage,
    recorded_at
  ) VALUES (
    p_user_id,
    p_overall_score,
    p_connected_sources,
    p_verified_sources,
    p_category_scores,
    p_data_quality_score,
    p_completion_percentage,
    NOW()
  );
END;
$$;


ALTER FUNCTION "public"."record_business_health_snapshot"("p_user_id" "uuid", "p_overall_score" integer, "p_connected_sources" integer, "p_verified_sources" integer, "p_category_scores" "jsonb", "p_data_quality_score" integer, "p_completion_percentage" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_communication_event"("p_user_id" "uuid", "p_company_id" "uuid", "p_platform" "text", "p_event_type" "text", "p_event_data" "jsonb", "p_channel_id" "text" DEFAULT NULL::"text", "p_message_id" "text" DEFAULT NULL::"text", "p_timestamp" timestamp with time zone DEFAULT "now"()) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.communication_events (
        user_id,
        company_id,
        platform,
        event_type,
        event_data,
        channel_id,
        message_id,
        timestamp
    ) VALUES (
        p_user_id,
        p_company_id,
        p_platform,
        p_event_type,
        p_event_data,
        p_channel_id,
        p_message_id,
        p_timestamp
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;


ALTER FUNCTION "public"."record_communication_event"("p_user_id" "uuid", "p_company_id" "uuid", "p_platform" "text", "p_event_type" "text", "p_event_data" "jsonb", "p_channel_id" "text", "p_message_id" "text", "p_timestamp" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_migration_check"("migration_name" "text", "check_type" "text", "target_name" "text", "status" "text", "notes" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.migration_checks (
        migration_name, check_type, target_name, status, notes
    ) VALUES (
        migration_name, check_type, target_name, status, notes
    );
END;
$$;


ALTER FUNCTION "public"."record_migration_check"("migration_name" "text", "check_type" "text", "target_name" "text", "status" "text", "notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_mv_paypal_txns"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  refresh materialized view concurrently public.mv_paypal_txns;
end;
$$;


ALTER FUNCTION "public"."refresh_mv_paypal_txns"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_kpi_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "department_id" "text" NOT NULL,
    "kpi_id" "text",
    "value" "jsonb" NOT NULL,
    "source" "text",
    "captured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "kpi_key" "text",
    "user_id" "uuid",
    "company_id" "uuid",
    "metadata" "jsonb",
    CONSTRAINT "ai_kpi_snapshots_department_id_check" CHECK (("department_id" = ANY (ARRAY['sales'::"text", 'finance'::"text", 'support'::"text", 'maturity'::"text", 'marketing'::"text", 'operations'::"text"])))
);


ALTER TABLE "public"."ai_kpi_snapshots" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."mv_paypal_txns" AS
 SELECT "org_id",
    ("value" ->> 'txn_id'::"text") AS "txn_id",
    ("value" ->> 'currency'::"text") AS "currency",
    (("value" ->> 'amount'::"text"))::numeric AS "amount",
    "captured_at"
   FROM "public"."ai_kpi_snapshots"
  WHERE ("kpi_id" = 'paypal_revenue'::"text")
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_paypal_txns" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_list_paypal_txns"("p_org" "uuid", "p_limit" integer DEFAULT 100) RETURNS SETOF "public"."mv_paypal_txns"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select *
  from public.mv_paypal_txns
  where org_id = p_org
  order by captured_at desc
  limit greatest(1, p_limit);
$$;


ALTER FUNCTION "public"."rpc_list_paypal_txns"("p_org" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_add_column"("table_name" "text", "column_name" "text", "column_definition" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = safe_add_column.table_name
        AND column_name = safe_add_column.column_name
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', 
                      table_name, column_name, column_definition);
        RAISE NOTICE 'Added column % to table %', column_name, table_name;
    ELSE
        RAISE NOTICE 'Column % already exists in table %, skipping', column_name, table_name;
    END IF;
END;
$$;


ALTER FUNCTION "public"."safe_add_column"("table_name" "text", "column_name" "text", "column_definition" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."safe_add_column"("table_name" "text", "column_name" "text", "column_definition" "text") IS 'Safely adds a column to a table if it does not exist';



CREATE OR REPLACE FUNCTION "public"."safe_add_constraint"("table_name" "text", "constraint_name" "text", "constraint_definition" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = constraint_name
        AND conrelid = format('public.%I', table_name)::regclass
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', 
                      table_name, constraint_name, constraint_definition);
        RAISE NOTICE 'Added constraint % to table %', constraint_name, table_name;
    ELSE
        RAISE NOTICE 'Constraint % already exists on table %, skipping', constraint_name, table_name;
    END IF;
END;
$$;


ALTER FUNCTION "public"."safe_add_constraint"("table_name" "text", "constraint_name" "text", "constraint_definition" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."safe_add_constraint"("table_name" "text", "constraint_name" "text", "constraint_definition" "text") IS 'Safely adds a constraint to a table if it does not exist';



CREATE OR REPLACE FUNCTION "public"."safe_create_index"("index_name" "text", "table_name" "text", "index_definition" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = index_name
        AND tablename = table_name
        AND schemaname = 'public'
    ) THEN
        EXECUTE format('CREATE INDEX %I ON public.%I (%s)', 
                      index_name, table_name, index_definition);
        RAISE NOTICE 'Created index % on table %', index_name, table_name;
    ELSE
        RAISE NOTICE 'Index % already exists on table %, skipping', index_name, table_name;
    END IF;
END;
$$;


ALTER FUNCTION "public"."safe_create_index"("index_name" "text", "table_name" "text", "index_definition" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."safe_create_index"("index_name" "text", "table_name" "text", "index_definition" "text") IS 'Safely creates an index if it does not exist';



CREATE OR REPLACE FUNCTION "public"."safe_create_table"("table_name" "text", "table_definition" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = safe_create_table.table_name
    ) THEN
        EXECUTE format('CREATE TABLE public.%I (%s)', table_name, table_definition);
        RAISE NOTICE 'Created table %', table_name;
    ELSE
        RAISE NOTICE 'Table % already exists, skipping', table_name;
    END IF;
END;
$$;


ALTER FUNCTION "public"."safe_create_table"("table_name" "text", "table_definition" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."safe_create_table"("table_name" "text", "table_definition" "text") IS 'Safely creates a table if it does not exist';



CREATE OR REPLACE FUNCTION "public"."search_personal_thoughts"("query_text" "text", "user_uuid" "uuid" DEFAULT "auth"."uid"(), "category_filter" "text" DEFAULT NULL::"text", "business_context_filter" "jsonb" DEFAULT NULL::"jsonb", "limit_count" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "content" "text", "category" "text", "tags" "text"[], "business_context" "jsonb", "relevance_score" real, "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    pt.id,
    pt.content,
    pt.category,
    pt.tags,
    pt.business_context,
    ts_rank(pt.search_vector, plainto_tsquery('english', query_text)) as relevance_score,
    pt.created_at
  FROM personal_thoughts pt
  WHERE 
    pt.user_id = user_uuid
    AND pt.search_vector @@ plainto_tsquery('english', query_text)
    AND (category_filter IS NULL OR pt.category = category_filter)
    AND (business_context_filter IS NULL OR pt.business_context @> business_context_filter)
  ORDER BY relevance_score DESC, pt.created_at DESC
  LIMIT limit_count;
$$;


ALTER FUNCTION "public"."search_personal_thoughts"("query_text" "text", "user_uuid" "uuid", "category_filter" "text", "business_context_filter" "jsonb", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_daily_usage"("p_user_id" "text", "p_message_count" integer DEFAULT 1, "p_ai_requests" integer DEFAULT 1, "p_files_uploaded" integer DEFAULT 0, "p_tokens_used" integer DEFAULT 0, "p_estimated_cost" numeric DEFAULT 0.002) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO chat_usage_tracking (
    user_id, 
    message_count, 
    ai_requests_made, 
    files_uploaded, 
    tokens_used, 
    estimated_cost_usd
  )
  VALUES (
    p_user_id, 
    p_message_count, 
    p_ai_requests, 
    p_files_uploaded, 
    p_tokens_used, 
    p_estimated_cost
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    message_count = chat_usage_tracking.message_count + p_message_count,
    ai_requests_made = chat_usage_tracking.ai_requests_made + p_ai_requests,
    files_uploaded = chat_usage_tracking.files_uploaded + p_files_uploaded,
    tokens_used = chat_usage_tracking.tokens_used + p_tokens_used,
    estimated_cost_usd = chat_usage_tracking.estimated_cost_usd + p_estimated_cost,
    updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."track_daily_usage"("p_user_id" "text", "p_message_count" integer, "p_ai_requests" integer, "p_files_uploaded" integer, "p_tokens_used" integer, "p_estimated_cost" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_performance_metrics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Track user satisfaction metrics when feedback is added
    INSERT INTO ai_performance_metrics (
        metric_type,
        metric_value,
        agent_id,
        model,
        provider,
        timeframe,
        metadata
    ) VALUES (
        'user_satisfaction',
        NEW.rating / 5.0,
        NEW.agent_id,
        NEW.model_used,
        NEW.provider,
        'day',
        jsonb_build_object('feedback_type', NEW.feedback_type, 'comment', NEW.comment)
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_performance_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_apply_inbox_rules"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Apply rules asynchronously (in a separate transaction)
    PERFORM apply_inbox_rules(NEW.id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_apply_inbox_rules"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_folder_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM update_folder_item_count(NEW.folder_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_folder_item_count(OLD.folder_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_update_folder_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_action_cards_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_action_cards_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ai_budget_tracking"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  month_key TEXT;
BEGIN
  -- Get the month key (YYYY-MM format)
  month_key := TO_CHAR(NEW.timestamp, 'YYYY-MM');
  
  -- Update or insert budget tracking record
  INSERT INTO ai_budget_tracking (user_id, month_year, current_spend, request_count)
  VALUES (NEW.user_id, month_key, NEW.cost, 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    current_spend = ai_budget_tracking.current_spend + NEW.cost,
    request_count = ai_budget_tracking.request_count + 1,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ai_budget_tracking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ai_model_performance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_performance RECORD;
  new_success_rate DECIMAL(5, 4);
  new_avg_latency DECIMAL(8, 2);
  new_avg_cost DECIMAL(10, 6);
  new_total_usage INTEGER;
  new_error_count INTEGER;
BEGIN
  -- Get current performance metrics
  SELECT * INTO current_performance
  FROM ai_model_performance
  WHERE model = NEW.model AND provider = NEW.provider;
  
  IF current_performance IS NULL THEN
    -- First time tracking this model
    INSERT INTO ai_model_performance (
      model, provider, success_rate, average_latency, average_cost,
      total_usage, error_count, last_used
    ) VALUES (
      NEW.model, NEW.provider,
      CASE WHEN NEW.success THEN 1.0000 ELSE 0.0000 END,
      NEW.latency,
      NEW.cost,
      1,
      CASE WHEN NEW.success THEN 0 ELSE 1 END,
      NEW.timestamp
    );
  ELSE
    -- Update existing metrics
    new_total_usage := current_performance.total_usage + 1;
    new_error_count := current_performance.error_count + CASE WHEN NEW.success THEN 0 ELSE 1 END;
    
    -- Calculate new averages
    new_success_rate := (current_performance.total_usage - current_performance.error_count + 
                        CASE WHEN NEW.success THEN 1 ELSE 0 END)::DECIMAL / new_total_usage;
    new_avg_latency := (current_performance.average_latency * current_performance.total_usage + NEW.latency) / new_total_usage;
    new_avg_cost := (current_performance.average_cost * current_performance.total_usage + NEW.cost) / new_total_usage;
    
    UPDATE ai_model_performance SET
      success_rate = new_success_rate,
      average_latency = new_avg_latency,
      average_cost = new_avg_cost,
      total_usage = new_total_usage,
      error_count = new_error_count,
      last_used = NEW.timestamp,
      updated_at = NOW()
    WHERE model = NEW.model AND provider = NEW.provider;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ai_model_performance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_assessment_scores"("target_company_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Step 1: Delete old scores for the company to ensure a clean slate.
    DELETE FROM public."AssessmentCategoryScore" WHERE company_id = target_company_id;
    DELETE FROM public."AssessmentSummary" WHERE company_id = target_company_id;

    -- Step 2: Recalculate and insert the score for each category.
    -- The key is AVG(ar.score) which naturally ignores NULL scores.
    INSERT INTO public."AssessmentCategoryScore" (company_id, category_id, score)
    SELECT
        target_company_id,
        aq.category_id,
        COALESCE(AVG(ar.score), 0) -- Use COALESCE to set score to 0 if all questions in a category are N/A
    FROM
        public."AssessmentResponse" ar
    JOIN
        public."AssessmentQuestion" aq ON ar.question_id = aq.id
    WHERE
        ar.company_id = target_company_id
    GROUP BY
        aq.category_id;

    -- Step 3: Recalculate and insert the overall summary score.
    -- This calculates the weighted average of the just-calculated category scores.
    INSERT INTO public."AssessmentSummary" (company_id, overall_score, last_calculated)
    SELECT
        target_company_id,
        COALESCE(
            SUM(acs.score * (ac.weight::decimal / 100.0)) / SUM(ac.weight::decimal / 100.0),
            0
        ) AS weighted_average_score,
        NOW()
    FROM
        public."AssessmentCategoryScore" acs
    JOIN
        public."AssessmentCategory" ac ON acs.category_id = ac.id
    WHERE
        acs.company_id = target_company_id;
END;
$$;


ALTER FUNCTION "public"."update_assessment_scores"("target_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_billing_tracking"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update monthly tracking when new cost allocation is added
    INSERT INTO ai_budget_tracking (user_id, month_year, current_spend, request_count)
    VALUES (
        NEW.user_id,
        TO_CHAR(NEW.timestamp, 'YYYY-MM'),
        NEW.cost,
        1
    )
    ON CONFLICT (user_id, month_year) DO UPDATE SET
        current_spend = ai_budget_tracking.current_spend + NEW.cost,
        request_count = ai_budget_tracking.request_count + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_billing_tracking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_client_profile_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.client_id, '') || ' ' ||
        COALESCE(NEW.profile_data->>'basic_info'->>'name', '') || ' ' ||
        COALESCE(NEW.profile_data->>'basic_info'->>'email', '') || ' ' ||
        COALESCE(NEW.profile_data->>'basic_info'->>'company', '') || ' ' ||
        COALESCE(NEW.industry_classification, '') || ' ' ||
        COALESCE(NEW.deal_stage, '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_client_profile_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_folder_item_count"("p_folder_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE ai_inbox_folders 
    SET item_count = (
        SELECT COUNT(*) 
        FROM ai_inbox_item_folders 
        WHERE folder_id = p_folder_id
    )
    WHERE id = p_folder_id;
END;
$$;


ALTER FUNCTION "public"."update_folder_item_count"("p_folder_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_parent_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update parent thought's updated_at when child task changes
  IF NEW.parent_idea_id IS NOT NULL THEN
    UPDATE thoughts 
    SET updated_at = NOW()
    WHERE id = NEW.parent_idea_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_parent_progress"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."thoughts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "creation_date" timestamp with time zone DEFAULT "now"(),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "content" "text" NOT NULL,
    "category" "text" NOT NULL,
    "status" "text" NOT NULL,
    "personal_or_professional" "text",
    "main_sub_categories" "jsonb" DEFAULT '[]'::"jsonb",
    "initiative" boolean DEFAULT false,
    "impact" "text",
    "parent_idea_id" "uuid",
    "workflow_stage" "text",
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "interaction_method" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "department" character varying(50),
    "priority" character varying(20),
    "estimated_effort" character varying(50),
    "ai_clarification_data" "jsonb",
    CONSTRAINT "thoughts_category_check" CHECK (("category" = ANY (ARRAY['idea'::"text", 'task'::"text", 'reminder'::"text", 'update'::"text"]))),
    CONSTRAINT "thoughts_interaction_method_check" CHECK (("interaction_method" = ANY (ARRAY['text'::"text", 'speech'::"text", 'copy_paste'::"text", 'upload'::"text"]))),
    CONSTRAINT "thoughts_personal_or_professional_check" CHECK (("personal_or_professional" = ANY (ARRAY['personal'::"text", 'professional'::"text"]))),
    CONSTRAINT "thoughts_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::"text"[]))),
    CONSTRAINT "thoughts_status_check" CHECK (("status" = ANY (ARRAY['future_goals'::"text", 'concept'::"text", 'in_progress'::"text", 'completed'::"text", 'pending'::"text", 'reviewed'::"text", 'implemented'::"text", 'not_started'::"text", 'upcoming'::"text", 'due'::"text", 'overdue'::"text"]))),
    CONSTRAINT "thoughts_workflow_stage_check" CHECK (("workflow_stage" = ANY (ARRAY['create_idea'::"text", 'update_idea'::"text", 'implement_idea'::"text", 'achievement'::"text"])))
);


ALTER TABLE "public"."thoughts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."thoughts"."department" IS 'Department this thought belongs to (Marketing, Sales, Support, Operations, Finance)';



COMMENT ON COLUMN "public"."thoughts"."priority" IS 'Priority level assigned by AI or user (low, medium, high)';



COMMENT ON COLUMN "public"."thoughts"."estimated_effort" IS 'Estimated time/effort for completion (e.g., "1-2 days", "2-3 weeks")';



COMMENT ON COLUMN "public"."thoughts"."ai_clarification_data" IS 'Structured data from AI clarification including breakdown, reasoning, and suggestions';



CREATE OR REPLACE FUNCTION "public"."update_thought_with_workspace_data"("thought_id" "uuid", "new_department" character varying, "new_priority" character varying, "new_estimated_effort" character varying, "new_ai_data" "jsonb") RETURNS "public"."thoughts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_thought thoughts;
BEGIN
  UPDATE thoughts 
  SET 
    department = COALESCE(new_department, department),
    priority = COALESCE(new_priority, priority),
    estimated_effort = COALESCE(new_estimated_effort, estimated_effort),
    ai_clarification_data = COALESCE(new_ai_data, ai_clarification_data),
    updated_at = NOW()
  WHERE id = thought_id AND user_id = auth.uid()
  RETURNING * INTO updated_thought;
  
  RETURN updated_thought;
END;
$$;


ALTER FUNCTION "public"."update_thought_with_workspace_data"("thought_id" "uuid", "new_department" character varying, "new_priority" character varying, "new_estimated_effort" character varying, "new_ai_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_thoughts_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_updated = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_thoughts_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_needs_onboarding"("user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    profile_exists BOOLEAN := false;
    onboarding_completed BOOLEAN := false;
BEGIN
    -- Check if user profile exists and onboarding is completed
    SELECT 
        (up.id IS NOT NULL) as profile_exists_check,
        COALESCE(up.onboarding_completed, false) as onboarding_check
    INTO profile_exists, onboarding_completed
    FROM public.user_profiles up
    WHERE up.id = user_uuid;
    
    -- If no profile exists, or onboarding not completed, they need onboarding
    RETURN NOT profile_exists OR NOT onboarding_completed;
END;
$$;


ALTER FUNCTION "public"."user_needs_onboarding"("user_uuid" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AIModel" (
    "name" "text" NOT NULL,
    "description" "text",
    "provider" "text",
    "input_cost" double precision,
    "output_cost" double precision
);


ALTER TABLE "public"."AIModel" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Account" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "type" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "providerAccountId" "text" NOT NULL,
    "refresh_token" "text",
    "access_token" "text",
    "expires_at" integer,
    "token_type" "text",
    "scope" "text",
    "id_token" "text",
    "session_state" "text",
    "userProfileId" "text"
);


ALTER TABLE "public"."Account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssessmentCategory" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "goal" "text" NOT NULL,
    "weight" integer NOT NULL
);


ALTER TABLE "public"."AssessmentCategory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssessmentCategoryScore" (
    "id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "score" integer NOT NULL,
    "calculated_at" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."AssessmentCategoryScore" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssessmentQuestion" (
    "id" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "question_type" "text" NOT NULL,
    "options" "jsonb",
    "thresholds" "jsonb",
    "integration_check" "text" NOT NULL,
    "marcovy_angle" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "offer_slug" "text",
    "action_type" "text" DEFAULT 'SCORE'::"text" NOT NULL,
    "target_field" "text",
    "explainer_text" "text"
);


ALTER TABLE "public"."AssessmentQuestion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssessmentResponse" (
    "id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "question_id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "value" "text" NOT NULL,
    "score" integer NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    "userProfileId" "text"
);


ALTER TABLE "public"."AssessmentResponse" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AssessmentSummary" (
    "id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "overall_score" integer NOT NULL,
    "report" "jsonb" NOT NULL,
    "generated_at" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."AssessmentSummary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Briefing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Briefing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Company" (
    "id" "text" NOT NULL,
    "hubspotId" "text",
    "name" "text" NOT NULL,
    "domain" "text" NOT NULL,
    "industry" "text" NOT NULL,
    "size" "text",
    "description" "text",
    "logo" "text",
    "website" "text",
    "social_profiles" "text"[],
    "founded" "text",
    "headquarters" "text",
    "specialties" "text"[],
    "employee_count" integer,
    "followers_count" integer,
    "microsoft_365" "jsonb",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    "duns_number" "text",
    "business_phone" "text",
    "inventory_management_system" "text",
    "business_licenses" "jsonb",
    "client_base_description" "text"
);


ALTER TABLE "public"."Company" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Contact" (
    "id" "text" NOT NULL,
    "hubspotId" "text",
    "user_id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "title" "text",
    "department" "text",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    "userProfileId" "text"
);


ALTER TABLE "public"."Contact" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Deal" (
    "id" "text" NOT NULL,
    "hubspotId" "text",
    "user_id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "value" double precision NOT NULL,
    "stage" "text" NOT NULL,
    "probability" double precision,
    "expected_close_date" timestamp(3) without time zone,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    "userProfileId" "text"
);


ALTER TABLE "public"."Deal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Email" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "to_address" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "sent_at" timestamp with time zone
);


ALTER TABLE "public"."Email" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Integration" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "config" "jsonb" NOT NULL,
    "last_synced" timestamp(3) without time zone,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    "userProfileId" "text"
);


ALTER TABLE "public"."Integration" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."KPI" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "metric" "text" NOT NULL,
    "value" numeric NOT NULL,
    "period" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."KPI" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ModelPerformance" (
    "model_name" "text" NOT NULL,
    "month" "text" NOT NULL,
    "successRate" double precision NOT NULL,
    "averageLatency" double precision NOT NULL,
    "averageCost" double precision NOT NULL,
    "lastUsed" timestamp(3) without time zone NOT NULL,
    "errorCount" integer NOT NULL
);


ALTER TABLE "public"."ModelPerformance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ModelUsage" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "model_name" "text" NOT NULL,
    "tokens_used" integer NOT NULL,
    "cost" double precision NOT NULL,
    "success" boolean NOT NULL,
    "latency" integer NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userProfileId" "text"
);


ALTER TABLE "public"."ModelUsage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Note" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Note" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Offer" (
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "url" "text" NOT NULL
);


ALTER TABLE "public"."Offer" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Pin" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "pinned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Pin" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Recent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "visited_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Recent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Request" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Request" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Session" (
    "id" "text" NOT NULL,
    "sessionToken" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "expires" timestamp(3) without time zone NOT NULL,
    "userProfileId" "text"
);


ALTER TABLE "public"."Session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Task" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Task" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Ticket" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Ticket" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."UserProfile" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "role" "text",
    "industry" "text",
    "company_size" "text",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."UserProfile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."VARLead" (
    "id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "contact_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "status" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    "userProfileId" "text"
);


ALTER TABLE "public"."VARLead" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."VerificationToken" (
    "identifier" "text" NOT NULL,
    "token" "text" NOT NULL,
    "expires" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."VerificationToken" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."WidgetEvent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "widget_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."WidgetEvent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."action_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "domain" "text" DEFAULT 'thoughts'::"text" NOT NULL,
    "kind" "text" DEFAULT 'approval'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."action_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source" "text" NOT NULL,
    "source_id" "text",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text",
    "metadata" "jsonb",
    "occurred_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_ab_test_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "test_id" "text" NOT NULL,
    "variant" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric(10,4) NOT NULL,
    "metadata" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_ab_test_results_variant_check" CHECK (("variant" = ANY (ARRAY['A'::"text", 'B'::"text"])))
);


ALTER TABLE "public"."ai_ab_test_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_action_card_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "action_card_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_action_card_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_action_card_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text",
    "is_active" boolean DEFAULT true,
    "template_data" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_action_card_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_action_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "conversation_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "actions" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_action_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "department" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_assessment_questions" (
    "id" integer NOT NULL,
    "question_text" "text" NOT NULL,
    "assessment_category" character varying(100) NOT NULL,
    "required_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_assessment_questions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_assessment_questions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ai_assessment_questions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_assessment_questions_id_seq" OWNED BY "public"."ai_assessment_questions"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "conversation_context" "text" NOT NULL,
    "answers" "jsonb" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_audit_logs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "text",
    "details" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_audit_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ai_audit_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_audit_logs_id_seq" OWNED BY "public"."ai_audit_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_billing_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "billing_period_start" timestamp with time zone NOT NULL,
    "billing_period_end" timestamp with time zone NOT NULL,
    "plan_id" "text" NOT NULL,
    "base_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "token_usage" "jsonb" DEFAULT '{"total": 0, "overage": 0, "included": 0}'::"jsonb" NOT NULL,
    "overage_charges" numeric(10,2) DEFAULT 0 NOT NULL,
    "additional_fees" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "payment_due" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_billing_records_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'finalized'::"text", 'paid'::"text", 'overdue'::"text"])))
);


ALTER TABLE "public"."ai_billing_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_billing_records" IS 'Complete billing statement records';



CREATE TABLE IF NOT EXISTS "public"."ai_budget_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "month_year" "text" NOT NULL,
    "current_spend" numeric(10,2) DEFAULT 0 NOT NULL,
    "request_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_budget_tracking" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_budget_tracking" IS 'Monthly budget tracking per user';



CREATE TABLE IF NOT EXISTS "public"."ai_business_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company_name" "text" NOT NULL,
    "industry" "text",
    "business_model" "text",
    "primary_services" "text"[],
    "value_proposition" "text",
    "target_markets" "text"[],
    "ideal_customer_profile" "text",
    "total_clients" integer,
    "active_clients" integer,
    "monthly_revenue" numeric,
    "average_deal_size" numeric,
    "short_term_goals" "text"[],
    "current_challenges" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."ai_business_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_client_intelligence_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "client_profile_id" "uuid",
    "user_id" "uuid",
    "alert_type" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "confidence_score" numeric(3,2) DEFAULT 0.0,
    "recommended_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "potential_value" numeric(12,2),
    "urgency_score" numeric(3,2) DEFAULT 0.5,
    "status" "text" DEFAULT 'open'::"text",
    "assigned_to" "uuid",
    "resolution_notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "ai_client_intelligence_alerts_alert_type_check" CHECK (("alert_type" = ANY (ARRAY['opportunity'::"text", 'risk'::"text", 'engagement_drop'::"text", 'high_value'::"text", 'milestone'::"text", 'anomaly'::"text"]))),
    CONSTRAINT "ai_client_intelligence_alerts_priority_check" CHECK (("priority" = ANY (ARRAY['critical'::"text", 'high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "ai_client_intelligence_alerts_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'acknowledged'::"text", 'in_progress'::"text", 'resolved'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "valid_confidence" CHECK ((("confidence_score" >= 0.0) AND ("confidence_score" <= 1.0))),
    CONSTRAINT "valid_urgency" CHECK ((("urgency_score" >= 0.0) AND ("urgency_score" <= 1.0)))
);


ALTER TABLE "public"."ai_client_intelligence_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_client_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "client_profile_id" "uuid",
    "interaction_type" "text" NOT NULL,
    "interaction_source" "text" NOT NULL,
    "external_id" "text",
    "title" "text",
    "description" "text",
    "interaction_data" "jsonb" DEFAULT '{}'::"jsonb",
    "interaction_timestamp" timestamp with time zone NOT NULL,
    "duration_minutes" integer,
    "participants" "jsonb" DEFAULT '[]'::"jsonb",
    "initiated_by" "text",
    "business_value" numeric(12,2),
    "outcome" "text",
    "next_action" "text",
    "sentiment_score" numeric(3,2),
    "importance_score" numeric(3,2),
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "valid_importance" CHECK ((("importance_score" >= 0.0) AND ("importance_score" <= 1.0))),
    CONSTRAINT "valid_sentiment" CHECK ((("sentiment_score" >= '-1.0'::numeric) AND ("sentiment_score" <= 1.0)))
);


ALTER TABLE "public"."ai_client_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "domain" "text",
    "industry" "text",
    "size" "text",
    "logo_url" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "growth_stage" character varying(50) DEFAULT 'growth'::character varying,
    "fiscal_year_end" character varying(10) DEFAULT '12-31'::character varying,
    "key_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "mrr" numeric,
    "avg_deal_cycle_days" numeric,
    "website_visitors_month" numeric,
    "cac" numeric,
    "burn_rate" numeric,
    "gross_margin" numeric,
    "on_time_delivery_pct" numeric,
    "avg_first_response_mins" numeric,
    "csat" numeric,
    "address" "jsonb" DEFAULT '{}'::"jsonb",
    "website" "text",
    "description" "text",
    "client_base_description" "text",
    "hubspotid" "text",
    "business_phone" "text",
    "duns_number" "text",
    "employee_count" integer,
    "founded" "text",
    "headquarters" "text",
    "social_profiles" "text"[],
    "specialties" "text"[],
    "followers_count" integer,
    "microsoft_365" "jsonb",
    "business_licenses" "jsonb",
    "inventory_management_system" "text",
    CONSTRAINT "companies_size_check" CHECK (("size" = ANY (ARRAY['startup'::"text", 'small'::"text", 'medium'::"text", 'large'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


COMMENT ON TABLE "public"."companies" IS 'Company profiles and information';



CREATE OR REPLACE VIEW "public"."ai_companies" AS
 SELECT "id",
    "name",
    "domain",
    "industry",
    "size",
    "logo_url",
    "settings",
    "created_at",
    "updated_at",
    "growth_stage",
    "fiscal_year_end",
    "key_metrics",
    "mrr",
    "avg_deal_cycle_days",
    "website_visitors_month",
    "cac",
    "burn_rate",
    "gross_margin",
    "on_time_delivery_pct",
    "avg_first_response_mins",
    "csat"
   FROM "public"."companies";


ALTER VIEW "public"."ai_companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_company_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "profile_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_company_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_company_profiles" IS 'AI-generated company profiles and data';



CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text",
    "user_id" "uuid" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "summary_chunks" "jsonb"[] DEFAULT '{}'::"jsonb"[]
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_cost_allocations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "department_id" "uuid",
    "agent_id" "text" NOT NULL,
    "model" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0 NOT NULL,
    "cost" numeric(10,6) DEFAULT 0 NOT NULL,
    "billing_category" "text" NOT NULL,
    "cost_center" "text",
    "project_id" "text",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_cost_allocations_billing_category_check" CHECK (("billing_category" = ANY (ARRAY['operations'::"text", 'development'::"text", 'research'::"text", 'customer_support'::"text", 'sales'::"text", 'marketing'::"text"])))
);


ALTER TABLE "public"."ai_cost_allocations" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_cost_allocations" IS 'AI usage cost tracking for billing and analytics';



CREATE TABLE IF NOT EXISTS "public"."ai_document_processing_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "document_id" "text" NOT NULL,
    "document_url" "text",
    "document_name" "text" NOT NULL,
    "document_type" "text",
    "file_size" bigint,
    "status" "text" DEFAULT 'pending'::"text",
    "processing_started_at" timestamp with time zone,
    "processing_completed_at" timestamp with time zone,
    "retry_count" integer DEFAULT 0,
    "max_retries" integer DEFAULT 3,
    "user_id" "uuid",
    "company_id" "uuid",
    "upload_context" "jsonb" DEFAULT '{}'::"jsonb",
    "processing_results" "jsonb" DEFAULT '{}'::"jsonb",
    "error_details" "jsonb" DEFAULT '{}'::"jsonb",
    "priority" integer DEFAULT 5,
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_document_processing_queue_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 10))),
    CONSTRAINT "ai_document_processing_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'retrying'::"text"])))
);


ALTER TABLE "public"."ai_document_processing_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_email_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "email" "text" NOT NULL,
    "account_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_email_accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_email_accounts" IS 'Email accounts connected to AI integrations';



CREATE TABLE IF NOT EXISTS "public"."ai_embedding_cache" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "checksum" "text" NOT NULL,
    "content" "text",
    "embedding" "extensions"."vector"(1536) NOT NULL
);


ALTER TABLE "public"."ai_embedding_cache" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_embedding_cache_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ai_embedding_cache_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_embedding_cache_id_seq" OWNED BY "public"."ai_embedding_cache"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_message_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "text" NOT NULL,
    "conversation_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "agent_id" "text",
    "rating" "text" NOT NULL,
    "feedback_category" "text",
    "comment" "text",
    "follow_up_needed" boolean DEFAULT false,
    "improvement_suggestion" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_message_feedback_feedback_category_check" CHECK (("feedback_category" = ANY (ARRAY['accuracy'::"text", 'relevance'::"text", 'completeness'::"text", 'clarity'::"text", 'actionability'::"text"]))),
    CONSTRAINT "ai_message_feedback_rating_check" CHECK (("rating" = ANY (ARRAY['helpful'::"text", 'unhelpful'::"text"])))
);


ALTER TABLE "public"."ai_message_feedback" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ai_feedback_analytics" AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "feedback_date",
    "rating",
    "feedback_category",
    "agent_id",
    "count"(*) AS "feedback_count",
    "avg"(
        CASE
            WHEN ("rating" = 'helpful'::"text") THEN 1
            ELSE 0
        END) AS "helpfulness_rate"
   FROM "public"."ai_message_feedback"
  GROUP BY ("date_trunc"('day'::"text", "created_at")), "rating", "feedback_category", "agent_id";


ALTER VIEW "public"."ai_feedback_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_improvement_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "expected_impact" "jsonb" NOT NULL,
    "implementation_steps" "text"[] NOT NULL,
    "estimated_effort" "text" NOT NULL,
    "potential_savings" numeric(10,2),
    "risk_level" "text" NOT NULL,
    "confidence" numeric(3,2) NOT NULL,
    "based_on_data" "text"[] NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_improvement_recommendations_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "ai_improvement_recommendations_estimated_effort_check" CHECK (("estimated_effort" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "ai_improvement_recommendations_priority_check" CHECK (("priority" = ANY (ARRAY['critical'::"text", 'high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "ai_improvement_recommendations_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "ai_improvement_recommendations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "ai_improvement_recommendations_type_check" CHECK (("type" = ANY (ARRAY['model_optimization'::"text", 'workflow_improvement'::"text", 'user_experience'::"text", 'cost_reduction'::"text", 'performance_boost'::"text"])))
);


ALTER TABLE "public"."ai_improvement_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_inbox_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#3B82F6'::"text",
    "icon" "text" DEFAULT 'folder'::"text",
    "is_system" boolean DEFAULT false,
    "parent_folder_id" "uuid",
    "sort_order" integer DEFAULT 0,
    "item_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_inbox_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_inbox_item_folders" (
    "inbox_item_id" "uuid" NOT NULL,
    "folder_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_inbox_item_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_inbox_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "subject" "text" NOT NULL,
    "sender_email" "text" NOT NULL,
    "sender_name" "text",
    "recipient_email" "text" NOT NULL,
    "content" "text",
    "html_content" "text",
    "message_id" "text",
    "thread_id" "text",
    "in_reply_to" "text",
    "email_references" "text"[],
    "ai_priority_score" integer DEFAULT 50,
    "ai_category" "text",
    "ai_sentiment" "text",
    "ai_summary" "text",
    "ai_action_items" "text"[],
    "ai_processed_at" timestamp with time zone,
    "status" "text" DEFAULT 'unread'::"text",
    "is_important" boolean DEFAULT false,
    "is_flagged" boolean DEFAULT false,
    "snooze_until" timestamp with time zone,
    "integration_id" "uuid",
    "source_type" "text" DEFAULT 'email'::"text",
    "external_id" "text",
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_demo" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "priority_score" integer DEFAULT 5,
    "ai_action_suggestion" "text",
    "item_timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_read" boolean DEFAULT false,
    "title" "text",
    "preview" "text",
    "sender" "text",
    "item_type" "text" DEFAULT 'email'::"text",
    CONSTRAINT "ai_inbox_items_ai_priority_score_check" CHECK ((("ai_priority_score" >= 0) AND ("ai_priority_score" <= 100))),
    CONSTRAINT "ai_inbox_items_ai_sentiment_check" CHECK (("ai_sentiment" = ANY (ARRAY['positive'::"text", 'neutral'::"text", 'negative'::"text"]))),
    CONSTRAINT "ai_inbox_items_priority_score_check" CHECK ((("priority_score" >= 1) AND ("priority_score" <= 10))),
    CONSTRAINT "ai_inbox_items_source_type_check" CHECK (("source_type" = ANY (ARRAY['email'::"text", 'chat'::"text", 'sms'::"text", 'notification'::"text"]))),
    CONSTRAINT "ai_inbox_items_status_check" CHECK (("status" = ANY (ARRAY['unread'::"text", 'read'::"text", 'archived'::"text", 'deleted'::"text", 'snoozed'::"text"])))
);


ALTER TABLE "public"."ai_inbox_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "icon_url" "text",
    "config_schema" "jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "auth_type" "text" DEFAULT 'oauth'::"text",
    "documentation_url" "text",
    "support_url" "text",
    "default_config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_beta" boolean DEFAULT false,
    "is_enterprise" boolean DEFAULT false,
    "estimated_setup_time" "text" DEFAULT '10 min'::"text",
    "difficulty" "text" DEFAULT 'medium'::"text",
    "rate_limit_requests_per_minute" integer DEFAULT 60,
    "rate_limit_requests_per_hour" integer DEFAULT 1000,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "prerequisites" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integrations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."integrations"."metadata" IS 'Stores API Learning metadata including endpoints, authentication details, and generated code';



CREATE OR REPLACE VIEW "public"."ai_inbox_items_detailed" AS
 SELECT "ii"."id",
    "ii"."user_id",
    "ii"."company_id",
    "ii"."subject",
    "ii"."sender_email",
    "ii"."sender_name",
    "ii"."recipient_email",
    "ii"."content",
    "ii"."html_content",
    "ii"."message_id",
    "ii"."thread_id",
    "ii"."in_reply_to",
    "ii"."email_references",
    "ii"."ai_priority_score",
    "ii"."ai_category",
    "ii"."ai_sentiment",
    "ii"."ai_summary",
    "ii"."ai_action_items",
    "ii"."ai_processed_at",
    "ii"."status",
    "ii"."is_important",
    "ii"."is_flagged",
    "ii"."snooze_until",
    "ii"."integration_id",
    "ii"."source_type",
    "ii"."external_id",
    "ii"."received_at",
    "ii"."created_at",
    "ii"."updated_at",
    NULL::"text" AS "from_address",
    NULL::"text" AS "to_addresses",
    NULL::"text" AS "cc_addresses",
    NULL::"text" AS "date_sent",
    false AS "has_attachments",
    0 AS "attachment_count",
    NULL::"text" AS "snippet",
    "i"."name" AS "integration_name",
    "i"."category" AS "integration_category"
   FROM ("public"."ai_inbox_items" "ii"
     LEFT JOIN "public"."integrations" "i" ON (("ii"."integration_id" = "i"."id")));


ALTER VIEW "public"."ai_inbox_items_detailed" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_inbox_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "priority" integer DEFAULT 100,
    "conditions" "jsonb" NOT NULL,
    "actions" "jsonb" NOT NULL,
    "times_triggered" integer DEFAULT 0,
    "last_triggered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_inbox_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "insight_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_integrations_oauth" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "token_type" "text" DEFAULT 'Bearer'::"text",
    "scope" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_integrations_oauth" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_integrations_oauth" IS 'OAuth tokens for AI integrations';



CREATE TABLE IF NOT EXISTS "public"."ai_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "thought_id" "uuid",
    "prompt_text" "text",
    "ai_response" "text",
    "interaction_type" "text",
    "context_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid",
    CONSTRAINT "ai_interactions_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['insight'::"text", 'suggestion'::"text", 'reminder'::"text", 'analysis'::"text"])))
);


ALTER TABLE "public"."ai_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_knowledge_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "event_type" "text",
    "knowledge_card_id" "uuid",
    "user_id" "uuid",
    "query_text" "text",
    "department" "text",
    "session_id" "text",
    "relevance_score" numeric(3,2),
    "user_satisfaction" integer,
    "time_to_resolution" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "ai_knowledge_analytics_event_type_check" CHECK (("event_type" = ANY (ARRAY['knowledge_accessed'::"text", 'knowledge_created'::"text", 'knowledge_updated'::"text", 'query_resolved'::"text", 'gap_identified'::"text"]))),
    CONSTRAINT "ai_knowledge_analytics_user_satisfaction_check" CHECK ((("user_satisfaction" >= 1) AND ("user_satisfaction" <= 5)))
);


ALTER TABLE "public"."ai_knowledge_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_knowledge_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "document_id" "text" NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "title" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "insights" "jsonb" DEFAULT '[]'::"jsonb",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "document_type" "text",
    "department" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "confidence" numeric(3,2),
    "is_verified" boolean DEFAULT false,
    "verification_source" "text",
    "last_accessed" timestamp with time zone,
    "access_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "ai_knowledge_cards_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "ai_knowledge_cards_department_check" CHECK (("department" = ANY (ARRAY['sales'::"text", 'marketing'::"text", 'finance'::"text", 'operations'::"text", 'hr'::"text", 'engineering'::"text", 'general'::"text"]))),
    CONSTRAINT "ai_knowledge_cards_document_type_check" CHECK (("document_type" = ANY (ARRAY['contract'::"text", 'invoice'::"text", 'report'::"text", 'policy'::"text", 'email'::"text", 'presentation'::"text", 'spreadsheet'::"text", 'other'::"text"]))),
    CONSTRAINT "ai_knowledge_cards_priority_check" CHECK (("priority" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."ai_knowledge_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_knowledge_gaps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "query_pattern" "text" NOT NULL,
    "department" "text",
    "topic_area" "text",
    "gap_description" "text" NOT NULL,
    "query_frequency" integer DEFAULT 1,
    "last_queried" timestamp with time zone DEFAULT "now"(),
    "priority_score" numeric(3,2) DEFAULT 0.5,
    "status" "text" DEFAULT 'identified'::"text",
    "assigned_to" "uuid",
    "resolution_notes" "text",
    "resolved_at" timestamp with time zone,
    "identified_by" "text" DEFAULT 'system'::"text",
    "source_queries" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "ai_knowledge_gaps_status_check" CHECK (("status" = ANY (ARRAY['identified'::"text", 'in_progress'::"text", 'resolved'::"text", 'deferred'::"text"])))
);


ALTER TABLE "public"."ai_knowledge_gaps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_knowledge_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "source_card_id" "uuid",
    "target_card_id" "uuid",
    "relationship_type" "text",
    "strength" numeric(3,2) DEFAULT 0.5,
    "confidence" numeric(3,2) DEFAULT 0.5,
    "is_auto_generated" boolean DEFAULT true,
    "created_by" "uuid",
    CONSTRAINT "ai_knowledge_relationships_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "ai_knowledge_relationships_relationship_type_check" CHECK (("relationship_type" = ANY (ARRAY['references'::"text", 'contradicts'::"text", 'supports'::"text", 'prerequisite'::"text", 'related'::"text", 'supersedes'::"text"]))),
    CONSTRAINT "ai_knowledge_relationships_strength_check" CHECK ((("strength" >= (0)::numeric) AND ("strength" <= (1)::numeric)))
);


ALTER TABLE "public"."ai_knowledge_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_llm_registry" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provider" "text" NOT NULL,
    "model_id" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "company_id" "uuid"
);


ALTER TABLE "public"."ai_llm_registry" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_llm_registry" IS 'Registry for Large Language Models, storing non-sensitive metadata.';



CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "ai_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_metrics_daily" (
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "chat_messages" integer DEFAULT 0 NOT NULL,
    "actions" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_metrics_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_model_performance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "success_rate" numeric(5,4) DEFAULT 0.0000 NOT NULL,
    "average_latency" numeric(8,2) DEFAULT 0.00 NOT NULL,
    "average_cost" numeric(10,6) DEFAULT 0.000000 NOT NULL,
    "total_usage" integer DEFAULT 0 NOT NULL,
    "error_count" integer DEFAULT 0 NOT NULL,
    "last_used" timestamp with time zone,
    "trend" "text" DEFAULT 'stable'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_model_performance_trend_check" CHECK (("trend" = ANY (ARRAY['improving'::"text", 'stable'::"text", 'degrading'::"text"])))
);


ALTER TABLE "public"."ai_model_performance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_model_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "model" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0 NOT NULL,
    "cost" numeric(10,6) DEFAULT 0 NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_model_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_name" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_operations_docs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "source" "text" NOT NULL,
    "chunk" "text" NOT NULL,
    "embedding" "extensions"."vector"(1536) NOT NULL
);


ALTER TABLE "public"."ai_operations_docs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_ops_kpis" (
    "org_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "units" "text" NOT NULL,
    "weight" numeric NOT NULL,
    "target_value" numeric,
    "target_operator" "text" DEFAULT '>='::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_ops_kpis_target_operator_check" CHECK (("target_operator" = ANY (ARRAY['>='::"text", '<='::"text", '='::"text"]))),
    CONSTRAINT "ai_ops_kpis_weight_check" CHECK ((("weight" > (0)::numeric) AND ("weight" <= (1)::numeric)))
);


ALTER TABLE "public"."ai_ops_kpis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_optimization_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "suggestion_type" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "recommendation" "text" NOT NULL,
    "potential_savings" numeric(10,2) DEFAULT 0.00,
    "implementation_effort" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "applied_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_optimization_suggestions_implementation_effort_check" CHECK (("implementation_effort" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "ai_optimization_suggestions_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "ai_optimization_suggestions_suggestion_type_check" CHECK (("suggestion_type" = ANY (ARRAY['model_switch'::"text", 'usage_reduction'::"text", 'budget_increase'::"text", 'tier_optimization'::"text"])))
);


ALTER TABLE "public"."ai_optimization_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_passkey_challenges" (
    "user_id" "uuid" NOT NULL,
    "challenge" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_passkey_challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_passkeys" (
    "credential_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "public_key" "text" NOT NULL,
    "counter" integer DEFAULT 0,
    "device_type" "text",
    "friendly_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_passkeys_device_type_check" CHECK (("device_type" = ANY (ARRAY['single_device'::"text", 'multi_device'::"text"])))
);


ALTER TABLE "public"."ai_passkeys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_type" "text" NOT NULL,
    "metric_value" numeric(10,4) NOT NULL,
    "previous_value" numeric(10,4),
    "trend" "text" NOT NULL,
    "change_percent" numeric(5,2) DEFAULT 0 NOT NULL,
    "agent_id" "text",
    "model" "text",
    "provider" "text",
    "timeframe" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_performance_metrics_metric_type_check" CHECK (("metric_type" = ANY (ARRAY['model_performance'::"text", 'user_satisfaction'::"text", 'cost_efficiency'::"text", 'response_quality'::"text", 'latency'::"text", 'error_rate'::"text"]))),
    CONSTRAINT "ai_performance_metrics_timeframe_check" CHECK (("timeframe" = ANY (ARRAY['hour'::"text", 'day'::"text", 'week'::"text", 'month'::"text"]))),
    CONSTRAINT "ai_performance_metrics_trend_check" CHECK (("trend" = ANY (ARRAY['improving'::"text", 'stable'::"text", 'degrading'::"text"])))
);


ALTER TABLE "public"."ai_performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_personal_thought_vectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "thought_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "content_embedding" "extensions"."vector"(1536) NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_personal_thought_vectors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_quality_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "assessment_type" "text" NOT NULL,
    "relevance_score" numeric(3,2) NOT NULL,
    "accuracy_score" numeric(3,2) NOT NULL,
    "helpfulness_score" numeric(3,2) NOT NULL,
    "completeness_score" numeric(3,2) NOT NULL,
    "clarity_score" numeric(3,2) NOT NULL,
    "overall_score" numeric(3,2) NOT NULL,
    "flags" "text"[] DEFAULT '{}'::"text"[],
    "improvements" "text"[] DEFAULT '{}'::"text"[],
    "model_used" "text" NOT NULL,
    "agent_id" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_quality_assessments_accuracy_score_check" CHECK ((("accuracy_score" >= (0)::numeric) AND ("accuracy_score" <= (1)::numeric))),
    CONSTRAINT "ai_quality_assessments_assessment_type_check" CHECK (("assessment_type" = ANY (ARRAY['automated'::"text", 'human'::"text", 'hybrid'::"text"]))),
    CONSTRAINT "ai_quality_assessments_clarity_score_check" CHECK ((("clarity_score" >= (0)::numeric) AND ("clarity_score" <= (1)::numeric))),
    CONSTRAINT "ai_quality_assessments_completeness_score_check" CHECK ((("completeness_score" >= (0)::numeric) AND ("completeness_score" <= (1)::numeric))),
    CONSTRAINT "ai_quality_assessments_helpfulness_score_check" CHECK ((("helpfulness_score" >= (0)::numeric) AND ("helpfulness_score" <= (1)::numeric))),
    CONSTRAINT "ai_quality_assessments_overall_score_check" CHECK ((("overall_score" >= (0)::numeric) AND ("overall_score" <= (1)::numeric))),
    CONSTRAINT "ai_quality_assessments_relevance_score_check" CHECK ((("relevance_score" >= (0)::numeric) AND ("relevance_score" <= (1)::numeric)))
);


ALTER TABLE "public"."ai_quality_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_revenue_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "source" character varying(100),
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_revenue_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_sales_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "deal_value" numeric(12,2),
    "status" character varying(50),
    "source" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_sales_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_subscription_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plan_name" character varying(100),
    "status" character varying(50),
    "monthly_value" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_subscription_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_success_outcomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conversation_id" "uuid",
    "recommendation_id" "text",
    "outcome_type" "text" NOT NULL,
    "success_status" "text" NOT NULL,
    "time_saved_minutes" integer,
    "revenue_impact_cents" integer,
    "satisfaction_score" integer,
    "outcome_description" "text",
    "follow_up_date" timestamp with time zone,
    "completion_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_success_outcomes_outcome_type_check" CHECK (("outcome_type" = ANY (ARRAY['task_completed'::"text", 'goal_achieved'::"text", 'problem_solved'::"text", 'time_saved'::"text", 'revenue_impact'::"text"]))),
    CONSTRAINT "ai_success_outcomes_satisfaction_score_check" CHECK ((("satisfaction_score" >= 1) AND ("satisfaction_score" <= 10))),
    CONSTRAINT "ai_success_outcomes_success_status_check" CHECK (("success_status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'failed'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."ai_success_outcomes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ai_success_analytics" AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "outcome_date",
    "outcome_type",
    "success_status",
    "count"(*) AS "outcome_count",
    "avg"("time_saved_minutes") AS "avg_time_saved",
    "sum"("revenue_impact_cents") AS "total_revenue_impact",
    "avg"("satisfaction_score") AS "avg_satisfaction"
   FROM "public"."ai_success_outcomes"
  GROUP BY ("date_trunc"('day'::"text", "created_at")), "outcome_type", "success_status";


ALTER VIEW "public"."ai_success_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_unified_client_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "text" NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "profile_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source_integrations" "text"[] DEFAULT '{}'::"text"[],
    "primary_source" "text",
    "completeness_score" numeric(3,2) DEFAULT 0.0,
    "accuracy_confidence" numeric(3,2) DEFAULT 0.0,
    "last_enrichment_at" timestamp with time zone DEFAULT "now"(),
    "engagement_score" numeric(3,2) DEFAULT 0.0,
    "relationship_strength" "text" DEFAULT 'new'::"text",
    "estimated_value" numeric(12,2),
    "deal_stage" "text",
    "industry_classification" "text",
    "company_size_estimate" "text",
    "enrichment_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "search_vector" "tsvector",
    CONSTRAINT "ai_unified_client_profiles_relationship_strength_check" CHECK (("relationship_strength" = ANY (ARRAY['strong'::"text", 'moderate'::"text", 'weak'::"text", 'new'::"text"]))),
    CONSTRAINT "valid_accuracy" CHECK ((("accuracy_confidence" >= 0.0) AND ("accuracy_confidence" <= 1.0))),
    CONSTRAINT "valid_completeness" CHECK ((("completeness_score" >= 0.0) AND ("completeness_score" <= 1.0))),
    CONSTRAINT "valid_engagement" CHECK ((("engagement_score" >= 0.0) AND ("engagement_score" <= 1.0)))
);


ALTER TABLE "public"."ai_unified_client_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_user_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "activity_type" character varying(100),
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "pinned" boolean DEFAULT false
);


ALTER TABLE "public"."ai_user_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_user_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "feedback_type" "text" NOT NULL,
    "comment" "text",
    "agent_id" "text" NOT NULL,
    "model_used" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_user_feedback_feedback_type_check" CHECK (("feedback_type" = ANY (ARRAY['accuracy'::"text", 'helpfulness'::"text", 'speed'::"text", 'relevance'::"text", 'overall'::"text"]))),
    CONSTRAINT "ai_user_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."ai_user_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_vector_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "document_id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "content_embedding" "extensions"."vector"(1536) NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_vector_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal_id" "uuid",
    "metric_name" "text" NOT NULL,
    "metric_value" numeric NOT NULL,
    "time_period" "text" NOT NULL,
    "period_start" timestamp with time zone,
    "period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_action_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "due_date" timestamp with time zone,
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessment_action_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_execution_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "trigger_data" "jsonb",
    "action_results" "jsonb"[],
    "executed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."automation_execution_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_workflows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "trigger_type" "text" NOT NULL,
    "trigger_config" "jsonb" NOT NULL,
    "actions" "jsonb"[] NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."automation_workflows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_plans" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price_monthly" numeric(10,2) DEFAULT 0 NOT NULL,
    "price_yearly" numeric(10,2) DEFAULT 0 NOT NULL,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "token_limit" integer DEFAULT 10000,
    "is_active" boolean DEFAULT true,
    "is_popular" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."billing_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "target_metric" "text" NOT NULL,
    "target_value" numeric NOT NULL,
    "current_value" numeric DEFAULT 0,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_health" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "overall_score" integer DEFAULT 0 NOT NULL,
    "category_scores" "jsonb" DEFAULT '{}'::"jsonb",
    "last_calculated" timestamp with time zone DEFAULT "now"(),
    "data_sources" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "connected_sources" integer DEFAULT 0,
    "verified_sources" integer DEFAULT 0,
    "data_quality_score" integer DEFAULT 0,
    "completion_percentage" integer DEFAULT 0,
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."capability_gap_analysis" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category" "text" NOT NULL,
    "capability_name" "text" NOT NULL,
    "current_status" "text" NOT NULL,
    "importance_score" integer NOT NULL,
    "impact_areas" "text"[] NOT NULL,
    "implementation_complexity" "text" NOT NULL,
    "estimated_effort" "text",
    "potential_solutions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."capability_gap_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."capability_roadmap" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "gap_id" "uuid" NOT NULL,
    "priority" "text" NOT NULL,
    "phase" "text" NOT NULL,
    "dependencies" "text"[],
    "success_criteria" "text"[],
    "target_completion_date" timestamp with time zone,
    "status" "text" DEFAULT 'planned'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."capability_roadmap" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "chat_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "total_messages" integer DEFAULT 0,
    "total_agents_used" integer DEFAULT 0,
    "primary_department" "text",
    "session_outcome" "text",
    "satisfaction_score" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "chat_sessions_satisfaction_score_check" CHECK ((("satisfaction_score" >= 1) AND ("satisfaction_score" <= 5))),
    CONSTRAINT "chat_sessions_session_outcome_check" CHECK (("session_outcome" = ANY (ARRAY['resolved'::"text", 'escalated'::"text", 'abandoned'::"text", 'ongoing'::"text"])))
);


ALTER TABLE "public"."chat_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_usage_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "message_count" integer DEFAULT 0,
    "ai_requests_made" integer DEFAULT 0,
    "files_uploaded" integer DEFAULT 0,
    "tokens_used" integer DEFAULT 0,
    "estimated_cost_usd" numeric(10,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_usage_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communication_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "platform" "text" NOT NULL,
    "metric_type" "text" NOT NULL,
    "metric_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "time_period" "text" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "communication_analytics_platform_check" CHECK (("platform" = ANY (ARRAY['slack'::"text", 'teams'::"text", 'unified'::"text"])))
);


ALTER TABLE "public"."communication_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communication_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "platform" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "channel_id" "text",
    "message_id" "text",
    "timestamp" timestamp with time zone NOT NULL,
    "processed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "communication_events_platform_check" CHECK (("platform" = ANY (ARRAY['slack'::"text", 'teams'::"text"])))
);


ALTER TABLE "public"."communication_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_document_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "template_type" "text" NOT NULL,
    "content" "text",
    "content_html" "text",
    "metadata" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_document_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_status_snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "snapshot_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "financial_metrics" "jsonb",
    "operational_metrics" "jsonb",
    "customer_metrics" "jsonb",
    "team_metrics" "jsonb",
    "growth_metrics" "jsonb",
    "status_summary" "text",
    "health_score" integer,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_status_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_activity_mapping" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "contribution_weight" numeric DEFAULT 1.0,
    "attribution_type" "text" DEFAULT 'manual'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goal_activity_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_calendar_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "is_all_day" boolean DEFAULT false,
    "recurrence_rule" "text",
    "attendees" "jsonb"[],
    "status" "text" DEFAULT 'confirmed'::"text",
    "visibility" "text" DEFAULT 'default'::"text",
    "reminder_minutes" integer[],
    "color" "text",
    "tags" "text"[],
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manual_calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_emails" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "subject" "text" NOT NULL,
    "sender_email" "text" NOT NULL,
    "sender_name" "text",
    "recipient_email" "text" NOT NULL,
    "recipient_name" "text",
    "cc_emails" "text"[],
    "bcc_emails" "text"[],
    "body_text" "text",
    "body_html" "text",
    "received_at" timestamp with time zone,
    "is_read" boolean DEFAULT false,
    "is_flagged" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "folder" "text" DEFAULT 'inbox'::"text",
    "priority" "text" DEFAULT 'normal'::"text",
    "tags" "text"[],
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manual_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'not_started'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "due_date" timestamp with time zone,
    "start_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "parent_task_id" "uuid",
    "assignee_id" "uuid",
    "progress" integer DEFAULT 0,
    "tags" "text"[],
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manual_tasks" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."manual_goal_progress_view" AS
 SELECT "bg"."id" AS "goal_id",
    "bg"."user_id",
    "bg"."title" AS "goal_title",
    "bg"."target_metric",
    "bg"."target_value",
    "bg"."current_value",
    "bg"."start_date",
    "bg"."end_date",
    "bg"."status",
    "count"(DISTINCT "mt"."id") AS "related_tasks_count",
    "sum"(
        CASE
            WHEN ("mt"."status" = 'completed'::"text") THEN 1
            ELSE 0
        END) AS "completed_tasks_count",
    "count"(DISTINCT "me"."id") AS "related_emails_count",
    "count"(DISTINCT "mce"."id") AS "related_events_count",
        CASE
            WHEN (("bg"."end_date" IS NOT NULL) AND ("bg"."end_date" < "now"())) THEN 'overdue'::"text"
            WHEN ("bg"."current_value" >= "bg"."target_value") THEN 'achieved'::"text"
            WHEN ("bg"."end_date" IS NOT NULL) THEN
            CASE
                WHEN (("bg"."end_date" - "bg"."start_date") = '00:00:00'::interval) THEN 'unknown'::"text"
                ELSE
                CASE
                    WHEN ((EXTRACT(epoch FROM ("now"() - "bg"."start_date")) / EXTRACT(epoch FROM ("bg"."end_date" - "bg"."start_date"))) > ("bg"."current_value" / "bg"."target_value")) THEN 'behind'::"text"
                    ELSE 'on_track'::"text"
                END
            END
            ELSE 'in_progress'::"text"
        END AS "progress_status"
   FROM ((((("public"."business_goals" "bg"
     LEFT JOIN "public"."goal_activity_mapping" "gam" ON (("bg"."id" = "gam"."goal_id")))
     LEFT JOIN "public"."activities" "a" ON (("gam"."activity_id" = "a"."id")))
     LEFT JOIN "public"."manual_tasks" "mt" ON ((("mt"."user_id" = "bg"."user_id") AND (("mt"."tags" && ARRAY["bg"."title"]) OR ("lower"("mt"."title") ~~ (('%'::"text" || "lower"("bg"."title")) || '%'::"text")) OR ("lower"("mt"."description") ~~ (('%'::"text" || "lower"("bg"."title")) || '%'::"text"))))))
     LEFT JOIN "public"."manual_emails" "me" ON ((("me"."user_id" = "bg"."user_id") AND (("me"."tags" && ARRAY["bg"."title"]) OR ("lower"("me"."subject") ~~ (('%'::"text" || "lower"("bg"."title")) || '%'::"text"))))))
     LEFT JOIN "public"."manual_calendar_events" "mce" ON ((("mce"."user_id" = "bg"."user_id") AND (("mce"."tags" && ARRAY["bg"."title"]) OR ("lower"("mce"."title") ~~ (('%'::"text" || "lower"("bg"."title")) || '%'::"text")) OR ("lower"("mce"."description") ~~ (('%'::"text" || "lower"("bg"."title")) || '%'::"text"))))))
  GROUP BY "bg"."id", "bg"."user_id", "bg"."title", "bg"."target_metric", "bg"."target_value", "bg"."current_value", "bg"."start_date", "bg"."end_date", "bg"."status";


ALTER VIEW "public"."manual_goal_progress_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "company_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "display_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text",
    "department" "text",
    "job_title" "text",
    "phone" "text",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "preferences" "jsonb" DEFAULT '{"theme": "system", "language": "en", "notifications": true}'::"jsonb",
    "onboarding_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bio" "text",
    "location" "text",
    "work_location" "text",
    "skills" "text"[],
    "profile_completion_percentage" integer DEFAULT 0,
    "mobile" "text",
    "work_phone" "text",
    "personal_email" "text",
    "linkedin_url" "text",
    "github_url" "text",
    "twitter_url" "text",
    "address" "jsonb" DEFAULT '{}'::"jsonb",
    "emergency_contact" "jsonb" DEFAULT '{}'::"jsonb",
    "languages" "jsonb" DEFAULT '[]'::"jsonb",
    "certifications" "text"[],
    "onboarding_chat_completed" boolean DEFAULT false,
    "executive_assistant_introduced" boolean DEFAULT false,
    "preferred_ai_personality" "text" DEFAULT 'adaptive'::"text",
    "onboarding_context" "jsonb" DEFAULT '{}'::"jsonb",
    "personal_manifest" "jsonb" DEFAULT '{}'::"jsonb",
    "learning_goals" "text"[] DEFAULT '{}'::"text"[],
    "personal_interests" "text"[] DEFAULT '{}'::"text"[],
    "thought_capture_enabled" boolean DEFAULT true,
    "user_id" "uuid",
    "email" "text",
    "business_email" "text",
    CONSTRAINT "user_profiles_preferred_ai_personality_check" CHECK (("preferred_ai_personality" = ANY (ARRAY['professional'::"text", 'friendly'::"text", 'adaptive'::"text"]))),
    CONSTRAINT "user_profiles_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'user'::"text"]))),
    CONSTRAINT "user_profiles_work_location_check" CHECK (("work_location" = ANY (ARRAY['office'::"text", 'remote'::"text", 'hybrid'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."company_performance_view" AS
 SELECT "c"."id" AS "company_id",
    "c"."name" AS "company_name",
    "css"."snapshot_date",
    "css"."financial_metrics",
    "css"."operational_metrics",
    "css"."customer_metrics",
    "css"."team_metrics",
    "css"."growth_metrics",
    "css"."health_score",
    "count"(DISTINCT "bg"."id") AS "total_goals",
    "count"(DISTINCT
        CASE
            WHEN ("bg"."status" = 'active'::"text") THEN "bg"."id"
            ELSE NULL::"uuid"
        END) AS "active_goals",
    "count"(DISTINCT
        CASE
            WHEN ("mgpv"."progress_status" = 'on_track'::"text") THEN "bg"."id"
            ELSE NULL::"uuid"
        END) AS "on_track_goals",
    "count"(DISTINCT
        CASE
            WHEN ("mgpv"."progress_status" = 'behind'::"text") THEN "bg"."id"
            ELSE NULL::"uuid"
        END) AS "behind_goals",
    "count"(DISTINCT
        CASE
            WHEN ("mgpv"."progress_status" = 'achieved'::"text") THEN "bg"."id"
            ELSE NULL::"uuid"
        END) AS "achieved_goals",
    (COALESCE("avg"(
        CASE
            WHEN ("bg"."status" = 'active'::"text") THEN ("bg"."current_value" / NULLIF("bg"."target_value", (0)::numeric))
            ELSE NULL::numeric
        END), (0)::numeric) * (100)::numeric) AS "avg_goal_progress"
   FROM ((("public"."companies" "c"
     LEFT JOIN "public"."company_status_snapshots" "css" ON ((("c"."id" = "css"."company_id") AND ("css"."snapshot_date" = ( SELECT "max"("company_status_snapshots"."snapshot_date") AS "max"
           FROM "public"."company_status_snapshots"
          WHERE ("company_status_snapshots"."company_id" = "c"."id"))))))
     LEFT JOIN "public"."business_goals" "bg" ON (("c"."id" = ( SELECT "user_profiles"."company_id"
           FROM "public"."user_profiles"
          WHERE ("user_profiles"."id" = "bg"."user_id")
         LIMIT 1))))
     LEFT JOIN "public"."manual_goal_progress_view" "mgpv" ON (("bg"."id" = "mgpv"."goal_id")))
  GROUP BY "c"."id", "c"."name", "css"."snapshot_date", "css"."financial_metrics", "css"."operational_metrics", "css"."customer_metrics", "css"."team_metrics", "css"."growth_metrics", "css"."health_score";


ALTER VIEW "public"."company_performance_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."component_usages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "component_name" "text" NOT NULL,
    "location" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "usage_count" integer DEFAULT 1,
    "performance_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "user_id" "uuid",
    "company_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."component_usages" OWNER TO "postgres";


COMMENT ON TABLE "public"."component_usages" IS 'Tracks component usage analytics for performance monitoring';



COMMENT ON COLUMN "public"."component_usages"."component_name" IS 'Name of the component being tracked';



COMMENT ON COLUMN "public"."component_usages"."location" IS 'Page or location where component was used';



COMMENT ON COLUMN "public"."component_usages"."performance_metrics" IS 'JSON object containing performance data';



CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hubspotid" "text",
    "userId" "uuid",
    "companyId" "uuid",
    "email" "text",
    "firstName" "text",
    "lastName" "text",
    "phone" "text",
    "properties" "jsonb",
    "isPotentialVAR" boolean,
    "lastSyncedAt" timestamp with time zone
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "agent_id" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credential_audit_log" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "organization_id" "uuid",
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "integration_name" "text" NOT NULL,
    "ip_address" "inet",
    "details" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."credential_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."credential_audit_log" IS 'Records all actions performed on credentials for security and compliance.';



COMMENT ON COLUMN "public"."credential_audit_log"."actor_id" IS 'The user who performed the action.';



COMMENT ON COLUMN "public"."credential_audit_log"."action" IS 'The action performed, e.g., ''CREATE'', ''READ'', ''DELETE''.';



CREATE SEQUENCE IF NOT EXISTS "public"."credential_audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."credential_audit_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."credential_audit_log_id_seq" OWNED BY "public"."credential_audit_log"."id";



CREATE TABLE IF NOT EXISTS "public"."deal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid"
);


ALTER TABLE "public"."deal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hubspotid" "text",
    "name" "text",
    "pipeline" "text",
    "stage" "text",
    "amount" double precision,
    "closeDate" timestamp with time zone,
    "properties" "jsonb",
    "lastSyncedAt" timestamp with time zone
);


ALTER TABLE "public"."deals" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."department_metrics_view" AS
 SELECT 'operations'::"text" AS "department",
    "jsonb_build_object"('score', 72, 'updatedAt', "to_char"("now"(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'::"text"), 'kpis', ( SELECT "jsonb_agg"("row_to_json"("t".*)) AS "jsonb_agg"
           FROM ( SELECT 'deploy_frequency'::"text" AS "id",
                    'Deployment Frequency'::"text" AS "label",
                    (( SELECT "count"(*) AS "count"
                           FROM "public"."deal" "d"
                          WHERE ("d"."created_at" >= ("now"() - '30 days'::interval))))::integer AS "value",
                    (( SELECT "count"(*) AS "count"
                           FROM "public"."deal" "d"
                          WHERE (("d"."created_at" >= ("now"() - '60 days'::interval)) AND ("d"."created_at" < ("now"() - '30 days'::interval)))))::integer AS "prev_value",
                    ((( SELECT "count"(*) AS "count"
                           FROM "public"."deal" "d"
                          WHERE ("d"."created_at" >= ("now"() - '30 days'::interval))) - ( SELECT "count"(*) AS "count"
                           FROM "public"."deal" "d"
                          WHERE (("d"."created_at" >= ("now"() - '60 days'::interval)) AND ("d"."created_at" < ("now"() - '30 days'::interval))))))::integer AS "delta",
                    ARRAY[]::integer[] AS "history") "t")) AS "state";


ALTER VIEW "public"."department_metrics_view" OWNER TO "postgres";


COMMENT ON VIEW "public"."department_metrics_view" IS 'Aggregated KPI snapshot per department (operations MVP)';



CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" bigint NOT NULL,
    "content" "text",
    "embedding" "extensions"."vector"(1536)
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."documents"."id";



CREATE TABLE IF NOT EXISTS "public"."encrypted_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "integration_name" "text" NOT NULL,
    "encrypted_token" "text" NOT NULL,
    "iv" "text" NOT NULL,
    "auth_tag" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."encrypted_credentials" OWNER TO "postgres";


COMMENT ON TABLE "public"."encrypted_credentials" IS 'Stores encrypted OAuth tokens and API keys for third-party integrations.';



COMMENT ON COLUMN "public"."encrypted_credentials"."encrypted_token" IS 'The AES-256-GCM encrypted credential.';



COMMENT ON COLUMN "public"."encrypted_credentials"."iv" IS 'Initialization Vector for AES encryption.';



COMMENT ON COLUMN "public"."encrypted_credentials"."auth_tag" IS 'GCM authentication tag to ensure data integrity.';



CREATE TABLE IF NOT EXISTS "public"."financial_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "category" character varying(255),
    "amount" numeric(15,2) DEFAULT 0,
    "description" "text",
    "date" "date" NOT NULL,
    "month" integer NOT NULL,
    "year" integer NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."financial_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "revenue_forecast" numeric(15,2) DEFAULT 0,
    "cash_balance" numeric(15,2) DEFAULT 0,
    "projected_cash_flow" numeric(15,2) DEFAULT 0,
    "burn_rate" numeric(15,2) DEFAULT 0,
    "gross_margin" numeric(5,2) DEFAULT 0,
    "cac" numeric(10,2) DEFAULT 0,
    "ltv" numeric(15,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."financial_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_assessments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "assessment_date" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "feasibility_score" integer,
    "resource_gap_analysis" "jsonb",
    "risk_factors" "jsonb"[],
    "opportunity_factors" "jsonb"[],
    "ai_recommendations" "text",
    "next_steps" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goal_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_insights" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "insights" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goal_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_resource_mapping" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "relevance_score" numeric,
    "allocation_amount" numeric,
    "allocation_unit" "text",
    "status" "text" DEFAULT 'planned'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goal_resource_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_user_alignment" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "alignment_score" integer,
    "strength_factors" "jsonb"[],
    "challenge_factors" "jsonb"[],
    "personalized_recommendations" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goal_user_alignment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insight_business_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "personal_thought_id" "uuid",
    "business_metric_id" "uuid",
    "business_context" "jsonb" DEFAULT '{}'::"jsonb",
    "connection_type" "text" NOT NULL,
    "impact_description" "text",
    "impact_score" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "insight_business_connections_impact_score_check" CHECK ((("impact_score" >= 1) AND ("impact_score" <= 10)))
);


ALTER TABLE "public"."insight_business_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_integration_id" "uuid" NOT NULL,
    "data_type" "text" NOT NULL,
    "external_id" "text",
    "raw_data" "jsonb" NOT NULL,
    "processed_data" "jsonb" DEFAULT '{}'::"jsonb",
    "sync_batch_id" "uuid",
    "data_timestamp" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integration_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_ninjarmm_device_data" (
    "id" bigint NOT NULL,
    "user_integration_id" "uuid" NOT NULL,
    "device_id" character varying(255) NOT NULL,
    "status" character varying(50),
    "cpu_usage" double precision,
    "memory_usage" double precision,
    "disk_usage_gb" double precision,
    "last_seen" timestamp with time zone,
    "raw_payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integration_ninjarmm_device_data" OWNER TO "postgres";


COMMENT ON TABLE "public"."integration_ninjarmm_device_data" IS 'Stores raw device health data ingested from NinjaRMM integrations.';



COMMENT ON COLUMN "public"."integration_ninjarmm_device_data"."user_integration_id" IS 'FK to the user_integrations table.';



COMMENT ON COLUMN "public"."integration_ninjarmm_device_data"."device_id" IS 'The unique identifier for the device in NinjaRMM.';



COMMENT ON COLUMN "public"."integration_ninjarmm_device_data"."raw_payload" IS 'Raw JSON payload from the NinjaRMM API for extensibility.';



ALTER TABLE "public"."integration_ninjarmm_device_data" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."integration_ninjarmm_device_data_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."integration_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "integration_slug" "text" NOT NULL,
    "status" "text" DEFAULT 'disconnected'::"text" NOT NULL,
    "last_sync" timestamp with time zone,
    "error_count" integer DEFAULT 0,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integration_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_integration_id" "uuid" NOT NULL,
    "sync_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "total_records" integer DEFAULT 0,
    "processed_records" integer DEFAULT 0,
    "failed_records" integer DEFAULT 0,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "duration_ms" integer,
    "error_message" "text",
    "error_details" "jsonb",
    "batch_id" "uuid" DEFAULT "gen_random_uuid"(),
    "triggered_by" "text" DEFAULT 'system'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "integration_sync_logs_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "integration_sync_logs_sync_type_check" CHECK (("sync_type" = ANY (ARRAY['initial'::"text", 'incremental'::"text", 'full'::"text", 'manual'::"text"]))),
    CONSTRAINT "integration_sync_logs_triggered_by_check" CHECK (("triggered_by" = ANY (ARRAY['system'::"text", 'user'::"text", 'webhook'::"text", 'api'::"text"])))
);


ALTER TABLE "public"."integration_sync_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_integration_id" "uuid" NOT NULL,
    "webhook_url" "text" NOT NULL,
    "secret_key" "text",
    "events" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_triggered_at" timestamp with time zone,
    "total_triggers" integer DEFAULT 0,
    "successful_triggers" integer DEFAULT 0,
    "failed_triggers" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integration_webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_contacts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "company_name" "text",
    "job_title" "text",
    "address" "jsonb",
    "notes" "text",
    "tags" "text"[],
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manual_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text",
    "content_html" "text",
    "document_type" "text" DEFAULT 'note'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "folder" "text" DEFAULT 'general'::"text",
    "tags" "text"[],
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manual_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "campaign_name" character varying(255) NOT NULL,
    "type" character varying(100),
    "status" character varying(50) DEFAULT 'active'::character varying,
    "budget" numeric(15,2) DEFAULT 0,
    "spent" numeric(15,2) DEFAULT 0,
    "impressions" integer DEFAULT 0,
    "clicks" integer DEFAULT 0,
    "conversions" integer DEFAULT 0,
    "start_date" "date",
    "end_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."marketing_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "email" character varying(255),
    "first_name" character varying(255),
    "last_name" character varying(255),
    "company_name" character varying(255),
    "source" character varying(255),
    "campaign_id" "uuid",
    "qualified" boolean DEFAULT false,
    "score" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."marketing_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migration_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "migration_name" "text" NOT NULL,
    "check_type" "text" NOT NULL,
    "target_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "checked_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);


ALTER TABLE "public"."migration_checks" OWNER TO "postgres";


COMMENT ON TABLE "public"."migration_checks" IS 'Tracks the status of migration checks for debugging and monitoring';



CREATE TABLE IF NOT EXISTS "public"."model_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text",
    "company_id" "text",
    "model_name" "text",
    "tokens_used" integer,
    "cost" numeric,
    "success" boolean,
    "latency" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."model_usage" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."mv_latest_department_kpis" AS
 SELECT DISTINCT ON ("org_id", "department_id", COALESCE("kpi_id", 'NA'::"text")) "id",
    "org_id",
    "department_id",
    "kpi_id",
    "value",
    "source",
    "captured_at"
   FROM "public"."ai_kpi_snapshots"
  ORDER BY "org_id", "department_id", COALESCE("kpi_id", 'NA'::"text"), "captured_at" DESC
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_latest_department_kpis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."n8n_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "instance_name" "text",
    "base_url" "text" NOT NULL,
    "api_key" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."n8n_configurations" OWNER TO "postgres";


COMMENT ON TABLE "public"."n8n_configurations" IS 'n8n workflow configurations for user instances';



CREATE TABLE IF NOT EXISTS "public"."n8n_workflow_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "workflow_name" "text" NOT NULL,
    "workflow_id" "text" NOT NULL,
    "webhook_url" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "company_id" "uuid" NOT NULL
);


ALTER TABLE "public"."n8n_workflow_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."n8n_workflow_configs" IS 'Configuration and metadata for n8n workflow integrations with Nexus automation systems';



COMMENT ON COLUMN "public"."n8n_workflow_configs"."workflow_name" IS 'Unique identifier for the workflow within Nexus ecosystem';



COMMENT ON COLUMN "public"."n8n_workflow_configs"."webhook_url" IS 'Full webhook URL for triggering the n8n workflow from Nexus components';



COMMENT ON COLUMN "public"."n8n_workflow_configs"."description" IS 'Human-readable description of workflow purpose and functionality';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."oauth_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "integration_slug" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "token_type" "text" DEFAULT 'Bearer'::"text",
    "scope" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."oauth_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."oauth_tokens" IS 'OAuth tokens for various integrations';



CREATE TABLE IF NOT EXISTS "public"."onboarding_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_step" integer DEFAULT 0,
    "total_steps" integer DEFAULT 6,
    "collected_data" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "last_interaction_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "onboarding_conversations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."onboarding_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "message_type" "text" DEFAULT 'message'::"text",
    "step_id" "text",
    "step_number" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "onboarding_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['message'::"text", 'introduction'::"text", 'data-collected'::"text", 'relationship-building'::"text"]))),
    CONSTRAINT "onboarding_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."onboarding_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ops_action_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "kpi_key" "text" NOT NULL,
    "action_slug" "text" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text",
    "output" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ops_action_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_thoughts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "category" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "business_context" "jsonb" DEFAULT '{}'::"jsonb",
    "connections" "uuid"[] DEFAULT '{}'::"uuid"[],
    "search_vector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", "content")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "personal_thoughts_category_check" CHECK (("category" = ANY (ARRAY['idea'::"text", 'learning'::"text", 'reflection'::"text", 'goal'::"text"])))
);


ALTER TABLE "public"."personal_thoughts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."personal_memory_timeline" AS
 SELECT "pt"."id",
    "pt"."user_id",
    "pt"."content",
    "pt"."category",
    "pt"."tags",
    "pt"."business_context",
    "pt"."created_at",
    "pt"."updated_at",
    COALESCE("json_agg"("json_build_object"('connection_id', "ibc"."id", 'type', "ibc"."connection_type", 'impact', "ibc"."impact_description", 'score', "ibc"."impact_score")) FILTER (WHERE ("ibc"."id" IS NOT NULL)), '[]'::json) AS "business_connections"
   FROM ("public"."personal_thoughts" "pt"
     LEFT JOIN "public"."insight_business_connections" "ibc" ON (("pt"."id" = "ibc"."personal_thought_id")))
  GROUP BY "pt"."id", "pt"."user_id", "pt"."content", "pt"."category", "pt"."tags", "pt"."business_context", "pt"."created_at", "pt"."updated_at"
  ORDER BY "pt"."created_at" DESC;


ALTER VIEW "public"."personal_memory_timeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "status" character varying(50) DEFAULT 'active'::character varying,
    "health" character varying(50) DEFAULT 'on_track'::character varying,
    "start_date" "date",
    "end_date" "date",
    "completion_date" "date",
    "budget" numeric(15,2) DEFAULT 0,
    "progress_percentage" integer DEFAULT 0,
    "assigned_team" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource_inventory" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "resource_type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "availability" "text",
    "quantity" numeric,
    "unit" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resource_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "deal_name" character varying(255) NOT NULL,
    "company_name" character varying(255),
    "value" numeric(15,2) DEFAULT 0,
    "stage" character varying(100),
    "close_date" "date",
    "status" character varying(50) DEFAULT 'open'::character varying,
    "rep_name" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales_deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_performance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "rep_name" character varying(255),
    "quota" numeric(15,2) DEFAULT 0,
    "achieved" numeric(15,2) DEFAULT 0,
    "period_start" "date",
    "period_end" "date",
    "metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales_performance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_pipeline" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "deal_name" character varying(255) NOT NULL,
    "company_name" character varying(255),
    "value" numeric(15,2) DEFAULT 0,
    "stage" character varying(100),
    "close_date" "date",
    "probability" integer DEFAULT 0,
    "status" character varying(50) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales_pipeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."secure_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "integration_type" "text" NOT NULL,
    "integration_name" "text" NOT NULL,
    "encrypted_credentials" "text" NOT NULL,
    "permissions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "data_retention_days" integer DEFAULT 30,
    "last_sync" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "secure_integrations_integration_type_check" CHECK (("integration_type" = ANY (ARRAY['crm'::"text", 'email'::"text", 'calendar'::"text", 'finance'::"text", 'communication'::"text"]))),
    CONSTRAINT "valid_permissions" CHECK (("jsonb_typeof"("permissions") = 'array'::"text"))
);


ALTER TABLE "public"."secure_integrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."secure_integrations" IS 'Encrypted storage for third-party integration credentials';



CREATE TABLE IF NOT EXISTS "public"."security_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_details" "jsonb" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_event_type" CHECK (("event_type" = ANY (ARRAY['login'::"text", 'logout'::"text", 'data_access'::"text", 'integration_added'::"text", 'integration_removed'::"text", 'permission_change'::"text", 'data_export'::"text", 'suspicious_activity'::"text", 'failed_login'::"text", 'data_modification'::"text"])))
);


ALTER TABLE "public"."security_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_audit_log" IS 'Comprehensive audit trail for all security-relevant events';



CREATE TABLE IF NOT EXISTS "public"."security_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "config_key" "text" NOT NULL,
    "config_value" "jsonb" NOT NULL,
    "is_encrypted" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."security_config" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."security_policy_summary" AS
 SELECT "p"."schemaname",
    "p"."tablename",
    "count"(*) AS "total_policies",
    "count"(*) FILTER (WHERE ("p"."cmd" = 'SELECT'::"text")) AS "select_policies",
    "count"(*) FILTER (WHERE ("p"."cmd" = 'INSERT'::"text")) AS "insert_policies",
    "count"(*) FILTER (WHERE ("p"."cmd" = 'UPDATE'::"text")) AS "update_policies",
    "count"(*) FILTER (WHERE ("p"."cmd" = 'DELETE'::"text")) AS "delete_policies",
    "count"(*) FILTER (WHERE ("p"."cmd" = 'ALL'::"text")) AS "all_policies",
    "bool_and"("t"."rowsecurity") AS "rls_enabled"
   FROM ("pg_policies" "p"
     JOIN "pg_tables" "t" ON ((("p"."tablename" = "t"."tablename") AND ("p"."schemaname" = "t"."schemaname"))))
  WHERE ("p"."schemaname" = 'public'::"name")
  GROUP BY "p"."schemaname", "p"."tablename", "t"."rowsecurity"
  ORDER BY "p"."tablename";


ALTER VIEW "public"."security_policy_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_events" (
    "id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "processed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone
);


ALTER TABLE "public"."stripe_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "status" character varying(50) DEFAULT 'open'::character varying,
    "priority" character varying(50) DEFAULT 'medium'::character varying,
    "assigned_to" character varying(255),
    "reporter" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_capacity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "team_member" character varying(255) NOT NULL,
    "department" character varying(255),
    "utilization" numeric(5,2) DEFAULT 0,
    "capacity_hours" numeric(8,2) DEFAULT 40,
    "allocated_hours" numeric(8,2) DEFAULT 0,
    "week_start" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_capacity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."thought_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_thought_id" "uuid" NOT NULL,
    "target_thought_id" "uuid" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "thought_relationships_relationship_type_check" CHECK (("relationship_type" = ANY (ARRAY['spawns_task'::"text", 'spawns_reminder'::"text", 'implements'::"text", 'relates_to'::"text", 'depends_on'::"text", 'blocks'::"text"])))
);


ALTER TABLE "public"."thought_relationships" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unified_productivity_view" AS
 SELECT 'email'::"text" AS "item_type",
    "manual_emails"."id" AS "item_id",
    "manual_emails"."user_id",
    "manual_emails"."company_id",
    "manual_emails"."subject" AS "title",
    "manual_emails"."body_text" AS "content",
    "manual_emails"."sender_email" AS "source",
    "manual_emails"."sender_name" AS "source_name",
    "manual_emails"."received_at" AS "item_date",
    "manual_emails"."is_read",
    "manual_emails"."is_flagged",
    "manual_emails"."is_archived",
    "manual_emails"."priority",
    "manual_emails"."tags",
    "manual_emails"."created_at",
    "manual_emails"."updated_at"
   FROM "public"."manual_emails"
UNION ALL
 SELECT 'event'::"text" AS "item_type",
    "manual_calendar_events"."id" AS "item_id",
    "manual_calendar_events"."user_id",
    "manual_calendar_events"."company_id",
    "manual_calendar_events"."title",
    "manual_calendar_events"."description" AS "content",
    'calendar'::"text" AS "source",
    "manual_calendar_events"."location" AS "source_name",
    "manual_calendar_events"."start_time" AS "item_date",
    true AS "is_read",
    false AS "is_flagged",
    false AS "is_archived",
        CASE
            WHEN ("manual_calendar_events"."start_time" <= ("now"() + '1 day'::interval)) THEN 'high'::"text"
            WHEN ("manual_calendar_events"."start_time" <= ("now"() + '3 days'::interval)) THEN 'medium'::"text"
            ELSE 'normal'::"text"
        END AS "priority",
    "manual_calendar_events"."tags",
    "manual_calendar_events"."created_at",
    "manual_calendar_events"."updated_at"
   FROM "public"."manual_calendar_events"
UNION ALL
 SELECT 'task'::"text" AS "item_type",
    "manual_tasks"."id" AS "item_id",
    "manual_tasks"."user_id",
    "manual_tasks"."company_id",
    "manual_tasks"."title",
    "manual_tasks"."description" AS "content",
    'task_manager'::"text" AS "source",
    "manual_tasks"."status" AS "source_name",
    "manual_tasks"."due_date" AS "item_date",
        CASE
            WHEN ("manual_tasks"."status" = 'completed'::"text") THEN true
            ELSE false
        END AS "is_read",
        CASE
            WHEN ("manual_tasks"."priority" = 'high'::"text") THEN true
            ELSE false
        END AS "is_flagged",
    false AS "is_archived",
    "manual_tasks"."priority",
    "manual_tasks"."tags",
    "manual_tasks"."created_at",
    "manual_tasks"."updated_at"
   FROM "public"."manual_tasks"
UNION ALL
 SELECT 'document'::"text" AS "item_type",
    "manual_documents"."id" AS "item_id",
    "manual_documents"."user_id",
    "manual_documents"."company_id",
    "manual_documents"."title",
    "manual_documents"."content",
    "manual_documents"."document_type" AS "source",
    "manual_documents"."folder" AS "source_name",
    "manual_documents"."created_at" AS "item_date",
    true AS "is_read",
    false AS "is_flagged",
    false AS "is_archived",
    'normal'::"text" AS "priority",
    "manual_documents"."tags",
    "manual_documents"."created_at",
    "manual_documents"."updated_at"
   FROM "public"."manual_documents";


ALTER VIEW "public"."unified_productivity_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_content" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "content_html" "text",
    "metadata" "jsonb",
    "position" integer,
    "parent_id" "uuid",
    "created_by" "uuid",
    "last_edited_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workspace_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "color" "text",
    "is_default" boolean DEFAULT false,
    "is_private" boolean DEFAULT false,
    "owner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unified_workspace_view" AS
 SELECT 'workspace_content'::"text" AS "item_type",
    "wc"."id" AS "item_id",
    "u"."id" AS "user_id",
    "w"."company_id",
    "wc"."title",
    "wc"."content",
    "w"."name" AS "source",
    "wc"."content_type" AS "source_name",
    "wc"."created_at" AS "item_date",
    true AS "is_read",
    false AS "is_flagged",
    false AS "is_archived",
    'normal'::"text" AS "priority",
    ARRAY[]::"text"[] AS "tags",
    "wc"."created_at",
    "wc"."updated_at"
   FROM ((("public"."workspace_content" "wc"
     JOIN "public"."workspaces" "w" ON (("wc"."workspace_id" = "w"."id")))
     JOIN "public"."workspace_members" "wm" ON (("w"."id" = "wm"."workspace_id")))
     JOIN "auth"."users" "u" ON (("wm"."user_id" = "u"."id")))
UNION ALL
 SELECT 'email'::"text" AS "item_type",
    "manual_emails"."id" AS "item_id",
    "manual_emails"."user_id",
    "manual_emails"."company_id",
    "manual_emails"."subject" AS "title",
    "manual_emails"."body_text" AS "content",
    "manual_emails"."sender_email" AS "source",
    "manual_emails"."sender_name" AS "source_name",
    "manual_emails"."received_at" AS "item_date",
    "manual_emails"."is_read",
    "manual_emails"."is_flagged",
    "manual_emails"."is_archived",
    "manual_emails"."priority",
    "manual_emails"."tags",
    "manual_emails"."created_at",
    "manual_emails"."updated_at"
   FROM "public"."manual_emails"
UNION ALL
 SELECT 'event'::"text" AS "item_type",
    "manual_calendar_events"."id" AS "item_id",
    "manual_calendar_events"."user_id",
    "manual_calendar_events"."company_id",
    "manual_calendar_events"."title",
    "manual_calendar_events"."description" AS "content",
    'calendar'::"text" AS "source",
    "manual_calendar_events"."location" AS "source_name",
    "manual_calendar_events"."start_time" AS "item_date",
    true AS "is_read",
    false AS "is_flagged",
    false AS "is_archived",
        CASE
            WHEN ("manual_calendar_events"."start_time" <= ("now"() + '1 day'::interval)) THEN 'high'::"text"
            WHEN ("manual_calendar_events"."start_time" <= ("now"() + '3 days'::interval)) THEN 'medium'::"text"
            ELSE 'normal'::"text"
        END AS "priority",
    "manual_calendar_events"."tags",
    "manual_calendar_events"."created_at",
    "manual_calendar_events"."updated_at"
   FROM "public"."manual_calendar_events"
UNION ALL
 SELECT 'task'::"text" AS "item_type",
    "manual_tasks"."id" AS "item_id",
    "manual_tasks"."user_id",
    "manual_tasks"."company_id",
    "manual_tasks"."title",
    "manual_tasks"."description" AS "content",
    'task_manager'::"text" AS "source",
    "manual_tasks"."status" AS "source_name",
    "manual_tasks"."due_date" AS "item_date",
        CASE
            WHEN ("manual_tasks"."status" = 'completed'::"text") THEN true
            ELSE false
        END AS "is_read",
        CASE
            WHEN ("manual_tasks"."priority" = 'high'::"text") THEN true
            ELSE false
        END AS "is_flagged",
    false AS "is_archived",
    "manual_tasks"."priority",
    "manual_tasks"."tags",
    "manual_tasks"."created_at",
    "manual_tasks"."updated_at"
   FROM "public"."manual_tasks"
UNION ALL
 SELECT 'document'::"text" AS "item_type",
    "manual_documents"."id" AS "item_id",
    "manual_documents"."user_id",
    "manual_documents"."company_id",
    "manual_documents"."title",
    "manual_documents"."content",
    "manual_documents"."document_type" AS "source",
    "manual_documents"."folder" AS "source_name",
    "manual_documents"."created_at" AS "item_date",
    true AS "is_read",
    false AS "is_flagged",
    false AS "is_archived",
    'normal'::"text" AS "priority",
    "manual_documents"."tags",
    "manual_documents"."created_at",
    "manual_documents"."updated_at"
   FROM "public"."manual_documents";


ALTER VIEW "public"."unified_workspace_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "page" character varying(255),
    "action" character varying(255),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_billing_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_billing_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_context_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "work_style_preferences" "jsonb",
    "communication_patterns" "jsonb",
    "decision_making_profile" "jsonb",
    "productivity_patterns" "jsonb",
    "skill_strengths" "text"[],
    "skill_gaps" "text"[],
    "collaboration_network" "jsonb",
    "interest_areas" "text"[],
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_context_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "integration_id" "uuid" NOT NULL,
    "name" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "last_sync" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "next_sync_at" timestamp with time zone,
    "sync_frequency" "text" DEFAULT 'hourly'::"text",
    "credentials" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "user_integrations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"]))),
    CONSTRAINT "user_integrations_sync_frequency_check" CHECK (("sync_frequency" = ANY (ARRAY['realtime'::"text", 'hourly'::"text", 'daily'::"text", 'weekly'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."user_integrations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_integrations"."credentials" IS 'Encrypted credentials for the integration (OAuth tokens, API keys, etc.)';



CREATE TABLE IF NOT EXISTS "public"."user_interaction_analysis" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "analysis_period_start" timestamp with time zone,
    "analysis_period_end" timestamp with time zone,
    "interaction_patterns" "jsonb",
    "response_effectiveness" "jsonb",
    "feature_engagement" "jsonb",
    "pain_points" "text"[],
    "success_patterns" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_interaction_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_learning_patterns" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "learning_style" "text",
    "preferred_content_types" "text"[],
    "optimal_learning_times" "jsonb",
    "knowledge_retention_patterns" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_learning_patterns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_licenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "expires_at" timestamp with time zone,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscription_status" "text",
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_licenses_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'expired'::"text"]))),
    CONSTRAINT "user_licenses_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'enterprise'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."user_licenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_onboarding_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_started_at" timestamp with time zone,
    "onboarding_completed_at" timestamp with time zone,
    "steps_completed" "jsonb" DEFAULT '[]'::"jsonb",
    "current_step" "text" DEFAULT 'introduction'::"text",
    "business_context" "jsonb" DEFAULT '{}'::"jsonb",
    "role_context" "jsonb" DEFAULT '{}'::"jsonb",
    "goals_context" "jsonb" DEFAULT '{}'::"jsonb",
    "working_style" "jsonb" DEFAULT '{}'::"jsonb",
    "preferred_communication_style" "text" DEFAULT 'adaptive'::"text",
    "total_onboarding_time_minutes" integer DEFAULT 0,
    "conversation_turns" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_onboarding_progress_preferred_communication_style_check" CHECK (("preferred_communication_style" = ANY (ARRAY['professional'::"text", 'friendly'::"text", 'adaptive'::"text"])))
);


ALTER TABLE "public"."user_onboarding_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_organizations" (
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist_signups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "company_name" "text",
    "referral_code" "text",
    "referred_by_code" "text",
    "position" integer DEFAULT 0 NOT NULL,
    "tier" "text" DEFAULT 'early-bird'::"text" NOT NULL,
    "referral_count" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "waitlist_signups_tier_check" CHECK (("tier" = ANY (ARRAY['early-bird'::"text", 'vip'::"text", 'founder'::"text"])))
);


ALTER TABLE "public"."waitlist_signups" OWNER TO "postgres";


COMMENT ON TABLE "public"."waitlist_signups" IS 'Stores waitlist signups for Nexus platform launch with referral system and tier management';



CREATE OR REPLACE VIEW "public"."waitlist_stats" WITH ("security_invoker"='true') AS
 SELECT "count"(*) AS "total_signups",
    "count"(*) FILTER (WHERE ("tier" = 'founder'::"text")) AS "founder_spots_taken",
    "count"(*) FILTER (WHERE ("tier" = 'vip'::"text")) AS "vip_spots_taken",
    "count"(*) FILTER (WHERE ("tier" = 'early-bird'::"text")) AS "early_bird_signups",
    "max"("created_at") AS "last_signup_at"
   FROM "public"."waitlist_signups";


ALTER VIEW "public"."waitlist_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."website_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "visitors" integer DEFAULT 0,
    "page_views" integer DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "avg_session_duration" integer DEFAULT 0,
    "top_pages" "jsonb" DEFAULT '[]'::"jsonb",
    "traffic_sources" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."website_analytics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."workspace_action_plans" AS
 SELECT "id",
    "content",
    "category",
    "status",
    "department",
    "priority",
    "estimated_effort",
    "initiative",
    "workflow_stage",
    "created_at",
    "updated_at",
    "user_id",
    ( SELECT "count"(*) AS "count"
           FROM "public"."thoughts" "child"
          WHERE (("child"."parent_idea_id" = "t"."id") AND ("child"."category" = 'task'::"text"))) AS "task_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."thoughts" "child"
          WHERE (("child"."parent_idea_id" = "t"."id") AND ("child"."category" = 'task'::"text") AND ("child"."status" = 'completed'::"text"))) AS "completed_tasks",
        CASE
            WHEN (( SELECT "count"(*) AS "count"
               FROM "public"."thoughts" "child"
              WHERE (("child"."parent_idea_id" = "t"."id") AND ("child"."category" = 'task'::"text"))) > 0) THEN "round"((((( SELECT "count"(*) AS "count"
               FROM "public"."thoughts" "child"
              WHERE (("child"."parent_idea_id" = "t"."id") AND ("child"."category" = 'task'::"text") AND ("child"."status" = 'completed'::"text"))))::numeric / (( SELECT "count"(*) AS "count"
               FROM "public"."thoughts" "child"
              WHERE (("child"."parent_idea_id" = "t"."id") AND ("child"."category" = 'task'::"text"))))::numeric) * (100)::numeric))
            ELSE (0)::numeric
        END AS "progress_percentage"
   FROM "public"."thoughts" "t"
  WHERE (("initiative" = true) AND ("workflow_stage" = ANY (ARRAY['create_idea'::"text", 'update_idea'::"text", 'implement_idea'::"text"])) AND ("user_id" = "auth"."uid"()));


ALTER VIEW "public"."workspace_action_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_activity" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "activity_type" "text" NOT NULL,
    "content_id" "uuid",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workspace_activity" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_assessment_questions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_assessment_questions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_audit_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_embedding_cache" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_embedding_cache_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."credential_audit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."credential_audit_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."documents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."AIModel"
    ADD CONSTRAINT "AIModel_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AssessmentCategoryScore"
    ADD CONSTRAINT "AssessmentCategoryScore_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AssessmentCategory"
    ADD CONSTRAINT "AssessmentCategory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AssessmentQuestion"
    ADD CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AssessmentResponse"
    ADD CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AssessmentSummary"
    ADD CONSTRAINT "AssessmentSummary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Briefing"
    ADD CONSTRAINT "Briefing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Deal"
    ADD CONSTRAINT "Deal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Email"
    ADD CONSTRAINT "Email_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Integration"
    ADD CONSTRAINT "Integration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."KPI"
    ADD CONSTRAINT "KPI_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ModelPerformance"
    ADD CONSTRAINT "ModelPerformance_pkey" PRIMARY KEY ("model_name", "month");



ALTER TABLE ONLY "public"."ModelUsage"
    ADD CONSTRAINT "ModelUsage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Note"
    ADD CONSTRAINT "Note_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Offer"
    ADD CONSTRAINT "Offer_pkey" PRIMARY KEY ("slug");



ALTER TABLE ONLY "public"."Pin"
    ADD CONSTRAINT "Pin_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Recent"
    ADD CONSTRAINT "Recent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Request"
    ADD CONSTRAINT "Request_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserProfile"
    ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."VARLead"
    ADD CONSTRAINT "VARLead_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."WidgetEvent"
    ADD CONSTRAINT "WidgetEvent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."action_cards"
    ADD CONSTRAINT "action_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_ab_test_results"
    ADD CONSTRAINT "ai_ab_test_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_action_card_events"
    ADD CONSTRAINT "ai_action_card_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_action_card_templates"
    ADD CONSTRAINT "ai_action_card_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_action_card_templates"
    ADD CONSTRAINT "ai_action_card_templates_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."ai_action_cards"
    ADD CONSTRAINT "ai_action_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_assessment_questions"
    ADD CONSTRAINT "ai_assessment_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_assessments"
    ADD CONSTRAINT "ai_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_audit_logs"
    ADD CONSTRAINT "ai_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_billing_records"
    ADD CONSTRAINT "ai_billing_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_budget_tracking"
    ADD CONSTRAINT "ai_budget_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_budget_tracking"
    ADD CONSTRAINT "ai_budget_tracking_user_id_month_year_key" UNIQUE ("user_id", "month_year");



ALTER TABLE ONLY "public"."ai_business_profiles"
    ADD CONSTRAINT "ai_business_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_client_intelligence_alerts"
    ADD CONSTRAINT "ai_client_intelligence_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_client_interactions"
    ADD CONSTRAINT "ai_client_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_company_profiles"
    ADD CONSTRAINT "ai_company_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_cost_allocations"
    ADD CONSTRAINT "ai_cost_allocations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_document_processing_queue"
    ADD CONSTRAINT "ai_document_processing_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_email_accounts"
    ADD CONSTRAINT "ai_email_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_email_accounts"
    ADD CONSTRAINT "ai_email_accounts_user_id_provider_email_key" UNIQUE ("user_id", "provider", "email");



ALTER TABLE ONLY "public"."ai_embedding_cache"
    ADD CONSTRAINT "ai_embedding_cache_checksum_key" UNIQUE ("checksum");



ALTER TABLE ONLY "public"."ai_embedding_cache"
    ADD CONSTRAINT "ai_embedding_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_improvement_recommendations"
    ADD CONSTRAINT "ai_improvement_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_inbox_folders"
    ADD CONSTRAINT "ai_inbox_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_inbox_item_folders"
    ADD CONSTRAINT "ai_inbox_item_folders_pkey" PRIMARY KEY ("inbox_item_id", "folder_id");



ALTER TABLE ONLY "public"."ai_inbox_items"
    ADD CONSTRAINT "ai_inbox_items_message_id_key" UNIQUE ("message_id");



ALTER TABLE ONLY "public"."ai_inbox_items"
    ADD CONSTRAINT "ai_inbox_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_inbox_rules"
    ADD CONSTRAINT "ai_inbox_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_integrations_oauth"
    ADD CONSTRAINT "ai_integrations_oauth_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_integrations_oauth"
    ADD CONSTRAINT "ai_integrations_oauth_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."ai_integrations"
    ADD CONSTRAINT "ai_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_knowledge_analytics"
    ADD CONSTRAINT "ai_knowledge_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_knowledge_cards"
    ADD CONSTRAINT "ai_knowledge_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_knowledge_gaps"
    ADD CONSTRAINT "ai_knowledge_gaps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_knowledge_relationships"
    ADD CONSTRAINT "ai_knowledge_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_knowledge_relationships"
    ADD CONSTRAINT "ai_knowledge_relationships_source_card_id_target_card_id_re_key" UNIQUE ("source_card_id", "target_card_id", "relationship_type");



ALTER TABLE ONLY "public"."ai_kpi_snapshots"
    ADD CONSTRAINT "ai_kpi_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_learning_events"
    ADD CONSTRAINT "ai_learning_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_llm_registry"
    ADD CONSTRAINT "ai_llm_registry_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_message_feedback"
    ADD CONSTRAINT "ai_message_feedback_message_id_user_id_key" UNIQUE ("message_id", "user_id");



ALTER TABLE ONLY "public"."ai_message_feedback"
    ADD CONSTRAINT "ai_message_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_metrics_daily"
    ADD CONSTRAINT "ai_metrics_daily_pkey" PRIMARY KEY ("user_id", "date");



ALTER TABLE ONLY "public"."ai_model_performance"
    ADD CONSTRAINT "ai_model_performance_model_provider_key" UNIQUE ("model", "provider");



ALTER TABLE ONLY "public"."ai_model_performance"
    ADD CONSTRAINT "ai_model_performance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_model_usage"
    ADD CONSTRAINT "ai_model_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_models"
    ADD CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_operations_docs"
    ADD CONSTRAINT "ai_operations_docs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_ops_kpis"
    ADD CONSTRAINT "ai_ops_kpis_pkey" PRIMARY KEY ("org_id", "key");



ALTER TABLE ONLY "public"."ai_optimization_suggestions"
    ADD CONSTRAINT "ai_optimization_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_passkey_challenges"
    ADD CONSTRAINT "ai_passkey_challenges_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."ai_passkeys"
    ADD CONSTRAINT "ai_passkeys_pkey" PRIMARY KEY ("credential_id");



ALTER TABLE ONLY "public"."ai_performance_metrics"
    ADD CONSTRAINT "ai_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_personal_thought_vectors"
    ADD CONSTRAINT "ai_personal_thought_vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_quality_assessments"
    ADD CONSTRAINT "ai_quality_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_revenue_metrics"
    ADD CONSTRAINT "ai_revenue_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_sales_metrics"
    ADD CONSTRAINT "ai_sales_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_subscription_metrics"
    ADD CONSTRAINT "ai_subscription_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_success_outcomes"
    ADD CONSTRAINT "ai_success_outcomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_unified_client_profiles"
    ADD CONSTRAINT "ai_unified_client_profiles_client_id_company_id_key" UNIQUE ("client_id", "company_id");



ALTER TABLE ONLY "public"."ai_unified_client_profiles"
    ADD CONSTRAINT "ai_unified_client_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_user_activity"
    ADD CONSTRAINT "ai_user_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_user_feedback"
    ADD CONSTRAINT "ai_user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_vector_documents"
    ADD CONSTRAINT "ai_vector_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics"
    ADD CONSTRAINT "analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_action_items"
    ADD CONSTRAINT "assessment_action_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_execution_logs"
    ADD CONSTRAINT "automation_execution_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_workflows"
    ADD CONSTRAINT "automation_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_plans"
    ADD CONSTRAINT "billing_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_goals"
    ADD CONSTRAINT "business_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_health"
    ADD CONSTRAINT "business_health_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."capability_gap_analysis"
    ADD CONSTRAINT "capability_gap_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."capability_roadmap"
    ADD CONSTRAINT "capability_roadmap_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."chat_usage_tracking"
    ADD CONSTRAINT "chat_usage_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_usage_tracking"
    ADD CONSTRAINT "chat_usage_tracking_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."communication_analytics"
    ADD CONSTRAINT "communication_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communication_events"
    ADD CONSTRAINT "communication_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_hubspotid_unique" UNIQUE ("hubspotid");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_document_templates"
    ADD CONSTRAINT "company_document_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_status_snapshots"
    ADD CONSTRAINT "company_status_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."component_usages"
    ADD CONSTRAINT "component_usages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_hubspotid_key" UNIQUE ("hubspotid");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credential_audit_log"
    ADD CONSTRAINT "credential_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal"
    ADD CONSTRAINT "deal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_hubspotid_key" UNIQUE ("hubspotid");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."encrypted_credentials"
    ADD CONSTRAINT "encrypted_credentials_organization_id_integration_name_key" UNIQUE ("organization_id", "integration_name");



ALTER TABLE ONLY "public"."encrypted_credentials"
    ADD CONSTRAINT "encrypted_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."encrypted_credentials"
    ADD CONSTRAINT "encrypted_credentials_user_id_integration_name_key" UNIQUE ("user_id", "integration_name");



ALTER TABLE ONLY "public"."financial_data"
    ADD CONSTRAINT "financial_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_metrics"
    ADD CONSTRAINT "financial_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_activity_mapping"
    ADD CONSTRAINT "goal_activity_mapping_goal_id_activity_id_key" UNIQUE ("goal_id", "activity_id");



ALTER TABLE ONLY "public"."goal_activity_mapping"
    ADD CONSTRAINT "goal_activity_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_assessments"
    ADD CONSTRAINT "goal_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_insights"
    ADD CONSTRAINT "goal_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_resource_mapping"
    ADD CONSTRAINT "goal_resource_mapping_goal_id_resource_id_key" UNIQUE ("goal_id", "resource_id");



ALTER TABLE ONLY "public"."goal_resource_mapping"
    ADD CONSTRAINT "goal_resource_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_user_alignment"
    ADD CONSTRAINT "goal_user_alignment_goal_id_user_id_key" UNIQUE ("goal_id", "user_id");



ALTER TABLE ONLY "public"."goal_user_alignment"
    ADD CONSTRAINT "goal_user_alignment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insight_business_connections"
    ADD CONSTRAINT "insight_business_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_data"
    ADD CONSTRAINT "integration_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_data"
    ADD CONSTRAINT "integration_data_user_integration_id_data_type_external_id_key" UNIQUE ("user_integration_id", "data_type", "external_id");



ALTER TABLE ONLY "public"."integration_ninjarmm_device_data"
    ADD CONSTRAINT "integration_ninjarmm_device_d_user_integration_id_device_id_key" UNIQUE ("user_integration_id", "device_id");



ALTER TABLE ONLY "public"."integration_ninjarmm_device_data"
    ADD CONSTRAINT "integration_ninjarmm_device_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_status"
    ADD CONSTRAINT "integration_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_status"
    ADD CONSTRAINT "integration_status_user_id_integration_slug_key" UNIQUE ("user_id", "integration_slug");



ALTER TABLE ONLY "public"."integration_sync_logs"
    ADD CONSTRAINT "integration_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_webhooks"
    ADD CONSTRAINT "integration_webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."manual_calendar_events"
    ADD CONSTRAINT "manual_calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manual_contacts"
    ADD CONSTRAINT "manual_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manual_documents"
    ADD CONSTRAINT "manual_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manual_emails"
    ADD CONSTRAINT "manual_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manual_tasks"
    ADD CONSTRAINT "manual_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_campaigns"
    ADD CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_leads"
    ADD CONSTRAINT "marketing_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migration_checks"
    ADD CONSTRAINT "migration_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model_usage"
    ADD CONSTRAINT "model_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."n8n_configurations"
    ADD CONSTRAINT "n8n_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."n8n_workflow_configs"
    ADD CONSTRAINT "n8n_workflow_configs_company_workflow_unique" UNIQUE ("company_id", "workflow_name");



ALTER TABLE ONLY "public"."n8n_workflow_configs"
    ADD CONSTRAINT "n8n_workflow_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oauth_tokens"
    ADD CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oauth_tokens"
    ADD CONSTRAINT "oauth_tokens_user_id_integration_slug_key" UNIQUE ("user_id", "integration_slug");



ALTER TABLE ONLY "public"."onboarding_conversations"
    ADD CONSTRAINT "onboarding_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_conversations"
    ADD CONSTRAINT "onboarding_conversations_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."onboarding_messages"
    ADD CONSTRAINT "onboarding_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ops_action_queue"
    ADD CONSTRAINT "ops_action_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_thoughts"
    ADD CONSTRAINT "personal_thoughts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_inventory"
    ADD CONSTRAINT "resource_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_deals"
    ADD CONSTRAINT "sales_deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_performance"
    ADD CONSTRAINT "sales_performance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_pipeline"
    ADD CONSTRAINT "sales_pipeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."secure_integrations"
    ADD CONSTRAINT "secure_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_config"
    ADD CONSTRAINT "security_config_config_key_key" UNIQUE ("config_key");



ALTER TABLE ONLY "public"."security_config"
    ADD CONSTRAINT "security_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_events"
    ADD CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_capacity"
    ADD CONSTRAINT "team_capacity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."thought_relationships"
    ADD CONSTRAINT "thought_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."thought_relationships"
    ADD CONSTRAINT "thought_relationships_source_thought_id_target_thought_id_r_key" UNIQUE ("source_thought_id", "target_thought_id", "relationship_type");



ALTER TABLE ONLY "public"."thoughts"
    ADD CONSTRAINT "thoughts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_inbox_items"
    ADD CONSTRAINT "unique_external_message" UNIQUE ("integration_id", "external_id");



ALTER TABLE ONLY "public"."ai_inbox_folders"
    ADD CONSTRAINT "unique_user_folder_name" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."secure_integrations"
    ADD CONSTRAINT "unique_user_integration" UNIQUE ("user_id", "integration_type", "integration_name");



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_billing_plans"
    ADD CONSTRAINT "user_billing_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_context_profiles"
    ADD CONSTRAINT "user_context_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_integration_id_company_id_key" UNIQUE ("user_id", "integration_id", "company_id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_integration_id_name_key" UNIQUE ("user_id", "integration_id", "name");



ALTER TABLE ONLY "public"."user_interaction_analysis"
    ADD CONSTRAINT "user_interaction_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_learning_patterns"
    ADD CONSTRAINT "user_learning_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_licenses"
    ADD CONSTRAINT "user_licenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_onboarding_progress"
    ADD CONSTRAINT "user_onboarding_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_onboarding_progress"
    ADD CONSTRAINT "user_onboarding_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("user_id", "org_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist_signups"
    ADD CONSTRAINT "waitlist_signups_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist_signups"
    ADD CONSTRAINT "waitlist_signups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist_signups"
    ADD CONSTRAINT "waitlist_signups_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."website_analytics"
    ADD CONSTRAINT "website_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_activity"
    ADD CONSTRAINT "workspace_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_content"
    ADD CONSTRAINT "workspace_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_user_id_key" UNIQUE ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account" USING "btree" ("provider", "providerAccountId");



CREATE UNIQUE INDEX "AssessmentCategory_name_key" ON "public"."AssessmentCategory" USING "btree" ("name");



CREATE UNIQUE INDEX "AssessmentSummary_company_id_key" ON "public"."AssessmentSummary" USING "btree" ("company_id");



CREATE UNIQUE INDEX "Company_domain_key" ON "public"."Company" USING "btree" ("domain");



CREATE UNIQUE INDEX "Offer_name_key" ON "public"."Offer" USING "btree" ("name");



CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session" USING "btree" ("sessionToken");



CREATE UNIQUE INDEX "UserProfile_user_id_key" ON "public"."UserProfile" USING "btree" ("user_id");



CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");



CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken" USING "btree" ("identifier", "token");



CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken" USING "btree" ("token");



CREATE UNIQUE INDEX "ai_business_profiles_org_id_key" ON "public"."ai_business_profiles" USING "btree" ("org_id");



CREATE INDEX "ai_inbox_items_is_demo_idx" ON "public"."ai_inbox_items" USING "btree" ("is_demo");



CREATE INDEX "ai_kpi_snapshots_company_id_idx" ON "public"."ai_kpi_snapshots" USING "btree" ("company_id");



CREATE UNIQUE INDEX "ai_kpi_snapshots_unique_user_kpi" ON "public"."ai_kpi_snapshots" USING "btree" ("user_id", "kpi_id");



CREATE INDEX "ai_kpi_snapshots_user_id_idx" ON "public"."ai_kpi_snapshots" USING "btree" ("user_id");



CREATE UNIQUE INDEX "ai_llm_registry_company_id_provider_model_id_idx" ON "public"."ai_llm_registry" USING "btree" ("company_id", "provider", "model_id");



CREATE INDEX "ai_operations_docs_embedding_idx" ON "public"."ai_operations_docs" USING "ivfflat" ("embedding" "extensions"."vector_cosine_ops");



CREATE INDEX "idx_action_cards_created_at" ON "public"."action_cards" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_action_cards_domain" ON "public"."action_cards" USING "btree" ("domain");



CREATE INDEX "idx_action_cards_user_status" ON "public"."action_cards" USING "btree" ("user_id", "status");



CREATE INDEX "idx_ai_ab_test_results_test_id" ON "public"."ai_ab_test_results" USING "btree" ("test_id");



CREATE INDEX "idx_ai_ab_test_results_timestamp" ON "public"."ai_ab_test_results" USING "btree" ("timestamp");



CREATE INDEX "idx_ai_ab_test_results_user_id" ON "public"."ai_ab_test_results" USING "btree" ("user_id");



CREATE INDEX "idx_ai_action_card_templates_active" ON "public"."ai_action_card_templates" USING "btree" ("is_active");



CREATE INDEX "idx_ai_action_card_templates_category" ON "public"."ai_action_card_templates" USING "btree" ("category");



CREATE INDEX "idx_ai_action_card_templates_slug" ON "public"."ai_action_card_templates" USING "btree" ("slug");



CREATE INDEX "idx_ai_assessments_company_user" ON "public"."ai_assessments" USING "btree" ("company_id", "user_id");



CREATE INDEX "idx_ai_assessments_processed_at" ON "public"."ai_assessments" USING "btree" ("processed_at");



CREATE INDEX "idx_ai_billing_records_billing_period" ON "public"."ai_billing_records" USING "btree" ("billing_period_start", "billing_period_end");



CREATE INDEX "idx_ai_billing_records_status" ON "public"."ai_billing_records" USING "btree" ("status");



CREATE INDEX "idx_ai_billing_records_user_id" ON "public"."ai_billing_records" USING "btree" ("user_id");



CREATE INDEX "idx_ai_billing_records_user_period" ON "public"."ai_billing_records" USING "btree" ("user_id", "billing_period_start", "billing_period_end");



CREATE INDEX "idx_ai_budget_tracking_user_month" ON "public"."ai_budget_tracking" USING "btree" ("user_id", "month_year");



CREATE INDEX "idx_ai_company_profiles_company_id" ON "public"."ai_company_profiles" USING "btree" ("company_id");



CREATE INDEX "idx_ai_company_profiles_user_id" ON "public"."ai_company_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_ai_cost_allocations_agent_id" ON "public"."ai_cost_allocations" USING "btree" ("agent_id");



CREATE INDEX "idx_ai_cost_allocations_billing_category" ON "public"."ai_cost_allocations" USING "btree" ("billing_category");



CREATE INDEX "idx_ai_cost_allocations_model_provider" ON "public"."ai_cost_allocations" USING "btree" ("model", "provider");



CREATE INDEX "idx_ai_cost_allocations_timestamp" ON "public"."ai_cost_allocations" USING "btree" ("timestamp");



CREATE INDEX "idx_ai_cost_allocations_user_id" ON "public"."ai_cost_allocations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_cost_allocations_user_timestamp" ON "public"."ai_cost_allocations" USING "btree" ("user_id", "timestamp");



CREATE INDEX "idx_ai_document_processing_queue_priority" ON "public"."ai_document_processing_queue" USING "btree" ("priority" DESC, "created_at");



CREATE INDEX "idx_ai_document_processing_queue_scheduled" ON "public"."ai_document_processing_queue" USING "btree" ("scheduled_for");



CREATE INDEX "idx_ai_document_processing_queue_status" ON "public"."ai_document_processing_queue" USING "btree" ("status");



CREATE INDEX "idx_ai_document_processing_queue_user" ON "public"."ai_document_processing_queue" USING "btree" ("user_id");



CREATE INDEX "idx_ai_email_accounts_provider" ON "public"."ai_email_accounts" USING "btree" ("provider");



CREATE INDEX "idx_ai_email_accounts_user_id" ON "public"."ai_email_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_ai_embedding_cache_checksum" ON "public"."ai_embedding_cache" USING "btree" ("checksum");



CREATE INDEX "idx_ai_improvement_recommendations_priority" ON "public"."ai_improvement_recommendations" USING "btree" ("priority");



CREATE INDEX "idx_ai_improvement_recommendations_status" ON "public"."ai_improvement_recommendations" USING "btree" ("status");



CREATE INDEX "idx_ai_improvement_recommendations_type" ON "public"."ai_improvement_recommendations" USING "btree" ("type");



CREATE INDEX "idx_ai_inbox_folders_parent" ON "public"."ai_inbox_folders" USING "btree" ("parent_folder_id");



CREATE INDEX "idx_ai_inbox_folders_user" ON "public"."ai_inbox_folders" USING "btree" ("user_id");



CREATE INDEX "idx_ai_inbox_items_company_id" ON "public"."ai_inbox_items" USING "btree" ("company_id");



CREATE INDEX "idx_ai_inbox_items_external" ON "public"."ai_inbox_items" USING "btree" ("integration_id", "external_id");



CREATE INDEX "idx_ai_inbox_items_integration" ON "public"."ai_inbox_items" USING "btree" ("integration_id");



CREATE INDEX "idx_ai_inbox_items_priority" ON "public"."ai_inbox_items" USING "btree" ("ai_priority_score" DESC);



CREATE INDEX "idx_ai_inbox_items_received_at" ON "public"."ai_inbox_items" USING "btree" ("received_at" DESC);



CREATE INDEX "idx_ai_inbox_items_status" ON "public"."ai_inbox_items" USING "btree" ("status");



CREATE INDEX "idx_ai_inbox_items_title" ON "public"."ai_inbox_items" USING "gin" ("to_tsvector"('"english"'::"regconfig", "title"));



CREATE INDEX "idx_ai_inbox_items_user_id" ON "public"."ai_inbox_items" USING "btree" ("user_id");



CREATE INDEX "idx_ai_inbox_rules_active" ON "public"."ai_inbox_rules" USING "btree" ("is_active", "priority");



CREATE INDEX "idx_ai_inbox_rules_user" ON "public"."ai_inbox_rules" USING "btree" ("user_id");



CREATE INDEX "idx_ai_integrations_oauth_provider" ON "public"."ai_integrations_oauth" USING "btree" ("provider");



CREATE INDEX "idx_ai_integrations_oauth_user_id" ON "public"."ai_integrations_oauth" USING "btree" ("user_id");



CREATE INDEX "idx_ai_interactions_company_id" ON "public"."ai_interactions" USING "btree" ("company_id");



CREATE INDEX "idx_ai_interactions_thought_id" ON "public"."ai_interactions" USING "btree" ("thought_id");



CREATE INDEX "idx_ai_interactions_user_id" ON "public"."ai_interactions" USING "btree" ("user_id");



CREATE INDEX "idx_ai_knowledge_analytics_event_type" ON "public"."ai_knowledge_analytics" USING "btree" ("event_type");



CREATE INDEX "idx_ai_knowledge_analytics_knowledge_card" ON "public"."ai_knowledge_analytics" USING "btree" ("knowledge_card_id");



CREATE INDEX "idx_ai_knowledge_analytics_recorded_at" ON "public"."ai_knowledge_analytics" USING "btree" ("recorded_at" DESC);



CREATE INDEX "idx_ai_knowledge_analytics_user" ON "public"."ai_knowledge_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_ai_knowledge_cards_department" ON "public"."ai_knowledge_cards" USING "btree" ("department");



CREATE INDEX "idx_ai_knowledge_cards_document_id" ON "public"."ai_knowledge_cards" USING "btree" ("document_id");



CREATE INDEX "idx_ai_knowledge_cards_insights" ON "public"."ai_knowledge_cards" USING "gin" ("insights");



CREATE INDEX "idx_ai_knowledge_cards_priority" ON "public"."ai_knowledge_cards" USING "btree" ("priority");



CREATE INDEX "idx_ai_knowledge_cards_tags" ON "public"."ai_knowledge_cards" USING "gin" ("tags");



CREATE INDEX "idx_ai_knowledge_cards_type" ON "public"."ai_knowledge_cards" USING "btree" ("document_type");



CREATE INDEX "idx_ai_knowledge_cards_user_company" ON "public"."ai_knowledge_cards" USING "btree" ("user_id", "company_id");



CREATE INDEX "idx_ai_knowledge_gaps_department" ON "public"."ai_knowledge_gaps" USING "btree" ("department");



CREATE INDEX "idx_ai_knowledge_gaps_frequency" ON "public"."ai_knowledge_gaps" USING "btree" ("query_frequency" DESC);



CREATE INDEX "idx_ai_knowledge_gaps_priority" ON "public"."ai_knowledge_gaps" USING "btree" ("priority_score" DESC);



CREATE INDEX "idx_ai_knowledge_gaps_status" ON "public"."ai_knowledge_gaps" USING "btree" ("status");



CREATE INDEX "idx_ai_knowledge_relationships_source" ON "public"."ai_knowledge_relationships" USING "btree" ("source_card_id");



CREATE INDEX "idx_ai_knowledge_relationships_target" ON "public"."ai_knowledge_relationships" USING "btree" ("target_card_id");



CREATE INDEX "idx_ai_knowledge_relationships_type" ON "public"."ai_knowledge_relationships" USING "btree" ("relationship_type");



CREATE INDEX "idx_ai_message_feedback_conversation_id" ON "public"."ai_message_feedback" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_message_feedback_created_at" ON "public"."ai_message_feedback" USING "btree" ("created_at");



CREATE INDEX "idx_ai_message_feedback_user_id" ON "public"."ai_message_feedback" USING "btree" ("user_id");



CREATE INDEX "idx_ai_model_performance_model" ON "public"."ai_model_performance" USING "btree" ("model", "provider");



CREATE INDEX "idx_ai_model_usage_model_provider" ON "public"."ai_model_usage" USING "btree" ("model", "provider");



CREATE INDEX "idx_ai_model_usage_timestamp" ON "public"."ai_model_usage" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_ai_model_usage_user_timestamp" ON "public"."ai_model_usage" USING "btree" ("user_id", "timestamp" DESC);



CREATE INDEX "idx_ai_optimization_suggestions_user" ON "public"."ai_optimization_suggestions" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_ai_passkeys_user_id" ON "public"."ai_passkeys" USING "btree" ("user_id");



CREATE INDEX "idx_ai_performance_metrics_agent_id" ON "public"."ai_performance_metrics" USING "btree" ("agent_id");



CREATE INDEX "idx_ai_performance_metrics_metric_type" ON "public"."ai_performance_metrics" USING "btree" ("metric_type");



CREATE INDEX "idx_ai_performance_metrics_timestamp" ON "public"."ai_performance_metrics" USING "btree" ("timestamp");



CREATE INDEX "idx_ai_personal_thought_vectors_embedding" ON "public"."ai_personal_thought_vectors" USING "ivfflat" ("content_embedding" "extensions"."vector_cosine_ops");



CREATE INDEX "idx_ai_quality_assessments_agent_id" ON "public"."ai_quality_assessments" USING "btree" ("agent_id");



CREATE INDEX "idx_ai_quality_assessments_overall_score" ON "public"."ai_quality_assessments" USING "btree" ("overall_score");



CREATE INDEX "idx_ai_quality_assessments_timestamp" ON "public"."ai_quality_assessments" USING "btree" ("timestamp");



CREATE INDEX "idx_ai_success_outcomes_created_at" ON "public"."ai_success_outcomes" USING "btree" ("created_at");



CREATE INDEX "idx_ai_success_outcomes_status" ON "public"."ai_success_outcomes" USING "btree" ("success_status");



CREATE INDEX "idx_ai_success_outcomes_user_id" ON "public"."ai_success_outcomes" USING "btree" ("user_id");



CREATE INDEX "idx_ai_user_feedback_agent_id" ON "public"."ai_user_feedback" USING "btree" ("agent_id");



CREATE INDEX "idx_ai_user_feedback_rating" ON "public"."ai_user_feedback" USING "btree" ("rating");



CREATE INDEX "idx_ai_user_feedback_timestamp" ON "public"."ai_user_feedback" USING "btree" ("timestamp");



CREATE INDEX "idx_ai_user_feedback_user_id" ON "public"."ai_user_feedback" USING "btree" ("user_id");



CREATE INDEX "idx_chat_messages_conversation_id" ON "public"."chat_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_chat_messages_conversation_user_created" ON "public"."chat_messages" USING "btree" ("conversation_id", "user_id", "created_at" DESC);



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at");



CREATE INDEX "idx_chat_sessions_created_at" ON "public"."chat_sessions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_chat_sessions_outcome" ON "public"."chat_sessions" USING "btree" ("session_outcome");



CREATE INDEX "idx_chat_sessions_session_id" ON "public"."chat_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_chat_sessions_user_id" ON "public"."chat_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_chat_usage_tracking_date" ON "public"."chat_usage_tracking" USING "btree" ("date");



CREATE INDEX "idx_chat_usage_tracking_user_date" ON "public"."chat_usage_tracking" USING "btree" ("user_id", "date");



CREATE INDEX "idx_client_alerts_alert_type" ON "public"."ai_client_intelligence_alerts" USING "btree" ("alert_type");



CREATE INDEX "idx_client_alerts_priority" ON "public"."ai_client_intelligence_alerts" USING "btree" ("priority");



CREATE INDEX "idx_client_alerts_profile_id" ON "public"."ai_client_intelligence_alerts" USING "btree" ("client_profile_id");



CREATE INDEX "idx_client_alerts_status" ON "public"."ai_client_intelligence_alerts" USING "btree" ("status");



CREATE INDEX "idx_client_alerts_user_id" ON "public"."ai_client_intelligence_alerts" USING "btree" ("user_id");



CREATE INDEX "idx_client_interactions_data" ON "public"."ai_client_interactions" USING "gin" ("interaction_data");



CREATE INDEX "idx_client_interactions_profile_id" ON "public"."ai_client_interactions" USING "btree" ("client_profile_id");



CREATE INDEX "idx_client_interactions_source" ON "public"."ai_client_interactions" USING "btree" ("interaction_source");



CREATE INDEX "idx_client_interactions_timestamp" ON "public"."ai_client_interactions" USING "btree" ("interaction_timestamp" DESC);



CREATE INDEX "idx_client_interactions_type" ON "public"."ai_client_interactions" USING "btree" ("interaction_type");



CREATE INDEX "idx_client_profiles_client_id" ON "public"."ai_unified_client_profiles" USING "btree" ("client_id");



CREATE INDEX "idx_client_profiles_company_id" ON "public"."ai_unified_client_profiles" USING "btree" ("company_id");



CREATE INDEX "idx_client_profiles_engagement_score" ON "public"."ai_unified_client_profiles" USING "btree" ("engagement_score" DESC);



CREATE INDEX "idx_client_profiles_estimated_value" ON "public"."ai_unified_client_profiles" USING "btree" ("estimated_value" DESC);



CREATE INDEX "idx_client_profiles_last_enrichment" ON "public"."ai_unified_client_profiles" USING "btree" ("last_enrichment_at");



CREATE INDEX "idx_client_profiles_profile_data" ON "public"."ai_unified_client_profiles" USING "gin" ("profile_data");



CREATE INDEX "idx_client_profiles_search" ON "public"."ai_unified_client_profiles" USING "gin" ("search_vector");



CREATE INDEX "idx_communication_analytics_period" ON "public"."communication_analytics" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_communication_analytics_user_platform" ON "public"."communication_analytics" USING "btree" ("user_id", "platform");



CREATE INDEX "idx_communication_events_timestamp" ON "public"."communication_events" USING "btree" ("timestamp");



CREATE INDEX "idx_communication_events_user_platform" ON "public"."communication_events" USING "btree" ("user_id", "platform");



CREATE INDEX "idx_companies_created_at" ON "public"."companies" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_companies_hubspotid" ON "public"."companies" USING "btree" ("hubspotid");



CREATE INDEX "idx_companies_industry" ON "public"."companies" USING "btree" ("industry");



CREATE INDEX "idx_companies_size" ON "public"."companies" USING "btree" ("size");



CREATE INDEX "idx_component_usages_company_id" ON "public"."component_usages" USING "btree" ("company_id");



CREATE INDEX "idx_component_usages_component_name" ON "public"."component_usages" USING "btree" ("component_name");



CREATE INDEX "idx_component_usages_location" ON "public"."component_usages" USING "btree" ("location");



CREATE INDEX "idx_component_usages_timestamp" ON "public"."component_usages" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_component_usages_user_id" ON "public"."component_usages" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_updated_at" ON "public"."conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_conversations_user_id" ON "public"."conversations" USING "btree" ("user_id");



CREATE INDEX "idx_financial_data_company_id" ON "public"."financial_data" USING "btree" ("company_id");



CREATE INDEX "idx_financial_data_date" ON "public"."financial_data" USING "btree" ("date" DESC);



CREATE INDEX "idx_financial_data_type" ON "public"."financial_data" USING "btree" ("type");



CREATE INDEX "idx_financial_metrics_company_id" ON "public"."financial_metrics" USING "btree" ("company_id");



CREATE INDEX "idx_financial_metrics_date" ON "public"."financial_metrics" USING "btree" ("date" DESC);



CREATE INDEX "idx_integration_data_sync_batch" ON "public"."integration_data" USING "btree" ("sync_batch_id");



CREATE INDEX "idx_integration_data_timestamp" ON "public"."integration_data" USING "btree" ("data_timestamp");



CREATE INDEX "idx_integration_data_type" ON "public"."integration_data" USING "btree" ("data_type");



CREATE INDEX "idx_integration_data_user_integration_id" ON "public"."integration_data" USING "btree" ("user_integration_id");



CREATE INDEX "idx_integrations_metadata_gin" ON "public"."integrations" USING "gin" ("metadata");



CREATE INDEX "idx_marketing_campaigns_company_id" ON "public"."marketing_campaigns" USING "btree" ("company_id");



CREATE INDEX "idx_marketing_leads_company_id" ON "public"."marketing_leads" USING "btree" ("company_id");



CREATE INDEX "idx_mv_paypal_txns_org_time" ON "public"."mv_paypal_txns" USING "btree" ("org_id", "captured_at" DESC);



CREATE INDEX "idx_n8n_configurations_is_active" ON "public"."n8n_configurations" USING "btree" ("is_active");



CREATE INDEX "idx_n8n_configurations_user_id" ON "public"."n8n_configurations" USING "btree" ("user_id");



CREATE INDEX "idx_oauth_tokens_integration_slug" ON "public"."oauth_tokens" USING "btree" ("integration_slug");



CREATE INDEX "idx_oauth_tokens_user_id" ON "public"."oauth_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_onboarding_conversations_session_id" ON "public"."onboarding_conversations" USING "btree" ("session_id");



CREATE INDEX "idx_onboarding_conversations_status" ON "public"."onboarding_conversations" USING "btree" ("status");



CREATE INDEX "idx_onboarding_conversations_user_id" ON "public"."onboarding_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_onboarding_messages_conversation_id" ON "public"."onboarding_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_onboarding_messages_created_at" ON "public"."onboarding_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_onboarding_messages_user_id" ON "public"."onboarding_messages" USING "btree" ("user_id");



CREATE INDEX "idx_pin_entity" ON "public"."Pin" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_pin_user_entity" ON "public"."Pin" USING "btree" ("user_id", "entity_type", "entity_id");



CREATE INDEX "idx_projects_company_id" ON "public"."projects" USING "btree" ("company_id");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_recent_entity" ON "public"."Recent" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_recent_user_entity" ON "public"."Recent" USING "btree" ("user_id", "entity_type", "entity_id");



CREATE INDEX "idx_revenue_metrics_user_created" ON "public"."ai_revenue_metrics" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_sales_deals_company_id" ON "public"."sales_deals" USING "btree" ("company_id");



CREATE INDEX "idx_sales_metrics_user_created" ON "public"."ai_sales_metrics" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_sales_performance_company_id" ON "public"."sales_performance" USING "btree" ("company_id");



CREATE INDEX "idx_sales_pipeline_company_id" ON "public"."sales_pipeline" USING "btree" ("company_id");



CREATE INDEX "idx_secure_integrations_user" ON "public"."secure_integrations" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_security_audit_event_type" ON "public"."security_audit_log" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "idx_security_audit_user_time" ON "public"."security_audit_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_stripe_events_processed" ON "public"."stripe_events" USING "btree" ("processed", "created_at");



CREATE INDEX "idx_stripe_events_type" ON "public"."stripe_events" USING "btree" ("type");



CREATE INDEX "idx_subscription_metrics_user_status" ON "public"."ai_subscription_metrics" USING "btree" ("user_id", "status");



CREATE INDEX "idx_support_tickets_company_id" ON "public"."support_tickets" USING "btree" ("company_id");



CREATE INDEX "idx_support_tickets_status" ON "public"."support_tickets" USING "btree" ("status");



CREATE INDEX "idx_sync_logs_started_at" ON "public"."integration_sync_logs" USING "btree" ("started_at");



CREATE INDEX "idx_sync_logs_status" ON "public"."integration_sync_logs" USING "btree" ("status");



CREATE INDEX "idx_sync_logs_user_integration_id" ON "public"."integration_sync_logs" USING "btree" ("user_integration_id");



CREATE INDEX "idx_team_capacity_company_id" ON "public"."team_capacity" USING "btree" ("company_id");



CREATE INDEX "idx_thought_relationships_source" ON "public"."thought_relationships" USING "btree" ("source_thought_id");



CREATE INDEX "idx_thought_relationships_target" ON "public"."thought_relationships" USING "btree" ("target_thought_id");



CREATE INDEX "idx_thoughts_category" ON "public"."thoughts" USING "btree" ("category");



CREATE INDEX "idx_thoughts_created_at" ON "public"."thoughts" USING "btree" ("created_at");



CREATE INDEX "idx_thoughts_department" ON "public"."thoughts" USING "btree" ("department");



CREATE INDEX "idx_thoughts_parent_idea_id" ON "public"."thoughts" USING "btree" ("parent_idea_id");



CREATE INDEX "idx_thoughts_priority" ON "public"."thoughts" USING "btree" ("priority");



CREATE INDEX "idx_thoughts_status" ON "public"."thoughts" USING "btree" ("status");



CREATE INDEX "idx_thoughts_user_id" ON "public"."thoughts" USING "btree" ("user_id");



CREATE INDEX "idx_thoughts_workflow_stage" ON "public"."thoughts" USING "btree" ("workflow_stage");



CREATE INDEX "idx_usage_tracking_user_date_desc" ON "public"."chat_usage_tracking" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "idx_user_activity_created_at" ON "public"."user_activity" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_activity_user_created" ON "public"."ai_user_activity" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_user_activity_user_id" ON "public"."user_activity" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_user_billing_plans_active_unique" ON "public"."user_billing_plans" USING "btree" ("user_id") WHERE ("is_active" = true);



CREATE INDEX "idx_user_integrations_company_id" ON "public"."user_integrations" USING "btree" ("company_id");



CREATE INDEX "idx_user_integrations_integration_id" ON "public"."user_integrations" USING "btree" ("integration_id");



CREATE INDEX "idx_user_integrations_next_sync" ON "public"."user_integrations" USING "btree" ("next_sync_at") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_user_integrations_status" ON "public"."user_integrations" USING "btree" ("status");



CREATE INDEX "idx_user_integrations_user_id" ON "public"."user_integrations" USING "btree" ("user_id");



CREATE INDEX "idx_user_licenses_stripe_customer_id" ON "public"."user_licenses" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_user_licenses_stripe_subscription_id" ON "public"."user_licenses" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_user_licenses_tier" ON "public"."user_licenses" USING "btree" ("tier");



CREATE INDEX "idx_user_licenses_user_active" ON "public"."user_licenses" USING "btree" ("user_id", "status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_user_licenses_user_id" ON "public"."user_licenses" USING "btree" ("user_id");



CREATE INDEX "idx_user_onboarding_progress_completed" ON "public"."user_onboarding_progress" USING "btree" ("onboarding_completed");



CREATE INDEX "idx_user_onboarding_progress_user_id" ON "public"."user_onboarding_progress" USING "btree" ("user_id");



CREATE INDEX "idx_waitlist_created_at" ON "public"."waitlist_signups" USING "btree" ("created_at");



CREATE INDEX "idx_waitlist_email" ON "public"."waitlist_signups" USING "btree" ("email");



CREATE INDEX "idx_waitlist_position" ON "public"."waitlist_signups" USING "btree" ("position");



CREATE INDEX "idx_waitlist_referral_code" ON "public"."waitlist_signups" USING "btree" ("referral_code");



CREATE INDEX "idx_waitlist_referred_by" ON "public"."waitlist_signups" USING "btree" ("referred_by_code");



CREATE INDEX "idx_waitlist_tier" ON "public"."waitlist_signups" USING "btree" ("tier");



CREATE INDEX "idx_website_analytics_company_id" ON "public"."website_analytics" USING "btree" ("company_id");



CREATE INDEX "idx_website_analytics_date" ON "public"."website_analytics" USING "btree" ("date" DESC);



CREATE INDEX "idx_widget_event_created_at" ON "public"."WidgetEvent" USING "btree" ("created_at");



CREATE INDEX "idx_widget_event_user" ON "public"."WidgetEvent" USING "btree" ("user_id", "widget_id", "event_type");



CREATE INDEX "insight_connections_metric_idx" ON "public"."insight_business_connections" USING "btree" ("business_metric_id");



CREATE INDEX "insight_connections_thought_idx" ON "public"."insight_business_connections" USING "btree" ("personal_thought_id");



CREATE INDEX "personal_thoughts_category_idx" ON "public"."personal_thoughts" USING "btree" ("category");



CREATE INDEX "personal_thoughts_created_at_idx" ON "public"."personal_thoughts" USING "btree" ("created_at" DESC);



CREATE INDEX "personal_thoughts_search_idx" ON "public"."personal_thoughts" USING "gin" ("search_vector");



CREATE INDEX "personal_thoughts_user_id_idx" ON "public"."personal_thoughts" USING "btree" ("user_id");



CREATE UNIQUE INDEX "ui_mv_latest_department_kpis" ON "public"."mv_latest_department_kpis" USING "btree" ("org_id", "department_id", COALESCE("kpi_id", 'NA'::"text"));



CREATE UNIQUE INDEX "user_billing_plans_user_active_unique" ON "public"."user_billing_plans" USING "btree" ("user_id") WHERE ("is_active" = true);



CREATE INDEX "user_profiles_business_email_idx" ON "public"."user_profiles" USING "btree" ("business_email");



CREATE INDEX "user_profiles_email_idx" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "user_profiles_user_id_idx" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "action_cards_updated_at" BEFORE UPDATE ON "public"."action_cards" FOR EACH ROW EXECUTE FUNCTION "public"."update_action_cards_updated_at"();



CREATE OR REPLACE TRIGGER "ai_model_usage_budget_trigger" AFTER INSERT ON "public"."ai_model_usage" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_budget_tracking"();



CREATE OR REPLACE TRIGGER "ai_model_usage_performance_trigger" AFTER INSERT ON "public"."ai_model_usage" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_model_performance"();



CREATE OR REPLACE TRIGGER "assign_waitlist_position_trigger" BEFORE INSERT ON "public"."waitlist_signups" FOR EACH ROW EXECUTE FUNCTION "public"."assign_waitlist_position"();



CREATE OR REPLACE TRIGGER "auto_apply_inbox_rules" AFTER INSERT ON "public"."ai_inbox_items" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_apply_inbox_rules"();



CREATE OR REPLACE TRIGGER "on_assessment_response_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."AssessmentResponse" FOR EACH ROW EXECUTE FUNCTION "public"."handle_assessment_response_change"();



CREATE OR REPLACE TRIGGER "on_integrations_updated" BEFORE UPDATE ON "public"."integrations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_ai_integrations_updated_at" BEFORE UPDATE ON "public"."ai_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_ai_ops_kpis_updated_at" BEFORE UPDATE ON "public"."ai_ops_kpis" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_track_performance_metrics" AFTER INSERT ON "public"."ai_user_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."track_performance_metrics"();



CREATE OR REPLACE TRIGGER "trigger_update_billing_tracking" AFTER INSERT ON "public"."ai_cost_allocations" FOR EACH ROW EXECUTE FUNCTION "public"."update_billing_tracking"();



CREATE OR REPLACE TRIGGER "trigger_update_client_profile_search_vector" BEFORE INSERT OR UPDATE ON "public"."ai_unified_client_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_client_profile_search_vector"();



CREATE OR REPLACE TRIGGER "trigger_update_parent_progress" AFTER UPDATE ON "public"."thoughts" FOR EACH ROW EXECUTE FUNCTION "public"."update_parent_progress"();



CREATE OR REPLACE TRIGGER "update_ai_action_card_events_updated_at" BEFORE UPDATE ON "public"."ai_action_card_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_action_card_templates_updated_at" BEFORE UPDATE ON "public"."ai_action_card_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_action_cards_updated_at" BEFORE UPDATE ON "public"."ai_action_cards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_agents_updated_at" BEFORE UPDATE ON "public"."ai_agents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_assessment_questions_updated_at" BEFORE UPDATE ON "public"."ai_assessment_questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_conversations_updated_at" BEFORE UPDATE ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_document_processing_queue_updated_at" BEFORE UPDATE ON "public"."ai_document_processing_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_inbox_folders_updated_at" BEFORE UPDATE ON "public"."ai_inbox_folders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_inbox_items_updated_at" BEFORE UPDATE ON "public"."ai_inbox_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_inbox_rules_updated_at" BEFORE UPDATE ON "public"."ai_inbox_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_knowledge_cards_updated_at" BEFORE UPDATE ON "public"."ai_knowledge_cards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_knowledge_gaps_updated_at" BEFORE UPDATE ON "public"."ai_knowledge_gaps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_message_feedback_updated_at" BEFORE UPDATE ON "public"."ai_message_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_messages_updated_at" BEFORE UPDATE ON "public"."ai_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_personal_thought_vectors_updated_at" BEFORE UPDATE ON "public"."ai_personal_thought_vectors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_success_outcomes_updated_at" BEFORE UPDATE ON "public"."ai_success_outcomes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_vector_documents_updated_at" BEFORE UPDATE ON "public"."ai_vector_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chat_sessions_updated_at" BEFORE UPDATE ON "public"."chat_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_component_usages_updated_at" BEFORE UPDATE ON "public"."component_usages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_folder_counts_on_change" AFTER INSERT OR DELETE ON "public"."ai_inbox_item_folders" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_folder_counts"();



CREATE OR REPLACE TRIGGER "update_integration_data_updated_at" BEFORE UPDATE ON "public"."integration_data" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_integration_webhooks_updated_at" BEFORE UPDATE ON "public"."integration_webhooks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_integrations_updated_at" BEFORE UPDATE ON "public"."integrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_n8n_configurations_updated_at" BEFORE UPDATE ON "public"."n8n_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_n8n_workflow_configs_updated_at" BEFORE UPDATE ON "public"."n8n_workflow_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_personal_thoughts_updated_at" BEFORE UPDATE ON "public"."personal_thoughts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_thoughts_updated_at" BEFORE UPDATE ON "public"."thoughts" FOR EACH ROW EXECUTE FUNCTION "public"."update_thoughts_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_integrations_updated_at" BEFORE UPDATE ON "public"."user_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_waitlist_signups_updated_at" BEFORE UPDATE ON "public"."waitlist_signups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "public"."UserProfile"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."AssessmentCategoryScore"
    ADD CONSTRAINT "AssessmentCategoryScore_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."AssessmentCategory"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."AssessmentCategoryScore"
    ADD CONSTRAINT "AssessmentCategoryScore_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."AssessmentQuestion"
    ADD CONSTRAINT "AssessmentQuestion_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."AssessmentCategory"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."AssessmentQuestion"
    ADD CONSTRAINT "AssessmentQuestion_offer_slug_fkey" FOREIGN KEY ("offer_slug") REFERENCES "public"."Offer"("slug") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."AssessmentResponse"
    ADD CONSTRAINT "AssessmentResponse_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."AssessmentResponse"
    ADD CONSTRAINT "AssessmentResponse_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."AssessmentQuestion"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."AssessmentResponse"
    ADD CONSTRAINT "AssessmentResponse_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "public"."UserProfile"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."AssessmentResponse"
    ADD CONSTRAINT "AssessmentResponse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."AssessmentSummary"
    ADD CONSTRAINT "AssessmentSummary_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Contact"
    ADD CONSTRAINT "Contact_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Contact"
    ADD CONSTRAINT "Contact_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "public"."UserProfile"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Contact"
    ADD CONSTRAINT "Contact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Deal"
    ADD CONSTRAINT "Deal_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Deal"
    ADD CONSTRAINT "Deal_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "public"."UserProfile"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Deal"
    ADD CONSTRAINT "Deal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Integration"
    ADD CONSTRAINT "Integration_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Integration"
    ADD CONSTRAINT "Integration_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "public"."UserProfile"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Integration"
    ADD CONSTRAINT "Integration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ModelPerformance"
    ADD CONSTRAINT "ModelPerformance_model_name_fkey" FOREIGN KEY ("model_name") REFERENCES "public"."AIModel"("name") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ModelUsage"
    ADD CONSTRAINT "ModelUsage_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ModelUsage"
    ADD CONSTRAINT "ModelUsage_model_name_fkey" FOREIGN KEY ("model_name") REFERENCES "public"."AIModel"("name") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ModelUsage"
    ADD CONSTRAINT "ModelUsage_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "public"."UserProfile"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ModelUsage"
    ADD CONSTRAINT "ModelUsage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Session"
    ADD CONSTRAINT "Session_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "public"."UserProfile"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."UserProfile"
    ADD CONSTRAINT "UserProfile_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."UserProfile"
    ADD CONSTRAINT "UserProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."VARLead"
    ADD CONSTRAINT "VARLead_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."VARLead"
    ADD CONSTRAINT "VARLead_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "public"."UserProfile"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."VARLead"
    ADD CONSTRAINT "VARLead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."action_cards"
    ADD CONSTRAINT "action_cards_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."action_cards"
    ADD CONSTRAINT "action_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_ab_test_results"
    ADD CONSTRAINT "ai_ab_test_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_action_card_events"
    ADD CONSTRAINT "ai_action_card_events_action_card_id_fkey" FOREIGN KEY ("action_card_id") REFERENCES "public"."ai_action_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_action_card_events"
    ADD CONSTRAINT "ai_action_card_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_action_cards"
    ADD CONSTRAINT "ai_action_cards_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_audit_logs"
    ADD CONSTRAINT "ai_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_billing_records"
    ADD CONSTRAINT "ai_billing_records_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id");



ALTER TABLE ONLY "public"."ai_billing_records"
    ADD CONSTRAINT "ai_billing_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_budget_tracking"
    ADD CONSTRAINT "ai_budget_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_business_profiles"
    ADD CONSTRAINT "ai_business_profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_business_profiles"
    ADD CONSTRAINT "ai_business_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_client_intelligence_alerts"
    ADD CONSTRAINT "ai_client_intelligence_alerts_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_client_intelligence_alerts"
    ADD CONSTRAINT "ai_client_intelligence_alerts_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "public"."ai_unified_client_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_client_intelligence_alerts"
    ADD CONSTRAINT "ai_client_intelligence_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_client_interactions"
    ADD CONSTRAINT "ai_client_interactions_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "public"."ai_unified_client_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_company_profiles"
    ADD CONSTRAINT "ai_company_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_company_profiles"
    ADD CONSTRAINT "ai_company_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_cost_allocations"
    ADD CONSTRAINT "ai_cost_allocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_document_processing_queue"
    ADD CONSTRAINT "ai_document_processing_queue_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_document_processing_queue"
    ADD CONSTRAINT "ai_document_processing_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_email_accounts"
    ADD CONSTRAINT "ai_email_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_inbox_folders"
    ADD CONSTRAINT "ai_inbox_folders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_inbox_folders"
    ADD CONSTRAINT "ai_inbox_folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."ai_inbox_folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_inbox_folders"
    ADD CONSTRAINT "ai_inbox_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_inbox_item_folders"
    ADD CONSTRAINT "ai_inbox_item_folders_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."ai_inbox_folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_inbox_item_folders"
    ADD CONSTRAINT "ai_inbox_item_folders_inbox_item_id_fkey" FOREIGN KEY ("inbox_item_id") REFERENCES "public"."ai_inbox_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_inbox_items"
    ADD CONSTRAINT "ai_inbox_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_inbox_items"
    ADD CONSTRAINT "ai_inbox_items_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_inbox_items"
    ADD CONSTRAINT "ai_inbox_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_inbox_rules"
    ADD CONSTRAINT "ai_inbox_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_inbox_rules"
    ADD CONSTRAINT "ai_inbox_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_integrations_oauth"
    ADD CONSTRAINT "ai_integrations_oauth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_thought_id_fkey" FOREIGN KEY ("thought_id") REFERENCES "public"."thoughts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_knowledge_analytics"
    ADD CONSTRAINT "ai_knowledge_analytics_knowledge_card_id_fkey" FOREIGN KEY ("knowledge_card_id") REFERENCES "public"."ai_knowledge_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_knowledge_analytics"
    ADD CONSTRAINT "ai_knowledge_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_knowledge_cards"
    ADD CONSTRAINT "ai_knowledge_cards_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_knowledge_cards"
    ADD CONSTRAINT "ai_knowledge_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_knowledge_gaps"
    ADD CONSTRAINT "ai_knowledge_gaps_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_knowledge_relationships"
    ADD CONSTRAINT "ai_knowledge_relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_knowledge_relationships"
    ADD CONSTRAINT "ai_knowledge_relationships_source_card_id_fkey" FOREIGN KEY ("source_card_id") REFERENCES "public"."ai_knowledge_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_knowledge_relationships"
    ADD CONSTRAINT "ai_knowledge_relationships_target_card_id_fkey" FOREIGN KEY ("target_card_id") REFERENCES "public"."ai_knowledge_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_learning_events"
    ADD CONSTRAINT "ai_learning_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_llm_registry"
    ADD CONSTRAINT "ai_llm_registry_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_message_feedback"
    ADD CONSTRAINT "ai_message_feedback_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_message_feedback"
    ADD CONSTRAINT "ai_message_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_metrics_daily"
    ADD CONSTRAINT "ai_metrics_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_model_usage"
    ADD CONSTRAINT "ai_model_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_ops_kpis"
    ADD CONSTRAINT "ai_ops_kpis_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_optimization_suggestions"
    ADD CONSTRAINT "ai_optimization_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_passkey_challenges"
    ADD CONSTRAINT "ai_passkey_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_passkeys"
    ADD CONSTRAINT "ai_passkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_personal_thought_vectors"
    ADD CONSTRAINT "ai_personal_thought_vectors_thought_id_fkey" FOREIGN KEY ("thought_id") REFERENCES "public"."personal_thoughts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_revenue_metrics"
    ADD CONSTRAINT "ai_revenue_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_sales_metrics"
    ADD CONSTRAINT "ai_sales_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_subscription_metrics"
    ADD CONSTRAINT "ai_subscription_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_success_outcomes"
    ADD CONSTRAINT "ai_success_outcomes_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_success_outcomes"
    ADD CONSTRAINT "ai_success_outcomes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_unified_client_profiles"
    ADD CONSTRAINT "ai_unified_client_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_unified_client_profiles"
    ADD CONSTRAINT "ai_unified_client_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_user_activity"
    ADD CONSTRAINT "ai_user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_user_feedback"
    ADD CONSTRAINT "ai_user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics"
    ADD CONSTRAINT "analytics_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."business_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics"
    ADD CONSTRAINT "analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_action_items"
    ADD CONSTRAINT "assessment_action_items_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."goal_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_action_items"
    ADD CONSTRAINT "assessment_action_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."automation_execution_logs"
    ADD CONSTRAINT "automation_execution_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_execution_logs"
    ADD CONSTRAINT "automation_execution_logs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."automation_workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_workflows"
    ADD CONSTRAINT "automation_workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_goals"
    ADD CONSTRAINT "business_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_health"
    ADD CONSTRAINT "business_health_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."capability_roadmap"
    ADD CONSTRAINT "capability_roadmap_gap_id_fkey" FOREIGN KEY ("gap_id") REFERENCES "public"."capability_gap_analysis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_usage_tracking"
    ADD CONSTRAINT "chat_usage_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_analytics"
    ADD CONSTRAINT "communication_analytics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_analytics"
    ADD CONSTRAINT "communication_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_events"
    ADD CONSTRAINT "communication_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_events"
    ADD CONSTRAINT "communication_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_document_templates"
    ADD CONSTRAINT "company_document_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_document_templates"
    ADD CONSTRAINT "company_document_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_status_snapshots"
    ADD CONSTRAINT "company_status_snapshots_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_status_snapshots"
    ADD CONSTRAINT "company_status_snapshots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."component_usages"
    ADD CONSTRAINT "component_usages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."component_usages"
    ADD CONSTRAINT "component_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credential_audit_log"
    ADD CONSTRAINT "credential_audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."deal"
    ADD CONSTRAINT "deal_company_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."encrypted_credentials"
    ADD CONSTRAINT "encrypted_credentials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."encrypted_credentials"
    ADD CONSTRAINT "encrypted_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_kpi_snapshots"
    ADD CONSTRAINT "fk_ai_kpi_snapshots_kpi" FOREIGN KEY ("org_id", "kpi_key") REFERENCES "public"."ai_ops_kpis"("org_id", "key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."n8n_configurations"
    ADD CONSTRAINT "fk_n8n_configurations_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_activity_mapping"
    ADD CONSTRAINT "goal_activity_mapping_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_activity_mapping"
    ADD CONSTRAINT "goal_activity_mapping_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."business_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_assessments"
    ADD CONSTRAINT "goal_assessments_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."business_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_assessments"
    ADD CONSTRAINT "goal_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_insights"
    ADD CONSTRAINT "goal_insights_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."business_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_insights"
    ADD CONSTRAINT "goal_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_resource_mapping"
    ADD CONSTRAINT "goal_resource_mapping_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."business_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_resource_mapping"
    ADD CONSTRAINT "goal_resource_mapping_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resource_inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_user_alignment"
    ADD CONSTRAINT "goal_user_alignment_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."business_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_user_alignment"
    ADD CONSTRAINT "goal_user_alignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."insight_business_connections"
    ADD CONSTRAINT "insight_business_connections_personal_thought_id_fkey" FOREIGN KEY ("personal_thought_id") REFERENCES "public"."personal_thoughts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_data"
    ADD CONSTRAINT "integration_data_user_integration_id_fkey" FOREIGN KEY ("user_integration_id") REFERENCES "public"."user_integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_ninjarmm_device_data"
    ADD CONSTRAINT "integration_ninjarmm_device_data_user_integration_id_fkey" FOREIGN KEY ("user_integration_id") REFERENCES "public"."user_integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_status"
    ADD CONSTRAINT "integration_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_sync_logs"
    ADD CONSTRAINT "integration_sync_logs_user_integration_id_fkey" FOREIGN KEY ("user_integration_id") REFERENCES "public"."user_integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_webhooks"
    ADD CONSTRAINT "integration_webhooks_user_integration_id_fkey" FOREIGN KEY ("user_integration_id") REFERENCES "public"."user_integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_calendar_events"
    ADD CONSTRAINT "manual_calendar_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_calendar_events"
    ADD CONSTRAINT "manual_calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_contacts"
    ADD CONSTRAINT "manual_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_contacts"
    ADD CONSTRAINT "manual_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_documents"
    ADD CONSTRAINT "manual_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_documents"
    ADD CONSTRAINT "manual_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_emails"
    ADD CONSTRAINT "manual_emails_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_emails"
    ADD CONSTRAINT "manual_emails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_tasks"
    ADD CONSTRAINT "manual_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."manual_tasks"
    ADD CONSTRAINT "manual_tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_tasks"
    ADD CONSTRAINT "manual_tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "public"."manual_tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."manual_tasks"
    ADD CONSTRAINT "manual_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."n8n_workflow_configs"
    ADD CONSTRAINT "n8n_workflow_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."oauth_tokens"
    ADD CONSTRAINT "oauth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_conversations"
    ADD CONSTRAINT "onboarding_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_messages"
    ADD CONSTRAINT "onboarding_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."onboarding_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_messages"
    ADD CONSTRAINT "onboarding_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_thoughts"
    ADD CONSTRAINT "personal_thoughts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Pin"
    ADD CONSTRAINT "pin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Recent"
    ADD CONSTRAINT "recent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resource_inventory"
    ADD CONSTRAINT "resource_inventory_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resource_inventory"
    ADD CONSTRAINT "resource_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."secure_integrations"
    ADD CONSTRAINT "secure_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."security_config"
    ADD CONSTRAINT "security_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."thought_relationships"
    ADD CONSTRAINT "thought_relationships_source_thought_id_fkey" FOREIGN KEY ("source_thought_id") REFERENCES "public"."thoughts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."thought_relationships"
    ADD CONSTRAINT "thought_relationships_target_thought_id_fkey" FOREIGN KEY ("target_thought_id") REFERENCES "public"."thoughts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."thoughts"
    ADD CONSTRAINT "thoughts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."thoughts"
    ADD CONSTRAINT "thoughts_parent_idea_id_fkey" FOREIGN KEY ("parent_idea_id") REFERENCES "public"."thoughts"("id");



ALTER TABLE ONLY "public"."thoughts"
    ADD CONSTRAINT "thoughts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."thoughts"
    ADD CONSTRAINT "thoughts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_billing_plans"
    ADD CONSTRAINT "user_billing_plans_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_billing_plans"
    ADD CONSTRAINT "user_billing_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_context_profiles"
    ADD CONSTRAINT "user_context_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interaction_analysis"
    ADD CONSTRAINT "user_interaction_analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_learning_patterns"
    ADD CONSTRAINT "user_learning_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_licenses"
    ADD CONSTRAINT "user_licenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_onboarding_progress"
    ADD CONSTRAINT "user_onboarding_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_activity"
    ADD CONSTRAINT "workspace_activity_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."workspace_content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_activity"
    ADD CONSTRAINT "workspace_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workspace_activity"
    ADD CONSTRAINT "workspace_activity_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_content"
    ADD CONSTRAINT "workspace_content_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workspace_content"
    ADD CONSTRAINT "workspace_content_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workspace_content"
    ADD CONSTRAINT "workspace_content_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."workspace_content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_content"
    ADD CONSTRAINT "workspace_content_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can view all improvement recommendations" ON "public"."ai_improvement_recommendations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Admins can view all performance metrics" ON "public"."ai_performance_metrics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Allow all operations on ai_assessments" ON "public"."ai_assessments" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert API Learning integrations" ON "public"."integrations" FOR INSERT TO "authenticated" WITH CHECK (("category" = 'api-learning'::"text"));



CREATE POLICY "Allow authenticated users to update API Learning integrations" ON "public"."integrations" FOR UPDATE TO "authenticated" USING (("category" = 'api-learning'::"text")) WITH CHECK (("category" = 'api-learning'::"text"));



CREATE POLICY "Allow reading waitlist stats" ON "public"."waitlist_signups" FOR SELECT USING (true);



CREATE POLICY "Allow users to access their own company's workflow configs" ON "public"."n8n_workflow_configs" FOR SELECT TO "authenticated" USING (("company_id" IN ( SELECT "p"."company_id"
   FROM "public"."user_profiles" "p"
  WHERE ("p"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow users to insert their own company's workflow configs" ON "public"."n8n_workflow_configs" FOR INSERT TO "authenticated" WITH CHECK (("company_id" IN ( SELECT "p"."company_id"
   FROM "public"."user_profiles" "p"
  WHERE ("p"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow users to update own records" ON "public"."waitlist_signups" FOR UPDATE USING ((("auth"."jwt"() ->> 'email'::"text") = "email"));



CREATE POLICY "Allow waitlist signups" ON "public"."waitlist_signups" FOR INSERT WITH CHECK (true);



CREATE POLICY "Assessment questions are manageable by service role" ON "public"."ai_assessment_questions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Assessment questions are readable by authenticated users" ON "public"."ai_assessment_questions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can create companies" ON "public"."companies" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view AI agents" ON "public"."ai_agents" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view AI vector documents" ON "public"."ai_vector_documents" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view action card templates" ON "public"."ai_action_card_templates" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("is_active" = true)));



CREATE POLICY "Authenticated users can view model performance" ON "public"."ai_model_performance" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."Briefing" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Company owners can update company" ON "public"."companies" FOR UPDATE USING (("id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Company users can view financial data" ON "public"."financial_data" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."company_id" = "financial_data"."company_id")))));



CREATE POLICY "Company users can view financial metrics" ON "public"."financial_metrics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."company_id" = "financial_metrics"."company_id")))));



CREATE POLICY "Company users can view projects" ON "public"."projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."company_id" = "projects"."company_id")))));



CREATE POLICY "Company users can view sales deals" ON "public"."sales_deals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."company_id" = "sales_deals"."company_id")))));



ALTER TABLE "public"."Deal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Email" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Everyone can view active integrations" ON "public"."integrations" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Everyone can view available integrations" ON "public"."integrations" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Everyone can view billing plans" ON "public"."billing_plans" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Finance role can manage financial data" ON "public"."financial_data" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."company_id" = "financial_data"."company_id") AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'finance'::"text"]))))));



CREATE POLICY "Finance role can manage financial metrics" ON "public"."financial_metrics" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."company_id" = "financial_metrics"."company_id") AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'finance'::"text"]))))));



ALTER TABLE "public"."KPI" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "No users can select AI audit logs" ON "public"."ai_audit_logs" FOR SELECT USING (false);



ALTER TABLE "public"."Note" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Org isolation" ON "public"."ai_integrations" USING (("org_id" = ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))::"uuid"));



CREATE POLICY "Org isolation" ON "public"."ai_kpi_snapshots" USING (("org_id" = ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))::"uuid"));



CREATE POLICY "Org members can manage their integrations" ON "public"."ai_integrations" USING ((("org_id")::"text" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'org_id'::"text"))) WITH CHECK ((("org_id")::"text" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'org_id'::"text")));



CREATE POLICY "Org-scoped access" ON "public"."ai_ops_kpis" USING ((("org_id")::"text" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'org_id'::"text"))) WITH CHECK ((("org_id")::"text" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'org_id'::"text")));



ALTER TABLE "public"."Pin" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Recent" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Request" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Sales role can manage sales deals" ON "public"."sales_deals" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."company_id" = "sales_deals"."company_id") AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'sales'::"text", 'manager'::"text"]))))));



CREATE POLICY "Service role can insert AI audit logs" ON "public"."ai_audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can manage AI agents" ON "public"."ai_agents" USING (true);



CREATE POLICY "Service role can manage action card templates" ON "public"."ai_action_card_templates" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage ai_embedding_cache" ON "public"."ai_embedding_cache" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage all licenses" ON "public"."user_licenses" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all usage" ON "public"."chat_usage_tracking" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage document processing queue" ON "public"."ai_document_processing_queue" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage knowledge analytics" ON "public"."ai_knowledge_analytics" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage knowledge gaps" ON "public"."ai_knowledge_gaps" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage knowledge relationships" ON "public"."ai_knowledge_relationships" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage stripe events" ON "public"."stripe_events" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage thought vectors" ON "public"."ai_personal_thought_vectors" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "System can create intelligence alerts" ON "public"."ai_client_intelligence_alerts" FOR INSERT WITH CHECK ((("client_profile_id" IN ( SELECT "ai_unified_client_profiles"."id"
   FROM "public"."ai_unified_client_profiles"
  WHERE ("ai_unified_client_profiles"."company_id" = ( SELECT "user_profiles"."company_id"
           FROM "public"."user_profiles"
          WHERE ("user_profiles"."id" = "auth"."uid"()))))) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "System can insert client interactions" ON "public"."ai_client_interactions" FOR INSERT WITH CHECK ((("client_profile_id" IN ( SELECT "ai_unified_client_profiles"."id"
   FROM "public"."ai_unified_client_profiles"
  WHERE ("ai_unified_client_profiles"."company_id" = ( SELECT "user_profiles"."company_id"
           FROM "public"."user_profiles"
          WHERE ("user_profiles"."id" = "auth"."uid"()))))) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "System can insert integration data" ON "public"."integration_data" FOR INSERT WITH CHECK (("user_integration_id" IN ( SELECT "user_integrations"."id"
   FROM "public"."user_integrations"
  WHERE ("user_integrations"."user_id" = "auth"."uid"()))));



CREATE POLICY "System can manage registry" ON "public"."ai_llm_registry" USING (true) WITH CHECK (true);



CREATE POLICY "System can update integration data" ON "public"."integration_data" FOR UPDATE USING (("user_integration_id" IN ( SELECT "user_integrations"."id"
   FROM "public"."user_integrations"
  WHERE ("user_integrations"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."Task" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Ticket" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "User can manage their memberships" ON "public"."user_organizations" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can access their own billing records" ON "public"."ai_billing_records" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can access their own briefings" ON "public"."Briefing" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can access their own budget tracking" ON "public"."ai_budget_tracking" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can access their own cost allocations" ON "public"."ai_cost_allocations" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can access their own deals" ON "public"."Deal" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can access their own emails" ON "public"."Email" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can access their own kpis" ON "public"."KPI" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can access their own notes" ON "public"."Note" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can access their own requests" ON "public"."Request" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can access their own tasks" ON "public"."Task" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can access their own tickets" ON "public"."Ticket" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can access their own widget events" ON "public"."WidgetEvent" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can add to document processing queue" ON "public"."ai_document_processing_queue" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("company_id" = ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can create client profiles for their company" ON "public"."ai_unified_client_profiles" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("company_id" = ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can create company status snapshots for their company" ON "public"."company_status_snapshots" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can create content in their workspaces" ON "public"."workspace_content" FOR INSERT WITH CHECK (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create knowledge cards" ON "public"."ai_knowledge_cards" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("company_id" = ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can create own activity" ON "public"."user_activity" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create workspaces for their company" ON "public"."workspaces" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own AI action cards" ON "public"."ai_action_cards" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "ac"
  WHERE (("ac"."id" = "ai_action_cards"."conversation_id") AND ("ac"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own AI conversations" ON "public"."ai_conversations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own AI messages" ON "public"."ai_messages" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own ai company profiles" ON "public"."ai_company_profiles" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own ai email accounts" ON "public"."ai_email_accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own ai integrations oauth" ON "public"."ai_integrations_oauth" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own component usages" ON "public"."component_usages" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own conversations" ON "public"."conversations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own insight connections" ON "public"."insight_business_connections" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."personal_thoughts" "pt"
  WHERE (("pt"."id" = "insight_business_connections"."personal_thought_id") AND ("pt"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own integrations" ON "public"."user_integrations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own messages" ON "public"."chat_messages" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own n8n configurations" ON "public"."n8n_configurations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own oauth tokens" ON "public"."oauth_tokens" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own passkeys" ON "public"."ai_passkeys" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own personal thoughts" ON "public"."personal_thoughts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own pins" ON "public"."Pin" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own recent items" ON "public"."Recent" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own sessions" ON "public"."chat_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own thoughts" ON "public"."thoughts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their inbox item folder associations" ON "public"."ai_inbox_item_folders" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."ai_inbox_items"
  WHERE (("ai_inbox_items"."id" = "ai_inbox_item_folders"."inbox_item_id") AND ("ai_inbox_items"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own action cards" ON "public"."action_cards" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own activities" ON "public"."activities" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own assessment action items" ON "public"."assessment_action_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."goal_assessments"
  WHERE (("goal_assessments"."id" = "assessment_action_items"."assessment_id") AND ("goal_assessments"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own automation workflows" ON "public"."automation_workflows" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own business goals" ON "public"."business_goals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own calendar events" ON "public"."manual_calendar_events" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own contacts" ON "public"."manual_contacts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own documents" ON "public"."manual_documents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own emails" ON "public"."manual_emails" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own goal activity mappings" ON "public"."goal_activity_mapping" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."business_goals"
  WHERE (("business_goals"."id" = "goal_activity_mapping"."goal_id") AND ("business_goals"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own goal assessments" ON "public"."goal_assessments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own goal resource mappings" ON "public"."goal_resource_mapping" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."business_goals"
  WHERE (("business_goals"."id" = "goal_resource_mapping"."goal_id") AND ("business_goals"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own inbox folders" ON "public"."ai_inbox_folders" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own inbox items" ON "public"."ai_inbox_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own inbox rules" ON "public"."ai_inbox_rules" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own resources" ON "public"."resource_inventory" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own tasks" ON "public"."manual_tasks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own thoughts" ON "public"."thoughts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert companies" ON "public"."companies" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert inbox item folder associations for their items" ON "public"."ai_inbox_item_folders" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."ai_inbox_items"
  WHERE (("ai_inbox_items"."id" = "ai_inbox_item_folders"."inbox_item_id") AND ("ai_inbox_items"."user_id" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."ai_inbox_folders"
  WHERE (("ai_inbox_folders"."id" = "ai_inbox_item_folders"."folder_id") AND ("ai_inbox_folders"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert messages into own conversations" ON "public"."chat_messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE ("conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own AI action card events" ON "public"."ai_action_card_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own AI action cards" ON "public"."ai_action_cards" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "ac"
  WHERE (("ac"."id" = "ai_action_cards"."conversation_id") AND ("ac"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own AI conversations" ON "public"."ai_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own AI interactions" ON "public"."ai_interactions" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."company_id" = "ai_interactions"."company_id"))))));



CREATE POLICY "Users can insert own AI messages" ON "public"."ai_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own AI usage" ON "public"."ai_model_usage" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own activity" ON "public"."ai_user_activity" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own ai company profiles" ON "public"."ai_company_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own ai email accounts" ON "public"."ai_email_accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own ai integrations oauth" ON "public"."ai_integrations_oauth" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own component usages" ON "public"."component_usages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own conversations" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own feedback" ON "public"."ai_message_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own insight connections" ON "public"."insight_business_connections" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."personal_thoughts" "pt"
  WHERE (("pt"."id" = "insight_business_connections"."personal_thought_id") AND ("pt"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own integrations" ON "public"."user_integrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own n8n configurations" ON "public"."n8n_configurations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own oauth tokens" ON "public"."oauth_tokens" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own onboarding conversations" ON "public"."onboarding_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own onboarding messages" ON "public"."onboarding_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own onboarding progress" ON "public"."user_onboarding_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own outcomes" ON "public"."ai_success_outcomes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own passkeys" ON "public"."ai_passkeys" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own personal thoughts" ON "public"."personal_thoughts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own pins" ON "public"."Pin" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can insert own recent items" ON "public"."Recent" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own revenue metrics" ON "public"."ai_revenue_metrics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own sales metrics" ON "public"."ai_sales_metrics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own sessions" ON "public"."chat_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own subscription metrics" ON "public"."ai_subscription_metrics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own thoughts" ON "public"."thoughts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own A/B test results" ON "public"."ai_ab_test_results" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own action cards" ON "public"."action_cards" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own activities" ON "public"."activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own analytics" ON "public"."analytics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own assessment action items" ON "public"."assessment_action_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."goal_assessments"
  WHERE (("goal_assessments"."id" = "assessment_action_items"."assessment_id") AND ("goal_assessments"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own automation logs" ON "public"."automation_execution_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own automation workflows" ON "public"."automation_workflows" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own business goals" ON "public"."business_goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own business profile" ON "public"."ai_business_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own calendar events" ON "public"."manual_calendar_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own communication analytics" ON "public"."communication_analytics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own communication events" ON "public"."communication_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own component usage" ON "public"."component_usages" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR ("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own contacts" ON "public"."manual_contacts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own cost allocations" ON "public"."ai_cost_allocations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own documents" ON "public"."manual_documents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own emails" ON "public"."manual_emails" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own feedback" ON "public"."ai_user_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own goal activity mappings" ON "public"."goal_activity_mapping" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."business_goals"
  WHERE (("business_goals"."id" = "goal_activity_mapping"."goal_id") AND ("business_goals"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own goal assessments" ON "public"."goal_assessments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own goal insights" ON "public"."goal_insights" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own goal resource mappings" ON "public"."goal_resource_mapping" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."business_goals"
  WHERE (("business_goals"."id" = "goal_resource_mapping"."goal_id") AND ("business_goals"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own inbox folders" ON "public"."ai_inbox_folders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own inbox items" ON "public"."ai_inbox_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own inbox rules" ON "public"."ai_inbox_rules" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own resources" ON "public"."resource_inventory" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own tasks" ON "public"."manual_tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own thoughts" ON "public"."thoughts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own budget tracking" ON "public"."ai_budget_tracking" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own integration status" ON "public"."integration_status" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own integrations" ON "public"."user_integrations" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own optimization suggestions" ON "public"."ai_optimization_suggestions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own passkey challenges" ON "public"."ai_passkey_challenges" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own thought relationships" ON "public"."thought_relationships" USING ((EXISTS ( SELECT 1
   FROM "public"."thoughts"
  WHERE (("thoughts"."id" = "thought_relationships"."source_thought_id") AND ("thoughts"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage own webhooks" ON "public"."integration_webhooks" USING (("user_integration_id" IN ( SELECT "user_integrations"."id"
   FROM "public"."user_integrations"
  WHERE ("user_integrations"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can read organizations they belong to" ON "public"."organizations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_organizations" "uo"
  WHERE (("uo"."org_id" = "organizations"."id") AND ("uo"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read their integration data" ON "public"."integration_data" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_integrations" "ui"
  WHERE (("ui"."id" = "integration_data"."user_integration_id") AND ("ui"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read their own business profile" ON "public"."ai_business_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update alerts assigned to them" ON "public"."ai_client_intelligence_alerts" FOR UPDATE USING ((("assigned_to" = "auth"."uid"()) OR ("user_id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can update client profiles in their company" ON "public"."ai_unified_client_profiles" FOR UPDATE USING ((("company_id" = ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"()))) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can update content they created or in workspaces they adm" ON "public"."workspace_content" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR ("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."user_id" = "auth"."uid"()) AND ("workspace_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "Users can update own AI action cards" ON "public"."ai_action_cards" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "ac"
  WHERE (("ac"."id" = "ai_action_cards"."conversation_id") AND ("ac"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own AI conversations" ON "public"."ai_conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own AI messages" ON "public"."ai_messages" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own ai company profiles" ON "public"."ai_company_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own ai email accounts" ON "public"."ai_email_accounts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own ai integrations oauth" ON "public"."ai_integrations_oauth" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own companies" ON "public"."companies" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can update own component usages" ON "public"."component_usages" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own conversations" ON "public"."conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own feedback" ON "public"."ai_message_feedback" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own insight connections" ON "public"."insight_business_connections" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."personal_thoughts" "pt"
  WHERE (("pt"."id" = "insight_business_connections"."personal_thought_id") AND ("pt"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own integrations" ON "public"."user_integrations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own messages" ON "public"."chat_messages" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own n8n configurations" ON "public"."n8n_configurations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own oauth tokens" ON "public"."oauth_tokens" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own onboarding conversations" ON "public"."onboarding_conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own onboarding progress" ON "public"."user_onboarding_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own outcomes" ON "public"."ai_success_outcomes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own personal thoughts" ON "public"."personal_thoughts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own pins" ON "public"."Pin" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update own recent items" ON "public"."Recent" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own sessions" ON "public"."chat_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own thoughts" ON "public"."thoughts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their inbox item folder associations" ON "public"."ai_inbox_item_folders" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."ai_inbox_items"
  WHERE (("ai_inbox_items"."id" = "ai_inbox_item_folders"."inbox_item_id") AND ("ai_inbox_items"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their knowledge cards" ON "public"."ai_knowledge_cards" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can update their own action cards" ON "public"."action_cards" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own activities" ON "public"."activities" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own assessment action items" ON "public"."assessment_action_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."goal_assessments"
  WHERE (("goal_assessments"."id" = "assessment_action_items"."assessment_id") AND ("goal_assessments"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own automation workflows" ON "public"."automation_workflows" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own business goals" ON "public"."business_goals" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own business profile" ON "public"."ai_business_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own calendar events" ON "public"."manual_calendar_events" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own communication analytics" ON "public"."communication_analytics" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own contacts" ON "public"."manual_contacts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own context profiles" ON "public"."user_context_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own documents" ON "public"."manual_documents" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own emails" ON "public"."manual_emails" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own goal activity mappings" ON "public"."goal_activity_mapping" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."business_goals"
  WHERE (("business_goals"."id" = "goal_activity_mapping"."goal_id") AND ("business_goals"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own goal assessments" ON "public"."goal_assessments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own goal resource mappings" ON "public"."goal_resource_mapping" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."business_goals"
  WHERE (("business_goals"."id" = "goal_resource_mapping"."goal_id") AND ("business_goals"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own inbox folders" ON "public"."ai_inbox_folders" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own inbox items" ON "public"."ai_inbox_items" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own inbox rules" ON "public"."ai_inbox_rules" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own licenses" ON "public"."user_licenses" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own resources" ON "public"."resource_inventory" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own tasks" ON "public"."manual_tasks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own thoughts" ON "public"."thoughts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own usage" ON "public"."chat_usage_tracking" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view alerts for their company" ON "public"."ai_client_intelligence_alerts" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("client_profile_id" IN ( SELECT "ai_unified_client_profiles"."id"
   FROM "public"."ai_unified_client_profiles"
  WHERE ("ai_unified_client_profiles"."company_id" = ( SELECT "user_profiles"."company_id"
           FROM "public"."user_profiles"
          WHERE ("user_profiles"."id" = "auth"."uid"()))))) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can view billing plans" ON "public"."billing_plans" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can view client profiles in their company" ON "public"."ai_unified_client_profiles" FOR SELECT USING ((("company_id" = ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"()))) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can view company status snapshots for their company" ON "public"."company_status_snapshots" FOR SELECT USING (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view content in their workspaces" ON "public"."workspace_content" FOR SELECT USING (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view document templates for their company" ON "public"."company_document_templates" FOR SELECT USING (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view interactions for their company clients" ON "public"."ai_client_interactions" FOR SELECT USING ((("client_profile_id" IN ( SELECT "ai_unified_client_profiles"."id"
   FROM "public"."ai_unified_client_profiles"
  WHERE ("ai_unified_client_profiles"."company_id" = ( SELECT "user_profiles"."company_id"
           FROM "public"."user_profiles"
          WHERE ("user_profiles"."id" = "auth"."uid"()))))) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can view knowledge analytics for their company" ON "public"."ai_knowledge_analytics" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can view knowledge cards in their company" ON "public"."ai_knowledge_cards" FOR SELECT USING ((("company_id" = ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"()))) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can view knowledge gaps in their company" ON "public"."ai_knowledge_gaps" FOR SELECT USING ((("department" IN ( SELECT "unnest"("string_to_array"(COALESCE(( SELECT "user_profiles"."role"
           FROM "public"."user_profiles"
          WHERE ("user_profiles"."id" = "auth"."uid"())), ''::"text"), ','::"text")) AS "unnest")) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can view knowledge relationships in their company" ON "public"."ai_knowledge_relationships" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."ai_knowledge_cards" "kc"
  WHERE (("kc"."id" = "ai_knowledge_relationships"."source_card_id") AND ("kc"."company_id" = ( SELECT "user_profiles"."company_id"
           FROM "public"."user_profiles"
          WHERE ("user_profiles"."id" = "auth"."uid"())))))) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can view messages from own conversations" ON "public"."chat_messages" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE ("conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view models for their own company" ON "public"."ai_llm_registry" FOR SELECT TO "authenticated" USING (("company_id" = ( SELECT "private"."get_company_id_from_user_id"("auth"."uid"()) AS "get_company_id_from_user_id")));



CREATE POLICY "Users can view own AI action card events" ON "public"."ai_action_card_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own AI action cards" ON "public"."ai_action_cards" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "ac"
  WHERE (("ac"."id" = "ai_action_cards"."conversation_id") AND ("ac"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own AI conversations" ON "public"."ai_conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own AI insights" ON "public"."ai_insights" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own AI interactions" ON "public"."ai_interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own AI messages" ON "public"."ai_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own AI usage" ON "public"."ai_model_usage" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own activity" ON "public"."ai_user_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own activity" ON "public"."user_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own ai company profiles" ON "public"."ai_company_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own ai email accounts" ON "public"."ai_email_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own ai integrations oauth" ON "public"."ai_integrations_oauth" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own billing plan" ON "public"."user_billing_plans" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own budget tracking" ON "public"."ai_budget_tracking" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own business health" ON "public"."business_health" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own companies" ON "public"."companies" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can view own component usages" ON "public"."component_usages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own conversations" ON "public"."conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own feedback" ON "public"."ai_message_feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own insight connections" ON "public"."insight_business_connections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."personal_thoughts" "pt"
  WHERE (("pt"."id" = "insight_business_connections"."personal_thought_id") AND ("pt"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own integration data" ON "public"."integration_data" FOR SELECT USING (("user_integration_id" IN ( SELECT "user_integrations"."id"
   FROM "public"."user_integrations"
  WHERE ("user_integrations"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own integrations" ON "public"."user_integrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own metrics" ON "public"."ai_metrics_daily" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own model usage" ON "public"."ai_model_usage" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own n8n configurations" ON "public"."n8n_configurations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own oauth tokens" ON "public"."oauth_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own onboarding conversations" ON "public"."onboarding_conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own onboarding messages" ON "public"."onboarding_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own onboarding progress" ON "public"."user_onboarding_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own optimization suggestions" ON "public"."ai_optimization_suggestions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own outcomes" ON "public"."ai_success_outcomes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own passkeys" ON "public"."ai_passkeys" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own personal thoughts" ON "public"."personal_thoughts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own pins" ON "public"."Pin" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view own recent items" ON "public"."Recent" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own revenue metrics" ON "public"."ai_revenue_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own sales metrics" ON "public"."ai_sales_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own sessions" ON "public"."chat_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own subscription metrics" ON "public"."ai_subscription_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own sync logs" ON "public"."integration_sync_logs" FOR SELECT USING (("user_integration_id" IN ( SELECT "user_integrations"."id"
   FROM "public"."user_integrations"
  WHERE ("user_integrations"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own thought relationships" ON "public"."thought_relationships" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."thoughts"
  WHERE (("thoughts"."id" = "thought_relationships"."source_thought_id") AND ("thoughts"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own thought vectors" ON "public"."ai_personal_thought_vectors" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."personal_thoughts" "pt"
  WHERE (("pt"."id" = "ai_personal_thought_vectors"."thought_id") AND ("pt"."user_id" = "auth"."uid"())))) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can view own thoughts" ON "public"."thoughts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own webhooks" ON "public"."integration_webhooks" FOR SELECT USING (("user_integration_id" IN ( SELECT "user_integrations"."id"
   FROM "public"."user_integrations"
  WHERE ("user_integrations"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view sync logs" ON "public"."integration_sync_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_integrations" "ui"
  WHERE (("ui"."id" = "integration_sync_logs"."user_integration_id") AND ("ui"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their company" ON "public"."companies" FOR SELECT USING (("id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view their document processing queue" ON "public"."ai_document_processing_queue" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "Users can view their inbox item folder associations" ON "public"."ai_inbox_item_folders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ai_inbox_items"
  WHERE (("ai_inbox_items"."id" = "ai_inbox_item_folders"."inbox_item_id") AND ("ai_inbox_items"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their integrations" ON "public"."user_integrations" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own A/B test results" ON "public"."ai_ab_test_results" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own action cards" ON "public"."action_cards" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own activities" ON "public"."activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own analytics" ON "public"."analytics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own assessment action items" ON "public"."assessment_action_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."goal_assessments"
  WHERE (("goal_assessments"."id" = "assessment_action_items"."assessment_id") AND ("goal_assessments"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own automation logs" ON "public"."automation_execution_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own automation workflows" ON "public"."automation_workflows" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own billing plan" ON "public"."user_billing_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own billing records" ON "public"."ai_billing_records" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own business goals" ON "public"."business_goals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own calendar events" ON "public"."manual_calendar_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own communication analytics" ON "public"."communication_analytics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own communication events" ON "public"."communication_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own component usage" ON "public"."component_usages" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own contacts" ON "public"."manual_contacts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own context profiles" ON "public"."user_context_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own cost allocations" ON "public"."ai_cost_allocations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own documents" ON "public"."manual_documents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own emails" ON "public"."manual_emails" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own feedback" ON "public"."ai_user_feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own goal activity mappings" ON "public"."goal_activity_mapping" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."business_goals"
  WHERE (("business_goals"."id" = "goal_activity_mapping"."goal_id") AND ("business_goals"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own goal alignments" ON "public"."goal_user_alignment" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own goal assessments" ON "public"."goal_assessments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own goal insights" ON "public"."goal_insights" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own goal resource mappings" ON "public"."goal_resource_mapping" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."business_goals"
  WHERE (("business_goals"."id" = "goal_resource_mapping"."goal_id") AND ("business_goals"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own inbox folders" ON "public"."ai_inbox_folders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own inbox items" ON "public"."ai_inbox_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own inbox rules" ON "public"."ai_inbox_rules" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own interaction analysis" ON "public"."user_interaction_analysis" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own learning patterns" ON "public"."user_learning_patterns" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own licenses" ON "public"."user_licenses" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own or company resources" ON "public"."resource_inventory" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own quality assessments" ON "public"."ai_quality_assessments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ai_user_feedback"
  WHERE (("ai_user_feedback"."conversation_id" = "ai_quality_assessments"."conversation_id") AND ("ai_user_feedback"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own tasks" ON "public"."manual_tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own thoughts" ON "public"."thoughts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own usage" ON "public"."chat_usage_tracking" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view workspace members for their workspaces" ON "public"."workspace_members" FOR SELECT USING (("workspace_id" IN ( SELECT "workspace_members_1"."workspace_id"
   FROM "public"."workspace_members" "workspace_members_1"
  WHERE ("workspace_members_1"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view workspaces they are members of" ON "public"."workspaces" FOR SELECT USING ((("id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))) OR (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "auth"."uid"()))) AND ("is_private" = false))));



ALTER TABLE "public"."WidgetEvent" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Workspace owners and admins can manage members" ON "public"."workspace_members" FOR INSERT WITH CHECK (("workspace_id" IN ( SELECT "workspace_members_1"."workspace_id"
   FROM "public"."workspace_members" "workspace_members_1"
  WHERE (("workspace_members_1"."user_id" = "auth"."uid"()) AND ("workspace_members_1"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Workspace owners and admins can update workspaces" ON "public"."workspaces" FOR UPDATE USING (("id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."user_id" = "auth"."uid"()) AND ("workspace_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."action_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_ab_test_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_action_card_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_action_card_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_action_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_assessment_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_billing_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_budget_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_business_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_client_intelligence_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_client_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_company_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_cost_allocations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_document_processing_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_email_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_embedding_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_improvement_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_inbox_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_inbox_item_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_inbox_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_inbox_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_integrations_oauth" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_knowledge_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_knowledge_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_knowledge_gaps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_knowledge_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_kpi_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_learning_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_llm_registry" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_message_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_metrics_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_model_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_operations_docs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_ops_kpis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_optimization_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_passkey_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_passkeys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_personal_thought_vectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_quality_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_revenue_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_sales_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_subscription_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_success_outcomes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_unified_client_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_user_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_vector_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_action_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_user_access" ON "public"."security_audit_log" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



ALTER TABLE "public"."automation_execution_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "block_all" ON "public"."marketing_campaigns" USING (false);



CREATE POLICY "block_all" ON "public"."marketing_leads" USING (false);



CREATE POLICY "block_all" ON "public"."sales_performance" USING (false);



CREATE POLICY "block_all" ON "public"."sales_pipeline" USING (false);



CREATE POLICY "block_all" ON "public"."support_tickets" USING (false);



CREATE POLICY "block_all" ON "public"."team_capacity" USING (false);



CREATE POLICY "block_all" ON "public"."website_analytics" USING (false);



ALTER TABLE "public"."business_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_health" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_messages_isolation" ON "public"."chat_messages" USING ((("auth"."uid"() = "user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



ALTER TABLE "public"."chat_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_usage_isolation" ON "public"."chat_usage_tracking" USING ((("auth"."uid"() = "user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



ALTER TABLE "public"."chat_usage_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communication_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communication_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company-scope-insert" ON "public"."deal" FOR INSERT WITH CHECK ((("company_id")::"text" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'company_id'::"text")));



CREATE POLICY "company-scope-insert" ON "public"."model_usage" FOR INSERT WITH CHECK (("company_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'company_id'::"text")));



CREATE POLICY "company-scope-select" ON "public"."deal" FOR SELECT USING ((("company_id")::"text" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'company_id'::"text")));



CREATE POLICY "company-scope-select" ON "public"."model_usage" FOR SELECT USING (("company_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'company_id'::"text")));



CREATE POLICY "company-scope-update" ON "public"."deal" FOR UPDATE USING ((("company_id")::"text" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'company_id'::"text")));



CREATE POLICY "company-scope-update" ON "public"."model_usage" FOR UPDATE USING (("company_id" = (("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'company_id'::"text")));



ALTER TABLE "public"."company_document_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_status_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."component_usages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_isolation" ON "public"."conversations" USING ((("auth"."uid"() = "user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



ALTER TABLE "public"."deal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "documents_block_all" ON "public"."documents" USING (false);



ALTER TABLE "public"."financial_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_activity_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_resource_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_user_alignment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insight_business_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_sync_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_webhooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integrations_isolation" ON "public"."secure_integrations" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."manual_calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketing_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketing_leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."model_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."n8n_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."n8n_workflow_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oauth_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ops_action_queue" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org-scope" ON "public"."ai_operations_docs" USING ((("org_id" IS NULL) OR ("org_id" = ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))::"uuid")));



CREATE POLICY "org-scope" ON "public"."ops_action_queue" USING (("org_id" = ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'org_id'::"text"))::"uuid"));



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_thoughts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read only after deprecation" ON "public"."chat_messages" FOR SELECT USING (true);



ALTER TABLE "public"."resource_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_deals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_performance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_pipeline" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."secure_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_config_admin_only" ON "public"."security_config" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."stripe_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_capacity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."thought_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."thoughts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "thoughts_isolation" ON "public"."thoughts" USING ((("auth"."uid"() = "user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



ALTER TABLE "public"."user_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_billing_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_context_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_interaction_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_learning_patterns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_licenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_licenses_isolation" ON "public"."user_licenses" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."id" = "user_licenses"."user_id")))));



ALTER TABLE "public"."user_onboarding_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profiles_isolation" ON "public"."user_profiles" USING ((("auth"."uid"() = "id") OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text")));



CREATE POLICY "users_can_insert_learning_events" ON "public"."ai_learning_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_can_view_own_learning_events" ON "public"."ai_learning_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."waitlist_signups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."website_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Pin";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Recent";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."companies";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";










































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."analyze_ab_test"("test_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."analyze_ab_test"("test_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."analyze_ab_test"("test_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_inbox_rules"("p_inbox_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_inbox_rules"("p_inbox_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_inbox_rules"("p_inbox_item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_waitlist_position"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_waitlist_position"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_waitlist_position"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calc_ops_score"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calc_ops_score"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calc_ops_score"("p_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_migration_status"("migration_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_migration_status"("migration_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_migration_status"("migration_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rls_security"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_rls_security"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rls_security"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_user_onboarding"("user_uuid" "uuid", "onboarding_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_user_onboarding"("user_uuid" "uuid", "onboarding_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_user_onboarding"("user_uuid" "uuid", "onboarding_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."conversations_with_messages"("limit_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."conversations_with_messages"("limit_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."conversations_with_messages"("limit_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_inbox_folders"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_inbox_folders"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_inbox_folders"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_sensitive_data"("encrypted_data" "text", "encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data"("data" "text", "encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data"("data" "text", "encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_sensitive_data"("data" "text", "encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_billing_analytics"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_billing_analytics"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_billing_analytics"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_referral_code"("email_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"("email_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"("email_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ai_budget_status"("user_uuid" "uuid", "target_month" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_budget_status"("user_uuid" "uuid", "target_month" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_budget_status"("user_uuid" "uuid", "target_month" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ai_model_analytics"("user_uuid" "uuid", "days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_model_analytics"("user_uuid" "uuid", "days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_model_analytics"("user_uuid" "uuid", "days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_business_health"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_business_health"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_business_health"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_business_health_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_business_health_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_business_health_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_engagement_summary"("company_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_engagement_summary"("company_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_engagement_summary"("company_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_communication_health_score"("p_user_id" "uuid", "p_days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_communication_health_score"("p_user_id" "uuid", "p_days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_communication_health_score"("p_user_id" "uuid", "p_days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cost_allocation_breakdown"("user_id_param" "uuid", "start_date" timestamp with time zone, "end_date" timestamp with time zone, "group_by_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_cost_allocation_breakdown"("user_id_param" "uuid", "start_date" timestamp with time zone, "end_date" timestamp with time zone, "group_by_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cost_allocation_breakdown"("user_id_param" "uuid", "start_date" timestamp with time zone, "end_date" timestamp with time zone, "group_by_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_demo_business_health_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_demo_business_health_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_demo_business_health_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inbox_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_inbox_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inbox_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inbox_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_jwt_claims"("uid" "uuid", "email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_jwt_claims"("uid" "uuid", "email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_jwt_claims"("uid" "uuid", "email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_onboarding_progress"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_onboarding_progress"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_onboarding_progress"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_performance_trends"("metric_name" "text", "timeframe_type" "text", "agent_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_performance_trends"("metric_name" "text", "timeframe_type" "text", "agent_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_performance_trends"("metric_name" "text", "timeframe_type" "text", "agent_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_personal_context_for_ai"("user_uuid" "uuid", "business_context_filter" "jsonb", "recent_days" integer, "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_personal_context_for_ai"("user_uuid" "uuid", "business_context_filter" "jsonb", "recent_days" integer, "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_personal_context_for_ai"("user_uuid" "uuid", "business_context_filter" "jsonb", "recent_days" integer, "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_platform_comparison"("p_user_id" "uuid", "p_days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_platform_comparison"("p_user_id" "uuid", "p_days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_platform_comparison"("p_user_id" "uuid", "p_days_back" integer) TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_learning_events" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_learning_events" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_learning_events" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_learning_events"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_learning_events"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_learning_events"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_scheduled_syncs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_scheduled_syncs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_scheduled_syncs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_client_opportunities"("company_uuid" "uuid", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_client_opportunities"("company_uuid" "uuid", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_client_opportunities"("company_uuid" "uuid", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_billing_status"("p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_billing_status"("p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_billing_status"("p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_integration_analytics"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_integration_analytics"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_integration_analytics"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_integration_details"("user_integration_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_integration_details"("user_integration_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_integration_details"("user_integration_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_quota_status"("p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_quota_status"("p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_quota_status"("p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_with_company"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_with_company"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_with_company"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_assessment_response_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_assessment_response_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_assessment_response_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment"("x" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."increment"("x" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment"("x" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_learning_event"("p_event_type" "text", "p_data" "jsonb", "p_context" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_learning_event"("p_event_type" "text", "p_data" "jsonb", "p_context" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_learning_event"("p_event_type" "text", "p_data" "jsonb", "p_context" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_event_type" "text", "p_event_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_event_type" "text", "p_event_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_event_type" "text", "p_event_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_inbox_items_read"("p_user_id" "uuid", "p_item_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_inbox_items_read"("p_user_id" "uuid", "p_item_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_inbox_items_read"("p_user_id" "uuid", "p_item_ids" "uuid"[]) TO "service_role";












GRANT ALL ON FUNCTION "public"."record_business_health_snapshot"("p_user_id" "uuid", "p_overall_score" integer, "p_connected_sources" integer, "p_verified_sources" integer, "p_category_scores" "jsonb", "p_data_quality_score" integer, "p_completion_percentage" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."record_business_health_snapshot"("p_user_id" "uuid", "p_overall_score" integer, "p_connected_sources" integer, "p_verified_sources" integer, "p_category_scores" "jsonb", "p_data_quality_score" integer, "p_completion_percentage" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_business_health_snapshot"("p_user_id" "uuid", "p_overall_score" integer, "p_connected_sources" integer, "p_verified_sources" integer, "p_category_scores" "jsonb", "p_data_quality_score" integer, "p_completion_percentage" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_communication_event"("p_user_id" "uuid", "p_company_id" "uuid", "p_platform" "text", "p_event_type" "text", "p_event_data" "jsonb", "p_channel_id" "text", "p_message_id" "text", "p_timestamp" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."record_communication_event"("p_user_id" "uuid", "p_company_id" "uuid", "p_platform" "text", "p_event_type" "text", "p_event_data" "jsonb", "p_channel_id" "text", "p_message_id" "text", "p_timestamp" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_communication_event"("p_user_id" "uuid", "p_company_id" "uuid", "p_platform" "text", "p_event_type" "text", "p_event_data" "jsonb", "p_channel_id" "text", "p_message_id" "text", "p_timestamp" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_migration_check"("migration_name" "text", "check_type" "text", "target_name" "text", "status" "text", "notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_migration_check"("migration_name" "text", "check_type" "text", "target_name" "text", "status" "text", "notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_migration_check"("migration_name" "text", "check_type" "text", "target_name" "text", "status" "text", "notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_mv_paypal_txns"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_mv_paypal_txns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_mv_paypal_txns"() TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_kpi_snapshots" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_kpi_snapshots" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_kpi_snapshots" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mv_paypal_txns" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mv_paypal_txns" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mv_paypal_txns" TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_list_paypal_txns"("p_org" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_list_paypal_txns"("p_org" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_list_paypal_txns"("p_org" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_add_column"("table_name" "text", "column_name" "text", "column_definition" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_add_column"("table_name" "text", "column_name" "text", "column_definition" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_add_column"("table_name" "text", "column_name" "text", "column_definition" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_add_constraint"("table_name" "text", "constraint_name" "text", "constraint_definition" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_add_constraint"("table_name" "text", "constraint_name" "text", "constraint_definition" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_add_constraint"("table_name" "text", "constraint_name" "text", "constraint_definition" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_create_index"("index_name" "text", "table_name" "text", "index_definition" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_create_index"("index_name" "text", "table_name" "text", "index_definition" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_create_index"("index_name" "text", "table_name" "text", "index_definition" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_create_table"("table_name" "text", "table_definition" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_create_table"("table_name" "text", "table_definition" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_create_table"("table_name" "text", "table_definition" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_personal_thoughts"("query_text" "text", "user_uuid" "uuid", "category_filter" "text", "business_context_filter" "jsonb", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_personal_thoughts"("query_text" "text", "user_uuid" "uuid", "category_filter" "text", "business_context_filter" "jsonb", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_personal_thoughts"("query_text" "text", "user_uuid" "uuid", "category_filter" "text", "business_context_filter" "jsonb", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_daily_usage"("p_user_id" "text", "p_message_count" integer, "p_ai_requests" integer, "p_files_uploaded" integer, "p_tokens_used" integer, "p_estimated_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."track_daily_usage"("p_user_id" "text", "p_message_count" integer, "p_ai_requests" integer, "p_files_uploaded" integer, "p_tokens_used" integer, "p_estimated_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_daily_usage"("p_user_id" "text", "p_message_count" integer, "p_ai_requests" integer, "p_files_uploaded" integer, "p_tokens_used" integer, "p_estimated_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."track_performance_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_performance_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_performance_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_apply_inbox_rules"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_apply_inbox_rules"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_apply_inbox_rules"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_folder_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_folder_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_folder_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_action_cards_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_action_cards_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_action_cards_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_budget_tracking"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_budget_tracking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_budget_tracking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_model_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_model_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_model_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_assessment_scores"("target_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_assessment_scores"("target_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_assessment_scores"("target_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_billing_tracking"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_billing_tracking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_billing_tracking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_client_profile_search_vector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_client_profile_search_vector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_client_profile_search_vector"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_folder_item_count"("p_folder_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_folder_item_count"("p_folder_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_folder_item_count"("p_folder_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_parent_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_parent_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_parent_progress"() TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."thoughts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."thoughts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."thoughts" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_thought_with_workspace_data"("thought_id" "uuid", "new_department" character varying, "new_priority" character varying, "new_estimated_effort" character varying, "new_ai_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_thought_with_workspace_data"("thought_id" "uuid", "new_department" character varying, "new_priority" character varying, "new_estimated_effort" character varying, "new_ai_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_thought_with_workspace_data"("thought_id" "uuid", "new_department" character varying, "new_priority" character varying, "new_estimated_effort" character varying, "new_ai_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_thoughts_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_thoughts_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_thoughts_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_needs_onboarding"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_needs_onboarding"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_needs_onboarding"("user_uuid" "uuid") TO "service_role";

































GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AIModel" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AIModel" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AIModel" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Account" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Account" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Account" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentCategory" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentCategory" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentCategory" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentCategoryScore" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentCategoryScore" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentCategoryScore" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentQuestion" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentQuestion" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentQuestion" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentResponse" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentResponse" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentResponse" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentSummary" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentSummary" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."AssessmentSummary" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Briefing" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Briefing" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Briefing" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Company" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Company" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Company" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Contact" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Contact" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Contact" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Deal" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Deal" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Deal" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Email" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Email" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Email" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Integration" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Integration" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Integration" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."KPI" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."KPI" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."KPI" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ModelPerformance" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ModelPerformance" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ModelPerformance" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ModelUsage" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ModelUsage" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ModelUsage" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Note" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Note" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Note" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Offer" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Offer" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Offer" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Pin" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Pin" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Pin" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Recent" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Recent" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Recent" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Request" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Request" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Request" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Session" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Session" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Session" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Task" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Task" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Task" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Ticket" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Ticket" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."Ticket" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."User" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."User" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."User" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."UserProfile" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."UserProfile" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."UserProfile" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."VARLead" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."VARLead" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."VARLead" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."VerificationToken" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."VerificationToken" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."VerificationToken" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."WidgetEvent" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."WidgetEvent" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."WidgetEvent" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."action_cards" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."action_cards" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."action_cards" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."activities" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."activities" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."activities" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_ab_test_results" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_ab_test_results" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_ab_test_results" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_action_card_events" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_action_card_events" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_action_card_events" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_action_card_templates" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_action_card_templates" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_action_card_templates" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_action_cards" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_action_cards" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_action_cards" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_agents" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_agents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_agents" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_assessment_questions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_assessment_questions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_assessment_questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_assessment_questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_assessment_questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_assessment_questions_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_assessments" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_assessments" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_assessments" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_audit_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_audit_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_audit_logs_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_billing_records" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_billing_records" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_billing_records" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_budget_tracking" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_budget_tracking" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_budget_tracking" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_business_profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_business_profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_business_profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_client_intelligence_alerts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_client_intelligence_alerts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_client_intelligence_alerts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_client_interactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_client_interactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_client_interactions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."companies" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_companies" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_companies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_companies" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_company_profiles" TO "anon";
GRANT ALL ON TABLE "public"."ai_company_profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_company_profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_conversations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_conversations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_cost_allocations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_cost_allocations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_cost_allocations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_document_processing_queue" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_document_processing_queue" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_document_processing_queue" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_email_accounts" TO "anon";
GRANT ALL ON TABLE "public"."ai_email_accounts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_email_accounts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_embedding_cache" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_embedding_cache" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_embedding_cache" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_embedding_cache_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_embedding_cache_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_embedding_cache_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_message_feedback" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_message_feedback" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_message_feedback" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_feedback_analytics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_feedback_analytics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_feedback_analytics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_improvement_recommendations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_improvement_recommendations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_improvement_recommendations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_folders" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_folders" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_folders" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_item_folders" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_item_folders" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_item_folders" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_items" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_items" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_items" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integrations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integrations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integrations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_items_detailed" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_items_detailed" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_items_detailed" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_rules" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_rules" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_inbox_rules" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_insights" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_insights" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_insights" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_integrations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_integrations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_integrations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_integrations_oauth" TO "anon";
GRANT ALL ON TABLE "public"."ai_integrations_oauth" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_integrations_oauth" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_interactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_interactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_interactions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_analytics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_analytics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_analytics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_cards" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_cards" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_cards" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_gaps" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_gaps" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_gaps" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_relationships" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_relationships" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_knowledge_relationships" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_llm_registry" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_llm_registry" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_llm_registry" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_messages" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_messages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_messages" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_metrics_daily" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_metrics_daily" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_metrics_daily" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_model_performance" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_model_performance" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_model_performance" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_model_usage" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_model_usage" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_model_usage" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_models" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_models" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_models" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_operations_docs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_operations_docs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_operations_docs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_ops_kpis" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_ops_kpis" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_ops_kpis" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_optimization_suggestions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_optimization_suggestions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_optimization_suggestions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_passkey_challenges" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_passkey_challenges" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_passkey_challenges" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_passkeys" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_passkeys" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_passkeys" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_performance_metrics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_performance_metrics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_performance_metrics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_personal_thought_vectors" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_personal_thought_vectors" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_personal_thought_vectors" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_quality_assessments" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_quality_assessments" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_quality_assessments" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_revenue_metrics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_revenue_metrics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_revenue_metrics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_sales_metrics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_sales_metrics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_sales_metrics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_subscription_metrics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_subscription_metrics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_subscription_metrics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_success_outcomes" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_success_outcomes" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_success_outcomes" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_success_analytics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_success_analytics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_success_analytics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_unified_client_profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_unified_client_profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_unified_client_profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_user_activity" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_user_activity" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_user_activity" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_user_feedback" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_user_feedback" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_user_feedback" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_vector_documents" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_vector_documents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ai_vector_documents" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."analytics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."analytics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."analytics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."assessment_action_items" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."assessment_action_items" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."assessment_action_items" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."automation_execution_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."automation_execution_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."automation_execution_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."automation_workflows" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."automation_workflows" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."automation_workflows" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."billing_plans" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."billing_plans" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."billing_plans" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."business_goals" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."business_goals" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."business_goals" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."business_health" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."business_health" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."business_health" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."capability_gap_analysis" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."capability_gap_analysis" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."capability_gap_analysis" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."capability_roadmap" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."capability_roadmap" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."capability_roadmap" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."chat_messages" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."chat_messages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_messages" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_sessions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_sessions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_sessions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_usage_tracking" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_usage_tracking" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_usage_tracking" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."communication_analytics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."communication_analytics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."communication_analytics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."communication_events" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."communication_events" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."communication_events" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."company_document_templates" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."company_document_templates" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."company_document_templates" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."company_status_snapshots" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."company_status_snapshots" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."company_status_snapshots" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_activity_mapping" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_activity_mapping" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_activity_mapping" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_calendar_events" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_calendar_events" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_calendar_events" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_emails" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_emails" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_emails" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_tasks" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_tasks" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_tasks" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_goal_progress_view" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_goal_progress_view" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_goal_progress_view" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."company_performance_view" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."company_performance_view" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."company_performance_view" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."component_usages" TO "anon";
GRANT ALL ON TABLE "public"."component_usages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."component_usages" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contacts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contacts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contacts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."credential_audit_log" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."credential_audit_log" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."credential_audit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."credential_audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."credential_audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."credential_audit_log_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."deal" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."deal" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."deal" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."deals" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."deals" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."deals" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."department_metrics_view" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."department_metrics_view" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."department_metrics_view" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."documents" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."documents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."encrypted_credentials" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."encrypted_credentials" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."encrypted_credentials" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."financial_data" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."financial_data" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."financial_data" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."financial_metrics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."financial_metrics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."financial_metrics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_assessments" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_assessments" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_assessments" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_insights" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_insights" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_insights" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_resource_mapping" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_resource_mapping" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_resource_mapping" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_user_alignment" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_user_alignment" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goal_user_alignment" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insight_business_connections" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insight_business_connections" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insight_business_connections" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_data" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_data" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_data" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_ninjarmm_device_data" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_ninjarmm_device_data" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_ninjarmm_device_data" TO "service_role";



GRANT ALL ON SEQUENCE "public"."integration_ninjarmm_device_data_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."integration_ninjarmm_device_data_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."integration_ninjarmm_device_data_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_status" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_status" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_status" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_sync_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_sync_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_sync_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_webhooks" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_webhooks" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."integration_webhooks" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_contacts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_contacts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_contacts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_documents" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_documents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."manual_documents" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."marketing_campaigns" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."marketing_campaigns" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."marketing_campaigns" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."marketing_leads" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."marketing_leads" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."marketing_leads" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."migration_checks" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."migration_checks" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."migration_checks" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."model_usage" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."model_usage" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."model_usage" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mv_latest_department_kpis" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mv_latest_department_kpis" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mv_latest_department_kpis" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."n8n_configurations" TO "anon";
GRANT ALL ON TABLE "public"."n8n_configurations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."n8n_configurations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."n8n_workflow_configs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."n8n_workflow_configs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."n8n_workflow_configs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."oauth_tokens" TO "anon";
GRANT ALL ON TABLE "public"."oauth_tokens" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."oauth_tokens" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."onboarding_conversations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."onboarding_conversations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."onboarding_conversations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."onboarding_messages" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."onboarding_messages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."onboarding_messages" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ops_action_queue" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ops_action_queue" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ops_action_queue" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."organizations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."organizations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."organizations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."personal_thoughts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."personal_thoughts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."personal_thoughts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."personal_memory_timeline" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."personal_memory_timeline" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."personal_memory_timeline" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."projects" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."projects" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."projects" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."resource_inventory" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."resource_inventory" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."resource_inventory" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sales_deals" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sales_deals" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sales_deals" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sales_performance" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sales_performance" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sales_performance" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sales_pipeline" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sales_pipeline" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."sales_pipeline" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."secure_integrations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."secure_integrations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."secure_integrations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_audit_log" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_audit_log" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_audit_log" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_config" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_config" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_config" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_policy_summary" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_policy_summary" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."security_policy_summary" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stripe_events" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stripe_events" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."stripe_events" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."support_tickets" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."support_tickets" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."support_tickets" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_capacity" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_capacity" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_capacity" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."thought_relationships" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."thought_relationships" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."thought_relationships" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."unified_productivity_view" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."unified_productivity_view" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."unified_productivity_view" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_content" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_content" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_content" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_members" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_members" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_members" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspaces" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspaces" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspaces" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."unified_workspace_view" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."unified_workspace_view" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."unified_workspace_view" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_activity" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_activity" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_activity" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_billing_plans" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_billing_plans" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_billing_plans" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_context_profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_context_profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_context_profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_integrations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_integrations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_integrations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_interaction_analysis" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_interaction_analysis" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_interaction_analysis" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_learning_patterns" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_learning_patterns" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_learning_patterns" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_licenses" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_licenses" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_licenses" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_onboarding_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_onboarding_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_onboarding_progress" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_organizations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_organizations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_organizations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."waitlist_signups" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."waitlist_signups" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."waitlist_signups" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."waitlist_stats" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."waitlist_stats" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."waitlist_stats" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."website_analytics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."website_analytics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."website_analytics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_action_plans" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_action_plans" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_action_plans" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_activity" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_activity" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."workspace_activity" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";






























RESET ALL;
