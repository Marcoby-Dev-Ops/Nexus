#!/usr/bin/env node
require('../loadEnv');

const { query, closePool } = require('../src/database/connection');

function parseArgs(argv = []) {
  const args = { userId: process.env.KNOWLEDGE_SEED_USER_ID || '', agentId: 'executive-assistant', dryRun: false };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--user' || value === '-u') {
      args.userId = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (value === '--agent' || value === '-a') {
      args.agentId = argv[index + 1] || args.agentId;
      index += 1;
      continue;
    }

    if (value === '--dry-run') {
      args.dryRun = true;
    }
  }

  return args;
}

function buildSeedFacts({ userId, agentId }) {
  return [
    {
      subjectType: 'user',
      subjectId: userId,
      horizon: 'short',
      domain: 'conversation',
      factKey: 'current_focus',
      factValue: { focus: 'knowledge foundation and context enforcement', updatedBy: 'seed-script' },
      source: 'seed-script',
      confidence: 0.88,
      ttlSeconds: 60 * 60 * 24,
      tags: ['foundation', 'knowledge', 'short-term']
    },
    {
      subjectType: 'user',
      subjectId: userId,
      horizon: 'medium',
      domain: 'execution',
      factKey: 'primary_goal',
      factValue: { goal: 'ship AI operating system MVP', targetQuarter: '2026-Q1' },
      source: 'seed-script',
      confidence: 0.92,
      ttlSeconds: null,
      tags: ['goal', 'mvp']
    },
    {
      subjectType: 'agent',
      subjectId: agentId,
      horizon: 'long',
      domain: 'assistant',
      factKey: 'operating_principle',
      factValue: { principle: 'Prefer deterministic backend context before generation.' },
      source: 'seed-script',
      confidence: 0.95,
      ttlSeconds: null,
      tags: ['agent', 'policy']
    },
    {
      subjectType: 'shared',
      subjectId: 'global',
      horizon: 'long',
      domain: 'platform',
      factKey: 'vision',
      factValue: { statement: 'Nexus is an AI operating system for individuals, teams, and enterprises.' },
      source: 'seed-script',
      confidence: 0.97,
      ttlSeconds: null,
      tags: ['platform', 'vision']
    }
  ];
}

async function tableExists(tableName) {
  const result = await query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [tableName]
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return Boolean(result.data?.[0]?.exists);
}

async function upsertFact(fact) {
  const result = await query(
    `INSERT INTO knowledge_facts (
      subject_type,
      subject_id,
      horizon,
      domain,
      fact_key,
      fact_value,
      source,
      confidence,
      status,
      ttl_seconds,
      tags,
      metadata,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, 'active', $9, $10::text[], $11::jsonb, 'seed-script')
    ON CONFLICT (subject_type, subject_id, horizon, domain, fact_key)
    DO UPDATE SET
      fact_value = EXCLUDED.fact_value,
      source = EXCLUDED.source,
      confidence = EXCLUDED.confidence,
      status = 'active',
      ttl_seconds = EXCLUDED.ttl_seconds,
      tags = EXCLUDED.tags,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING id, subject_type, subject_id, horizon, domain, fact_key`,
    [
      fact.subjectType,
      fact.subjectId,
      fact.horizon,
      fact.domain,
      fact.factKey,
      JSON.stringify(fact.factValue || {}),
      fact.source || 'seed-script',
      fact.confidence || 0.8,
      fact.ttlSeconds,
      fact.tags || [],
      JSON.stringify({ seededAt: new Date().toISOString() })
    ]
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data?.[0];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.userId) {
    console.error('Missing required user id. Use --user <userId> or set KNOWLEDGE_SEED_USER_ID.');
    process.exit(1);
  }

  try {
    const exists = await tableExists('knowledge_facts');
    if (!exists) {
      console.error('knowledge_facts table does not exist. Run migrations first.');
      process.exit(1);
    }

    const facts = buildSeedFacts({ userId: args.userId, agentId: args.agentId });
    console.log(`Preparing ${facts.length} knowledge facts for user=${args.userId}, agent=${args.agentId}`);

    if (args.dryRun) {
      console.log('Dry run mode: no rows written.');
      for (const fact of facts) {
        console.log(`- ${fact.subjectType}/${fact.subjectId} ${fact.horizon} ${fact.domain}.${fact.factKey}`);
      }
      return;
    }

    const inserted = [];
    for (const fact of facts) {
      const row = await upsertFact(fact);
      inserted.push(row);
      console.log(`Upserted ${row.subject_type}/${row.subject_id} ${row.horizon} ${row.domain}.${row.fact_key}`);
    }

    console.log(`Done. Upserted ${inserted.length} fact(s).`);
  } catch (error) {
    console.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
