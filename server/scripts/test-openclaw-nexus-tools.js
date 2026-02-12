#!/usr/bin/env node

/**
 * End-to-end Nexus tool bridge verifier for OpenClaw.
 *
 * What it checks:
 * 1) Bridge health endpoint
 * 2) Tool catalog discovery
 * 3) Direct tool execution through /api/openclaw/tools/execute
 * 4) Optional /api/ai/chat path check (requires NEXUS_BEARER_TOKEN)
 *
 * Usage:
 *   NEXUS_API_URL=https://napi.marcoby.net \
 *   OPENCLAW_API_KEY=openclaw-default-key \
 *   NEXUS_USER_ID=<nexus-user-id> \
 *   node scripts/test-openclaw-nexus-tools.js
 *
 * Optional:
 *   NEXUS_BEARER_TOKEN=<jwt>   # enables /api/ai/chat check
 *   REQUIRE_TOOL_USAGE=1       # fail if /api/ai/chat does not report toolUsage.used=true
 */

const axios = require('axios');

const CONFIG = {
  baseUrl: String(process.env.NEXUS_API_URL || 'https://napi.marcoby.net').replace(/\/+$/, ''),
  apiKey: process.env.OPENCLAW_API_KEY || 'openclaw-default-key',
  userId: process.env.NEXUS_USER_ID || 'openclaw-system-user',
  bearerToken: process.env.NEXUS_BEARER_TOKEN || '',
  timeoutMs: Number(process.env.TEST_TIMEOUT_MS || 20000)
};
const REQUIRE_TOOL_USAGE = String(process.env.REQUIRE_TOOL_USAGE || '').trim() === '1';

const EXPECTED_NEXUS_TOOLS = [
  'nexus_get_integration_status',
  'nexus_search_emails',
  'nexus_resolve_email_provider',
  'nexus_start_email_connection',
  'nexus_connect_imap',
  'nexus_test_integration_connection',
  'nexus_disconnect_integration'
];

function divider() {
  console.log('------------------------------------------------------------');
}

function printConfig() {
  console.log('Nexus Tool Bridge Test');
  divider();
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`API Key: ${CONFIG.apiKey ? '***set***' : 'NOT SET'}`);
  console.log(`Nexus User ID: ${CONFIG.userId}`);
  console.log(`Bearer Token (/api/ai/chat check): ${CONFIG.bearerToken ? '***set***' : 'NOT SET (optional check will be skipped)'}`);
  divider();
}

function makeBridgeClient() {
  return axios.create({
    baseURL: CONFIG.baseUrl,
    timeout: CONFIG.timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      'X-OpenClaw-Api-Key': CONFIG.apiKey
    }
  });
}

async function checkBridgeHealth(client) {
  process.stdout.write('1) Checking /api/openclaw/health ... ');
  const response = await client.get('/api/openclaw/health');
  if (!response.data?.success) {
    throw new Error(`Health endpoint responded but success=false: ${JSON.stringify(response.data)}`);
  }
  console.log('OK');
  return response.data;
}

async function checkToolCatalog(client) {
  process.stdout.write('2) Checking /api/openclaw/tools/catalog ... ');
  const response = await client.get('/api/openclaw/tools/catalog');
  if (!response.data?.success || !Array.isArray(response.data?.tools)) {
    throw new Error(`Invalid catalog payload: ${JSON.stringify(response.data)}`);
  }

  const discovered = response.data.tools.map((tool) => tool.name).filter(Boolean);
  const missing = EXPECTED_NEXUS_TOOLS.filter((tool) => !discovered.includes(tool));
  if (missing.length) {
    throw new Error(`Catalog missing expected Nexus tools: ${missing.join(', ')}`);
  }

  console.log(`OK (${discovered.length} tools, all Nexus tools present)`);
  return {
    discovered,
    metadata: response.data.metadata || null
  };
}

async function checkToolExecution(client) {
  process.stdout.write('3) Checking /api/openclaw/tools/execute (nexus_get_integration_status) ... ');
  const response = await client.post(
    '/api/openclaw/tools/execute',
    {
      tool: 'nexus_get_integration_status',
      args: {}
    },
    {
      headers: {
        'X-Nexus-User-Id': CONFIG.userId
      }
    }
  );

  if (!response.data?.success) {
    throw new Error(`Tool execute responded but success=false: ${JSON.stringify(response.data)}`);
  }

  const integrationCount = Array.isArray(response.data?.result?.integrations)
    ? response.data.result.integrations.length
    : 'n/a';
  console.log(`OK (integrations returned: ${integrationCount})`);
  return response.data;
}

async function checkAiChatPath() {
  if (!CONFIG.bearerToken) {
    console.log('4) Skipping /api/ai/chat check (set NEXUS_BEARER_TOKEN to enable)');
    return { skipped: true };
  }

  process.stdout.write('4) Checking /api/ai/chat (tool-routing path smoke test) ... ');
  const response = await axios.post(
    `${CONFIG.baseUrl}/api/ai/chat`,
    {
      stream: false,
      conversationId: `tool-check-${Date.now()}`,
      messages: [
        {
          role: 'user',
          content: 'Connect my email founder@contoso.com, resolve the provider, and then check current integration status.'
        }
      ]
    },
    {
      timeout: CONFIG.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CONFIG.bearerToken}`
      }
    }
  );

  const payload = response.data || {};
  const modelWay = payload?.metadata?.modelWay || null;
  const toolUsage = payload?.metadata?.toolUsage || null;
  const content = String(payload?.content || '').trim();
  if (!content) {
    throw new Error('Chat call succeeded but returned empty content');
  }
  if (REQUIRE_TOOL_USAGE && !toolUsage?.used) {
    throw new Error('Chat call completed but no tool usage metadata was observed (REQUIRE_TOOL_USAGE=1).');
  }
  const toolSummary = toolUsage?.used ? `tools=${toolUsage.tools.join(', ')}` : 'tools=none observed';
  console.log(`OK (intent=${modelWay?.intent?.id || 'n/a'}, phase=${modelWay?.phase?.id || 'n/a'}, ${toolSummary})`);
  return {
    intent: modelWay?.intent?.id || null,
    phase: modelWay?.phase?.id || null,
    toolUsage,
    contentPreview: content.slice(0, 180)
  };
}

function printSummary(summary) {
  divider();
  console.log('Summary');
  divider();
  console.log(`Health: ${summary.health ? 'PASS' : 'FAIL'}`);
  console.log(`Catalog: ${summary.catalog ? 'PASS' : 'FAIL'}`);
  console.log(`Execute: ${summary.execute ? 'PASS' : 'FAIL'}`);
  if (summary.chat?.skipped) {
    console.log('AI Chat Path: SKIPPED (no NEXUS_BEARER_TOKEN)');
  } else {
    console.log(`AI Chat Path: ${summary.chat ? 'PASS' : 'FAIL'}`);
    if (summary.chat?.toolUsage?.used) {
      console.log(`AI Chat Tool Usage: ${summary.chat.toolUsage.tools.join(', ')}`);
    } else {
      console.log('AI Chat Tool Usage: none observed');
    }
  }

  if (summary.catalog?.metadata) {
    console.log(`Catalog Version: ${summary.catalog.metadata.catalogVersion || 'n/a'}`);
  }

  console.log('');
  console.log('If tools still do not surface in assistant responses, check server logs for "modelWayTools" and "OpenClaw tool usage observed" on /api/ai/chat requests.');
}

async function main() {
  printConfig();
  const client = makeBridgeClient();
  const summary = {};

  try {
    summary.health = await checkBridgeHealth(client);
    summary.catalog = await checkToolCatalog(client);
    summary.execute = await checkToolExecution(client);
    summary.chat = await checkAiChatPath();
    printSummary(summary);
  } catch (error) {
    divider();
    console.error('FAILED');
    divider();
    console.error(error?.message || String(error));
    if (error?.response?.status) {
      console.error(`HTTP ${error.response.status}`);
    }
    if (error?.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
