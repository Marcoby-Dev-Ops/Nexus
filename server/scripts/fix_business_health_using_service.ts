/**
 * Example: Fix business_health table using CentralizedRLSService
 * 
 * This demonstrates how to use the centralized RLS service instead of
 * manually creating SQL policies.
 */

// Load ServiceRegistry from client codebase if available; fall back to any for type-checking
let serviceRegistry: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  serviceRegistry = require('../client/src/core/services/ServiceRegistry');
  serviceRegistry = serviceRegistry.serviceRegistry || serviceRegistry;
} catch (e) {
  // fall back to a noop registry for scripts run in isolation
  serviceRegistry = { getService: () => ({}) } as any;
}

async function fixBusinessHealthTable() {
  try {
    // Get the centralized RLS service
    const rlsService = serviceRegistry.getService('centralized-rls');
    
    console.log('🔧 Fixing business_health table policies...');
    
    // Fix the specific table using centralized standards
    const result = await rlsService.fixTablePolicies('business_health');
    
    if (result.success) {
      console.log('✅ Successfully fixed business_health table policies');
      
      // Get updated statistics
      const stats = await rlsService.getPolicyStatistics();
      if (stats.success) {
        console.log('📊 Updated policy statistics:', stats.data);
      }
      
      // Get tables needing attention
      const attention = await rlsService.getTablesNeedingAttention();
      if (attention.success) {
        console.log('⚠️ Tables still needing attention:', attention.data?.length || 0);
      }
      
    } else {
      console.error('❌ Failed to fix business_health table:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error fixing business_health table:', error);
  }
}

// Alternative: Fix multiple failing tables at once
async function fixMultipleFailingTables() {
  try {
    const rlsService = serviceRegistry.getService('centralized-rls');
    
    // Get tables that need attention
    const attentionResult = await rlsService.getTablesNeedingAttention();
    if (!attentionResult.success) {
      console.error('Failed to get tables needing attention');
      return;
    }
    
  const failingTables = attentionResult.data?.map((t: any) => t.tableName) || [];
    
    if (failingTables.length === 0) {
      console.log('✅ No tables need fixing');
      return;
    }
    
    console.log(`🔧 Fixing ${failingTables.length} failing tables...`);
    
    // Fix all failing tables at once
    const result = await rlsService.fixFailingTables(failingTables);
    
    if (result.success) {
      const { fixed, failed, errors } = result.data || { fixed: [], failed: [], errors: {} };
      
      console.log(`✅ Fixed ${fixed.length} tables`);
      if (failed.length > 0) {
        console.log(`❌ Failed to fix ${failed.length} tables:`, failed);
        console.log('Errors:', errors);
      }
    } else {
      console.error('❌ Failed to fix tables:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error fixing tables:', error);
  }
}

// Usage examples:
// fixBusinessHealthTable();
// fixMultipleFailingTables();

export { fixBusinessHealthTable, fixMultipleFailingTables };
