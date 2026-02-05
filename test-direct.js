#!/usr/bin/env node
// Direct OpenClaw API test
const fetch = require('node-fetch');

async function testDirect() {
  console.log('Testing direct OpenClaw API...');
  
  // Try different endpoints
  const endpoints = [
    'http://localhost:18789/api/chat',
    'http://localhost:18789/api/completions', 
    'http://localhost:18789/chat',
    'http://localhost:18789/completions',
    'http://localhost:18789/v1/completions'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTrying ${endpoint}...`);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-openclaw-local'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4o'
        })
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        const data = await response.text();
        console.log('Response:', data.substring(0, 200));
        break;
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
  }
  
  // Also try GET to see what's available
  console.log('\n\nChecking available endpoints via GET...');
  const getEndpoints = [
    'http://localhost:18789/',
    'http://localhost:18789/api',
    'http://localhost:18789/v1',
    'http://localhost:18789/health'
  ];
  
  for (const endpoint of getEndpoints) {
    try {
      const response = await fetch(endpoint);
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${endpoint}: Error - ${error.message}`);
    }
  }
}

testDirect().catch(console.error);