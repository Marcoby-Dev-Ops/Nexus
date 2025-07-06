import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CentralizedAppsHub } from './CentralizedAppsHub';
import { orchestrator } from '@/lib/centralizedAppsOrchestrator';

// Mock the orchestrator
jest.mock('@/lib/centralizedAppsOrchestrator');

const mockOrchestrator = orchestrator as jest.Mocked<typeof orchestrator>;

const mockApps = [
    { id: 'salesforce', name: 'Salesforce', category: 'crm-sales', status: 'connected' },
    { id: 'quickbooks', name: 'QuickBooks', category: 'finance-accounting', status: 'connected' },
];
const mockFunctions = [
    { id: 'gen_report', name: 'Generate Sales Report', description: 'Generates the monthly sales report.' },
];
const mockStatus = { connectedApps: 2, healthyApps: 2, totalDataPoints: 1000 };
const mockInsights = { keyInsights: [{ id: '1', text: 'Sales are up!' }] };

describe('CentralizedAppsHub', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockOrchestrator.getConnectedApps.mockReturnValue(mockApps);
        mockOrchestrator.getBusinessFunctions.mockReturnValue(mockFunctions);
        mockOrchestrator.getAppsCentralizedStatus.mockReturnValue(mockStatus);
        mockOrchestrator.getBusinessInsights.mockResolvedValue(mockInsights);
        mockOrchestrator.executeUnifiedCommand.mockResolvedValue({ success: true });
        mockOrchestrator.executeBusinessFunction.mockResolvedValue({ success: true });
    });

    it('renders loading state initially', () => {
        mockOrchestrator.getConnectedApps.mockImplementation(() => {
            throw new Error("Simulate initial loading state");
        });
        const { container } = render(<CentralizedAppsHub />);
        // The component does not have an explicit loading text, we check for absence of data
        expect(container.firstChild).not.toBeNull(); // It renders a skeleton
        expect(screen.queryByText(/centralizing your business apps/i)).toBeInTheDocument();
    });

    it('fetches and displays data from the orchestrator', async () => {
        render(<CentralizedAppsHub />);
        await waitFor(() => {
            // Check stats
            expect(screen.getByText('Connected Apps').closest('div')).toHaveTextContent('2');
            // Check app list
            expect(screen.getByText('Salesforce')).toBeInTheDocument();
            // Check function list
            expect(screen.getByText(/generate sales report/i)).toBeInTheDocument();
        });
    });

    it('enables execute button only when command and apps are selected', async () => {
        render(<CentralizedAppsHub />);
        await waitFor(() => expect(mockOrchestrator.getConnectedApps).toHaveBeenCalled());

        const executeButton = screen.getByRole('button', { name: /execute/i });
        expect(executeButton).toBeDisabled();

        const commandInput = screen.getByPlaceholderText(/generate monthly sales report/i);
        fireEvent.change(commandInput, { target: { value: 'Test Command' } });
        expect(executeButton).toBeDisabled();

        const appButton = screen.getByRole('button', { name: /salesforce/i });
        fireEvent.click(appButton);
        expect(executeButton).not.toBeDisabled();
    });

    it('calls executeUnifiedCommand with correct arguments', async () => {
        render(<CentralizedAppsHub />);
        await waitFor(() => expect(mockOrchestrator.getConnectedApps).toHaveBeenCalled());

        const commandInput = screen.getByPlaceholderText(/generate monthly sales report/i);
        fireEvent.change(commandInput, { target: { value: 'Test Command' } });

        const appButton = screen.getByRole('button', { name: /salesforce/i });
        fireEvent.click(appButton);

        const executeButton = screen.getByRole('button', { name: /execute/i });
        fireEvent.click(executeButton);

        await waitFor(() => {
            expect(mockOrchestrator.executeUnifiedCommand).toHaveBeenCalledWith(
                'Test Command',
                ['salesforce'],
                'current-user'
            );
        });
    });

    it('calls executeBusinessFunction with correct arguments', async () => {
        render(<CentralizedAppsHub />);
        await waitFor(() => expect(mockOrchestrator.getBusinessFunctions).toHaveBeenCalled());

        const functionButton = screen.getByRole('button', { name: /run function/i });
        fireEvent.click(functionButton);

        await waitFor(() => {
            expect(mockOrchestrator.executeBusinessFunction).toHaveBeenCalledWith(
                'gen_report',
                expect.any(Object),
                'current-user'
            );
        });
    });
}); 