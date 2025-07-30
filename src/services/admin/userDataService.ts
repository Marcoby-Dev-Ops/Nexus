import { supabase, select } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

class UserDataService {
  async exportUserData(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const [
        recents,
        pins,
        tasks,
        notifications
      ] = await Promise.all([
        select('recents', '*', { user_id: user.id }),
        select('pins', '*', { user_id: user.id }),
        select('tasks', '*', { user_id: user.id }),
        select('notifications', '*', { user_id: user.id }),
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