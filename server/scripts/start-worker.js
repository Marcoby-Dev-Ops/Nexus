#!/usr/bin/env node

/**
 * Integration Worker Startup Script
 * 
 * Starts the BullMQ workers for processing integration jobs
 */

const { integrationService } = require('../src/core/integrations');

async function startWorker() {
  console.log('🚀 Starting Nexus Integration Workers...');

  try {
    // Initialize the integration service
    await integrationService.initialize();
    console.log('✅ Integration service initialized');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down workers...');
      await integrationService.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down workers...');
      await integrationService.shutdown();
      process.exit(0);
    });

    console.log('👷 Workers are running. Press Ctrl+C to stop.');
    console.log('📊 Monitor queues at: http://localhost:3000/admin/queues');

  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();
