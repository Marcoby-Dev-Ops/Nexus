import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { financialDataService } from '@/services/business/financialDataService';

  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('FinancialDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeFinancialData', () => {
    it('should store financial data successfully', async () => {
      const mockData = {
        user_id: 'test-user-id',
        integration_type: 'quickbooks' as const,
        data_type: 'revenue' as const,
        amount: 1000.00,
        currency: 'USD',
        category: 'Sales',
        description: 'Product sale',
        date: '2025-01-28',
        external_id: 'qb-123',
        metadata: { source: 'quickbooks' }
      };

      const mockResponse = {
        data: { id: 'test-id', ...mockData, created_at: '2025-01-28T00:00:00Z', updated_at: '2025-01-28T00:00:00Z' },
        error: null
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      } as any);

      const result = await financialDataService.storeFinancialData(mockData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(mockSupabase.from).toHaveBeenCalledWith('financial_data');
    });

    it('should handle database errors', async () => {
      const mockData = {
        user_id: 'test-user-id',
        integration_type: 'paypal' as const,
        data_type: 'payment' as const,
        amount: 500.00,
        currency: 'USD',
        date: '2025-01-28'
      };

      const mockError = { message: 'Database error', code: 'PGRST116' };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: mockError })
          })
        })
      } as any);

      const result = await financialDataService.storeFinancialData(mockData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getFinancialData', () => {
    it('should get financial data with filters', async () => {
      const mockData = [
        {
          id: 'test-1',
          user_id: 'test-user-id',
          integration_type: 'quickbooks',
          data_type: 'revenue',
          amount: 1000.00,
          currency: 'USD',
          date: '2025-01-28',
          created_at: '2025-01-28T00:00:00Z',
          updated_at: '2025-01-28T00:00:00Z'
        }
      ];

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery)
      } as any);

      const result = await financialDataService.getFinancialData('test-user-id', {
        integration_type: 'quickbooks',
        data_type: 'revenue',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('integration_type', 'quickbooks');
      expect(mockQuery.eq).toHaveBeenCalledWith('data_type', 'revenue');
      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2025-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2025-01-31');
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should handle empty results', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery)
      } as any);

      const result = await financialDataService.getFinancialData('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('calculateFinancialMetrics', () => {
    it('should calculate and store financial metrics', async () => {
      const mockFinancialData = [
        {
          id: 'test-1',
          user_id: 'test-user-id',
          data_type: 'revenue',
          amount: 1000.00,
          date: '2025-01-28'
        },
        {
          id: 'test-2',
          user_id: 'test-user-id',
          data_type: 'expense',
          amount: 300.00,
          date: '2025-01-28'
        }
      ];

      const mockMetrics = {
        id: 'metrics-id',
        user_id: 'test-user-id',
        date: '2025-01-28',
        month: '2025-01',
        year: '2025',
        revenue: 1000.00,
        expenses: 300.00,
        profit: 700.00,
        profit_margin: 70.00,
        cash_flow: 700.00,
        created_at: '2025-01-28T00:00:00Z',
        updated_at: '2025-01-28T00:00:00Z'
      };

      // Mock the data fetch
      const mockDataQuery = {
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockFinancialData, error: null })
      };

      // Mock the metrics upsert
      const mockUpsertQuery = {
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockMetrics, error: null })
          })
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockDataQuery as any) // First call for financial_data
        .mockReturnValueOnce(mockUpsertQuery as any); // Second call for financial_metrics

      const result = await financialDataService.calculateFinancialMetrics('test-user-id', '2025-01-28');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMetrics);
      expect(mockDataQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockDataQuery.gte).toHaveBeenCalledWith('date', '2025-01-01');
      expect(mockDataQuery.lte).toHaveBeenCalledWith('date', '2025-01-31');
    });

    it('should handle missing financial data', async () => {
      const mockDataQuery = {
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      const mockUpsertQuery = {
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { 
                id: 'metrics-id',
                user_id: 'test-user-id',
                date: '2025-01-28',
                revenue: 0,
                expenses: 0,
                profit: 0,
                profit_margin: 0,
                cash_flow: 0
              }, 
              error: null 
            })
          })
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockDataQuery as any)
        .mockReturnValueOnce(mockUpsertQuery as any);

      const result = await financialDataService.calculateFinancialMetrics('test-user-id', '2025-01-28');

      expect(result.success).toBe(true);
      expect(result.data?.revenue).toBe(0);
      expect(result.data?.expenses).toBe(0);
    });
  });

  describe('getFinancialMetrics', () => {
    it('should get financial metrics for a period', async () => {
      const mockMetrics = [
        {
          id: 'metrics-1',
          user_id: 'test-user-id',
          date: '2025-01-28',
          month: '2025-01',
          year: '2025',
          revenue: 1000.00,
          expenses: 300.00,
          profit: 700.00,
          profit_margin: 70.00,
          cash_flow: 700.00,
          created_at: '2025-01-28T00:00:00Z',
          updated_at: '2025-01-28T00:00:00Z'
        }
      ];

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockMetrics, error: null })
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery)
      } as any);

      const result = await financialDataService.getFinancialMetrics('test-user-id', 'month');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMetrics);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockQuery.gte).toHaveBeenCalledWith('date', expect.stringMatching(/^\d{4}-\d{2}-01$/));
    });
  });

  describe('calculateFinancialHealthScore', () => {
    it('should calculate health score with financial data', async () => {
      const mockMetrics = [
        {
          id: 'metrics-1',
          user_id: 'test-user-id',
          revenue: 10000.00,
          expenses: 6000.00,
          profit: 4000.00,
          profit_margin: 40.00,
          cash_flow: 4000.00,
          total_assets: 20000.00,
          created_at: '2025-01-28T00:00:00Z',
          updated_at: '2025-01-28T00:00:00Z'
        }
      ];

      const mockHealthScore = {
        id: 'health-id',
        user_id: 'test-user-id',
        overall_score: 85,
        revenue_score: 100,
        profitability_score: 40,
        cash_flow_score: 100,
        efficiency_score: 70,
        growth_score: 75,
        risk_score: 15,
        recommendations: ['Maintain current performance'],
        insights: ['Strong profitability indicates healthy business model'],
        calculated_at: '2025-01-28T00:00:00Z',
        created_at: '2025-01-28T00:00:00Z',
        updated_at: '2025-01-28T00:00:00Z'
      };

      // Mock metrics fetch
      const mockMetricsQuery = {
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockMetrics, error: null })
      };

      // Mock health score upsert
      const mockUpsertQuery = {
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockHealthScore, error: null })
          })
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockMetricsQuery as any)
        .mockReturnValueOnce(mockUpsertQuery as any);

      const result = await financialDataService.calculateFinancialHealthScore('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHealthScore);
      expect(result.data?.overall_score).toBe(85);
      expect(result.data?.profitability_score).toBe(40);
    });

    it('should handle no financial metrics', async () => {
      const mockMetricsQuery = {
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockMetricsQuery)
      } as any);

      const result = await financialDataService.calculateFinancialHealthScore('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data?.overall_score).toBe(0);
      expect(result.data?.recommendations).toContain('Connect financial integrations to get accurate health scores');
    });
  });

  describe('getFinancialHealthScore', () => {
    it('should get existing health score', async () => {
      const mockHealthScore = {
        id: 'health-id',
        user_id: 'test-user-id',
        overall_score: 85,
        revenue_score: 100,
        profitability_score: 40,
        cash_flow_score: 100,
        efficiency_score: 70,
        growth_score: 75,
        risk_score: 15,
        recommendations: ['Maintain current performance'],
        insights: ['Strong profitability indicates healthy business model'],
        calculated_at: '2025-01-28T00:00:00Z',
        created_at: '2025-01-28T00:00:00Z',
        updated_at: '2025-01-28T00:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockHealthScore, error: null })
          })
        })
      } as any);

      const result = await financialDataService.getFinancialHealthScore('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHealthScore);
    });

    it('should handle no health score found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      } as any);

      const result = await financialDataService.getFinancialHealthScore('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('updateIntegrationStatus', () => {
    it('should update integration status', async () => {
      const mockStatus = {
        id: 'status-id',
        user_id: 'test-user-id',
        integration_type: 'quickbooks',
        status: 'connected',
        last_sync_at: '2025-01-28T00:00:00Z',
        error_message: null,
        metadata: { sync_count: 1 },
        created_at: '2025-01-28T00:00:00Z',
        updated_at: '2025-01-28T00:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockStatus, error: null })
          })
        })
      } as any);

      const result = await financialDataService.updateIntegrationStatus('test-user-id', 'quickbooks', {
        status: 'connected',
        last_sync_at: '2025-01-28T00:00:00Z',
        metadata: { sync_count: 1 }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStatus);
    });
  });

  describe('getIntegrationStatus', () => {
    it('should get all integration statuses', async () => {
      const mockStatuses = [
        {
          id: 'status-1',
          user_id: 'test-user-id',
          integration_type: 'quickbooks',
          status: 'connected',
          last_sync_at: '2025-01-28T00:00:00Z',
          created_at: '2025-01-28T00:00:00Z',
          updated_at: '2025-01-28T00:00:00Z'
        },
        {
          id: 'status-2',
          user_id: 'test-user-id',
          integration_type: 'paypal',
          status: 'disconnected',
          last_sync_at: null,
          created_at: '2025-01-28T00:00:00Z',
          updated_at: '2025-01-28T00:00:00Z'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockStatuses, error: null })
        })
      } as any);

      const result = await financialDataService.getIntegrationStatus('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStatuses);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('singleton pattern', () => {
    it('should maintain singleton instance', () => {
      const instance1 = financialDataService;
      const instance2 = financialDataService;
      
      expect(instance1).toBe(instance2);
    });
  });
});
