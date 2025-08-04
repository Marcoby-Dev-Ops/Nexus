#!/usr/bin/env node

/**
 * Phase 2 Service Migration Script
 * 
 * This script helps migrate from legacy services to the new core services:
 * - billingService.ts → BillingService
 * - googleAnalyticsService.ts → AnalyticsService
 * - googleWorkspaceService.ts → AnalyticsService
 * - IntegrationTracker.ts → IntegrationService
 * - agentRegistry.ts → AIService
 * - continuousImprovementService.ts → AIService
 * - slashCommandService.ts → AIService
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Legacy service patterns to search for
const LEGACY_SERVICES = {
  'billingService': {
    pattern: /billingService\./g,
    target: 'BillingService',
    files: ['src/services/admin/billingService.ts'],
    migration: {
      'getBillingStatus': 'getBillingStatus',
      'getOrCreateCustomer': 'getOrCreateCustomer',
      'getPaymentLinks': 'getPaymentLinks',
      'getUsageBilling': 'getUsageBilling',
      'handleSubscriptionChange': 'handleSubscriptionChange',
      'cancelSubscription': 'cancelSubscription',
      'reactivateSubscription': 'reactivateSubscription',
      'createCustomerPortalSession': 'createCustomerPortalSession',
    }
  },
  'googleAnalyticsService': {
    pattern: /googleAnalyticsService\./g,
    target: 'AnalyticsService',
    files: ['src/services/analytics/googleAnalyticsService.ts'],
    migration: {
      'connectGoogleAnalytics': 'connectGoogleAnalytics',
      'handleGoogleAnalyticsCallback': 'handleGoogleAnalyticsCallback',
      'fetchGA4Metrics': 'fetchGA4Metrics',
      'getGoogleAnalyticsOverview': 'getGoogleAnalyticsOverview',
    }
  },
  'googleWorkspaceService': {
    pattern: /googleWorkspaceService\./g,
    target: 'AnalyticsService',
    files: ['src/services/analytics/googleWorkspaceService.ts'],
    migration: {
      'connectGoogleWorkspace': 'connectGoogleWorkspace',
      'handleGoogleWorkspaceCallback': 'handleGoogleWorkspaceCallback',
      'getWorkspaceUsage': 'getWorkspaceUsage',
    }
  },
  'integrationTracker': {
    pattern: /integrationTracker\./g,
    target: 'IntegrationService',
    files: ['src/services/analytics/IntegrationTracker.ts'],
    migration: {
      'trackComponentUsage': 'trackComponentUsage',
      'getComponentStats': 'getComponentStats',
      'getIntegrationStats': 'getIntegrationStats',
      'getTopComponents': 'getTopComponents',
      'getInMemoryUsages': 'getInMemoryUsages',
    }
  },
  'agentRegistry': {
    pattern: /agentRegistry\./g,
    target: 'AIService',
    files: ['src/services/ai/agentRegistry.ts'],
    migration: {
      'getAllAgents': 'getAllAgents',
      'getAgent': 'getAgent',
      'getAgentByType': 'getAgentByType',
      'createAgent': 'createAgent',
      'updateAgent': 'updateAgent',
      'deactivateAgent': 'deactivateAgent',
    }
  },
  'continuousImprovementService': {
    pattern: /continuousImprovementService\./g,
    target: 'AIService',
    files: ['src/services/ai/continuousImprovementService.ts'],
    migration: {
      'getImprovementDashboard': 'getImprovementDashboard',
      'trackUserFeedback': 'trackUserFeedback',
      'generateImprovementRecommendations': 'generateImprovementRecommendations',
    }
  },
  'slashCommandService': {
    pattern: /slashCommandService\./g,
    target: 'AIService',
    files: ['src/services/ai/slashCommandService.ts'],
    migration: {
      'getSlashCommands': 'getSlashCommands',
      'trackCommandUsage': 'trackCommandUsage',
      'searchCommands': 'searchCommands',
    }
  }
};

// Core service imports
const CORE_SERVICES = {
  'BillingService': 'src/core/services/BillingService.ts',
  'AnalyticsService': 'src/core/services/AnalyticsService.ts',
  'AIService': 'src/core/services/AIService.ts',
  'IntegrationService': 'src/core/services/IntegrationService.ts',
};

function findLegacyServiceUsage() {
  console.log('🔍 Searching for legacy service usage...\n');
  
  const results = {};
  
  Object.entries(LEGACY_SERVICES).forEach(([serviceName, config]) => {
    try {
      const grepCommand = `grep -r "${serviceName}\\." src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/services/" | grep -v "src/core/services/"`;
      const output = execSync(grepCommand, { encoding: 'utf8' });
      
      if (output.trim()) {
        results[serviceName] = {
          usage: output.trim().split('\n').filter(line => line.trim()),
          target: config.target,
          migration: config.migration
        };
      }
    } catch (error) {
      // No usage found
    }
  });
  
  return results;
}

function generateMigrationReport(usageResults) {
  console.log('📊 Migration Report\n');
  
  if (Object.keys(usageResults).length === 0) {
    console.log('✅ No legacy service usage found! All services have been migrated.');
    return;
  }
  
  Object.entries(usageResults).forEach(([serviceName, data]) => {
    console.log(`🔧 ${serviceName} → ${data.target}`);
    console.log(`   Found ${data.usage.length} usage(s):`);
    
    data.usage.forEach(line => {
      const fileMatch = line.match(/^([^:]+):/);
      const file = fileMatch ? fileMatch[1] : 'unknown';
      console.log(`   - ${file}`);
    });
    
    console.log(`   Migration methods:`);
    Object.entries(data.migration).forEach(([oldMethod, newMethod]) => {
      console.log(`     ${oldMethod} → ${newMethod}`);
    });
    console.log('');
  });
}

function generateMigrationScript(usageResults) {
  console.log('📝 Migration Script\n');
  
  if (Object.keys(usageResults).length === 0) {
    console.log('✅ No migration needed!');
    return;
  }
  
  console.log('// Migration script - Replace legacy service imports with core services');
  console.log('');
  
  Object.entries(usageResults).forEach(([serviceName, data]) => {
    console.log(`// ${serviceName} → ${data.target}`);
    console.log(`// Replace:`);
    console.log(`import { ${serviceName} } from '@/services/...';`);
    console.log(`// With:`);
    console.log(`import { ${data.target.toLowerCase()}Service } from '@/core/services/${data.target}';`);
    console.log('');
  });
}

function checkCoreServiceImplementation() {
  console.log('🔍 Checking core service implementation...\n');
  
  const missingMethods = {};
  
  Object.entries(LEGACY_SERVICES).forEach(([serviceName, config]) => {
    const coreServicePath = CORE_SERVICES[config.target];
    
    if (!fs.existsSync(coreServicePath)) {
      missingMethods[serviceName] = `Core service file missing: ${coreServicePath}`;
      return;
    }
    
    const coreServiceContent = fs.readFileSync(coreServicePath, 'utf8');
    const missing = [];
    
    Object.values(config.migration).forEach(method => {
      if (!coreServiceContent.includes(`async ${method}(`)) {
        missing.push(method);
      }
    });
    
    if (missing.length > 0) {
      missingMethods[serviceName] = missing;
    }
  });
  
  if (Object.keys(missingMethods).length === 0) {
    console.log('✅ All core services are properly implemented!');
  } else {
    console.log('⚠️  Missing methods in core services:');
    Object.entries(missingMethods).forEach(([service, missing]) => {
      console.log(`   ${service}: ${Array.isArray(missing) ? missing.join(', ') : missing}`);
    });
  }
  
  return missingMethods;
}

function generateTestScript() {
  console.log('🧪 Test Script\n');
  
  console.log('// Test the migrated services');
  console.log('import { billingService, analyticsService, aiService, integrationService } from "@/core/services";');
  console.log('');
  console.log('// Test billing service');
  console.log('const billingStatus = await billingService.getBillingStatus(userId);');
  console.log('');
  console.log('// Test analytics service');
  console.log('const gaOverview = await analyticsService.getGoogleAnalyticsOverview();');
  console.log('const workspaceUsage = await analyticsService.getWorkspaceUsage();');
  console.log('');
  console.log('// Test AI service');
  console.log('const agents = await aiService.getAllAgents();');
  console.log('const commands = await aiService.getSlashCommands();');
  console.log('');
  console.log('// Test integration service');
  console.log('await integrationService.trackComponentUsage("Button", "HomePage");');
  console.log('const stats = await integrationService.getIntegrationStats();');
}

function main() {
  console.log('🚀 Phase 2 Service Migration Script\n');
  console.log('This script helps migrate from legacy services to core services.\n');
  
  const usageResults = findLegacyServiceUsage();
  const missingMethods = checkCoreServiceImplementation();
  
  generateMigrationReport(usageResults);
  
  if (Object.keys(missingMethods).length === 0) {
    generateMigrationScript(usageResults);
    generateTestScript();
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Review the migration report above');
  console.log('2. Update imports in affected files');
  console.log('3. Replace method calls with new service methods');
  console.log('4. Run tests to ensure functionality is preserved');
  console.log('5. Remove legacy service files once migration is complete');
  console.log('');
  console.log('💡 Tip: Use the migration helper in ServiceRegistry.ts for gradual migration');
}

if (require.main === module) {
  main();
}

module.exports = {
  findLegacyServiceUsage,
  generateMigrationReport,
  generateMigrationScript,
  checkCoreServiceImplementation,
  generateTestScript
}; 