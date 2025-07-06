import React from 'react';
import { render, screen } from '@testing-library/react';
import CrossDepartmentMatrix from './CrossDepartmentMatrix';

// Mock lucide-react icons to check for their presence by name
jest.mock('lucide-react', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');
    const original = jest.requireActual('lucide-react');
    const iconMocks = new Proxy({}, {
        get: (_target, prop) => {
            if (prop === '__esModule') return true;
            return (props: any) => React.createElement('svg', { 'data-testid': `icon-${String(prop)}`, ...props });
        }
    });
    return {
        ...original,
        ...iconMocks,
    };
});


describe('CrossDepartmentMatrix', () => {

    it('renders the main title', () => {
        render(<CrossDepartmentMatrix />);
        expect(screen.getByText(/cross-functional intelligence grid/i)).toBeInTheDocument();
    });

    it('renders a card for each department metric', () => {
        render(<CrossDepartmentMatrix />);
        // 8 departments are hardcoded in the component
        const departmentCards = screen.getAllByRole('heading', { level: 3 });
        // This is a bit brittle, a better approach might be to query by a test-id on the card
        // But for now, we'll check that we have cards rendered.
        // We look for the department name in the header of each card.
        expect(screen.getByText('FINANCE')).toBeInTheDocument();
        expect(screen.getByText('OPERATIONS')).toBeInTheDocument();
        expect(screen.getByText('SALES')).toBeInTheDocument();
        expect(screen.getByText('MARKETING')).toBeInTheDocument();
        expect(screen.getByText('PEOPLE')).toBeInTheDocument();
        expect(screen.getByText('TECHNOLOGY')).toBeInTheDocument();
        expect(screen.getByText('LEGAL')).toBeInTheDocument();
        expect(screen.getByText('STRATEGY')).toBeInTheDocument();
    });

    it('displays the correct data for a specific department (e.g., Finance)', () => {
        render(<CrossDepartmentMatrix />);
        const financeCard = screen.getByText('FINANCE').closest('div.flex.items-center.justify-between');
        expect(financeCard).toHaveTextContent('FINANCE');

        const financeData = screen.getByText('FINANCE').closest('div[class*="Card"]');
        expect(financeData).toHaveTextContent('Cash Flow');
        expect(financeData).toHaveTextContent('+$1.2M');
        expect(financeData).toHaveTextContent('Burn Rate');
        expect(financeData).toHaveTextContent('8%');
    });

    it('renders the correct status badge and trend icon', () => {
        render(<CrossDepartmentMatrix />);
        
        // Check Finance: excellent, up
        const financeCard = screen.getByText('FINANCE').closest('div.flex.items-center.justify-between');
        expect(financeCard).toHaveTextContent('excellent');
        expect(screen.getByTestId('icon-ArrowUp')).toBeInTheDocument();

        // Check Strategy: warning, up
        const strategyCard = screen.getByText('STRATEGY').closest('div.flex.items-center.justify-between');
        expect(strategyCard).toHaveTextContent('warning');
        expect(screen.getByTestId('icon-ArrowUp')).toBeInTheDocument();
    });

}); 