import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

interface FounderProfile {
  industry: string;
  companySize: string;
  biggestChallenge: string;
  monthlyRevenue: string;
  timeSpentOnAdmin: string;
  roi: {
    hoursPerWeek: number;
    hourlyValue: number;
    monthlySavings: number;
    annualSavings: number;
    timeToROI: string;
  };
  completedAt: string;
}

interface OnboardingRequest {
  userId: string;
  founderProfile: FounderProfile;
  setupTrialEnvironment?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const { userId, founderProfile, setupTrialEnvironment = true } = await req.json() as OnboardingRequest;

    if (!userId || !founderProfile) {
      throw new Error('Missing required fields: userId and founderProfile');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Save founder profile to user preferences
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        role: 'owner',
        job_title: 'Founder/CEO',
        preferences: {
          theme: 'system',
          notifications: true,
          language: 'en',
          founder_profile: founderProfile,
          onboarding_completed: true,
          trial_started_at: new Date().toISOString()
        },
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      throw new Error(`Failed to save founder profile: ${profileError.message}`);
    }

    // 2. Create company if not exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('company_id, companies(*)')
      .eq('id', userId)
      .single();

    let companyId = existingProfile?.company_id;

    if (!companyId) {
      // Create company based on founder profile
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: `${founderProfile.industry} Business`, // Placeholder - they can update later
          industry: founderProfile.industry,
          size: founderProfile.companySize,
          settings: {
            founder_profile: founderProfile,
            estimated_monthly_revenue: founderProfile.monthlyRevenue,
            automation_potential: founderProfile.roi
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        throw new Error(`Failed to create company: ${companyError.message}`);
      }

      companyId = newCompany.id;

      // Link user to company
      await supabase
        .from('user_profiles')
        .update({ company_id: companyId })
        .eq('id', userId);
    }

    // 3. Setup trial environment if requested
    if (setupTrialEnvironment) {
      // Create initial business health baseline
      const kpiInserts = [
        {
          org_id: companyId,
          kpi_key: 'monthly_revenue',
          value: parseInt(founderProfile.monthlyRevenue.replace(/[^0-9]/g, '')) || 0,
          recorded_at: new Date().toISOString(),
          source: 'founder_onboarding'
        },
        {
          org_id: companyId,
          kpi_key: 'admin_hours_per_week',
          value: parseInt(founderProfile.timeSpentOnAdmin.replace(/[^0-9]/g, '')) || 20,
          recorded_at: new Date().toISOString(),
          source: 'founder_onboarding'
        },
        {
          org_id: companyId,
          kpi_key: 'automation_potential_hours',
          value: founderProfile.roi.hoursPerWeek,
          recorded_at: new Date().toISOString(),
          source: 'founder_onboarding'
        }
      ];

      const { error: kpiError } = await supabase
        .from('ai_kpi_datapoints')
        .insert(kpiInserts);

      if (kpiError) {
        console.warn('Warning: Could not insert baseline KPIs:', kpiError);
        // Don't fail the onboarding for this
      }

      // Create first AI insight based on founder profile
      const firstInsight = {
        org_id: companyId,
        insight_type: 'welcome',
        title: `Welcome to Nexus, ${getFounderName(founderProfile)}!`,
        content: `Based on your ${founderProfile.industry} business profile, I've identified ${founderProfile.roi.hoursPerWeek} hours per week of automation potential. Your biggest challenge "${founderProfile.biggestChallenge}" is exactly what I'm here to help solve.`,
        confidence_score: 0.95,
        priority: 'high',
        category: 'onboarding',
        metadata: {
          founder_profile: founderProfile,
          automation_potential: founderProfile.roi,
          next_steps: getIndustrySpecificNextSteps(founderProfile.industry)
        },
        created_at: new Date().toISOString()
      };

      const { error: insightError } = await supabase
        .from('ai_insights')
        .insert(firstInsight);

      if (insightError) {
        console.warn('Warning: Could not create welcome insight:', insightError);
      }
    }

    // 4. Track onboarding completion event
    const { error: eventError } = await supabase
      .from('ai_audit_logs')
      .insert({
        org_id: companyId,
        user_id: userId,
        event_type: 'founder_onboarding_completed',
        details: {
          industry: founderProfile.industry,
          company_size: founderProfile.companySize,
          roi_potential: founderProfile.roi,
          completed_at: founderProfile.completedAt
        },
        created_at: new Date().toISOString()
      });

    if (eventError) {
      console.warn('Warning: Could not log onboarding event:', eventError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId,
          companyId,
          founderProfile,
          trialSetup: setupTrialEnvironment,
          nextSteps: getIndustrySpecificNextSteps(founderProfile.industry)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Founder onboarding error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function getFounderName(profile: FounderProfile): string {
  // Extract name from profile or use generic greeting
  return 'Founder'; // Can be enhanced with actual name extraction
}

function getIndustrySpecificNextSteps(industry: string): string[] {
  const nextSteps: Record<string, string[]> = {
    'ecommerce': [
      'Connect your e-commerce platform (Shopify, WooCommerce)',
      'Set up inventory automation alerts',
      'Configure customer service automation'
    ],
    'saas': [
      'Connect your CRM (HubSpot, Salesforce)',
      'Set up churn prediction monitoring', 
      'Configure customer health score tracking'
    ],
    'consulting': [
      'Connect your time tracking system',
      'Set up project management automation',
      'Configure client reporting automation'
    ],
    'agency': [
      'Connect your marketing platforms',
      'Set up client reporting automation',
      'Configure campaign performance tracking'
    ],
    'other': [
      'Explore available integrations',
      'Set up basic automation workflows',
      'Configure business health monitoring'
    ]
  };

  return nextSteps[industry] || nextSteps['other'];
} 