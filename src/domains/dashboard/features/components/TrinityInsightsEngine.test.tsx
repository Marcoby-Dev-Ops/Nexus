import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrinityInsightsEngine from '@/domains/dashboard/features/components/TrinityInsightsEngine';

// Mock lucide-react icons to check for their presence by name
jest.mock('lucide-react', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
        ...iconMocks
    };
});

describe('TrinityInsightsEngine', () => {

    it('renders the main title and tabs', () => {
        render(<TrinityInsightsEngine />);
        expect(screen.getByText(/trinity intelligence engine/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /think/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /see/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /act/i })).toBeInTheDocument();
    });

    it('displays "think" insights by default', () => {
        render(<TrinityInsightsEngine />);
        expect(screen.getByText(/cross-departmental pattern analysis/i)).toBeInTheDocument();
        expect(screen.queryByText(/real-time performance anomaly/i)).not.toBeInTheDocument();
    });

    it('switches to the "see" tab and filters insights correctly', () => {
        render(<TrinityInsightsEngine />);
        const seeTab = screen.getByRole('button', { name: /see/i });
        fireEvent.click(seeTab);
        
        expect(screen.getByText(/real-time performance anomaly/i)).toBeInTheDocument();
        expect(screen.queryByText(/cross-departmental pattern analysis/i)).not.toBeInTheDocument();
    });

    it('switches to the "act" tab and filters insights correctly', () => {
        render(<TrinityInsightsEngine />);
        const actTab = screen.getByRole('button', { name: /act/i });
        fireEvent.click(actTab);
        
        expect(screen.getByText(/automated workflow optimization/i)).toBeInTheDocument();
        expect(screen.queryByText(/real-time performance anomaly/i)).not.toBeInTheDocument();
    });

    it('displays correct impact and urgency for an insight', () => {
        render(<TrinityInsightsEngine />);
        // Find the card for the "Cross-departmental Pattern Analysis" insight
        const insightCard = screen.getByText(/cross-departmental pattern analysis/i).closest('div[class*="Card"]');

        expect(insightCard).toHaveTextContent(/high impact/i);
        expect(insightCard).toHaveTextContent(/urgent/i);

        // Check for urgency icon
        const urgencyIconContainer = insightCard.querySelector('h4').parentElement.parentElement;
        expect(urgencyIconContainer.querySelector('[data-testid="icon-AlertTriangle"]')).toBeInTheDocument();
    });

}); 