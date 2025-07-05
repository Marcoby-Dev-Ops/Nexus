import { supabase } from '@/lib/core/supabase';

/**
 * Centralised helper to invoke Supabase Edge Functions.
 * Automatically includes the current session auth token and
 * throws on error to simplify consumer code.
 */
export async function callEdgeFunction<T = any>(
  name: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body: payload,
  });

  if (error) {
    // Re-throw so calling code can handle in one place
    throw error;
  }

  return data as T;
}