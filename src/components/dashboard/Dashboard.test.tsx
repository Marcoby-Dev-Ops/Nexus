/**
 * @file Dashboard.test.tsx
 * @description Unit and snapshot tests for the Dashboard component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '@/pages/Dashboard';

// Mock child components
jest.mock('./ActivityFeed', () => ({
  __esModule: true,
  default: () => <div data-testid="activity-feed">Activity Feed</div>,
}));

jest.mock('./KpiCard', () => ({
  __esModule: true,
  default: () => <div data-testid="kpi-card">KPI Card</div>,
}));

jest.mock('./StatsCard', () => ({
  __esModule: true,
  default: () => <div data-testid="stats-card">Stats Card</div>,
}));

jest.mock('./QuickLaunchTiles', () => ({
  __esModule: true,
  default: () => <div data-testid="quick-launch">Quick Launch</div>,
}));

jest.mock('./SimpleBarChart', () => ({
  __esModule: true,
  default: () => <div data-testid="bar-chart">Bar Chart</div>,
}));

jest.mock('@/components/ai/enhanced/ModernExecutiveAssistant', () => ({
  __esModule: true,
  ModernExecutiveAssistant: () => <div data-testid="modern-executive-assistant">Modern Executive Assistant</div>,
}));

describe('Dashboard', () => {
  it('renders all dashboard sections', () => {
    render(<Dashboard />);
    
    // Check for KPI cards
    expect(screen.getAllByTestId('kpi-card')).toHaveLength(4);
    
    // Check for charts
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);
    
    // Check for activity feed
    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    
    // Check for AI insights
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    
    // Check for quick launch tiles
    expect(screen.getByTestId('quick-launch')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('toggles assistant panel visibility', () => {
    render(<Dashboard />);

    // Assistant panel should be hidden by default
    expect(screen.queryByTestId('modern-executive-assistant')).not.toBeInTheDocument();

    // Click assistant button to show panel
    fireEvent.click(screen.getByRole('button', { name: /ask ai/i }));
    expect(screen.getByTestId('modern-executive-assistant')).toBeInTheDocument();

    // Click close button to hide panel
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByTestId('modern-executive-assistant')).not.toBeInTheDocument();
  });

  it('navigates to sales dashboard when clicked', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }));

    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sales Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/sales');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Dashboard />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 