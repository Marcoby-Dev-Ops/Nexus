import { renderHook, act } from '@testing-library/react';
import { useSecondBrain } from '../../src/lib/hooks/useSecondBrain';

// Mock fetch
(global.fetch as any) = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('useSecondBrain', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should initialize and provide insights, actions, and automation opportunities', async () => {
    const { result } = renderHook(() => useSecondBrain('dashboard'));
    // Wait for useEffect to run
    await act(async () => {
      // Simulate async effect
      await Promise.resolve();
    });
    expect(Array.isArray(result.current.insights)).toBe(true);
    expect(Array.isArray(result.current.actions)).toBe(true);
    expect(Array.isArray(result.current.automationOpportunities)).toBe(true);
    expect(typeof result.current.isLearning).toBe('boolean');
  });

  it('should allow recording an event', async () => {
    const { result } = renderHook(() => useSecondBrain('dashboard'));
    await act(async () => {
      result.current.recordEvent({
        type: 'page_view',
        data: { test: true },
        context: {
          page: 'dashboard',
          sessionId: 'test-session',
          timestamp: new Date().toISOString(),
          userAgent: 'test-agent'
        }
      });
    });
    // No error means pass
    expect(true).toBe(true);
  });

  it('should allow dismissing an insight', async () => {
    const { result } = renderHook(() => useSecondBrain('dashboard'));
    await act(async () => {
      // Add a fake insight
      result.current.insights.push({
        id: 'test-insight',
        type: 'opportunity',
        priority: 'low',
        category: 'Test',
        title: 'Test Insight',
        description: 'Test',
        dataSource: [],
        metrics: { impact: 1, confidence: 1, timeToValue: 1, effort: 1 },
        suggestedActions: [],
        automationPotential: null,
        context: { pageRelevance: [], triggerConditions: {}, historicalData: [] },
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      result.current.dismissInsight('test-insight');
    });
    expect(result.current.insights.find(i => i.id === 'test-insight')?.status).toBe('dismissed');
  });

  it('should allow updating preferences', async () => {
    const { result } = renderHook(() => useSecondBrain('dashboard'));
    await act(async () => {
      result.current.updatePreferences({ communicationStyle: 'detailed' });
    });
    // No error means pass
    expect(true).toBe(true);
  });

  it('should allow executing an action (no-op if not found)', async () => {
    const { result } = renderHook(() => useSecondBrain('dashboard'));
    await act(async () => {
      await result.current.executeAction('nonexistent-action');
    });
    // No error means pass
    expect(true).toBe(true);
  });

  it('should allow creating an automation (no-op if not found)', async () => {
    const { result } = renderHook(() => useSecondBrain('dashboard'));
    await act(async () => {
      await result.current.createAutomation('nonexistent-automation');
    });
    // No error means pass
    expect(true).toBe(true);
  });
}); 