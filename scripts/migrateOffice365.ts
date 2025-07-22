import 'dotenv/config';
// This script previously used unifiedInboxService, which is now removed.
// If migration logic is still needed, refactor to use owaInboxService or remove this script if obsolete.

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
    // The original script used unifiedInboxService.migrateOffice365IntegrationsToEmailAccountsForUser.
    // Since unifiedInboxService is removed, this part of the script is now obsolete.
    // If migration logic is still needed, it must be refactored to use owaInboxService or removed.
    console.warn('This script is now obsolete as unifiedInboxService is removed. No migration logic executed.');
    process.exit(0); // Exit gracefully as no migration is performed.
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
