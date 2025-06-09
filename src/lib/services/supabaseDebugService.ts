/**
 * Supabase Debug Service
 * Helps diagnose common API issues like 406 errors
 */

import { supabase } from '../supabase';

interface DebugResult {
  success: boolean;
  message: string;
  details?: any;
  suggestions?: string[];
}

class SupabaseDebugService {
  /**
   * Diagnose the conversations API 406 error
   */
  async diagnoseConversationsError(userId?: string): Promise<DebugResult> {
    const results: any = {};
    const suggestions: string[] = [];

    try {
      // 1. Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.auth = {
        user: user ? { id: user.id, email: user.email } : null,
        error: authError?.message,
        isAuthenticated: !!user
      };

      if (!user) {
        return {
          success: false,
          message: 'User not authenticated',
          details: results,
          suggestions: [
            'User needs to be logged in to access conversations',
            'Check if authentication flow is working properly',
            'Verify environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
          ]
        };
      }

      // 2. Check if conversations table exists and user can read it
      try {
        const { data: conversationsTest, error: conversationsError } = await supabase
          .from('conversations')
          .select('id')
          .limit(1);

        results.table_access = {
          canRead: !conversationsError,
          error: conversationsError?.message,
          recordCount: conversationsTest?.length || 0
        };

        if (conversationsError) {
          suggestions.push('Check if conversations table exists and RLS policies allow read access');
        }
      } catch (error) {
        results.table_access = {
          canRead: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // 3. Test the specific failing query
      const testUserId = userId || user.id;
      try {
        const { data: metadataTest, error: metadataError } = await supabase
          .from('conversations')
          .select('metadata')
          .eq('user_id', testUserId)
          .limit(1);

        results.specific_query = {
          success: !metadataError,
          error: metadataError?.message,
          data: metadataTest
        };

        if (metadataError) {
          if (metadataError.message.includes('406')) {
            suggestions.push('406 error indicates request not acceptable - check authentication headers');
          }
          if (metadataError.message.includes('RLS')) {
            suggestions.push('Row Level Security is blocking access - verify RLS policies');
          }
        }
      } catch (error) {
        results.specific_query = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // 4. Check RLS policies
      try {
        const { data: policies } = await supabase
          .rpc('get_policies', { schema_name: 'public', table_name: 'conversations' })
          .single();

        results.rls_policies = policies;
      } catch (error) {
        results.rls_policies = {
          error: 'Could not fetch RLS policies',
          note: 'This is normal if you don\'t have admin access'
        };
      }

      // 5. Test basic connection
      try {
        const { data: healthCheck } = await supabase
          .from('conversations')
          .select('count')
          .limit(0);

        results.connection = {
          healthy: true,
          response: healthCheck
        };
      } catch (error) {
        results.connection = {
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        suggestions.push('Basic connection to Supabase failed - check network and credentials');
      }

      const hasErrors = Object.values(results).some((result: any) => 
        result?.error || result?.success === false || !result?.healthy
      );

      return {
        success: !hasErrors,
        message: hasErrors ? 'Issues detected with conversations API' : 'All checks passed',
        details: results,
        suggestions: suggestions.length > 0 ? suggestions : ['Everything looks good!']
      };

    } catch (error) {
      return {
        success: false,
        message: 'Debug check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        suggestions: ['Check console for detailed error information']
      };
    }
  }

  /**
   * Test the exact failing request from the browser console
   */
  async testFailingRequest(): Promise<DebugResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: 'Cannot test - user not authenticated',
          suggestions: ['Log in first, then run this test']
        };
      }

      // This replicates the exact failing request
      const { data, error } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('user_id', user.id);

      if (error) {
        let errorAnalysis = 'Unknown error type';
        const suggestions: string[] = [];

        if (error.message.includes('406')) {
          errorAnalysis = '406 Not Acceptable - Request format or authentication issue';
          suggestions.push(
            'Check if user is properly authenticated',
            'Verify RLS policies allow this operation',
            'Check if Content-Type headers are correct'
          );
        }

        if (error.message.includes('JWT')) {
          errorAnalysis = 'JWT/Authentication token issue';
          suggestions.push(
            'Try logging out and logging back in',
            'Check if token has expired',
            'Verify authentication flow'
          );
        }

        return {
          success: false,
          message: `Request failed: ${errorAnalysis}`,
          details: {
            error: error.message,
            code: error.code || 'unknown',
            hint: error.hint,
            details: error.details
          },
          suggestions
        };
      }

      return {
        success: true,
        message: 'Request succeeded!',
        details: {
          recordsFound: data?.length || 0,
          sampleData: data?.slice(0, 2) // Show first 2 records
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Test request failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        suggestions: ['Check browser console for more details']
      };
    }
  }

  /**
   * Generate a debug report
   */
  async generateDebugReport(): Promise<string> {
    const diagnosis = await this.diagnoseConversationsError();
    const testResult = await this.testFailingRequest();

    let report = '🔍 SUPABASE CONVERSATIONS API DEBUG REPORT\n';
    report += '='.repeat(50) + '\n\n';

    report += '📊 DIAGNOSIS RESULTS:\n';
    report += `Status: ${diagnosis.success ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `Message: ${diagnosis.message}\n\n`;

    if (diagnosis.details) {
      report += '🔧 DETAILED CHECKS:\n';
      Object.entries(diagnosis.details).forEach(([key, value]) => {
        report += `- ${key}: ${JSON.stringify(value, null, 2)}\n`;
      });
      report += '\n';
    }

    report += '🧪 TEST REQUEST RESULTS:\n';
    report += `Status: ${testResult.success ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `Message: ${testResult.message}\n\n`;

    if (testResult.details) {
      report += `Details: ${JSON.stringify(testResult.details, null, 2)}\n\n`;
    }

    report += '💡 SUGGESTIONS:\n';
    const allSuggestions = [...(diagnosis.suggestions || []), ...(testResult.suggestions || [])];
    allSuggestions.forEach((suggestion, index) => {
      report += `${index + 1}. ${suggestion}\n`;
    });

    return report;
  }
}

// Export singleton instance
export const supabaseDebugService = new SupabaseDebugService(); 