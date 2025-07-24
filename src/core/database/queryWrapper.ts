import { supabase } from '@/core/supabase';
import { logger } from '@/shared/utils/logger';

export class DatabaseQueryWrapper {
  private static instance: DatabaseQueryWrapper;
  
  private constructor() {}
  
  static getInstance(): DatabaseQueryWrapper {
    if (!DatabaseQueryWrapper.instance) {
      DatabaseQueryWrapper.instance = new DatabaseQueryWrapper();
    }
    return DatabaseQueryWrapper.instance;
  }

  private async ensureAuthenticatedClient() {
    try {
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        logger.error('No valid session available');
        throw new Error('No valid session available');
      }

      // Ensure the session is properly set in the Supabase client
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession || currentSession.access_token !== session.access_token) {
        logger.debug('Setting session in Supabase client...');
        const { error: setError } = await supabase.auth.setSession(session);
        if (setError) {
          logger.error('Failed to set session in client:', setError);
          throw new Error('Failed to set session: ' + setError.message);
        }
        logger.debug('Session set successfully in client');
      }
      
      return session;
    } catch (error) {
      logger.error('Failed to ensure authenticated client:', error);
      throw error;
    }
  }

  async query<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    context: string = 'unknown'
  ): Promise<{ data: T | null; error: any }> {
    try {
      logger.debug(`Ensuring authenticated client for query: ${context}`);
      await this.ensureAuthenticatedClient();
      
      logger.debug(`Executing database query: ${context}`);
      const result = await queryFn();
      
      if (result.error) {
        logger.error(`Database query failed: ${context}`, result.error);
      } else {
        logger.debug(`Database query successful: ${context}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Database query error: ${context}`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async userQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    userId: string,
    context: string = 'user-query'
  ): Promise<{ data: T | null; error: any }> {
    try {
      // Ensure authenticated client first
      const session = await this.ensureAuthenticatedClient();
      
      // Verify the user is authenticated and matches the requested userId
      if (session.user.id !== userId) {
        logger.warn(`Unauthorized access attempt in ${context} for user ${userId}`);
        return { data: null, error: { message: 'Unauthorized access' } };
      }
      
      logger.debug(`Executing user query: ${context} for user ${userId}`);
      return this.query(queryFn, context);
    } catch (error) {
      logger.error(`User query error: ${context}`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async companyQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    companyId: string,
    context: string = 'company-query'
  ): Promise<{ data: T | null; error: any }> {
    try {
      // Ensure authenticated client first
      const session = await this.ensureAuthenticatedClient();
      
      // Verify user belongs to the company
      const { data: profile, error: profileError } = await this.query(
        async () => {
          const result = await supabase
            .from('user_profiles')
            .select('company_id')
            .eq('id', session.user.id)
            .single();
          return result;
        },
        'company-verification'
      );
      
      if (profileError || !profile) {
        logger.error(`Failed to verify company access: ${context}`, profileError);
        return { data: null, error: { message: 'Failed to verify company access' } };
      }
      
      if (profile.company_id !== companyId) {
        logger.warn(`Unauthorized company access attempt in ${context} for company ${companyId}`);
        return { data: null, error: { message: 'Unauthorized company access' } };
      }
      
      logger.debug(`Executing company query: ${context} for company ${companyId}`);
      return this.query(queryFn, context);
    } catch (error) {
      logger.error(`Company query error: ${context}`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Convenience methods for common operations
  async getUserProfile(userId: string) {
    return this.userQuery(
      async () => {
        const result = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        return result;
      },
      userId,
      'get-user-profile'
    );
  }

  async updateUserProfile(userId: string, updates: any) {
    return this.userQuery(
      async () => {
        const result = await supabase
          .from('user_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();
        return result;
      },
      userId,
      'update-user-profile'
    );
  }
} 