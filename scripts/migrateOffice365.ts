import 'dotenv/config';
import { unifiedInboxService } from '../src/lib/services/unifiedInboxService';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file');
  console.error('Found URL:', supabaseUrl ? '✅' : '❌');
  console.error('Found Key:', anonKey ? '✅' : '❌');
  process.exit(1);
}

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: pnpm tsx scripts/migrateOffice365.ts <USER_ID>');
  process.exit(1);
}

console.log('Loaded env:', supabaseUrl, anonKey ? anonKey.substring(0, 8) + '...' : undefined);
console.log('Migrating Office 365 integrations for user:', userId);

(async () => {
  try {
    const result = await unifiedInboxService.migrateOffice365IntegrationsToEmailAccountsForUser(userId);
    console.log('Migration result:', result);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
