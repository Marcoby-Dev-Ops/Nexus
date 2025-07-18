import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardOnboarding } from '@/domains/dashboard/features/components/DashboardOnboarding';

describe('DashboardOnboarding Component', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  it('renders the generic welcome message when userName is not provided', () => {
    render(<DashboardOnboarding onComplete={mockOnComplete} />);
    expect(screen.getByText(/welcome to your nexus command center/i)).toBeInTheDocument();
    expect(screen.queryByText(/, /)).not.toBeInTheDocument();
  });

  it('renders a personalized welcome message when userName is provided', () => {
    render(<DashboardOnboarding onComplete={mockOnComplete} userName="Alex" />);
    expect(screen.getByText(/welcome to your nexus command center, alex!/i)).toBeInTheDocument();
  });

  it('renders the feature highlight sections', () => {
    render(<DashboardOnboarding onComplete={mockOnComplete} />);
    expect(screen.getByText(/ai-powered insights/i)).toBeInTheDocument();
    expect(screen.getByText(/automate everything/i)).toBeInTheDocument();
    expect(screen.getByText(/unified view/i)).toBeInTheDocument();
  });

  it('calls the onComplete callback when the "Let\'s Get Started" button is clicked', () => {
    render(<DashboardOnboarding onComplete={mockOnComplete} />);
    const getStartedButton = screen.getByRole('button', { name: /let's get started/i });
    fireEvent.click(getStartedButton);
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });
}); 