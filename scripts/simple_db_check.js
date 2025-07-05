#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Simple Database Check for n8n Workflows\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Has Key:', supabaseKey ? 'Yes' : 'No');
console.log('Key preview:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'None');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('\n🔗 Testing database connection...');
    
    // Simple test query
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check if n8n_workflow_configs table exists
    console.log('\n📋 Checking n8n_workflow_configs table...');
    
    const { data: workflows, error: workflowError } = await supabase
      .from('n8n_workflow_configs')
      .select('workflow_name, workflow_id, webhook_url, is_active, created_at')
      .limit(10);
    
    if (workflowError) {
      console.error('❌ Error querying n8n_workflow_configs:', workflowError.message);
      
      // Try the old table name
      console.log('\n🔄 Trying n8n_configurations table...');
      const { data: oldWorkflows, error: oldError } = await supabase
        .from('n8n_configurations')
        .select('workflow_name, webhook_url, created_at')
        .limit(10);
      
      if (oldError) {
        console.error('❌ Error querying n8n_configurations:', oldError.message);
      } else {
        console.log('✅ Found n8n_configurations table with', oldWorkflows?.length || 0, 'entries');
        if (oldWorkflows && oldWorkflows.length > 0) {
          console.log('\n📄 Sample workflows:');
          oldWorkflows.forEach((wf, i) => {
            console.log(`${i + 1}. ${wf.workflow_name} - ${wf.webhook_url}`);
          });
        }
      }
      return;
    }
    
    console.log('✅ n8n_workflow_configs table accessible');
    console.log(`📊 Found ${workflows?.length || 0} workflow configurations\n`);
    
    if (workflows && workflows.length > 0) {
      console.log('📄 Workflow Summary:');
      workflows.forEach((wf, i) => {
        console.log(`${i + 1}. ${wf.workflow_name}`);
        console.log(`   ID: ${wf.workflow_id}`);
        console.log(`   URL: ${wf.webhook_url}`);
        console.log(`   Active: ${wf.is_active ? '✅' : '❌'}`);
        console.log(`   Created: ${new Date(wf.created_at).toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No workflow configurations found');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkDatabase(); 