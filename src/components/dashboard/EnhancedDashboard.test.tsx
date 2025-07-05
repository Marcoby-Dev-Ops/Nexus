import React from 'react';
import { render, screen } from '@testing-library/react';
import EnhancedDashboard from './EnhancedDashboard';

describe('EnhancedDashboard', () => {
  it('renders AI Daily Briefing', () => {
    render(<EnhancedDashboard />);
    expect(screen.getByText(/AI Daily Briefing/i)).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    render(<EnhancedDashboard />);
    expect(screen.getByText(/THINK Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/SEE Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/ACT Automation/i)).toBeInTheDocument();
  });

  it('renders Activity Feed', () => {
    render(<EnhancedDashboard />);
    expect(screen.getByText(/Trinity Activity Stream/i)).toBeInTheDocument();
  });

  it('renders Smart Insights Panel', () => {
    render(<EnhancedDashboard />);
    expect(screen.getByText(/AI-Powered Trinity Insights/i)).toBeInTheDocument();
  });
}); 