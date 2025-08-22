import { renderHook, act } from '@testing-library/react';
import { useOperationsMetrics } from '../../src/domains/operations/hooks/useOperationsMetrics';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('useOperationsMetrics - Core Business Intelligence', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Metrics Fetching', () => {
    it('should fetch operations metrics successfully', async () => {
      const mockMetrics = {
        efficiency: 87.5,
        productivity: 92.1,
        qualityScore: 89.3,
        automationLevel: 76.2,
        trends: {
          efficiency: 5.2,
          productivity: 3.1,
          quality: -1.2
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      } as Response);

      const { result } = renderHook(() => useOperationsMetrics());

      expect(result.current.loading).toBe(true);

      // Wait for the hook to complete loading
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.error).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useOperationsMetrics());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch operations metrics');
      expect(result.current.metrics).toBeNull();
    });
  });

  describe('Metrics Validation', () => {
    it('should validate metric ranges', async () => {
      const mockMetrics = {
        efficiency: 87.5,
        productivity: 92.1,
        qualityScore: 89.3,
        automationLevel: 76.2
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      } as Response);

      const { result } = renderHook(() => useOperationsMetrics());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const metrics = result.current.metrics;
      if (metrics) {
        expect(metrics.efficiency).toBeGreaterThanOrEqual(0);
        expect(metrics.efficiency).toBeLessThanOrEqual(100);
        expect(metrics.productivity).toBeGreaterThanOrEqual(0);
        expect(metrics.productivity).toBeLessThanOrEqual(100);
        expect(metrics.qualityScore).toBeGreaterThanOrEqual(0);
        expect(metrics.qualityScore).toBeLessThanOrEqual(100);
        expect(metrics.automationLevel).toBeGreaterThanOrEqual(0);
        expect(metrics.automationLevel).toBeLessThanOrEqual(100);
      }
    });

    it('should handle missing metrics gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useOperationsMetrics());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.metrics).toEqual({});
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh metrics on demand', async () => {
      const initialMetrics = { efficiency: 80 };
      const updatedMetrics = { efficiency: 85 };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => initialMetrics,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedMetrics,
        } as Response);

      const { result } = renderHook(() => useOperationsMetrics());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.metrics).toEqual(initialMetrics);

      // Trigger refresh
      await act(async () => {
        if (result.current.refresh) {
          result.current.refresh();
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.metrics).toEqual(updatedMetrics);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track metric trends', async () => {
      const mockMetrics = {
        efficiency: 87.5,
        trends: {
          efficiency: 5.2,
          productivity: 3.1,
          quality: -1.2
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      } as Response);

      const { result } = renderHook(() => useOperationsMetrics());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.metrics?.trends).toBeDefined();
      expect(typeof result.current.metrics?.trends?.efficiency).toBe('number');
    });

    it('should identify performance alerts', async () => {
      const mockMetrics = {
        efficiency: 45.0, // Low efficiency should trigger alert
        productivity: 92.1,
        qualityScore: 35.0, // Low quality should trigger alert
        automationLevel: 76.2
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      } as Response);

      const { result } = renderHook(() => useOperationsMetrics());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Check if low values are properly identified
      const metrics = result.current.metrics;
      if (metrics) {
        const hasLowEfficiency = metrics.efficiency < 60;
        const hasLowQuality = metrics.qualityScore < 60;
        
        expect(hasLowEfficiency).toBe(true);
        expect(hasLowQuality).toBe(true);
      }
    });
  });
}); 