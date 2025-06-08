/**
 * @file MultiAgentPanel.test.tsx
 * @description Unit and snapshot tests for the MultiAgentPanel component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultiAgentPanel from './MultiAgentPanel';

// Mock child components
jest.mock('../ai/ExecutiveAssistant', () => ({
  __esModule: true,
  ExecutiveAssistant: () => <div data-testid="executive-assistant">Executive Assistant</div>,
}));

jest.mock('../../departments/marketing/MarketingAgent', () => ({
  __esModule: true,
  default: () => <div data-testid="marketing-agent">Marketing Agent</div>,
}));

describe('MultiAgentPanel', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<MultiAgentPanel open={true} onClose={mockOnClose} />);
    expect(screen.getByText('AI Agents')).toBeInTheDocument();
    expect(screen.getByText('Multi-Agent Beta')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<MultiAgentPanel open={false} onClose={mockOnClose} />);
    expect(screen.queryByText('AI Agents')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<MultiAgentPanel open={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close chat/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders executive assistant by default', () => {
    render(<MultiAgentPanel open={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('executive-assistant')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<MultiAgentPanel open={true} onClose={mockOnClose} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 