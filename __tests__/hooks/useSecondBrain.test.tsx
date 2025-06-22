import { renderHook, act } from '@testing-library/react';
import { useSecondBrain } from '../../src/lib/hooks/useSecondBrain';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('useSecondBrain', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Analytics Integration', () => {
    it('should fetch Google Analytics data', async () => {
      const mockAnalyticsData = {
        sessions: 1250,
        pageviews: 3400,
        bounceRate: 0.45,
        avgSessionDuration: 180
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      } as Response);

      const { result } = renderHook(() => useSecondBrain());

      await act(async () => {
        const data = await result.current.getAnalyticsData();
        expect(data).toEqual(mockAnalyticsData);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/integrations/google-analytics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle analytics API errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Analytics API error'));

      const { result } = renderHook(() => useSecondBrain());

      await act(async () => {
        const data = await result.current.getAnalyticsData();
        expect(data).toEqual({
          sessions: 0,
          pageviews: 0,
          bounceRate: 0,
          avgSessionDuration: 0
        });
      });
    });
  });

  describe('CRM Integration', () => {
    it('should fetch HubSpot leads', async () => {
      const mockLeads = [
        { id: '1', name: 'John Doe', email: 'john@example.com', score: 85 },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', score: 92 }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leads: mockLeads }),
      } as Response);

      const { result } = renderHook(() => useSecondBrain());

      await act(async () => {
        const data = await result.current.getCRMData();
        expect(data.leads).toEqual(mockLeads);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/integrations/hubspot', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('Event Tracking', () => {
    it('should track user events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useSecondBrain());

      await act(async () => {
        await result.current.trackEvent('user_action', {
          action: 'button_click',
          component: 'dashboard',
          userId: 'user-123'
        });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'user_action',
          properties: {
            action: 'button_click',
            component: 'dashboard',
            userId: 'user-123'
          },
          timestamp: expect.any(String)
        })
      });
    });
  });

  describe('Action Execution', () => {
    it('should execute actions via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, actionId: 'action-789' }),
      } as Response);

      const { result } = renderHook(() => useSecondBrain());

      await act(async () => {
        const resultData = await result.current.executeAction('send_email', {
          to: 'user@example.com',
          subject: 'Test Email',
          body: 'Hello World'
        });
        expect(resultData.success).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'send_email',
          parameters: {
            to: 'user@example.com',
            subject: 'Test Email',
            body: 'Hello World'
          }
        })
      });
    });
  });
}); 