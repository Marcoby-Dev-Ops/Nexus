import React from 'react';
import { render, screen } from '@testing-library/react';
import OrganizationalHealthScore from '@/domains/dashboard/features/components/OrganizationalHealthScore';

// Mock lucide-react icons to check for their presence by name
jest.mock('lucide-react', () => {
    const original = jest.requireActual('lucide-react');
    return {
        ...original,
        TrendingUp: (props: any) => <svg data-testid="icon-TrendingUp" {...props} />,
        Minus: (props: any) => <svg data-testid="icon-Minus" {...props} />,
    };
});

describe('OrganizationalHealthScore', () => {

    it('renders the main title and overall score', () => {
        render(<OrganizationalHealthScore />);
        expect(screen.getByText(/organizational health score/i)).toBeInTheDocument();
        expect(screen.getByText(/94%/i)).toBeInTheDocument();
    });

    it('renders all health metrics', () => {
        render(<OrganizationalHealthScore />);
        expect(screen.getByText('Revenue Flow')).toBeInTheDocument();
        expect(screen.getByText('Operations')).toBeInTheDocument();
        expect(screen.getByText('People')).toBeInTheDocument();
        expect(screen.getByText('Strategic')).toBeInTheDocument();
    });

    it('displays the correct data for a specific metric (e.g., Revenue Flow)', () => {
        render(<OrganizationalHealthScore />);
        const revenueMetric = screen.getByTestId('metric-Revenue Flow');
        expect(revenueMetric).toHaveTextContent('$2.4M/month');
        expect(revenueMetric).toHaveTextContent('+12%');
        expect(revenueMetric).toHaveTextContent('excellent');
    });

    it('renders the correct trend icon for each metric', () => {
        render(<OrganizationalHealthScore />);
        // Revenue Flow and Operations have 'up' trend
        const upIcons = screen.getAllByTestId('icon-TrendingUp');
        expect(upIcons.length).toBe(3); // Revenue, Ops, Strategic
        
        // People has 'stable' trend
        const stableIcon = screen.getByTestId('icon-Minus');
        expect(stableIcon).toBeInTheDocument();
    });

}); 