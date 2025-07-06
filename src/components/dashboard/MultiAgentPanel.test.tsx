import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiAgentPanel, { type MultiAgentPanelProps } from './MultiAgentPanel';

// Mock the child component to isolate the panel's functionality
jest.mock('../ai/OrganizationalChatPanel', () => ({
  OrganizationalChatPanel: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="mock-chat-panel">
      Mock Chat Panel
      <button onClick={onClose}>Close From Child</button>
    </div>
  ),
}));

describe('MultiAgentPanel', () => {
  const mockOnClose = jest.fn();

  const renderPanel = (props: Partial<MultiAgentPanelProps> = {}) => {
    return render(<MultiAgentPanel open={true} onClose={mockOnClose} {...props} />);
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('does not render when "open" prop is false', () => {
    const { container } = renderPanel({ open: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when "open" prop is true', () => {
    renderPanel();
    expect(screen.getByRole('dialog', { name: /ai assistant panel/i })).toBeInTheDocument();
    expect(screen.getByText(/your business ai assistant/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-chat-panel')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    renderPanel();
    const closeButton = screen.getByRole('button', { name: /close chat/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Escape key is pressed', () => {
    renderPanel();
    const panel = screen.getByRole('dialog');
    fireEvent.keyDown(panel, { key: 'Escape', code: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('does not render the close button if onClose is not provided', () => {
    render(<MultiAgentPanel open={true} />);
    expect(screen.queryByRole('button', { name: /close chat/i })).not.toBeInTheDocument();
  });

  it('prevents body scroll when open and restores it on unmount', () => {
    const { unmount } = renderPanel();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });
}); 