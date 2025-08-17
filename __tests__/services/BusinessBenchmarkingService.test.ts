/**
 * BusinessBenchmarkingService Tests
 * Tests the real database business benchmarking service functionality
 */

import { BusinessBenchmarkingService } from '@/services/business/businessBenchmarkingService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          not: jest.fn(() => ({
            limit: jest.fn(() => ({
              order: jest.fn(() => ({
                single: jest.fn(() => ({
                  maybeSingle: jest.fn()
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('BusinessBenchmarkingService', () => {
  let service: BusinessBenchmarkingService;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    service = BusinessBenchmarkingService.getInstance();
    jest.clearAllMocks();
  });

  describe('getLivingAssessment', () => {
    const mockUserId = 'test-user-id';
    const mockBusinessProfile = {
      industry: 'technology',
      size: 'small',
      founded: '2020'
    };

    it('should return successful assessment with real data', async () => {
      // Mock business profile data
      const mockBusinessProfileData = {
        user_id: mockUserId,
        industry: 'technology',
        company_size: 'small',
        assessment_completion_percentage: 75,
        performance_metrics: { overall_score: 65 },
        business_health_history: [{ score: 65, tracked_at: new Date().toISOString() }]
      };

      // Mock business health data
      const mockBusinessHealthData = {
        overall_score: 65,
        data_quality_score: 80,
        connected_sources: 3
      };

      // Mock user integrations
      const mockUserIntegrations = [
        { id: '1', integration_type: 'hubspot', status: 'active' },
        { id: '2', integration_type: 'quickbooks', status: 'active' },
        { id: '3', integration_type: 'google_analytics', status: 'active' }
      ];

      // Mock similar businesses for peer comparison
      const mockSimilarBusinesses = [
        { user_id: 'other1', performance_metrics: { overall_score: 70 } },
        { user_id: 'other2', performance_metrics: { overall_score: 60 } },
        { user_id: 'other3', performance_metrics: { overall_score: 80 } }
      ];

      // Mock industry data for benchmarks
      const mockIndustryData = [
        { performance_metrics: { overall_score: 70 } },
        { performance_metrics: { overall_score: 60 } },
        { performance_metrics: { overall_score: 80 } },
        { performance_metrics: { overall_score: 65 } }
      ];

      // Mock historical data for trends
      const mockHistory = [
        { overall_score: 65, created_at: new Date().toISOString() },
        { overall_score: 60, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
      ];

      // Setup mocks
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockBusinessProfileData, error: null })
              })
            })
          })
        })
      });

      const mockBusinessHealthSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockBusinessHealthData, error: null })
            })
          })
        })
      });

      const mockIntegrationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockUserIntegrations, error: null })
      });

      const mockSimilarBusinessesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockSimilarBusinesses, error: null })
            })
          })
        })
      });

      const mockIndustrySelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({ data: mockIndustryData, error: null })
        })
      });

      const mockHistorySelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
          })
        })
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'business_profiles') {
          return {
            select: mockSelect
          } as any;
        }
        if (table === 'business_health') {
          return {
            select: mockBusinessHealthSelect
          } as any;
        }
        if (table === 'user_integrations') {
          return {
            select: mockIntegrationsSelect
          } as any;
        }
        return {
          select: jest.fn()
        } as any;
      });

      // Execute
      const result = await service.getLivingAssessment(mockUserId, mockBusinessProfile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.currentScore).toBeGreaterThan(0);
      expect(result.data?.benchmarks).toBeDefined();
      expect(result.data?.peerComparison).toBeDefined();
      expect(result.data?.achievements).toBeDefined();
      expect(result.data?.trends).toBeDefined();
    });

    it('should handle missing business profile data gracefully', async () => {
      // Mock missing business profile
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                })
              })
            })
          })
        })
      } as any);

      const result = await service.getLivingAssessment(mockUserId, mockBusinessProfile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch business data');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
                })
              })
            })
          })
        })
      } as any);

      const result = await service.getLivingAssessment(mockUserId, mockBusinessProfile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch business data');
    });

    it('should calculate achievements based on integration count', async () => {
      // Mock data with multiple integrations
      const mockUserIntegrations = [
        { id: '1', integration_type: 'hubspot', status: 'active' },
        { id: '2', integration_type: 'quickbooks', status: 'active' },
        { id: '3', integration_type: 'google_analytics', status: 'active' },
        { id: '4', integration_type: 'stripe', status: 'active' },
        { id: '5', integration_type: 'zendesk', status: 'active' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockUserIntegrations, error: null })
        })
      } as any);

      // Mock other required data
      const mockBusinessProfileData = {
        user_id: mockUserId,
        industry: 'technology',
        company_size: 'small',
        assessment_completion_percentage: 100
      };

      const mockBusinessHealthData = {
        overall_score: 70,
        data_quality_score: 85
      };

      // Setup mocks for different table calls
      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) { // business_profiles
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({ data: mockBusinessProfileData, error: null })
                    })
                  })
                })
              })
            })
          } as any;
        }
        if (callCount === 2) { // business_health
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: mockBusinessHealthData, error: null })
                  })
                })
              })
            })
          } as any;
        }
        if (callCount === 3) { // user_integrations
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: mockUserIntegrations, error: null })
            })
          } as any;
        }
        // Default for other calls
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        } as any;
      });

      const result = await service.getLivingAssessment(mockUserId, mockBusinessProfile);

      expect(result.success).toBe(true);
      expect(result.data?.achievements).toHaveLength(3); // First Integration, Data Pioneer, Integration Master
      expect(result.data?.achievements.some(a => a.id === 'first-integration')).toBe(true);
      expect(result.data?.achievements.some(a => a.id === 'data-pioneer')).toBe(true);
      expect(result.data?.achievements.some(a => a.id === 'integration-master')).toBe(true);
    });

    it('should calculate trends from historical data', async () => {
      // Mock historical data showing improvement
      const mockHistory = [
        { overall_score: 75, created_at: new Date().toISOString() },
        { overall_score: 65, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
      ];

      // Setup mocks
      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (table === 'business_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({ 
                        data: { user_id: mockUserId, industry: 'technology', company_size: 'small' }, 
                        error: null 
                      })
                    })
                  })
                })
              })
            })
          } as any;
        }
        if (table === 'business_health') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: { overall_score: 75 }, error: null })
                  })
                })
              })
            })
          } as any;
        }
        if (table === 'user_integrations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          } as any;
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        } as any;
      });

      const result = await service.getLivingAssessment(mockUserId, mockBusinessProfile);

      expect(result.success).toBe(true);
      expect(result.data?.trends).toBeDefined();
      expect(result.data?.trends.monthlyChange).toBeDefined();
      expect(result.data?.trends.weeklyChange).toBeDefined();
      expect(result.data?.trends.direction).toBeDefined();
    });
  });

  describe('Service Instance', () => {
    it('should return the same instance (singleton pattern)', () => {
      const instance1 = BusinessBenchmarkingService.getInstance();
      const instance2 = BusinessBenchmarkingService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
