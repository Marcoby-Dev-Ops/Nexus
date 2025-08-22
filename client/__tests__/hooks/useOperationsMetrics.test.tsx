import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOperationsMetrics } from '../../src/domains/operations/hooks/useOperationsMetrics';
import React from 'react';

// Mock Supabase client and the RPC chain used in the hook
jest.mock('../../src/lib/supabase', () => {
  const mockData = {
    department: 'operations',
    state: {
      score: 80,
      updatedAt: new Date().toISOString(),
      kpis: [
        { id: 'deploy_frequency', label: 'Deployment Frequency', value: 10, delta: 0, history: [] },
      ],
    },
  };
  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: mockData, error: null }),
          }),
        }),
      }),
    },
  };
});

const queryClient = new QueryClient();

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useOperationsMetrics', () => {
  it('fetches and returns department metrics', async () => {
    const { result } = renderHook(() => useOperationsMetrics(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data;
    expect((data as any)?.kpis?.[0]?.value || (data as any)?.state?.kpis?.[0]?.value).toBe(10);
  });
}); 