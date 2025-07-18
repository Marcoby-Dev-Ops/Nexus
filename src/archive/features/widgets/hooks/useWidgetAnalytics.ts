import { supabase } from "@/core/supabase";

export type WidgetEventType = 'view' | 'click' | 'dismiss' | 'action' | 'custom';

export interface WidgetEventPayload {
  [key: string]: any;
}

export function useWidgetAnalytics() {
  async function logWidgetEvent(
    widget_id: string,
    event_type: WidgetEventType,
    event_payload?: WidgetEventPayload
  ): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase.from('WidgetEvent').insert([
      {
        widget_id,
        event_type,
        event_payload: event_payload || null,
      },
    ]);
    if (error) {
      // Optionally log error to a monitoring service
      return { success: false, error };
    }
    return { success: true };
  }

  return { logWidgetEvent };
} 