import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModelManagementDashboard } from '@/domains/dashboard/features/components/ModelManagementDashboard';
import { modelManager } from '@/domains/ai/lib/modelManager';
import { useToast } from '@/shared/components/ui/Toast';

// Mock dependencies
jest.mock('@shared/ai/lib/modelManager');
jest.mock('@shared/components/ui/Toast');
jest.mock('@shared/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));
jest.mock('recharts', () => {
    const OriginalRecharts = jest.requireActual('recharts');
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }: any) => <div data-testid="mock-responsive-container">{children}</div>,
        BarChart: ({ children }: any) => <div data-testid="mock-bar-chart">{children}</div>,
        PieChart: ({ children }: any) => <div data-testid="mock-pie-chart">{children}</div>,
        LineChart: ({ children }: any) => <div data-testid="mock-line-chart">{children}</div>,
    };
});

const mockModelManager = modelManager as jest.Mocked<typeof modelManager>;
const mockUseToast = useToast as jest.Mock;
const mockShowToast = jest.fn();

const mockReport = {
    monthlyCost: 1234.56,
    modelPerformance: {
        'gpt-4': { successRate: 0.98, averageLatency: 500, averageCost: 0.02, errorCount: 5 },
        'claude-3': { successRate: 0.99, averageLatency: 300, averageCost: 0.015, errorCount: 2 },
    },
    suggestions: ['Consider using claude-3 for cost-sensitive tasks.'],
};

describe('ModelManagementDashboard', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseToast.mockReturnValue({ showToast: mockShowToast });
        mockModelManager.generateReport.mockResolvedValue(mockReport);
    });

    it('renders loading state initially', () => {
        mockModelManager.generateReport.mockReturnValue(new Promise(() => {}));
        render(<ModelManagementDashboard />);
        // The component does not have an explicit loading text, we check for absence of data
        expect(screen.queryByText(/monthly cost/i)).not.toBeInTheDocument();
    });

    it('fetches and displays model management data', async () => {
        render(<ModelManagementDashboard />);

        await waitFor(() => {
            // Check stats card
            expect(screen.getByText('Monthly Cost').closest('div')).toHaveTextContent('$1234.56');
            // Check active models
            expect(screen.getByText('Active Models').closest('div')).toHaveTextContent('2');
            // Check a suggestion
            expect(screen.getByText(/consider using claude-3/i)).toBeInTheDocument();
            // Check that charts are rendered
            expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
            expect(screen.getByTestId('mock-pie-chart')).toBeInTheDocument();
            expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
        });
    });
    
    it('refetches data when the time range is changed', async () => {
        render(<ModelManagementDashboard />);
        await waitFor(() => expect(mockModelManager.generateReport).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByRole('button', { name: /week/i }));
        await waitFor(() => expect(mockModelManager.generateReport).toHaveBeenCalledTimes(2));

        fireEvent.click(screen.getByRole('button', { name: /day/i }));
        await waitFor(() => expect(mockModelManager.generateReport).toHaveBeenCalledTimes(3));
    });

    it('shows a toast notification on fetch error', async () => {
        mockModelManager.generateReport.mockRejectedValue(new Error('API Error'));
        render(<ModelManagementDashboard />);

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Error',
                description: 'Failed to load model management data',
                type: 'error',
            });
        });
    });
}); 