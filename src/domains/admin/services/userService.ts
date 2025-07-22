import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

class UserService {
  async deleteAccount(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // In a real application, this should call a backend function
      // that deletes all user data from all tables, revokes tokens,
      // and performs other cleanup.
      logger.warn({ userId: user.id }, 'User initiated account deletion. For now, only signing out.');

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirect to home page after sign out
      window.location.href = '/';

    } catch (error) {
      logger.error({ err: error }, 'Failed to delete account');
      throw new Error('Failed to delete account.');
    }
  }
  
  async getLoginHistory(limit: number = 5): Promise<any[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('audit_log_events')
            .select('payload')
            .eq('actor_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        // The action is stored in the payload, so we need to extract it.
        return data.map((d: any) => ({
            action: d.payload.action,
            timestamp: d.payload.timestamp,
            ...d.payload
        }));
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch login history');
        return [];
    }
  }
}

export const userService = new UserService(); 