/**
 * Onboarding Verification Service
 * Comprehensive verification system for onboarding completion
 */

import { supabase } from '@/core/supabase';

export interface VerificationResult {
  success: boolean;
  checks: VerificationCheck[];
  summary: string;
  recommendations: string[];
}

export interface VerificationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class OnboardingVerificationService {
  
  /**
   * Comprehensive verification of onboarding completion
   */
  async verifyOnboardingCompletion(userId: string): Promise<VerificationResult> {
    const checks: VerificationCheck[] = [];
    
    try {
      // 1. Check localStorage state
      const localStorageCheck = await this.verifyLocalStorage();
      checks.push(localStorageCheck);
      
      // 2. Check database records
      const databaseChecks = await this.verifyDatabaseRecords(userId);
      checks.push(...databaseChecks);
      
      // 3. Check UI state
      const uiCheck = await this.verifyUIState();
      checks.push(uiCheck);
      
      // 4. Check authentication
      const authCheck = await this.verifyAuthentication();
      checks.push(authCheck);
      
      // 5. Check integrations (if applicable)
      const integrationChecks = await this.verifyIntegrations(userId);
      checks.push(...integrationChecks);
      
      // Generate summary
      const passedChecks = checks.filter(c => c.status === 'pass').length;
      const totalChecks = checks.length;
      const success = passedChecks >= Math.ceil(totalChecks * 0.8); // 80% threshold
      
      const summary = `Onboarding verification: ${passedChecks}/${totalChecks} checks passed`;
      
      const recommendations = this.generateRecommendations(checks);
      
      return {
        success,
        checks,
        summary,
        recommendations
      };
      
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Onboarding verification failed: ', error);
      return {
        success: false,
        checks: [{
          name: 'Verification System',
          status: 'fail',
          message: 'Verification system encountered an error',
          details: error
        }],
        summary: 'Verification failed due to system error',
        recommendations: ['Contact support if this persists']
      };
    }
  }
  
  /**
   * Verify localStorage state
   */
  private async verifyLocalStorage(): Promise<VerificationCheck> {
    const isCompleted = localStorage.getItem('nexus_onboarding_complete') === 'true';
    const hasState = !!localStorage.getItem('nexus_onboarding_state');
    
    if (isCompleted && hasState) {
      return {
        name: 'LocalStorage State',
        status: 'pass',
        message: 'Onboarding marked as complete in localStorage'
      };
    } else if (isCompleted && !hasState) {
      return {
        name: 'LocalStorage State',
        status: 'warning',
        message: 'Onboarding marked complete but missing state data'
      };
    } else {
      return {
        name: 'LocalStorage State',
        status: 'fail',
        message: 'Onboarding not marked as complete'
      };
    }
  }
  
  /**
   * Verify database records
   */
  private async verifyDatabaseRecords(userId: string): Promise<VerificationCheck[]> {
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
          message: 'User profile not found in database',
          details: profileError
        });
      } else {
        checks.push({
          name: 'User Profile',
          status: profile.onboarding_completed ? 'pass' : 'fail',
          message: profile.onboarding_completed 
            ? 'User profile exists and onboarding marked complete'
            : 'User profile exists but onboarding not marked complete',
          details: {
            onboardingcompleted: profile.onboarding_completed,
            role: profile.role,
            companyid: profile.company_id
          }
        });
        
        // Check company if profile has company_id
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
              message: `Company "${company.name}" found and linked`,
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
            message: 'User not linked to any company'
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
          message: 'Onboarding progress record not found',
          details: progressError
        });
      } else if (progress) {
        checks.push({
          name: 'Onboarding Progress',
          status: progress.onboarding_completed ? 'pass' : 'fail',
          message: progress.onboarding_completed 
            ? 'Onboarding progress tracked and completed'
            : 'Onboarding progress tracked but not completed',
          details: {
            onboardingcompleted: progress.onboarding_completed,
            onboardingcompleted_at: progress.onboarding_completed_at,
            stepscompleted: progress.steps_completed
          }
        });
      }
      
    } catch (error) {
      checks.push({
        name: 'Database Verification',
        status: 'fail',
        message: 'Database verification failed',
        details: error
      });
    }
    
    return checks;
  }
  
  /**
   * Verify UI state
   */
  private async verifyUIState(): Promise<VerificationCheck> {
    // Check for "No data found" messages in DOM
    const noDataMessages = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent?.includes('No data found') || 
      el.textContent?.includes('No company status data found')
    );
    
    if (noDataMessages.length === 0) {
      return {
        name: 'UI State',
        status: 'pass',
        message: 'No "No data found" messages detected'
      };
    } else {
      return {
        name: 'UI State',
        status: 'fail',
        message: `${noDataMessages.length} "No data found" messages detected`,
        details: {
          messageCount: noDataMessages.length,
          messages: noDataMessages.map(el => el.textContent?.trim()).slice(0, 3)
        }
      };
    }
  }
  
  /**
   * Verify authentication
   */
  private async verifyAuthentication(): Promise<VerificationCheck> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return {
          name: 'Authentication',
          status: 'fail',
          message: 'User not authenticated',
          details: error
        };
      } else {
        return {
          name: 'Authentication',
          status: 'pass',
          message: 'User properly authenticated',
          details: {
            id: user.id,
            email: user.email
          }
        };
      }
    } catch (error) {
      return {
        name: 'Authentication',
        status: 'fail',
        message: 'Authentication verification failed',
        details: error
      };
    }
  }
  
  /**
   * Verify integrations (if applicable)
   */
  private async verifyIntegrations(userId: string): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = [];
    
    try {
      // Check for n8n configuration
      const { data: n8nConfig, error: n8nError } = await supabase
        .from('n8n_configurations')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (n8nError && n8nError.code !== 'PGRST116') {
        checks.push({
          name: 'n8n Configuration',
          status: 'warning',
          message: 'n8n configuration not found (optional)',
          details: n8nError
        });
      } else if (n8nConfig) {
        checks.push({
          name: 'n8n Configuration',
          status: 'pass',
          message: 'n8n configuration found and active',
          details: {
            instancename: n8nConfig.instance_name,
            isactive: n8nConfig.is_active
          }
        });
      }
      
      // Check for other integrations
      const { data: integrations, error: integrationsError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId);
      
      if (integrationsError) {
        checks.push({
          name: 'User Integrations',
          status: 'warning',
          message: 'Could not verify user integrations',
          details: integrationsError
        });
      } else if (integrations && integrations.length > 0) {
        checks.push({
          name: 'User Integrations',
          status: 'pass',
          message: `${integrations.length} integration(s) configured`,
          details: {
            count: integrations.length,
            types: integrations.map(i => i.integration_type)
          }
        });
      } else {
        checks.push({
          name: 'User Integrations',
          status: 'warning',
          message: 'No integrations configured (optional)'
        });
      }
      
    } catch (error) {
      checks.push({
        name: 'Integration Verification',
        status: 'warning',
        message: 'Integration verification failed',
        details: error
      });
    }
    
    return checks;
  }
  
  /**
   * Generate recommendations based on check results
   */
  private generateRecommendations(checks: VerificationCheck[]): string[] {
    const recommendations: string[] = [];
    
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');
    
    if (failedChecks.length > 0) {
      recommendations.push('Complete the onboarding flow to resolve failed checks');
    }
    
    if (warningChecks.length > 0) {
      recommendations.push('Consider completing optional setup steps for better experience');
    }
    
    // Specific recommendations based on failed checks
    const localStorageFailed = failedChecks.find(c => c.name === 'LocalStorage State');
    if (localStorageFailed) {
      recommendations.push('Reset onboarding state and complete the flow again');
    }
    
    const profileFailed = failedChecks.find(c => c.name === 'User Profile');
    if (profileFailed) {
      recommendations.push('Ensure user profile is properly created during onboarding');
    }
    
    const companyFailed = failedChecks.find(c => c.name === 'Company Record');
    if (companyFailed) {
      recommendations.push('Complete company setup in the onboarding flow');
    }
    
    const uiFailed = failedChecks.find(c => c.name === 'UI State');
    if (uiFailed) {
      recommendations.push('Check for data loading issues and refresh the page');
    }
    
    return recommendations;
  }
  
  /**
   * Quick verification for UI components
   */
  static quickVerify(): { isComplete: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check localStorage
    const isCompleted = localStorage.getItem('nexus_onboarding_complete') === 'true';
    if (!isCompleted) {
      issues.push('Onboarding not marked as complete');
    }
    
    // Check for UI issues
    const noDataMessages = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent?.includes('No data found') || 
      el.textContent?.includes('No company status data found')
    );
    
    if (noDataMessages.length > 0) {
      issues.push(`${noDataMessages.length} "No data found" messages detected`);
    }
    
    return {
      isComplete: isCompleted && noDataMessages.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const onboardingVerificationService = new OnboardingVerificationService(); 