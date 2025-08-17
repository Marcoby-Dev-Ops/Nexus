/**
 * KPICalculationService Tests
 * Tests the real database KPI calculation service functionality
 */

import { KPICalculationService } from '@/services/business/kpiCalculationService';


describe('KPICalculationService', () => {
  let service: KPICalculationService;

  beforeEach(() => {
    service = KPICalculationService.getInstance();
    jest.clearAllMocks();
  });

  describe('getBusinessHealthScore', () => {
    const mockUserId = 'test-user-id';

    it('should return successful health score with real KPI data', async () => {
      // Mock KPI snapshots data
      const mockKPISnapshots = [
        {
          kpi_key: 'mrr_arr',
          value: 75000,
          captured_at: new Date().toISOString()
        },
        {
          kpi_key: 'conversion_rate',
          value: 25,
          captured_at: new Date().toISOString()
        },
        {
          kpi_key: 'profit_margin',
          value: 28,
          captured_at: new Date().toISOString()
        },
        {
          kpi_key: 'customer_satisfaction',
          value: 8.5,
          captured_at: new Date().toISOString()
        }
      ];

      // Mock business profile data
      const mockBusinessProfile = {
        user_id: mockUserId,
        industry: 'technology',
        company_size: 'medium',
        business_stage: 'growth'
      };

      // Mock business health history
      const mockBusinessHealthHistory = [
        { overall_score: 75, created_at: new Date().toISOString() },
        { overall_score: 70, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
      ];

      // Setup mocks
      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (table === 'ai_kpi_snapshots') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ data: mockKPISnapshots, error: null })
              })
            })
          } as any;
        }
        if (table === 'business_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockBusinessProfile, error: null })
              })
            })
          } as any;
        }
        if (table === 'business_health') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: mockBusinessHealthHistory, error: null })
                })
              }),
              upsert: jest.fn().mockResolvedValue({ error: null })
            })
          } as any;
        }
        return {
          select: jest.fn()
        } as any;
      });

      // Execute
      const result = await service.getBusinessHealthScore(mockUserId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.overallScore).toBeGreaterThan(0);
      expect(result.data?.categoryScores).toBeDefined();
      expect(result.data?.kpiScores).toBeDefined();
      expect(result.data?.recommendations).toBeDefined();
      expect(result.data?.trends).toBeDefined();
      expect(result.data?.dataQuality).toBeGreaterThan(0);
    });

    it('should handle missing KPI data gracefully', async () => {
      // Mock empty KPI data
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ data: [], error: null }),
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          }),
          upsert: jest.fn().mockResolvedValue({ error: null })
        })
      } as any);

      const result = await service.getBusinessHealthScore(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.overallScore).toBe(0);
      expect(result.data?.dataQuality).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          })
        })
      } as any);

      const result = await service.getBusinessHealthScore(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch KPI data');
    });

    it('should calculate correct scores for different KPI types', async () => {
      // Mock KPI data with various types
      const mockKPISnapshots = [
        { kpi_key: 'mrr_arr', value: 100000, captured_at: new Date().toISOString() }, // Should be excellent
        { kpi_key: 'customer_acquisition_cost', value: 50, captured_at: new Date().toISOString() }, // Should be excellent (inverse)
        { kpi_key: 'conversion_rate', value: 15, captured_at: new Date().toISOString() }, // Should be good
        { kpi_key: 'profit_margin', value: 5, captured_at: new Date().toISOString() } // Should be poor
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'ai_kpi_snapshots') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ data: mockKPISnapshots, error: null })
              })
            })
          } as any;
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null })
              })
            }),
            upsert: jest.fn().mockResolvedValue({ error: null })
          })
        } as any;
      });

      const result = await service.getBusinessHealthScore(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.kpiScores).toBeDefined();
      
      const mrrKPI = result.data?.kpiScores.find(k => k.key === 'mrr_arr');
      const cacKPI = result.data?.kpiScores.find(k => k.key === 'customer_acquisition_cost');
      const conversionKPI = result.data?.kpiScores.find(k => k.key === 'conversion_rate');
      const profitKPI = result.data?.kpiScores.find(k => k.key === 'profit_margin');

      expect(mrrKPI?.score).toBe(100); // Excellent
      expect(cacKPI?.score).toBe(100); // Excellent (inverse)
      expect(conversionKPI?.score).toBeGreaterThanOrEqual(60); // Good
      expect(profitKPI?.score).toBeLessThan(60); // Poor
    });

    it('should calculate trends correctly', async () => {
      // Mock historical data showing improvement
      const mockHistory = [
        { overall_score: 80, created_at: new Date().toISOString() },
        { overall_score: 70, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'ai_kpi_snapshots') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ data: [], error: null })
              })
            })
          } as any;
        }
        if (table === 'business_health') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
                })
              }),
              upsert: jest.fn().mockResolvedValue({ error: null })
            })
          } as any;
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        } as any;
      });

      const result = await service.getBusinessHealthScore(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.trends.overall).toBe('up');
      expect(result.data?.trends.monthlyChange).toBe(10);
      expect(result.data?.trends.weeklyChange).toBe(2.5);
    });

    it('should generate appropriate recommendations', async () => {
      // Mock KPI data with poor scores
      const mockKPISnapshots = [
        { kpi_key: 'profit_margin', value: 5, captured_at: new Date().toISOString() },
        { kpi_key: 'conversion_rate', value: 8, captured_at: new Date().toISOString() }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'ai_kpi_snapshots') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ data: mockKPISnapshots, error: null })
              })
            })
          } as any;
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null })
              })
            }),
            upsert: jest.fn().mockResolvedValue({ error: null })
          })
        } as any;
      });

      const result = await service.getBusinessHealthScore(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.recommendations).toBeDefined();
      expect(result.data?.recommendations.length).toBeGreaterThan(0);
      expect(result.data?.recommendations.some(rec => rec.includes('Profit Margin'))).toBe(true);
    });
  });

  describe('Service Instance', () => {
    it('should return the same instance (singleton pattern)', () => {
      const instance1 = KPICalculationService.getInstance();
      const instance2 = KPICalculationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('KPI Definitions', () => {
    it('should have correct KPI definitions', () => {
      const definitions = service.getKPIDefinitions();
      
      expect(definitions.length).toBeGreaterThan(0);
      expect(definitions.some(kpi => kpi.category === 'sales')).toBe(true);
      expect(definitions.some(kpi => kpi.category === 'finance')).toBe(true);
      expect(definitions.some(kpi => kpi.category === 'marketing')).toBe(true);
      expect(definitions.some(kpi => kpi.category === 'operations')).toBe(true);
      expect(definitions.some(kpi => kpi.category === 'support')).toBe(true);
      expect(definitions.some(kpi => kpi.category === 'maturity')).toBe(true);
    });

    it('should have correct category weights', () => {
      const weights = service.getCategoryWeights();
      
      expect(weights.sales).toBe(1.0);
      expect(weights.finance).toBe(1.0);
      expect(weights.support).toBe(0.8);
      expect(weights.marketing).toBe(0.9);
      expect(weights.operations).toBe(0.8);
      expect(weights.maturity).toBe(0.7);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate numeric scores correctly', () => {
      const service = KPICalculationService.getInstance();
      
      // Test excellent score
      const excellentScore = (service as any).calculateNumericScore(100000, 50000, 25000, 10000, false);
      expect(excellentScore).toBe(100);
      
      // Test good score
      const goodScore = (service as any).calculateNumericScore(30000, 50000, 25000, 10000, false);
      expect(goodScore).toBe(80);
      
      // Test fair score
      const fairScore = (service as any).calculateNumericScore(15000, 50000, 25000, 10000, false);
      expect(fairScore).toBe(60);
      
      // Test poor score
      const poorScore = (service as any).calculateNumericScore(5000, 50000, 25000, 10000, false);
      expect(poorScore).toBeLessThan(60);
    });

    it('should calculate inverse scores correctly', () => {
      const service = KPICalculationService.getInstance();
      
      // Test excellent score (inverse - lower is better)
      const excellentScore = (service as any).calculateNumericScore(50, 100, 200, 500, true);
      expect(excellentScore).toBe(100);
      
      // Test good score (inverse)
      const goodScore = (service as any).calculateNumericScore(150, 100, 200, 500, true);
      expect(goodScore).toBe(80);
      
      // Test fair score (inverse)
      const fairScore = (service as any).calculateNumericScore(300, 100, 200, 500, true);
      expect(fairScore).toBe(60);
    });
  });
});
