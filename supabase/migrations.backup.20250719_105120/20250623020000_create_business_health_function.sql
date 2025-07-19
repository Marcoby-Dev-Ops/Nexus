-- Business Health calculation helper
-- Pillar: 3 (Architecture/Performance)

create or replace function public.get_business_health(p_company_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
    profile record;
    foundations_fields text[] := array['tagline','mission_statement','vision_statement','motto','about_md'];
    filled_count integer := 0;
    missing_fields text[] := array[]::text[];
    foundation_score integer := 0;
    result jsonb;
begin
    select * into profile from public.ai_company_profiles where company_id = p_company_id;

    if profile is null then
        missing_fields := foundations_fields;
    else
        foreach f in array foundations_fields loop
            if coalesce(profile.(f), '') <> '' then
                filled_count := filled_count + 1;
            else
                missing_fields := array_append(missing_fields, f);
            end if;
        end loop;
    end if;

    foundation_score := round((filled_count::numeric / foundations_fields array_length) * 100);

    result := jsonb_build_object(
        'score', foundation_score,
        'dimensions', jsonb_build_array(
            jsonb_build_object('id', 'foundations', 'label', 'Business Foundations', 'score', foundation_score)
        ),
        'gaps', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'field', gf,
                'template_slug', case gf
                    when 'tagline' then 'define-mission'
                    when 'mission_statement' then 'define-mission'
                    when 'vision_statement' then 'define-vision'
                    when 'motto' then 'define-mission'
                    else 'define-value-proposition' end
            )), '[]'::jsonb)
            from unnest(missing_fields) gf
        )
    );

    return result;
end;
$$;

-- Grant execute to authenticated users (result is filtered by RLS on ai_company_profiles)
grant execute on function public.get_business_health(uuid) to authenticated; 