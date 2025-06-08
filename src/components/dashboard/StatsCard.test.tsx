/**
 * @file StatsCard.test.tsx
 * @description Unit and snapshot tests for the StatsCard dashboard component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsCard from './StatsCard';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Tasks" value={42} />);
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders icon if provided', () => {
    render(<StatsCard title="Tasks" value={42} icon={<span data-testid="icon">icon</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders delta and deltaLabel with correct color (positive)', () => {
    render(<StatsCard title="Revenue" value={1000} delta={5} deltaLabel="vs last month" />);
    const delta = screen.getByText(/5%/);
    expect(delta).toHaveClass('text-success');
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('renders delta with correct color (negative)', () => {
    render(<StatsCard title="Revenue" value={1000} delta={-3} />);
    const delta = screen.getByText(/3%/);
    expect(delta).toHaveClass('text-destructive');
  });

  it('renders progress bar if progress is provided', () => {
    render(<StatsCard title="Progress" value={80} progress={80} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');
    expect(screen.getByText('80% complete')).toBeInTheDocument();
  });

  it('renders sparkline if provided', () => {
    render(<StatsCard title="Revenue" value={1000} sparkline={<span data-testid="sparkline">spark</span>} />);
    expect(screen.getByTestId('sparkline')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    const { container } = render(<StatsCard title="Revenue" value={1000} loading />);
    // Look for the skeleton element by className
    expect(container.querySelector('.h-8.w-32')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatsCard title="Revenue" value={1000} className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<StatsCard title="Revenue" value={1000} delta={5} progress={80} sparkline={<span />} icon={<span />} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 