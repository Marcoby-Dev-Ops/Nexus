#!/usr/bin/env node
// scripts/delete-empty-conversations.js
// Usage:
//   node scripts/delete-empty-conversations.js --dry-run
//   node scripts/delete-empty-conversations.js --confirm --days=7 --userId=<user-id>

const { Pool } = require('pg');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('dry-run', { type: 'boolean', default: false, description: 'List but do not delete' })
  .option('confirm', { type: 'boolean', default: false, description: 'Actually perform deletions' })
  .option('userId', { type: 'string', description: 'Limit to this user id' })
  .option('days', { type: 'number', description: 'Only consider conversations created within N days' })
  .help()
  .argv;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgres://postgres@localhost:5432/nexus'
});

(async () => {
  try {
    const whereClauses = ['TRUE'];
    const params = [];
    let idx = 1;

    if (argv.userId) {
      whereClauses.push(`user_id = $${idx++}`);
      params.push(argv.userId);
    }

    if (argv.days) {
      whereClauses.push(`created_at >= now() - ($${idx++}::int * interval '1 day')`);
      params.push(argv.days);
    }

    // Find conversations that have 0 messages
    const query = `
      SELECT c.id, c.title, c.user_id, c.created_at, c.updated_at, COALESCE(m.count, 0) as message_count
      FROM ai_conversations c
      LEFT JOIN (
        SELECT conversation_id, COUNT(*) as count
        FROM ai_messages
        GROUP BY conversation_id
      ) m ON m.conversation_id = c.id
      WHERE (${whereClauses.join(' AND ')})
        AND COALESCE(m.count, 0) = 0
      ORDER BY c.created_at DESC
    `;

    const { rows } = await pool.query(query, params);

    if (!rows.length) {
      console.log('No empty conversations found with provided filters.');
      process.exit(0);
    }

    console.log(`Found ${rows.length} empty conversations:`);
    rows.forEach(r => console.log(`- ${r.id} | ${r.title || '<no title>'} | user:${r.user_id} | created:${r.created_at}`));

    if (argv['dry-run'] || !argv.confirm) {
      console.log('\nDry-run mode. No conversations were deleted.');
      console.log('Run with --confirm to actually delete, and consider --userId or --days to narrow the selection.');
      process.exit(0);
    }

    // Delete in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const r of rows) {
        await client.query('DELETE FROM ai_messages WHERE conversation_id = $1', [r.id]);
        await client.query('DELETE FROM ai_conversations WHERE id = $1', [r.id]);
        console.log(`Deleted conversation ${r.id}`);
      }

      await client.query('COMMIT');
      console.log('Deletion complete.');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
