/**
 * @file KpiCard.test.tsx
 * @description Unit and snapshot tests for the KpiCard dashboard component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KpiCard } from '@/domains/dashboard/features/components/KpiCard';

describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard title="Revenue" value="$1000" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
  });

  it('renders delta with correct color (positive)', () => {
    render(<KpiCard title="Revenue" value="$1000" delta="+10%" />);
    const delta = screen.getByText('+10%');
    expect(delta).toHaveClass('text-success');
  });

  it('renders delta with correct color (negative)', () => {
    render(<KpiCard title="Revenue" value="$1000" delta="-5%" />);
    const delta = screen.getByText('-5%');
    expect(delta).toHaveClass('text-destructive');
  });

  it('renders sparkline if sparklineData is provided', () => {
    render(<KpiCard title="Revenue" value="$1000" sparklineData={[1,2,3,4,5]} />);
    expect(screen.getByTestId('kpi-sparkline')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<KpiCard title="Revenue" value="$1000" delta="+10%" sparklineData={[1,2,3,4,5]} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 