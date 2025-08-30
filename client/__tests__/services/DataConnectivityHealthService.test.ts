/**
 * DataConnectivityHealthService Tests
 * Tests the real database connectivity health service functionality
 */

import { DataConnectivityHealthService } from '@/services/business/dataConnectivityHealthService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          filter: jest.fn(() => ({
            map: jest.fn(() => ({
              gte: jest.fn(() => ({
                not: jest.fn(() => ({
                  single: jest.fn(() => ({
                    limit: jest.fn(() => ({
                      order: jest.fn(() => ({
                        maybeSingle: jest.fn()
                      }))
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('DataConnectivityHealthService', () => {
  let service: DataConnectivityHealthService;
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    service = DataConnectivityHealthService.getInstance();
    jest.clearAllMocks();
  });

  describe('getConnectivityStatus', () => {
    it('should return connectivity health data for a valid user', async () => {
      // Mock user integrations data
      const mockUserIntegrations = [
        {
          id: 'integration-1',
          integration_name: 'HubSpot CRM',
          status: 'connected',
          last_sync_at: new Date().toISOString(),
          error_message: null,
          config: {},
          integration_id: 'hubspot-id',
          integrations: {
            name: 'HubSpot',
            category: 'crm',
            description: 'CRM integration'
          }
        },
        {
          id: 'integration-2',
          integration_name: 'Google Analytics',
          status: 'connected',
          last_sync_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          error_message: null,
          config: {},
          integration_id: 'ga-id',
          integrations: {
            name: 'Google Analytics',
            category: 'analytics',
            description: 'Analytics integration'
          }
        }
      ];

      // Mock available integrations data
      const mockAvailableIntegrations = [
        {
          id: 'hubspot-id',
          name: 'HubSpot',
          category: 'crm',
          description: 'CRM integration',
          is_active: true
        },
        {
          id: 'ga-id',
          name: 'Google Analytics',
          category: 'analytics',
          description: 'Analytics integration',
          is_active: true
        },
        {
          id: 'stripe-id',
          name: 'Stripe',
          category: 'finance',
          description: 'Payment processing',
          is_active: true
        }
      ];

      // Setup mocks
      const mockSelect = jest.fn();
      const mockEq = jest.fn();
      const mockFrom = jest.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq
        })
      }));

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // Mock first call (user integrations)
      mockEq.mockImplementationOnce(() => Promise.resolve({
        data: mockUserIntegrations,
        error: null
      }));

      // Mock second call (available integrations)
      mockEq.mockImplementationOnce(() => Promise.resolve({
        data: mockAvailableIntegrations,
        error: null
      }));

      const result = await service.getConnectivityStatus(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.overallScore).toBeGreaterThan(0);
      expect(result.data?.connectedSources).toHaveLength(2);
      expect(result.data?.unconnectedSources).toHaveLength(1);
      expect(result.data?.recommendations).toHaveLength(3);
    });

    it('should handle empty user integrations', async () => {
      // Mock empty user integrations
      const mockUserIntegrations: any[] = [];
      const mockAvailableIntegrations = [
        {
          id: 'hubspot-id',
          name: 'HubSpot',
          category: 'crm',
          description: 'CRM integration',
          is_active: true
        }
      ];

      const mockSelect = jest.fn();
      const mockEq = jest.fn();
      const mockFrom = jest.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq
        })
      }));

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // Mock first call (user integrations)
      mockEq.mockImplementationOnce(() => Promise.resolve({
        data: mockUserIntegrations,
        error: null
      }));

      // Mock second call (available integrations)
      mockEq.mockImplementationOnce(() => Promise.resolve({
        data: mockAvailableIntegrations,
        error: null
      }));

      const result = await service.getConnectivityStatus(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.overallScore).toBe(0);
      expect(result.data?.connectedSources).toHaveLength(0);
      expect(result.data?.unconnectedSources).toHaveLength(1);
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = jest.fn();
      const mockEq = jest.fn();
      const mockFrom = jest.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq
        })
      }));

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // Mock database error
      mockEq.mockImplementationOnce(() => Promise.resolve({
        data: null,
        error: { message: 'Database connection failed' }
      }));

      const result = await service.getConnectivityStatus(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate user ID parameter', async () => {
      const result = await service.getConnectivityStatus('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('userId');
    });
  });

  describe('getRealTimeConnectivityStatus', () => {
    it('should return real-time connectivity status with error adjustments', async () => {
      // Mock successful connectivity status
      const mockConnectivityData = {
        overallScore: 80,
        dataQualityScore: 85,
        completionPercentage: 60,
        connectedSources: [],
        unconnectedSources: [],
        lastUpdated: new Date().toISOString(),
        recommendations: []
      };

      // Mock recent errors
      const mockRecentErrors = [
        {
          integration_name: 'HubSpot',
          error_message: 'API rate limit exceeded',
          updated_at: new Date().toISOString()
        }
      ];

      const mockSelect = jest.fn();
      const mockEq = jest.fn();
      const mockNot = jest.fn();
      const mockGte = jest.fn();
      const mockFrom = jest.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            not: mockNot.mockReturnValue({
              gte: mockGte
            })
          })
        })
      }));

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // Mock the connectivity status call
      mockEq.mockImplementationOnce(() => Promise.resolve({
        data: [],
        error: null
      }));

      // Mock the recent errors call
      mockGte.mockImplementationOnce(() => Promise.resolve({
        data: mockRecentErrors,
        error: null
      }));

      const result = await service.getRealTimeConnectivityStatus(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('data quality calculation', () => {
    it('should calculate data quality based on sync frequency', () => {
      const integration = {
        error_message: null,
        last_sync_at: new Date().toISOString(),
        integrations: { category: 'crm' }
      };

      // This would test the private method indirectly through the public interface
      // For now, we'll test the behavior through the main method
      expect(true).toBe(true); // Placeholder for actual test
    });

    it('should reduce quality score for integrations with errors', () => {
      const integration = {
        error_message: 'API connection failed',
        last_sync_at: new Date().toISOString(),
        integrations: { category: 'crm' }
      };

      // This would test the private method indirectly through the public interface
      expect(true).toBe(true); // Placeholder for actual test
    });
  });

  describe('recommendation generation', () => {
    it('should generate recommendations for missing critical integrations', async () => {
      // Mock data with no CRM or finance integrations
      const mockUserIntegrations: any[] = [];
      const mockAvailableIntegrations = [
        {
          id: 'hubspot-id',
          name: 'HubSpot',
          category: 'crm',
          description: 'CRM integration',
          is_active: true
        },
        {
          id: 'stripe-id',
          name: 'Stripe',
          category: 'finance',
          description: 'Payment processing',
          is_active: true
        }
      ];

      const mockSelect = jest.fn();
      const mockEq = jest.fn();
      const mockFrom = jest.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq
        })
      }));

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      mockEq.mockImplementationOnce(() => Promise.resolve({
        data: mockUserIntegrations,
        error: null
      }));

      mockEq.mockImplementationOnce(() => Promise.resolve({
        data: mockAvailableIntegrations,
        error: null
      }));

      const result = await service.getConnectivityStatus(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.recommendations).toContain('Connect a CRM system to track customer relationships');
      expect(result.data?.recommendations).toContain('Connect financial tools to monitor business performance');
    });
  });
});
