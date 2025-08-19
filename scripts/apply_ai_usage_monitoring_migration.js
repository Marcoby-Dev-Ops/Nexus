#!/usr/bin/env node

/**
 * Script to apply AI Usage Monitoring database migration
 * This script creates the necessary tables for monitoring OpenAI and OpenRouter API usage
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applyMigration() {
  console.log('🚀 Applying AI Usage Monitoring Migration...');

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - VITE_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../server/migrations/038_create_ai_usage_monitoring_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded successfully');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement);
          throw error;
        }
      }
    }

    console.log('✅ AI Usage Monitoring migration applied successfully!');
    console.log('');
    console.log('📊 Created tables:');
    console.log('   - ai_provider_usage (tracks API usage)');
    console.log('   - ai_provider_credits (tracks balances)');
    console.log('   - ai_usage_alerts (tracks alerts)');
    console.log('   - ai_usage_budgets (tracks budgets)');
    console.log('   - ai_model_performance (tracks model performance)');
    console.log('');
    console.log('📈 Created views:');
    console.log('   - ai_usage_summary');
    console.log('   - ai_daily_usage');
    console.log('');
    console.log('🔐 RLS policies configured for admin access');
    console.log('');
    console.log('🎉 You can now monitor AI usage in the admin dashboard at /admin/ai-usage');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration().catch(console.error);
