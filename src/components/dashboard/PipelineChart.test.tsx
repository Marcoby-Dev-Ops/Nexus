/**
 * @file PipelineChart.test.tsx
 * @description Unit and snapshot tests for the PipelineChart component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PipelineChart from './PipelineChart';

// Mock recharts components
jest.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
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

describe('PipelineChart', () => {
  const mockData = [
    { stage: 'Lead', deals: 20 },
    { stage: 'Qualified', deals: 15 },
    { stage: 'Proposal', deals: 10 },
    { stage: 'Negotiation', deals: 5 },
    { stage: 'Closed Won', deals: 8 },
  ];

  it('renders chart components', () => {
    render(<PipelineChart data={mockData} />);
    
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toHaveTextContent('Pipeline (Deals by Stage)');
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<PipelineChart data={mockData} className="custom-class" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<PipelineChart data={mockData} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 