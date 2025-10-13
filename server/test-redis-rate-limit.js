#!/usr/bin/env node
/**
 * Test Redis-based rate limiting
 * This script verifies that rate limits are stored in Redis
 */

const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const REDIS_CONTAINER = process.env.REDIS_CONTAINER || 'nexus-redis';

async function checkRedisKeys() {
  try {
    const { stdout } = await execAsync(`docker exec ${REDIS_CONTAINER} redis-cli KEYS "rl:*"`);
    const keys = stdout.trim().split('\n').filter(k => k);
    return keys;
  } catch (error) {
    console.error('Error checking Redis keys:', error.message);
    return [];
  }
}

async function testRateLimitingWithRedis() {
  console.log('🧪 Testing Redis-Based Rate Limiting\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Clear any existing rate limit keys
    console.log('1️⃣  Clearing existing rate limit data...');
    try {
      await execAsync(`docker exec ${REDIS_CONTAINER} redis-cli FLUSHDB`);
      console.log('   ✅ Redis flushed\n');
    } catch (error) {
      console.log('   ⚠️  Could not flush Redis, continuing anyway\n');
    }

    // Check initial Redis state
    console.log('2️⃣  Checking initial Redis state...');
    let keys = await checkRedisKeys();
    console.log(`   📊 Rate limit keys in Redis: ${keys.length}`);
    if (keys.length > 0) {
      console.log(`   Keys: ${keys.join(', ')}`);
    }
    console.log();

    // Make requests to trigger rate limiting
    console.log('3️⃣  Making requests to populate rate limit data...');
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        axios.get(`${API_BASE_URL}/health`)
          .then(response => ({
            success: true,
            status: response.status,
            headers: {
              limit: response.headers['ratelimit-limit'],
              remaining: response.headers['ratelimit-remaining'],
              reset: response.headers['ratelimit-reset']
            }
          }))
          .catch(error => ({
            success: false,
            status: error.response?.status,
            error: error.message
          }))
      );
    }

    const results = await Promise.all(requests);
    const successful = results.filter(r => r.success).length;
    console.log(`   ✅ Made ${requests.length} requests: ${successful} successful\n`);

    // Check rate limit headers
    const firstSuccess = results.find(r => r.success);
    if (firstSuccess) {
      console.log('4️⃣  Rate limit headers:');
      console.log(`   Limit: ${firstSuccess.headers.limit}`);
      console.log(`   Remaining: ${firstSuccess.headers.remaining}`);
      console.log(`   Reset: ${firstSuccess.headers.reset}\n`);
    }

    // Check if data was stored in Redis
    console.log('5️⃣  Checking if rate limit data is in Redis...');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for async operations
    keys = await checkRedisKeys();
    console.log(`   📊 Rate limit keys in Redis: ${keys.length}`);
    
    if (keys.length > 0) {
      console.log(`   ✅ Redis is being used for rate limiting!\n`);
      console.log('   Keys found:');
      keys.forEach(key => console.log(`   - ${key}`));
      console.log();
      
      // Get a sample key value
      if (keys[0]) {
        try {
          const { stdout } = await execAsync(`docker exec ${REDIS_CONTAINER} redis-cli GET "${keys[0]}"`);
          console.log(`   Sample key value: ${stdout.trim()}\n`);
        } catch (error) {
          console.log(`   Could not read key value\n`);
        }
      }
    } else {
      console.log(`   ⚠️  No Redis keys found - using in-memory store\n`);
    }

    // Test rate limit enforcement
    console.log('6️⃣  Testing rate limit enforcement...');
    console.log('   Making many rapid requests...');
    
    const rapidRequests = [];
    for (let i = 0; i < 50; i++) {
      rapidRequests.push(
        axios.get(`${API_BASE_URL}/health`)
          .then(() => ({ status: 200 }))
          .catch(error => ({ status: error.response?.status || 500 }))
      );
    }
    
    const rapidResults = await Promise.all(rapidRequests);
    const ok = rapidResults.filter(r => r.status === 200).length;
    const rateLimited = rapidResults.filter(r => r.status === 429).length;
    
    console.log(`   Successful requests: ${ok}`);
    console.log(`   Rate limited (429): ${rateLimited}`);
    
    if (rateLimited > 0) {
      console.log(`   ✅ Rate limiting is enforcing limits\n`);
    } else {
      console.log(`   ℹ️  No requests were rate limited (limit might be high for dev mode)\n`);
    }

    // Final Redis check
    keys = await checkRedisKeys();
    console.log(`7️⃣  Final Redis key count: ${keys.length}\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📝 Summary:\n');
    console.log(`   ${keys.length > 0 ? '✅' : '❌'} Redis Integration: ${keys.length > 0 ? 'WORKING' : 'NOT WORKING (using in-memory)'}`);
    console.log(`   ${firstSuccess ? '✅' : '❌'} Rate Limit Headers: ${firstSuccess ? 'PRESENT' : 'MISSING'}`);
    console.log(`   ${successful > 0 ? '✅' : '❌'} API Requests: ${successful > 0 ? 'WORKING' : 'FAILING'}`);
    console.log(`   ${rateLimited > 0 ? '✅' : 'ℹ️'} Rate Enforcement: ${rateLimited > 0 ? 'ACTIVE' : 'PERMISSIVE (dev mode)'}`);
    console.log();

    if (keys.length > 0) {
      console.log('🎉 Rate limiting is using Redis successfully!\n');
      console.log('   Benefits:');
      console.log('   - Rate limits work across multiple server instances');
      console.log('   - Rate limit counters persist across server restarts');
      console.log('   - Distributed rate limiting is enabled\n');
    } else {
      console.log('⚠️  Rate limiting is using in-memory store.\n');
      console.log('   This means:');
      console.log('   - Each server instance has separate counters');
      console.log('   - Rate limits reset on server restart');
      console.log('   - Not suitable for production with multiple instances\n');
      console.log('   Check server logs for Redis connection errors.\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running on', API_BASE_URL);
    }
    process.exit(1);
  }
}

// Run the test
testRateLimitingWithRedis();
