import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompanyStatusDashboard } from './CompanyStatusDashboard';
import { companyStatusService } from '@/domains/services/companyStatusService';
import { logger } from '@/core/auth/logger';

// Mock dependencies
jest.mock('@shared/shared/services/companyStatusService');
jest.mock('@shared/lib/security/logger');

const mockCompanyStatusService = companyStatusService as jest.Mocked<typeof companyStatusService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

const mockStatusData = {
  overallHealth: { score: 85, status: 'excellent', trend: 'improving' },
  keyMetrics: {
    revenue: { value: 1200000, trend: 5, period: 'month' },
    customer: { value: 500, trend: 10, period: 'month' },
    uptime: { value: 99.9, trend: 0.1, period: 'week' },
    satisfaction: { value: 9.2, trend: -0.2, period: 'week' },
  },
  dimensions: {
    financial: { score: 90, status: 'excellent', trend: 'improving' },
    operational: { score: 80, status: 'good', trend: 'stable' },
  },
  alerts: [{ id: '1', type: 'warning', message: 'High server load detected' }],
  insights: [{ id: '1', type: 'opportunity', message: 'New market segment showing high engagement' }],
};

describe('CompanyStatusDashboard', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockCompanyStatusService.getCompanyStatusOverview.mockResolvedValue(mockStatusData);
    });

    it('renders loading state initially', () => {
        mockCompanyStatusService.getCompanyStatusOverview.mockReturnValue(new Promise(() => {}));
        render(<CompanyStatusDashboard />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('fetches and displays company status data correctly', async () => {
        render(<CompanyStatusDashboard />);
        await waitFor(() => {
            // Check overall health
            expect(screen.getByText('85%')).toBeInTheDocument();
            // Check a key metric
            expect(screen.getByText('Revenue').closest('div')).toHaveTextContent('$1,200,000');
            // Check a dimension
            expect(screen.getByText('Financial').closest('div')).toHaveTextContent('90%');
            // Check an alert
            expect(screen.getByText(/high server load detected/i)).toBeInTheDocument();
        });
        expect(mockLogger.info).toHaveBeenCalledWith(expect.any(Object), 'Company status loaded');
    });

    it('renders error state on fetch failure and allows retry', async () => {
        const errorMessage = 'Network Error';
        mockCompanyStatusService.getCompanyStatusOverview.mockRejectedValue(new Error(errorMessage));
        render(<CompanyStatusDashboard />);

        expect(await screen.findByText(/error loading company status/i)).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(mockLogger.error).toHaveBeenCalled();
        
        const retryButton = screen.getByRole('button', { name: /retry/i });
        fireEvent.click(retryButton);

        await waitFor(() => {
            expect(mockCompanyStatusService.getCompanyStatusOverview).toHaveBeenCalledTimes(2);
        });
    });

    it('allows refreshing the data', async () => {
        render(<CompanyStatusDashboard />);
        await waitFor(() => expect(mockCompanyStatusService.getCompanyStatusOverview).toHaveBeenCalledTimes(1));

        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(mockCompanyStatusService.getCompanyStatusOverview).toHaveBeenCalledTimes(2);
        });
    });
}); 