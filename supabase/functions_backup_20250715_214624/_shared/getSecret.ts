import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// A simple in-memory cache to avoid fetching the same key multiple times per function invocation
const secretCache = new Map<string, string>();

export async function getSecret(name: string): Promise<string | null> {
  if (secretCache.has(name)) {
    return secretCache.get(name)!;
  }

  const { data, error } = await supabaseAdmin
    .from('decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', name)
    .single();

  if (error) {
    console.error(`Error fetching secret: ${name}`, error);
    // Return null instead of throwing to allow for graceful handling
    return null;
  }

  if (!data) {
    console.warn(`Secret not found: ${name}`);
    return null;
  }

  const secret = data.decrypted_secret;
  secretCache.set(name, secret);

  return secret;
} 