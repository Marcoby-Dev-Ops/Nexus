import { DataPointMappingService } from './dataPointMappingService';

describe('DataPointMappingService', () => {
  let service: DataPointMappingService;

  beforeEach(() => {
    service = new DataPointMappingService();
  });

  describe('generateMappingReport', () => {
    it('should generate a mapping report for a user', async () => {
      const userId = 'test-user-id';
      const result = await service.generateMappingReport(userId);
      
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success && result.data) {
        expect(result.data.totalDataPoints).toBeGreaterThanOrEqual(0);
        expect(result.data.coveragePercentage).toBeGreaterThanOrEqual(0);
        expect(result.data.coveragePercentage).toBeLessThanOrEqual(100);
        expect(Array.isArray(result.data.issues)).toBe(true);
        expect(Array.isArray(result.data.mappings)).toBe(true);
      }
    });
  });

  describe('getUnmappedDataPoints', () => {
    it('should get unmapped data points for a user', async () => {
      const userId = 'test-user-id';
      const result = await service.getUnmappedDataPoints(userId);
      
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success && result.data) {
        expect(result.data.totalUnmapped).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.data.unmappedDataPoints)).toBe(true);
      }
    });
  });

  describe('getBusinessValue', () => {
    it('should categorize data points by business value', () => {
      const highValueNames = ['revenue', 'customers', 'conversion_rate', 'mrr'];
      const mediumValueNames = ['leads', 'opportunities', 'response_time', 'satisfaction'];
      const lowValueNames = ['test', 'unknown', 'other'];
      
      highValueNames.forEach(name => {
        expect(service['getBusinessValue'](name)).toBe('high');
      });
      
      mediumValueNames.forEach(name => {
        expect(service['getBusinessValue'](name)).toBe('medium');
      });
      
      lowValueNames.forEach(name => {
        expect(service['getBusinessValue'](name)).toBe('low');
      });
    });
  });
});
