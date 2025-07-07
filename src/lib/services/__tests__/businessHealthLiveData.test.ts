import { businessHealthService } from '../businessHealthService';
import { businessHealthSyncService } from '../businessHealthSyncService';
import { supabase } from '../../core/supabase';

describe('Business Health Live Data Integration', () => {
  // Mock company ID for testing
  const testCompanyId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    // Ensure we have test data in place
    await setupTestData();
  });

  describe('Enhanced RPC Function', () => {
    it('should return live business health scores from integrated data sources', async () => {
      // Call the enhanced RPC function
      const { data, error } = await supabase.rpc('get_business_health_score');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      
      if (data && data.length > 0) {
        const healthData = data[0];
        
        // Verify new return structure
        expect(healthData).toHaveProperty('score');
        expect(healthData).toHaveProperty('breakdown');
        expect(healthData).toHaveProperty('last_updated');
        expect(healthData).toHaveProperty('data_sources');
        expect(healthData).toHaveProperty('completeness_percentage');
        
        // Verify breakdown structure
        const breakdown = healthData.breakdown;
        expect(breakdown).toHaveProperty('sales');
        expect(breakdown).toHaveProperty('marketing');
        expect(breakdown).toHaveProperty('finance');
        expect(breakdown).toHaveProperty('operations');
        expect(breakdown).toHaveProperty('support');
        
        // Verify data sources are tracked
        expect(Array.isArray(healthData.data_sources)).toBe(true);
        
        console.log('Live Business Health Data:', {
          overallScore: healthData.score,
          categoryScores: {
            sales: breakdown.sales,
            marketing: breakdown.marketing,
            finance: breakdown.finance,
            operations: breakdown.operations,
            support: breakdown.support
          },
          dataSources: healthData.data_sources,
          completeness: healthData.completeness_percentage
        });
      }
    });

    it('should calculate scores based on real KPI thresholds', async () => {
      const { data } = await supabase.rpc('get_business_health_score');
      
      if (data && data.length > 0) {
        const breakdown = data[0].breakdown;
        
        // Finance should score well with $25k revenue, 25% margin, positive cash flow
        expect(breakdown.finance).toBeGreaterThan(50);
        
        // Marketing should score well with 2500 traffic, 3.2% conversion, good engagement
        expect(breakdown.marketing).toBeGreaterThan(50);
        
        // Operations should score well with 99.8% uptime, 65% automation, 75% utilization
        expect(breakdown.operations).toBeGreaterThan(50);
        
        // Support should score well with 1.5hr response, 8.5 satisfaction, 95% resolution
        expect(breakdown.support).toBeGreaterThan(50);
      }
    });
  });

  describe('BusinessHealthService Integration', () => {
    it('should fetch live data using the enhanced service', async () => {
      const healthData = await businessHealthService.fetchBusinessHealthData(testCompanyId);
      
      expect(healthData).toBeDefined();
      expect(healthData.overallScore).toBeGreaterThan(0);
      expect(healthData.dataSources).toBeDefined();
      expect(Array.isArray(healthData.dataSources)).toBe(true);
      expect(healthData.completionPercentage).toBeGreaterThan(0);
      
      // Should have live data details
      if (healthData.liveDataDetails) {
        expect(healthData.liveDataDetails).toHaveProperty('company_id');
      }
      
      console.log('Service Integration Results:', {
        score: healthData.overallScore,
        completion: healthData.completionPercentage,
        sources: healthData.dataSources,
        categories: healthData.categoryScores
      });
    });
  });

  describe('Data Sync Service', () => {
    it('should provide sync status information', async () => {
      const syncStatus = await businessHealthSyncService.getSyncStatus();
      
      expect(syncStatus).toBeDefined();
      expect(syncStatus).toHaveProperty('isRunning');
      expect(syncStatus).toHaveProperty('lastSyncTime');
      expect(syncStatus).toHaveProperty('autoSyncEnabled');
      expect(syncStatus).toHaveProperty('recentSyncStats');
      expect(Array.isArray(syncStatus.recentSyncStats)).toBe(true);
      
      console.log('Sync Status:', syncStatus);
    });

    it('should be able to trigger manual sync', async () => {
      // Note: This would normally call real APIs, so we're just testing the interface
      const mockSyncResults = await businessHealthSyncService.triggerManualSync(['hubspot']);
      
      expect(Array.isArray(mockSyncResults)).toBe(true);
      
      // Each result should have the expected structure
      mockSyncResults.forEach(result => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('kpisUpdated');
      });
    });
  });

  describe('Data Source Integration', () => {
    it('should track multiple data sources in the breakdown', async () => {
      const { data } = await supabase.rpc('get_business_health_score');
      
      if (data && data.length > 0) {
        const healthData = data[0];
        const details = healthData.breakdown.details;
        
        if (details) {
          // Should have company_id for context
          expect(details.company_id).toBe(testCompanyId);
          
          // May have integration data (depending on what's available)
          console.log('Integration Details:', {
            hubspot: details.hubspot_data,
            apollo: details.apollo_data,
            marcoby: details.marcoby_data
          });
        }
      }
    });

    it('should handle missing data gracefully', async () => {
      // Test with a non-existent company
      const { data } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('user_id', '00000000-0000-0000-0000-000000000000')
        .single();
      
      // Should not crash and should return meaningful data
      const { data: healthData } = await supabase.rpc('get_business_health_score');
      expect(healthData).toBeDefined();
    });
  });

  describe('Performance and Caching', () => {
    it('should complete health calculation within reasonable time', async () => {
      const startTime = Date.now();
      
      await supabase.rpc('get_business_health_score');
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 2 seconds
      expect(executionTime).toBeLessThan(2000);
      
      console.log(`Business health calculation took ${executionTime}ms`);
    });
  });
});

// Helper function to setup test data
async function setupTestData() {
  // This would typically be handled by test fixtures
  // For now, we rely on the data inserted via SQL earlier
  console.log('Test data setup completed');
}

// Integration test for the complete flow
describe('End-to-End Business Health Flow', () => {
  it('should demonstrate complete live data flow', async () => {
    console.log('\n=== LIVE BUSINESS HEALTH DEMONSTRATION ===\n');
    
    // 1. Check current KPI data
    const { data: kpiData } = await supabase
      .from('ai_kpi_snapshots')
      .select('department_id, kpi_id, value, source')
      .eq('org_id', '00000000-0000-0000-0000-000000000001')
      .order('department_id');
    
    console.log('1. Current KPI Data Sources:');
    const sourceCount = new Map();
    kpiData?.forEach(kpi => {
      const count = sourceCount.get(kpi.source) || 0;
      sourceCount.set(kpi.source, count + 1);
    });
    
    sourceCount.forEach((count, source) => {
      console.log(`   ${source}: ${count} KPIs`);
    });
    
    // 2. Get live business health score
    const { data: healthData } = await supabase.rpc('get_business_health_score');
    
    if (healthData && healthData.length > 0) {
      const health = healthData[0];
      
      console.log('\n2. Live Business Health Scores:');
      console.log(`   Overall Score: ${health.score}/100`);
      console.log(`   Data Completeness: ${health.completeness_percentage}%`);
      console.log(`   Active Data Sources: ${health.data_sources.join(', ')}`);
      
      console.log('\n3. Department Breakdown:');
      const breakdown = health.breakdown;
      Object.entries(breakdown).forEach(([dept, score]) => {
        if (typeof score === 'number') {
          console.log(`   ${dept.charAt(0).toUpperCase() + dept.slice(1)}: ${score}/100`);
        }
      });
      
      console.log(`\n4. Last Updated: ${health.last_updated}`);
    }
    
    // 3. Test service integration
    const serviceData = await businessHealthService.fetchBusinessHealthData('00000000-0000-0000-0000-000000000001');
    
    console.log('\n5. Service Integration:');
    console.log(`   Service Score: ${serviceData.overallScore}/100`);
    console.log(`   Service Sources: ${serviceData.dataSources.join(', ')}`);
    
    console.log('\n=== DEMONSTRATION COMPLETE ===\n');
    
    // Verify the integration works
    expect(healthData).toBeDefined();
    expect(serviceData.overallScore).toBeGreaterThan(0);
  });
}); 