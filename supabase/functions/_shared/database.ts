import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

export interface DatabaseService {
  getUserIntegrations(userId: string, caller: string): Promise<{ data: any[] | null; error: any }>;
  getUserProfile(userId: string, caller: string): Promise<{ data: any | null; error: any }>;
  getCompanyStatus(companyId: string, caller: string): Promise<{ data: any | null; error: any }>;
  updateUserIntegration(userId: string, integrationName: string, updates: any, caller: string): Promise<{ data: any | null; error: any }>;
  createUserIntegration(userId: string, integrationData: any, caller: string): Promise<{ data: any | null; error: any }>;
}

export class EdgeDatabaseService implements DatabaseService {
  private supabaseClient: any;
  private userId: string;

  constructor(supabaseUrl: string, serviceKey: string, userId: string) {
    this.supabaseClient = createClient(supabaseUrl, serviceKey);
    this.userId = userId;
  }

  // Centralized user integrations queries
  async getUserIntegrations(userId: string, caller: string) {
    console.log(`🔍 [${caller}] Fetching user integrations for user: ${userId}`);
    
    try {
      const { data: userIntegrations, error } = await this.supabaseClient
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error(`❌ [${caller}] Database query failed:`, error);
        return { data: null, error };
      }

      // Fetch integration details separately to avoid join issues
      const integrationsWithDetails = await Promise.all(
        (userIntegrations || []).map(async (userIntegration: any) => {
          try {
            const { data: integrationDetails } = await this.supabaseClient
              .from('integrations')
              .select('id, name, slug, auth_type, category')
              .eq('id', userIntegration.integration_id)
              .single();
            
            return {
              ...userIntegration,
              integrations: integrationDetails || { name: 'Unknown', slug: 'unknown', auth_type: 'unknown', category: 'general' }
            };
          } catch (error) {
            console.error('Error fetching integration details:', error);
            return {
              ...userIntegration,
              integrations: { name: 'Unknown', slug: 'unknown', auth_type: 'unknown', category: 'general' }
            };
          }
        })
      );

      console.log(`✅ [${caller}] Successfully fetched ${integrationsWithDetails?.length || 0} integrations`);
      return { data: integrationsWithDetails, error: null };
    } catch (err) {
      console.error(`❌ [${caller}] getUserIntegrations failed:`, err);
      return { data: null, error: err };
    }
  }

  // Centralized user profile queries
  async getUserProfile(userId: string, caller: string) {
    console.log(`🔍 [${caller}] Fetching user profile for user: ${userId}`);
    
    try {
      const { data, error } = await this.supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(`❌ [${caller}] Database query failed:`, error);
        return { data: null, error };
      }

      console.log(`✅ [${caller}] Successfully fetched user profile`);
      return { data, error: null };
    } catch (err) {
      console.error(`❌ [${caller}] getUserProfile failed:`, err);
      return { data: null, error: err };
    }
  }

  // Centralized company status queries
  async getCompanyStatus(companyId: string, caller: string) {
    console.log(`🔍 [${caller}] Fetching company status for company: ${companyId}`);
    
    try {
      const { data, error } = await this.supabaseClient
        .from('company_status')
        .select('*')
        .eq('company_id', companyId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error(`❌ [${caller}] Database query failed:`, error);
        return { data: null, error };
      }

      console.log(`✅ [${caller}] Successfully fetched company status`);
      return { data, error: null };
    } catch (err) {
      console.error(`❌ [${caller}] getCompanyStatus failed:`, err);
      return { data: null, error: err };
    }
  }

  // Update user integration
  async updateUserIntegration(userId: string, integrationName: string, updates: any, caller: string) {
    console.log(`🔍 [${caller}] Updating user integration: ${integrationName} for user: ${userId}`);
    
    try {
      const { data, error } = await this.supabaseClient
        .from('user_integrations')
        .update(updates)
        .eq('user_id', userId)
        .eq('integration_name', integrationName)
        .select()
        .maybeSingle();

      if (error) {
        console.error(`❌ [${caller}] Database update failed:`, error);
        return { data: null, error };
      }

      console.log(`✅ [${caller}] Successfully updated user integration`);
      return { data, error: null };
    } catch (err) {
      console.error(`❌ [${caller}] updateUserIntegration failed:`, err);
      return { data: null, error: err };
    }
  }

  // Create user integration
  async createUserIntegration(userId: string, integrationData: any, caller: string) {
    console.log(`🔍 [${caller}] Creating user integration for user: ${userId}`);
    
    try {
      const { data, error } = await this.supabaseClient
        .from('user_integrations')
        .insert({
          ...integrationData,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ [${caller}] Database insert failed:`, error);
        return { data: null, error };
      }

      console.log(`✅ [${caller}] Successfully created user integration`);
      return { data, error: null };
    } catch (err) {
      console.error(`❌ [${caller}] createUserIntegration failed:`, err);
      return { data: null, error: err };
    }
  }
}

// Factory function to create database service
export function createDatabaseService(supabaseUrl: string, serviceKey: string, userId: string): DatabaseService {
  return new EdgeDatabaseService(supabaseUrl, serviceKey, userId);
}

// Authentication helper for edge functions
export async function authenticateRequest(req: Request, supabaseUrl: string, serviceKey: string): Promise<{ userId: string | null; error: string | null }> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { userId: null, error: 'No authorization header' };
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, serviceKey);
    
    const { data: { user }, error } = await supabaseClient.auth.getUser(jwt);
    
    if (error || !user?.id) {
      return { userId: null, error: 'Invalid token' };
    }

    console.log(`✅ [Edge Auth] Authenticated user: ${user.id}`);
    return { userId: user.id, error: null };
  } catch (err) {
    console.error('❌ [Edge Auth] Authentication failed:', err);
    return { userId: null, error: 'Authentication failed' };
  }
} 