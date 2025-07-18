import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Pins } from '@/domains/dashboard/features/components/Pins';
import { useWidgetAnalytics } from '@/shared/features/widgets/hooks/useWidgetAnalytics';
import { supabase } from "@/core/supabase";

// Mocks
jest.mock('@shared/features/widgets/hooks/useWidgetAnalytics');
jest.mock('@core/hooks/useRealtimeTable', () => ({
  useRealtimeTable: jest.fn(),
}));
jest.mock('@shared/lib/core/supabase');

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

describe('Pins Component', () => {
  const mockLogWidgetEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWidgetAnalytics.mockReturnValue({
      logWidgetEvent: mockLogWidgetEvent,
    });
    queryClient.clear();
  });

  it('renders loading state initially', () => {
    // Prevent query from resolving immediately
    (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
        }),
    });
    render(<Pins />, { wrapper });
    // The actual component shows a skeleton loader, not text.
    // Let's check for the presence of the pulse animation class.
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
    render(<Pins />, { wrapper });
    expect(await screen.findByText(/error loading pins/i)).toBeInTheDocument();
  });

  it('renders empty state when no pins are available', async () => {
    (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
        }),
    });
    render(<Pins />, { wrapper });
    expect(await screen.findByText(/no pinned items/i)).toBeInTheDocument();
  });

  it('renders a list of pinned items', async () => {
    const mockPins = [
      { id: '1', entityType: 'Document', entityId: 'doc-123', pinnedAt: new Date().toISOString() },
      { id: '2', entityType: 'Task', entityId: 'task-456', pinnedAt: new Date().toISOString() },
    ];
    (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockPins, error: null }),
            }),
        }),
    });
    render(<Pins />, { wrapper });

    expect(await screen.findByText(/document: doc-123/i)).toBeInTheDocument();
    expect(await screen.findByText(/task: task-456/i)).toBeInTheDocument();
  });

  it('calls analytics event on "Open" button click', async () => {
    const mockPins = [{ id: '1', entityType: 'Document', entityId: 'doc-123', pinnedAt: new Date().toISOString() }];
    (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockPins, error: null }),
            }),
        }),
    });
    render(<Pins />, { wrapper });
    
    const openButton = await screen.findByRole('button', { name: /open/i });
    fireEvent.click(openButton);

    expect(mockLogWidgetEvent).toHaveBeenCalledWith('pins-widget', 'click', { itemId: '1' });
  });
}); 