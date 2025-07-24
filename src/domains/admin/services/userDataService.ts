import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

class UserDataService {
  async exportUserData(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const [
        { data: recents },
        { data: pins },
        { data: tasks },
        { data: notifications }
      ] = await Promise.all([
        supabase.from('recents').select('*').eq('user_id', user.id),
        supabase.from('pins').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('notifications').select('*').eq('user_id', user.id),
      ]);

      const userExport = {
        profile: {
          id: user.id,
          email: user.email,
          createdat: user.created_at,
        },
        data: {
          recents,
          pins,
          tasks,
          notifications,
        },
        exportedat: new Date().toISOString(),
      };

      return JSON.stringify(userExport, null, 2);
    } catch (error) {
      logger.error({ err: error }, 'Failed to export user data');
      throw new Error('Failed to export user data.');
    }
  }
}

export const userDataService = new UserDataService(); 