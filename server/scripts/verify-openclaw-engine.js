#!/usr/bin/env node

/**
 * OpenClaw as Nexus AI Engine - Setup Verification
 * 
 * This script verifies that OpenClaw is properly configured as Nexus's AI engine.
 */

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function verifyOpenClawIntegration() {
    console.log('🔍 Verifying OpenClaw as Nexus AI Engine');
    console.log('==========================================\n');
    
    const checks = [];
    
    // Check 1: OpenClaw service availability
    console.log('1. Checking OpenClaw service...');
    try {
        const openclawUrl = process.env.OPENCLAW_API_URL || 'http://localhost:18789/v1';
        const openclawResponse = await axios.get(`${openclawUrl}/health`, {
            timeout: 5000
        });
        
        if (openclawResponse.status === 200) {
            console.log('   ✅ OpenClaw service is running');
            checks.push({ check: 'OpenClaw Service', status: '✅' });
        } else {
            console.log('   ❌ OpenClaw service returned status:', openclawResponse.status);
            checks.push({ check: 'OpenClaw Service', status: '❌' });
        }
    } catch (error) {
        console.log('   ❌ OpenClaw service is not accessible:', error.message);
        console.log('      Make sure OpenClaw is running at:', process.env.OPENCLAW_API_URL || 'http://localhost:18789/v1');
        checks.push({ check: 'OpenClaw Service', status: '❌' });
    }
    
    // Check 2: Nexus AI Gateway configuration
    console.log('\n2. Checking Nexus AI Gateway configuration...');
    try {
        const nexusResponse = await axios.get('http://localhost:3001/api/ai/health', {
            timeout: 5000
        });
        
        const data = nexusResponse.data;
        if (data.connections && data.connections.openclaw === 'connected') {
            console.log('   ✅ Nexus AI Gateway has OpenClaw provider connected');
            checks.push({ check: 'AI Gateway OpenClaw', status: '✅' });
        } else {
            console.log('   ⚠️  Nexus AI Gateway running but OpenClaw not listed as provider');
            console.log('      Available providers:', Object.keys(data.connections || {}).join(', '));
            checks.push({ check: 'AI Gateway OpenClaw', status: '⚠️' });
        }
    } catch (error) {
        console.log('   ❌ Nexus AI Gateway not accessible:', error.message);
        console.log('      Make sure Nexus backend is running on port 3001');
        checks.push({ check: 'AI Gateway OpenClaw', status: '❌' });
    }
    
    // Check 3: Database migrations
    console.log('\n3. Checking database migrations...');
    try {
        const { stdout } = await execPromise('npm run migrate:status', {
            cwd: '/root/openclaw-workspace/Nexus/server'
        });
        
        if (stdout.includes('version: 112') && stdout.includes('version: 113')) {
            console.log('   ✅ OpenClaw integration migrations (112, 113) are applied');
            checks.push({ check: 'Database Migrations', status: '✅' });
        } else {
            console.log('   ⚠️  OpenClaw migrations may not be applied');
            console.log('      Run: cd /root/openclaw-workspace/Nexus/server && npm run migrate');
            checks.push({ check: 'Database Migrations', status: '⚠️' });
        }
    } catch (error) {
        console.log('   ❌ Could not check migration status:', error.message);
        checks.push({ check: 'Database Migrations', status: '❌' });
    }
    
    // Check 4: Environment configuration
    console.log('\n4. Checking environment configuration...');
    const requiredEnvVars = ['OPENCLAW_API_URL', 'OPENCLAW_API_KEY'];
    let allEnvVarsPresent = true;
    
    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            console.log(`   ✅ ${envVar} is set`);
        } else {
            console.log(`   ❌ ${envVar} is not set`);
            allEnvVarsPresent = false;
        }
    }
    
    if (allEnvVarsPresent) {
        checks.push({ check: 'Environment Variables', status: '✅' });
    } else {
        checks.push({ check: 'Environment Variables', status: '❌' });
        console.log('      Add to Nexus .env file:');
        console.log('      OPENCLAW_API_URL=http://localhost:18789/v1');
        console.log('      OPENCLAW_API_KEY=sk-openclaw-local');
    }
    
    // Check 5: Test chat functionality
    console.log('\n5. Testing chat functionality...');
    try {
        const testResponse = await axios.post('http://localhost:3001/api/chat/message', {
            message: 'Hello, is OpenClaw working as my AI engine?',
            context: {}
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // Simplified for test
            },
            timeout: 10000
        });
        
        if (testResponse.data.success) {
            console.log('   ✅ Chat endpoint working, response:', testResponse.data.data.reply?.substring(0, 50) + '...');
            checks.push({ check: 'Chat Functionality', status: '✅' });
        } else {
            console.log('   ❌ Chat endpoint returned error:', testResponse.data.error);
            checks.push({ check: 'Chat Functionality', status: '❌' });
        }
    } catch (error) {
        console.log('   ❌ Chat test failed:', error.message);
        if (error.response) {
            console.log('      Response status:', error.response.status);
            console.log('      Response data:', JSON.stringify(error.response.data));
        }
        checks.push({ check: 'Chat Functionality', status: '❌' });
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('===========');
    checks.forEach(check => {
        console.log(`${check.status} ${check.check}`);
    });
    
    const passedChecks = checks.filter(c => c.status === '✅').length;
    const totalChecks = checks.length;
    
    console.log(`\n${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
        console.log('\n🎉 OpenClaw is successfully configured as Nexus AI engine!');
        console.log('   Nexus UI → Nexus Backend → OpenClaw AI → Response stored in Nexus DB');
    } else {
        console.log('\n🔧 Configuration needed:');
        console.log('   1. Ensure OpenClaw is running and accessible');
        console.log('   2. Set OPENCLAW_API_URL and OPENCLAW_API_KEY in Nexus .env');
        console.log('   3. Apply migrations: npm run migrate in Nexus/server');
        console.log('   4. Restart Nexus backend');
    }
}

// Run verification
verifyOpenClawIntegration().catch(console.error);