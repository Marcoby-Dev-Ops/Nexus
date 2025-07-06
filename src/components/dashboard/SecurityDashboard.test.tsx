import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecurityDashboard } from './SecurityDashboard';
import { supabase } from '@/lib/core/supabase';

// Mock child components and dependencies
jest.mock('@/lib/core/supabase');
jest.mock('recharts', () => {
    const OriginalRecharts = jest.requireActual('recharts');
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }: any) => <div data-testid="mock-responsive-container">{children}</div>,
        AreaChart: ({ children }: any) => <div data-testid="mock-area-chart">{children}</div>,
    };
});

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('SecurityDashboard', () => {

    const mockEvents = [
        { id: '1', event_type: 'login', created_at: new Date().toISOString(), ip_address: '127.0.0.1' },
        { id: '2', event_type: 'failed_login', created_at: new Date().toISOString(), ip_address: '127.0.0.1' },
        { id: '3', event_type: 'failed_login', created_at: new Date().toISOString(), ip_address: '127.0.0.1' },
        { id: '4', event_type: 'failed_login', created_at: new Date().toISOString(), ip_address: '127.0.0.1' },
        { id: '5', event_type: 'failed_login', created_at: new Date().toISOString(), ip_address: '127.0.0.1' },
        { id: '6', event_type: 'failed_login', created_at: new Date().toISOString(), ip_address: '127.0.0.1' },
        { id: '7', event_type: 'suspicious_activity', created_at: new Date().toISOString(), ip_address: '127.0.0.1' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (mockSupabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
        });
    });

    it('renders loading state initially', () => {
        (mockSupabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue(new Promise(() => {})),
                    })
                })
            })
        });
        render(<SecurityDashboard />);
        expect(screen.getByText(/loading security data/i)).toBeInTheDocument();
    });

    it('fetches and displays security data', async () => {
        render(<SecurityDashboard />);
        await waitFor(() => {
            expect(screen.getByText('Total Events')).toBeInTheDocument();
            // Check a metric value based on mockEvents
            const suspiciousActivityCard = screen.getByText('Suspicious Activity').closest('div');
            expect(suspiciousActivityCard).toHaveTextContent('1');
        });
        
        // Check if an event from the log is rendered
        expect(await screen.findByText('login')).toBeInTheDocument();
    });

    it('generates and displays alerts based on event patterns', async () => {
        render(<SecurityDashboard />);
        await waitFor(() => {
            // Based on mockEvents, we expect 2 alerts
            expect(screen.getByText(/multiple failed login attempts/i)).toBeInTheDocument();
            expect(screen.getByText(/suspicious activity detected/i)).toBeInTheDocument();
        });
    });

    it('refetches data when the time range changes', async () => {
        render(<SecurityDashboard />);
        await waitFor(() => {
            // Initial fetch
            expect(mockSupabase.from).toHaveBeenCalledTimes(1);
        });

        const sevenDayButton = screen.getByRole('button', { name: '7d' });
        fireEvent.click(sevenDayButton);

        await waitFor(() => {
            // Should have been called again for the new time range
            expect(mockSupabase.from).toHaveBeenCalledTimes(2);

        });
    });

    it('handles data fetching error gracefully', async () => {
        (mockSupabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
                    })
                })
            })
        });
        console.error = jest.fn(); // Suppress console.error for this test
        render(<SecurityDashboard />);
        
        await waitFor(() => {
            // Should not crash and should not be in loading state
            expect(screen.queryByText(/loading security data/i)).not.toBeInTheDocument();
        });
        // Check that console.error was called with our specific error.
        expect(console.error).toHaveBeenCalledWith('Failed to load security data:', expect.any(Error));
    });
}); 