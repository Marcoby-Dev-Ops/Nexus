#!/usr/bin/env node
/*
  Simple validation script that runs a list of sample queries against the server RPC /api/rpc/match_facts
  and logs the results to console. It expects API_URL and API_TOKEN environment variables (or default to http://localhost:3001)
*/
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TOKEN = process.env.API_TOKEN || null;

const samples = [
  'What is the company policy on refunds?',
  'Preferred contact method for John Doe',
  'Our SLA for enterprise customers',
  'List of critical security controls',
  'Company holiday schedule for 2025'
];

async function run() {
  for (const q of samples) {
    try {
      console.log('\n---');
      console.log('Query:', q);
      const res = await axios.post(
        `${API_URL}/api/rpc/match_facts`,
        { query: q, match_count: 5 },
        { headers: { Authorization: TOKEN ? `Bearer ${TOKEN}` : '' } }
      );

      if (res.data && res.data.success) {
        const rows = res.data.data || [];
        console.log('Matches:', rows.length);
        rows.forEach((r, i) => {
          console.log(`#${i + 1}: (${(r.score || r.similarity || 0).toFixed(3)}) [${r.kind}] ${r.key} -> ${r.value.slice(0, 120)}${r.value.length>120?"...":""}`);
        });
      } else {
        console.warn('RPC did not return success', res.data);
      }
    } catch (err) {
      console.error('Query failed', err?.message || err);
    }
  }
}

run().catch(e => {
  console.error('Validation script failed', e?.message || e);
  process.exit(1);
});
