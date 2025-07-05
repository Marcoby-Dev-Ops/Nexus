#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const n8nUrl = process.env.VITE_N8N_URL || process.env.N8N_URL;
const n8nApiKey = process.env.VITE_N8N_API_KEY || process.env.N8N_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Found URL:', supabaseUrl ? '✅' : '❌');
  console.error('Found Key:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

if (!n8nUrl || !n8nApiKey) {
  console.log('⚠️  n8n credentials not found, will only check database status');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkN8nInstance() {
  if (!n8nUrl || !n8nApiKey) {
    console.log('⚠️  Skipping n8n instance check - credentials not available\n');
    return null;
  }

  console.log('🔍 Checking n8n instance status...');
  console.log(`   URL: ${n8nUrl}`);
  
  try {
    // Check if n8n is accessible
    const response = await fetch(`${n8nUrl}/api/v1/workflows`, {
      headers: {
        'Authorization': `Bearer ${n8nApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`❌ n8n API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const workflows = await response.json();
    console.log(`✅ n8n instance accessible`);
    console.log(`   Found ${workflows.data?.length || 0} workflows in n8n\n`);
    
    return workflows.data || [];
  } catch (error) {
    console.log(`❌ Failed to connect to n8n: ${error.message}\n`);
    return null;
  }
}

async function checkWorkflowStatus() {
  console.log('🔍 Checking n8n workflow configuration status...\n');
  
  // First check the actual n8n instance
  const n8nWorkflows = await checkN8nInstance();
  
  try {
    // Get all workflow configurations
    const { data: workflows, error } = await supabase
      .from('n8n_workflow_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    if (!workflows || workflows.length === 0) {
      console.log('⚠️  No n8n workflows found in database');
      return;
    }

    console.log(`📊 Found ${workflows.length} workflow configurations in database:\n`);

    const issues = [];

    for (const workflow of workflows) {
      console.log(`🔄 Checking: ${workflow.workflow_name}`);
      console.log(`   Database ID: ${workflow.workflow_id}`);
      console.log(`   Webhook URL: ${workflow.webhook_url}`);
      console.log(`   Active in DB: ${workflow.is_active ? '✅' : '❌'}`);

      // Check if this workflow exists in actual n8n instance
      if (n8nWorkflows) {
        const n8nWorkflow = n8nWorkflows.find(nw => nw.id === workflow.workflow_id);
        if (n8nWorkflow) {
          console.log(`   n8n Status: ✅ Found in n8n (${n8nWorkflow.active ? 'active' : 'inactive'})`);
          console.log(`   n8n Name: ${n8nWorkflow.name}`);
        } else {
          console.log(`   n8n Status: ❌ Not found in n8n instance`);
          issues.push({
            workflow: workflow.workflow_name,
            issue: 'Workflow ID not found in n8n instance',
            id: workflow.workflow_id
          });
        }
      }

      // Check if webhook URL is reachable (only if it looks like a real URL)
      if (workflow.webhook_url && !workflow.webhook_url.includes('placeholder')) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(workflow.webhook_url, {
            method: 'GET',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`   Webhook: ✅ Reachable`);
          } else {
            console.log(`   Webhook: ⚠️  Returns ${response.status}`);
            issues.push({
              workflow: workflow.workflow_name,
              issue: `Webhook returns ${response.status}`,
              url: workflow.webhook_url
            });
          }
        } catch (error) {
          console.log(`   Webhook: ❌ Unreachable - ${error.message}`);
          issues.push({
            workflow: workflow.workflow_name,
            issue: 'Webhook unreachable',
            url: workflow.webhook_url,
            error: error.message
          });
        }
      } else {
        console.log(`   Webhook: ⚠️  Placeholder URL detected`);
        issues.push({
          workflow: workflow.workflow_name,
          issue: 'Webhook URL is placeholder/invalid',
          url: workflow.webhook_url
        });
      }

      console.log('');
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`Total workflows: ${workflows.length}`);
    console.log(`Active workflows: ${workflows.filter(w => w.is_active).length}`);
    console.log(`Issues found: ${issues.length}`);

    if (issues.length > 0) {
      console.log('\n🚨 ISSUES DETECTED:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.workflow}: ${issue.issue}`);
        console.log(`   URL: ${issue.url}`);
        if (issue.error) {
          console.log(`   Error: ${issue.error}`);
        }
        console.log('');
      });

      console.log('💡 RECOMMENDED ACTIONS:');
      
      const placeholderIssues = issues.filter(i => i.issue.includes('placeholder'));
      const webhookIssues = issues.filter(i => i.issue.includes('Webhook'));
      const notFoundIssues = issues.filter(i => i.issue.includes('not found'));
      
      if (placeholderIssues.length > 0) {
        console.log(`1. 🔗 Update ${placeholderIssues.length} placeholder webhook URLs`);
        console.log('   Run: node scripts/fix_n8n_workflows.js --fix-webhooks');
      }
      
      if (notFoundIssues.length > 0) {
        console.log(`2. 🔍 Create missing workflows in n8n (${notFoundIssues.length} missing)`);
        console.log('   Either create workflows in n8n or update database IDs');
      }
      
      if (webhookIssues.length > 0) {
        console.log(`3. 🌐 Fix ${webhookIssues.length} webhook connectivity issues`);
        console.log('   Check network access and webhook authentication');
      }
      
      console.log('4. 🔧 Use MCP tools to apply database migrations if needed');
      console.log('5. 🧪 Test workflow triggers after fixes');
      
      console.log(`\n🎯 Your n8n instance is at: ${n8nUrl || 'Not configured'}`);
      console.log(`📊 Actual workflows in n8n: ${n8nWorkflows?.length || 'Unknown'}`);
      console.log(`💾 Configured workflows in DB: ${workflows.length}`);
    } else {
      console.log('\n✅ All workflows appear to be properly connected!');
    }

  } catch (error) {
    console.error('❌ Error checking workflow status:', error);
  }
}

// Run the check
checkWorkflowStatus(); 