/**
 * @file RevenueChart.test.tsx
 * @description Unit and snapshot tests for the RevenueChart component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RevenueChart from './RevenueChart';

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock Card component
jest.mock('../Card', () => ({
  Card: ({ children, header }: { children: React.ReactNode; header: string }) => (
    <div data-testid="card">
      <div data-testid="card-header">{header}</div>
      {children}
    </div>
  ),
}));

describe('RevenueChart', () => {
  const mockData = [
    { date: '2024-01', revenue: 1000 },
    { date: '2024-02', revenue: 1500 },
    { date: '2024-03', revenue: 2000 },
  ];

  it('renders chart components', () => {
    render(<RevenueChart data={mockData} />);
    
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toHaveTextContent('Revenue (Last 12 Months)');
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<RevenueChart data={mockData} className="custom-class" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<RevenueChart data={mockData} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 