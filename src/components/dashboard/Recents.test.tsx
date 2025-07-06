import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Recents } from './Recents';
import { useWidgetAnalytics } from '@/hooks/useWidgetAnalytics';
import { supabase } from '@/lib/core/supabase';

// Mocks
jest.mock('@/hooks/useWidgetAnalytics');
jest.mock('@/hooks/useRealtimeTable', () => ({
  useRealtimeTable: jest.fn(),
}));
jest.mock('@/lib/core/supabase');

const mockUseWidgetAnalytics = useWidgetAnalytics as jest.Mock;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Recents Component', () => {
  const mockLogWidgetEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWidgetAnalytics.mockReturnValue({
      logWidgetEvent: mockLogWidgetEvent,
    });
    queryClient.clear();
  });

  it('renders loading state initially', () => {
    (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
        }),
    });
    render(<Recents />, { wrapper });
    const skeleton = screen.getByRole('list');
    expect(skeleton.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error state on fetch failure', async () => {
    (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ error: new Error('Failed to fetch') }),
            }),
        }),
    });
    render(<Recents />, { wrapper });
    expect(await screen.findByText(/error loading recents/i)).toBeInTheDocument();
  });

  it('renders empty state when no recent items are available', async () => {
    (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
        }),
    });
    render(<Recents />, { wrapper });
    expect(await screen.findByText(/no recent items/i)).toBeInTheDocument();
  });

  it('renders a list of recent items', async () => {
    const mockRecents = [
      { id: '1', entityType: 'Document', entityId: 'doc-123', viewedAt: new Date().toISOString() },
      { id: '2', entityType: 'Task', entityId: 'task-456', viewedAt: new Date().toISOString() },
    ];
    (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockRecents, error: null }),
            }),
        }),
    });
    render(<Recents />, { wrapper });

    expect(await screen.findByText(/document: doc-123/i)).toBeInTheDocument();
    expect(await screen.findByText(/task: task-456/i)).toBeInTheDocument();
  });

  it('calls analytics event on "Open" button click', async () => {
    const mockRecents = [{ id: '1', entityType: 'Document', entityId: 'doc-123', viewedAt: new Date().toISOString() }];
    (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockRecents, error: null }),
            }),
        }),
    });
    render(<Recents />, { wrapper });
    
    const openButton = await screen.findByRole('button', { name: /open/i });
    fireEvent.click(openButton);

    expect(mockLogWidgetEvent).toHaveBeenCalledWith('recents-widget', 'click', { itemId: '1' });
  });
}); 