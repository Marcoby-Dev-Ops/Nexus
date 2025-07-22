import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// TypeScript interfaces
interface VerificationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: unknown;
}

interface VerificationResult {
  success: boolean;
  checks: VerificationCheck[];
  recommendations: string[];
  summary: string;
  timestamp: string;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  onboarding_completed: boolean;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  created_at: string;
  updated_at: string;
}

interface OnboardingProgress {
  user_id: string;
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface N8nRemediationData {
  userId: string;
  issues: VerificationCheck[];
  verificationData: VerificationResult;
}

interface LogEventData {
  userId: string;
  result: VerificationResult;
  timestamp: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const n8nWebhookUrl = Deno.env.get('N8N_VERIFICATION_WEBHOOK');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const { userId, triggerRemediation = false } = await req.json() as {
      userId: string;
      triggerRemediation?: boolean;
    };

    if (!userId) {
      throw new Error('Missing required field: userId');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Perform comprehensive verification
    const verificationResult = await performVerification(supabase, userId);

    // 2. If remediation is requested and issues found, trigger n8n workflow
    if (triggerRemediation && !verificationResult.success) {
      if (n8nWebhookUrl) {
        await triggerN8nRemediation(n8nWebhookUrl, {
          userId,
          issues: verificationResult.checks.filter(c => c.status === 'fail'),
          verificationData: verificationResult
        });
      }
    }

    // 3. Log verification event
    await logVerificationEvent(supabase, userId, verificationResult);

    return new Response(
      JSON.stringify({
        success: true,
        verification: verificationResult,
        remediationTriggered: triggerRemediation && !verificationResult.success
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Onboarding verification error:', error);
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

/**
 * Perform comprehensive verification checks
 */
async function performVerification(supabase: SupabaseClient, userId: string) {
  const checks: VerificationCheck[] = [];

  try {
    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      checks.push({
        name: 'User Profile',
        status: 'fail',
        message: 'User profile not found',
        details: profileError
      });
    } else {
      checks.push({
        name: 'User Profile',
        status: profile.onboarding_completed ? 'pass' : 'fail',
        message: profile.onboarding_completed 
          ? 'User profile exists and onboarding complete'
          : 'User profile exists but onboarding incomplete',
        details: {
          onboarding_completed: profile.onboarding_completed,
          role: profile.role,
          company_id: profile.company_id
        }
      });

      // Check company
      if (profile.company_id) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();

        if (companyError || !company) {
          checks.push({
            name: 'Company Record',
            status: 'fail',
            message: 'Company record not found',
            details: companyError
          });
        } else {
          checks.push({
            name: 'Company Record',
            status: 'pass',
            message: `Company "${company.name}" found`,
            details: {
              name: company.name,
              industry: company.industry,
              size: company.size
            }
          });
        }
      } else {
        checks.push({
          name: 'Company Record',
          status: 'fail',
          message: 'User not linked to company'
        });
      }
    }

    // Check onboarding progress
    const { data: progress, error: progressError } = await supabase
      .from('user_onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      checks.push({
        name: 'Onboarding Progress',
        status: 'warning',
        message: 'Onboarding progress not tracked',
        details: progressError
      });
    } else if (progress) {
      checks.push({
        name: 'Onboarding Progress',
        status: progress.onboarding_completed ? 'pass' : 'fail',
        message: progress.onboarding_completed 
          ? 'Onboarding progress tracked and complete'
          : 'Onboarding progress tracked but incomplete',
        details: {
          onboarding_completed: progress.onboarding_completed,
          onboarding_completed_at: progress.onboarding_completed_at
        }
      });
    }

    // Check integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId);

    if (integrationsError) {
      checks.push({
        name: 'User Integrations',
        status: 'warning',
        message: 'Could not verify integrations',
        details: integrationsError
      });
    } else if (integrations && integrations.length > 0) {
      checks.push({
        name: 'User Integrations',
        status: 'pass',
        message: `${integrations.length} integration(s) configured`,
        details: {
          count: integrations.length,
          types: integrations.map((i: any) => i.integration_type)
        }
      });
    } else {
      checks.push({
        name: 'User Integrations',
        status: 'warning',
        message: 'No integrations configured (optional)'
      });
    }

    // Check analytics events
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', 'onboarding_completed')
      .limit(1);

    if (eventsError) {
      checks.push({
        name: 'Analytics Events',
        status: 'warning',
        message: 'Could not verify analytics events',
        details: eventsError
      });
    } else if (events && events.length > 0) {
      checks.push({
        name: 'Analytics Events',
        status: 'pass',
        message: 'Onboarding completion event logged',
        details: {
          event_count: events.length,
          latest_event: events[0].occurred_at
        }
      });
    } else {
      checks.push({
        name: 'Analytics Events',
        status: 'warning',
        message: 'No onboarding completion event found'
      });
    }

  } catch (error) {
    checks.push({
      name: 'Verification System',
      status: 'fail',
      message: 'Verification system error',
      details: error
    });
  }

  // Calculate success
  const passedChecks = checks.filter((c: VerificationCheck) => c.status === 'pass').length;
  const totalChecks = checks.length;
  const success = passedChecks >= Math.ceil(totalChecks * 0.8); // 80% threshold

  // Generate recommendations
  const recommendations = generateRecommendations(checks);

  // Create summary
  const summary = `Verification completed: ${passedChecks}/${totalChecks} checks passed`;

  return {
    success,
    checks,
    recommendations,
    summary,
    timestamp: new Date().toISOString()
  };
}

/**
 * Trigger n8n remediation workflow
 */
async function triggerN8nRemediation(webhookUrl: string, data: N8nRemediationData) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'onboarding_remediation',
        userId: data.userId,
        issues: data.issues,
        verificationData: data.verificationData,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status}`);
    }

    console.log('n8n remediation workflow triggered successfully');
    return true;
  } catch (error) {
    console.error('Failed to trigger n8n remediation:', error);
    return false;
  }
}

/**
 * Log verification event
 */
async function logVerificationEvent(supabase: SupabaseClient, userId: string, result: VerificationResult) {
  try {
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_type: 'onboarding_verification',
        event_data: {
          success: result.success,
          checks_count: result.checks.length,
          passed_checks: result.checks.filter((c: VerificationCheck) => c.status === 'pass').length,
          summary: result.summary
        },
        occurred_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log verification event:', error);
  }
}

/**
 * Generate recommendations based on check results
 */
function generateRecommendations(checks: VerificationCheck[]): string[] {
  const recommendations: string[] = [];
  
  const failedChecks = checks.filter((c: VerificationCheck) => c.status === 'fail');
  const warningChecks = checks.filter((c: VerificationCheck) => c.status === 'warning');
  
  if (failedChecks.length > 0) {
    recommendations.push('Complete the onboarding flow to resolve failed checks');
  }
  
  if (warningChecks.length > 0) {
    recommendations.push('Consider completing optional setup steps for better experience');
  }
  
  // Specific recommendations
  const profileFailed = failedChecks.find((c: VerificationCheck) => c.name === 'User Profile');
  if (profileFailed) {
    recommendations.push('Ensure user profile is properly created during onboarding');
  }
  
  const companyFailed = failedChecks.find((c: VerificationCheck) => c.name === 'Company Record');
  if (companyFailed) {
    recommendations.push('Complete company setup in the onboarding flow');
  }
  
  return recommendations;
} 