#!/usr/bin/env node
require('../loadEnv');

const { closePool } = require('../src/database/connection');
const { assembleKnowledgeContext } = require('../src/services/knowledgeContextService');

function parseArgs(argv = []) {
  const args = {
    userId: process.env.KNOWLEDGE_VALIDATE_USER_ID || '',
    agentId: 'executive-assistant',
    conversationId: null,
    maxBlocks: 10
  };

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

    if (value === '--conversation' || value === '-c') {
      args.conversationId = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (value === '--max-blocks') {
      const parsed = Number.parseInt(argv[index + 1] || '', 10);
      if (Number.isFinite(parsed)) args.maxBlocks = parsed;
      index += 1;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.userId) {
    console.error('Missing required user id. Use --user <userId> or set KNOWLEDGE_VALIDATE_USER_ID.');
    process.exit(1);
  }

  try {
    const context = await assembleKnowledgeContext({
      userId: args.userId,
      agentId: args.agentId,
      conversationId: args.conversationId,
      includeShort: true,
      includeMedium: true,
      includeLong: true,
      maxBlocks: args.maxBlocks
    });

    console.log(`Context digest: ${context.contextDigest}`);
    console.log(`Resolved agent: ${context.resolved.agentId}`);
    console.log(`Blocks: ${context.contextBlocks.length}`);
    console.log(`Horizon usage: short=${context.horizonUsage.short}, medium=${context.horizonUsage.medium}, long=${context.horizonUsage.long}`);
    console.log(`Sources: ${context.sources.map((source) => source.id).join(', ') || 'none'}`);
    console.log(`Estimated tokens: ${context.tokenEstimate}`);
    console.log('');

    for (const block of context.contextBlocks) {
      console.log(`[${block.horizon}] ${block.title}`);
      console.log(`  source=${block.source} subject=${block.subjectType}:${block.subjectId}`);
    }

    if (context.contextBlocks.length === 0) {
      console.error('Validation failed: no context blocks were assembled.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
