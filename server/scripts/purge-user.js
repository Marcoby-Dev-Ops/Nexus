#!/usr/bin/env node
// server/scripts/purge-user.js
// -----------------------------------------------------------------------------
// Safely purge a user and related data from the Nexus database so they can
// re-provision cleanly through the Authentik OIDC onboarding flow.
//
// Features:
//  - Lookup by --user-id OR --email (email matched in user_profiles.email OR business_email OR personal_email)
//  - Dry-run mode (default) shows what would be deleted and row counts
//  - --confirm required to actually perform deletion
//  - Optional deletion of companies the user owns (if --delete-owned-companies supplied)
//  - Protects against deleting multiple users unless --force-multi specified
//  - Orders deletions to satisfy FK constraints (child tables first)
//  - Wraps all mutations in a single transaction; rolls back on error
//  - Summarizes results
//
// Usage examples:
//   node server/scripts/purge-user.js --email="user@example.com"              (dry-run)
//   node server/scripts/purge-user.js --email="user@example.com" --confirm
//   node server/scripts/purge-user.js --user-id=AUTHENTIK_SUB --confirm --delete-owned-companies
//   node server/scripts/purge-user.js --email="user@example.com" --confirm --force-multi
//
// Exit codes:
//   0 success (or no-op in dry-run)
//   1 fatal error
//   2 not found / no matching users
//   3 multiple matches without --force-multi
// -----------------------------------------------------------------------------

const { Pool } = require('pg');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('user-id', { type: 'string', description: 'Exact Authentik user id (user_profiles.user_id)' })
  .option('email', { type: 'string', description: 'Email to match (matches email, business_email, personal_email)' })
  .option('confirm', { type: 'boolean', default: false, description: 'Actually perform the purge (otherwise dry-run)' })
  .option('delete-owned-companies', { type: 'boolean', default: false, description: 'Delete companies where this user is owner_id (and related members)' })
  .option('force-multi', { type: 'boolean', default: false, description: 'Allow purging when multiple users match (by email search)' })
  .option('json', { type: 'boolean', default: false, description: 'Output JSON summary only (machine readable)' })
  .option('connection', { type: 'string', description: 'Override DATABASE_URL/Postgres connection string' })
  .help()
  .alias('h', 'help')
  .argv;

if (!argv['user-id'] && !argv.email) {
  console.error('Error: provide either --user-id or --email');
  process.exit(1);
}

const pool = new Pool({
  connectionString: argv.connection || process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgres://postgres@localhost:5432/nexus'
});

async function findTargetUsers(client) {
  if (argv['user-id']) {
    const { rows } = await client.query(`SELECT * FROM user_profiles WHERE user_id = $1`, [argv['user-id']]);
    return rows;
  }
  const email = argv.email.toLowerCase();
  const { rows } = await client.query(
    `SELECT * FROM user_profiles WHERE LOWER(email) = $1 OR LOWER(business_email) = $1 OR LOWER(personal_email) = $1`,
    [email]
  );
  return rows;
}

const userRelatedTables = [
  // Order matters: children first
  { table: 'ai_messages', where: 'conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = $1)', key: 'ai_messages' },
  { table: 'ai_message_attachments', where: 'conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = $1)', key: 'ai_message_attachments', optional: true },
  { table: 'ai_conversations', where: 'user_id = $1', key: 'ai_conversations' },
  { table: 'ai_memories', where: 'user_id = $1', key: 'ai_memories', optional: true },
  { table: 'oauth_tokens', where: 'user_id = $1', key: 'oauth_tokens' },
  { table: 'user_integrations', where: 'user_id = $1', key: 'user_integrations' },
  { table: 'business_health_snapshots', where: 'user_id = $1', key: 'business_health_snapshots' },
  { table: 'onboarding_progress', where: 'user_id = $1', key: 'onboarding_progress', optional: true },
  { table: 'company_members', where: 'user_id = $1', key: 'company_members' },
  { table: 'user_preferences', where: 'user_id = $1', key: 'user_preferences' },
  { table: 'user_organizations', where: 'user_id = $1', key: 'user_organizations' },
  // Finally the profile
  { table: 'user_profiles', where: 'user_id = $1', key: 'user_profiles' }
];

async function filterExistingTables(client, tables) {
  const existing = [];
  for (const t of tables) {
    try {
      const { rows } = await client.query(`SELECT to_regclass($1) as reg`, [t.table]);
      if (rows[0].reg) {
        existing.push(t);
      } else if (!t.optional) {
        console.warn(`[purge] WARNING: required table ${t.table} does not exist; marking as skipped.`);
      } else {
        console.log(`[purge] Skipping missing optional table ${t.table}`);
      }
    } catch (err) {
      console.warn(`[purge] Could not check table ${t.table}: ${err.message}`);
    }
  }
  return existing;
}

async function countRows(client, userId) {
  const counts = {};
  for (const t of userRelatedTables) {
    // Some tables may not exist in some environments (optional migrations)
    try {
      const { rows } = await client.query(`SELECT COUNT(*)::int AS c FROM ${t.table} WHERE ${t.where}`, [userId]);
      counts[t.key] = rows[0].c;
    } catch (err) {
      if (t.optional && /relation .* does not exist/i.test(err.message)) {
        counts[t.key] = 0;
      } else if (/relation .* does not exist/i.test(err.message)) {
        counts[t.key] = 'n/a';
      } else {
        throw err;
      }
    }
  }
  return counts;
}

async function deleteRows(client, userId) {
  const delCounts = {};
  for (const t of userRelatedTables) {
    try {
      console.log(`[purge] Deleting from ${t.table} for user ${userId} ...`);
      const { rowCount } = await client.query(`DELETE FROM ${t.table} WHERE ${t.where}`, [userId]);
      delCounts[t.key] = rowCount;
      console.log(`[purge]   -> deleted ${rowCount}`);
    } catch (err) {
      if (t.optional && /relation .* does not exist/i.test(err.message)) {
        delCounts[t.key] = 0;
        console.log(`[purge]   -> table ${t.table} missing (optional)`);
      } else if (/relation .* does not exist/i.test(err.message)) {
        delCounts[t.key] = 'n/a';
        console.log(`[purge]   -> table ${t.table} missing (non-optional)`);
      } else {
        console.error(`[purge] ERROR deleting from ${t.table}:`, err.message);
        throw err;
      }
    }
  }
  return delCounts;
}

async function getOwnedCompanies(client, userId) {
  const { rows } = await client.query(`SELECT id, name FROM companies WHERE owner_id = $1`, [userId]);
  return rows;
}

async function deleteOwnedCompanies(client, companies) {
  const results = [];
  for (const c of companies) {
    // Rely on ON DELETE CASCADE for company_members etc.
    const { rowCount } = await client.query(`DELETE FROM companies WHERE id = $1`, [c.id]);
    results.push({ company_id: c.id, name: c.name, deleted: rowCount === 1 });
  }
  return results;
}

(async () => {
  const client = await pool.connect();
  try {
    const targets = await findTargetUsers(client);
    if (!targets.length) {
      if (!argv.json) console.error('No matching users found.');
      process.exit(2);
    }
    if (targets.length > 1 && !argv['force-multi']) {
      if (!argv.json) {
        console.error(`Multiple users matched (${targets.length}). Re-run with --force-multi to proceed or refine criteria.`);
        targets.forEach(u => console.error(` - user_id=${u.user_id} email=${u.email || '<none>'}`));
      }
      process.exit(3);
    }

    const summary = { mode: argv.confirm ? 'purge' : 'dry-run', users: [] };

    for (const user of targets) {
      const userId = user.user_id;
      const counts = await countRows(client, userId);
      const ownedCompanies = await getOwnedCompanies(client, userId);

      summary.users.push({
        user_id: userId,
        email: user.email,
        display_name: user.display_name,
        deletion_plan: counts,
        owned_companies: ownedCompanies.map(c => ({ id: c.id, name: c.name }))
      });
    }

    if (!argv.confirm) {
      if (argv.json) {
        console.log(JSON.stringify(summary, null, 2));
      } else {
        console.log('=== DRY RUN (no data deleted) ===');
        console.log(JSON.stringify(summary, null, 2));
        console.log('\nRe-run with --confirm to execute.');
      }
      process.exit(0);
    }

    // Preflight filter tables to those that exist to prevent transaction abort on missing tables
    const existingTables = await filterExistingTables(client, userRelatedTables);

    await client.query('BEGIN');

    for (const user of targets) {
      const userId = user.user_id;
      // Temporarily replace global list for deletion phase
      const originalList = userRelatedTables.splice(0, userRelatedTables.length, ...existingTables);
      const delCounts = await deleteRows(client, userId);
      // Restore list (not strictly necessary for single run)
      userRelatedTables.splice(0, userRelatedTables.length, ...originalList);
      let companyResults = [];
      if (argv['delete-owned-companies']) {
        const ownedCompanies = await getOwnedCompanies(client, userId);
        companyResults = await deleteOwnedCompanies(client, ownedCompanies);
      }
      const entry = summary.users.find(u => u.user_id === userId);
      entry.deleted = delCounts;
      entry.deleted_owned_companies = companyResults;
    }

    await client.query('COMMIT');

    if (argv.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log('=== PURGE COMPLETE ===');
      console.log(JSON.stringify(summary, null, 2));
    }
    process.exit(0);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    if (!argv.json) console.error('Error during purge:', err);
    else console.log(JSON.stringify({ error: err.message }));
    process.exit(1);
  } finally {
    client.release();
  }
})();
