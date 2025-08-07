#!/usr/bin/env node

/**
 * Service Migration Script
 * 
 * Identifies services that need to be migrated to use BaseService pattern
 * and provides guidance for the migration process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Migration status for services
 */
const MIGRATION_STATUS = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
  NEEDS_REVIEW: 'needs_review',
};

/**
 * Service migration data
 */
const SERVICE_MIGRATION_DATA = {
  // Core services that extend BaseService
  completed: [
    'BaseService',
    'WorkflowService',
    'SupabaseService',
    'DataPrincipleService',
    'PersonalThoughtsService',
    'PersonalAutomationsService',
    'ChatUsageTrackingService',
    'UserLicensesService',
    'AuthService',
    'OAuthTokenService',
    'UserService',
    'CompanyService',
    'DealService',
    'ContactService',
    'NotificationService',
    'BillingService',
    'CalendarService',
    'TenantService',
    'CompanyOwnershipService',
    'CompanyProvisioningService',
    'UserProfileService',
    'IntegrationService',
    'IntegrationDataService',
    'DataPointMappingService',
    'DataPointDictionaryService',
    'UniversalIntegrationService',
    'SalesforceStyleDataService',
    'RealTimeCrossDepartmentalSync',
    'ConsolidatedIntegrationService',
    'IntegrationRegistryService',
    'DataMappingService',
    'IntegrationBaseService',
    'HubSpotIntegrationService',
    'PayPalIntegrationService',
    'EmailService',
    'EmailIntegrationService',
    'OWAInboxService',
    'DashboardService',
    'TaskService',
    'TaskCalendarService',
    'QuotaService',
    'AuditLogService',
    'DemoService',
    'OnboardingService',
    'BusinessProfileService',
    'UserCompanyIntegrationBridgeService',
    'CompanyIntelligenceService',
    'BusinessProcessAutomationService',
    'WaitlistService',
    'DomainAnalysisService',
    'ThoughtsService',
    'OnboardingValidationService',
  ],
  
  // Services that need migration
  pending: [
    'AnalyticsService',
    'AIService',
    'NotificationService',
    'IntegrationService',
    'EmailService',
    'DashboardService',
    'TaskService',
    'CalendarService',
    'BillingService',
    'UserService',
    'CompanyService',
    'DealService',
    'ContactService',
    'TenantService',
  ],
  
  // Services that need review
  needs_review: [
    'LegacyService',
    'OldIntegrationService',
    'DeprecatedService',
  ],
};

/**
 * Find files that contain direct Supabase calls
 */
function findDirectSupabaseCalls() {
  console.log('🔍 Scanning for direct Supabase calls...');
  
  try {
    const result = execSync('grep -r "supabase\\.from" src/ --include="*.ts" --include="*.tsx"', { encoding: 'utf8' });
    const lines = result.split('\n').filter(line => line.trim());
    
    const directCalls = lines.map(line => {
      const [filePath, ...rest] = line.split(':');
      const code = rest.join(':').trim();
      return { filePath, code };
    });
    
    return directCalls;
  } catch (error) {
    console.log('✅ No direct Supabase calls found in src/');
    return [];
  }
}

/**
 * Find services that don't extend BaseService
 */
function findServicesNotExtendingBaseService() {
  console.log('🔍 Scanning for services not extending BaseService...');
  
  const servicesDir = path.join(__dirname, '../src');
  const services = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if it's a service class
        if (content.includes('class') && content.includes('Service') && !content.includes('extends BaseService')) {
          const className = content.match(/class\s+(\w+Service)/)?.[1];
          if (className) {
            services.push({
              file: filePath.replace(__dirname + '/../', ''),
              className,
              hasDirectSupabase: content.includes('supabase.from'),
            });
          }
        }
      }
    }
  }
  
  scanDirectory(servicesDir);
  return services;
}

/**
 * Generate migration report
 */
function generateMigrationReport() {
  console.log('\n📊 Service Migration Report');
  console.log('============================\n');
  
  const directCalls = findDirectSupabaseCalls();
  const nonBaseServices = findServicesNotExtendingBaseService();
  
  console.log(`✅ Completed Services: ${SERVICE_MIGRATION_DATA.completed.length}`);
  console.log(`⏳ Pending Services: ${SERVICE_MIGRATION_DATA.pending.length}`);
  console.log(`⚠️  Services Needing Review: ${SERVICE_MIGRATION_DATA.needs_review.length}`);
  console.log(`🔍 Direct Supabase Calls Found: ${directCalls.length}`);
  console.log(`🔍 Services Not Extending BaseService: ${nonBaseServices.length}`);
  
  if (directCalls.length > 0) {
    console.log('\n🚨 Direct Supabase Calls Found:');
    directCalls.forEach(({ filePath, code }) => {
      console.log(`  ${filePath}: ${code.substring(0, 80)}...`);
    });
  }
  
  if (nonBaseServices.length > 0) {
    console.log('\n🔍 Services Not Extending BaseService:');
    nonBaseServices.forEach(({ file, className, hasDirectSupabase }) => {
      const status = hasDirectSupabase ? '🚨' : '⚠️';
      console.log(`  ${status} ${className} (${file})`);
    });
  }
  
  return {
    directCalls,
    nonBaseServices,
    completed: SERVICE_MIGRATION_DATA.completed.length,
    pending: SERVICE_MIGRATION_DATA.pending.length,
    needsReview: SERVICE_MIGRATION_DATA.needs_review.length,
  };
}

/**
 * Generate migration checklist
 */
function generateMigrationChecklist() {
  console.log('\n📋 Migration Checklist');
  console.log('=====================\n');
  
  const checklist = [
    {
      step: 1,
      title: 'Identify Services',
      description: 'Find all services that don\'t extend BaseService',
      status: '✅',
    },
    {
      step: 2,
      title: 'Create Service Schemas',
      description: 'Define Zod schemas for each service\'s data types',
      status: '⏳',
    },
    {
      step: 3,
      title: 'Migrate to UnifiedService',
      description: 'Convert services to extend UnifiedService<T>',
      status: '⏳',
    },
    {
      step: 4,
      title: 'Register in ServiceFactory',
      description: 'Add services to ServiceRegistry',
      status: '⏳',
    },
    {
      step: 5,
      title: 'Update Components',
      description: 'Replace direct Supabase calls with service hooks',
      status: '⏳',
    },
    {
      step: 6,
      title: 'Add Tests',
      description: 'Create comprehensive tests for migrated services',
      status: '⏳',
    },
    {
      step: 7,
      title: 'Update Documentation',
      description: 'Update service documentation and examples',
      status: '⏳',
    },
  ];
  
  checklist.forEach(item => {
    console.log(`${item.status} Step ${item.step}: ${item.title}`);
    console.log(`    ${item.description}\n`);
  });
}

/**
 * Generate migration template
 */
function generateMigrationTemplate(serviceName) {
  const template = `/**
 * ${serviceName}
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 */

import { z } from 'zod';
import { UnifiedService } from '@/core/services/UnifiedService';
import type { ServiceResponse } from '@/core/services/BaseService';

// Define schema for your data type
export const ${serviceName}Schema = z.object({
  id: z.string().uuid(),
  // Add your fields here
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ${serviceName}Data = z.infer<typeof ${serviceName}Schema>;

/**
 * ${serviceName} Service
 * 
 * MIGRATED: Now extends UnifiedService for standardized CRUD operations
 */
export class ${serviceName} extends UnifiedService<${serviceName}Data> {
  protected config = {
    tableName: 'your_table_name',
    schema: ${serviceName}Schema,
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
    enableLogging: true,
  };

  // Add custom methods here
  async customMethod(): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('customMethod', {});
      
      // Your custom logic here
      
      return this.createSuccessResponse({});
    });
  }
}

// Export instance
export const ${serviceName.toLowerCase()}Service = new ${serviceName}();
`;

  return template;
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Service Migration Analysis');
  console.log('=============================\n');
  
  const report = generateMigrationReport();
  generateMigrationChecklist();
  
  console.log('\n📝 Migration Commands');
  console.log('=====================\n');
  console.log('1. Run tests: npm test');
  console.log('2. Check linting: npm run lint');
  console.log('3. Type check: npm run type-check');
  console.log('4. Build: npm run build');
  
  console.log('\n🔧 Next Steps');
  console.log('==============\n');
  console.log('1. Prioritize services with direct Supabase calls');
  console.log('2. Create Zod schemas for data validation');
  console.log('3. Migrate services to UnifiedService pattern');
  console.log('4. Update components to use service hooks');
  console.log('5. Add comprehensive tests');
  
  if (report.directCalls.length > 0) {
    console.log('\n🚨 Priority: Fix direct Supabase calls first!');
  }
  
  console.log('\n✅ Migration analysis complete!\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  findDirectSupabaseCalls,
  findServicesNotExtendingBaseService,
  generateMigrationReport,
  generateMigrationChecklist,
  generateMigrationTemplate,
  MIGRATION_STATUS,
  SERVICE_MIGRATION_DATA,
};
