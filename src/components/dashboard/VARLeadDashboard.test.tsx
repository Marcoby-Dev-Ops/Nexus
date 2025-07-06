import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VARLeadDashboard } from './VARLeadDashboard';
import { useToast } from '@/components/ui/Toast';

// Mock dependencies
jest.mock('@/components/ui/Toast', () => ({
  useToast: jest.fn(),
}));
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));
jest.mock('recharts', () => {
    const OriginalRecharts = jest.requireActual('recharts');
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }: any) => <div data-testid="mock-responsive-container">{children}</div>,
        BarChart: ({ children }: any) => <div data-testid="mock-bar-chart">{children}</div>,
        PieChart: ({ children }: any) => <div data-testid="mock-pie-chart">{children}</div>,
    };
});

const mockUseToast = useToast as jest.Mock;
const mockToast = jest.fn();

const mockLeads = [
  { id: '1', email: 'test1@example.com', company: 'Company A', status: 'new', score: 0.9, source: 'web', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), contact: { firstName: 'Test', lastName: 'User1' } },
  { id: '2', email: 'test2@example.com', company: 'Company B', status: 'qualified', score: 0.7, source: 'referral', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), contact: { firstName: 'Test', lastName: 'User2' } },
  { id: '3', email: 'test3@example.com', company: 'Another Co', status: 'new', score: 0.5, source: 'web', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), contact: { firstName: 'Another', lastName: 'User' } },
];

describe('VARLeadDashboard', () => {

    beforeEach(() => {
        mockUseToast.mockReturnValue({ toast: mockToast });
        global.fetch = jest.fn((url) => {
            if (url.toString().includes('/api/var-leads/')) { // For PATCH requests
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockLeads),
            });
        }) as jest.Mock;
    });

    it('fetches and displays leads on initial render', async () => {
        render(<VARLeadDashboard />);
        
        await waitFor(() => {
            expect(screen.getByText('Company A')).toBeInTheDocument();
            expect(screen.getByText('Company B')).toBeInTheDocument();
        });

        // Check stats card
        expect(screen.getByText('Total Leads').closest('div')).toHaveTextContent('3');
    });

    it('filters leads based on search term', async () => {
        render(<VARLeadDashboard />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

        const searchInput = screen.getByPlaceholderText(/search leads/i);
        fireEvent.change(searchInput, { target: { value: 'Company A' } });

        await waitFor(() => {
            expect(screen.getByText('Company A')).toBeInTheDocument();
            expect(screen.queryByText('Company B')).not.toBeInTheDocument();
        });
    });

    it('filters leads based on status', async () => {
        render(<VARLeadDashboard />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

        const statusFilter = screen.getByRole('button', { name: /all statuses/i });
        fireEvent.click(statusFilter);
        
        const qualifiedOption = await screen.findByText('Qualified');
        fireEvent.click(qualifiedOption);

        await waitFor(() => {
            expect(screen.getByText('Company B')).toBeInTheDocument();
            expect(screen.queryByText('Company A')).not.toBeInTheDocument();
        });
    });

    it('updates a lead status successfully', async () => {
        render(<VARLeadDashboard />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

        const leadToUpdate = screen.getByText('Company A');
        fireEvent.click(leadToUpdate);

        const statusSelect = await screen.findByLabelText(/update status/i);
        fireEvent.change(statusSelect, { target: { value: 'contacted' } });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/var-leads/1', expect.any(Object));
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
        });
    });

    it('handles fetch error gracefully', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('API Down'));
        render(<VARLeadDashboard />);
        
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
        });
    });
}); 