import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessProfileData {
  user_id: string;
  org_id: string;
  company_name: string;
  industry?: string | null;
  business_model?: string | null;
  company_size?: string | null;
  mission_statement?: string | null;
  primary_services?: string[] | null;
  unique_value_proposition?: string | null;
  competitive_advantages?: string[] | null;
  target_markets?: string[] | null;
  ideal_client_profile?: string[] | null;
  service_delivery_methods?: string[] | null;
  current_clients?: string[] | null;
  revenue_model?: string | null;
  pricing_strategy?: string | null;
  financial_goals?: string[] | null;
  strategic_objectives?: string[] | null;
}

interface SaveBusinessProfileRequest {
  orgId: string;
  profileData: BusinessProfileData;
  operation: 'create' | 'update' | 'upsert';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { orgId, profileData, operation = 'upsert' } = await req.json() as SaveBusinessProfileRequest

    // Validate required fields
    if (!orgId || !profileData) {
      throw new Error('Missing required fields: orgId and profileData')
    }

    if (!profileData.user_id) {
      throw new Error('Missing user_id in profile data')
    }

    if (!profileData.company_name?.trim()) {
      throw new Error('Company name is required')
    }

    // Validate organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      console.error('Organization validation failed:', orgError)
      throw new Error('Organization does not exist')
    }

    // Check if user is member of organization
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', profileData.user_id)
      .eq('org_id', orgId)
      .single()

    if (membershipError || !membership) {
      console.error('User membership validation failed:', membershipError)
      throw new Error('User is not a member of this organization')
    }

    // Check if business profile already exists for this org
    const { data: existingProfile, error: existingError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing profile:', existingError)
      throw new Error('Failed to check existing business profile')
    }

    let result
    const timestamp = new Date().toISOString()

    if (existingProfile && (operation === 'update' || operation === 'upsert')) {
      // Update existing profile
      console.log('Updating existing business profile', { orgId, userId: profileData.user_id })
      
      const updateData = {
        ...profileData,
        org_id: orgId,
        updated_at: timestamp
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .update(updateData)
        .eq('id', existingProfile.id)
        .select()
        .single()

      if (error) {
        console.error('Failed to update business profile:', error)
        throw new Error(`Failed to update business profile: ${error.message}`)
      }

      result = data
      console.log('Successfully updated business profile', { 
        orgId, 
        userId: profileData.user_id, 
        profileId: data.id 
      })
    } else if (!existingProfile && (operation === 'create' || operation === 'upsert')) {
      // Create new profile
      console.log('Creating new business profile', { orgId, userId: profileData.user_id })
      
      const insertData = {
        ...profileData,
        org_id: orgId,
        created_at: timestamp,
        updated_at: timestamp
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Failed to create business profile:', error)
        throw new Error(`Failed to create business profile: ${error.message}`)
      }

      result = data
      console.log('Successfully created business profile', { 
        orgId, 
        userId: profileData.user_id, 
        profileId: data.id 
      })
    } else {
      throw new Error(`Operation '${operation}' not allowed for current state`)
    }

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: profileData.user_id,
        action: 'business_profile_saved',
        resource_type: 'business_profile',
        resource_id: result.id,
        metadata: {
          org_id: orgId,
          operation,
          company_name: profileData.company_name
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `Business profile ${existingProfile ? 'updated' : 'created'} successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in save-business-profile function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
