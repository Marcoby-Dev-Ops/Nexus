import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/security/logger';

export async function sendAuditLog(action: string, details: Record<string, any> = {}) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    await supabase.from('ai_audit_logs').insert({
      user_id: userId,
      action,
      table_name: 'client_event',
      record_id: null,
      details,
    });
  } catch (err) {
    logger.error({ err, action }, 'Failed to insert audit log');
  }
} 