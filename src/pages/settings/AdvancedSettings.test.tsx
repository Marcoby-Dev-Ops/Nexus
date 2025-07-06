import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdvancedSettings from './AdvancedSettings';

// Mock the analytics module
jest.mock('./mockAnalytics', () => ({
  analytics: {
    track: jest.fn(),
  },
}));
import { analytics } from './mockAnalytics';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('AdvancedSettings', () => {
    beforeEach(() => {
        (analytics.track as jest.Mock).mockClear();
        (navigator.clipboard.writeText as jest.Mock).mockClear();
    });

  it('renders the API token management UI', () => {
    render(<AdvancedSettings />);
    expect(screen.getByText('API Tokens')).toBeInTheDocument();
    expect(screen.getByText('Generate New Token')).toBeInTheDocument();
    expect(screen.getByText('Active Tokens')).toBeInTheDocument();
  });

  it('generates a new token', () => {
    render(<AdvancedSettings />);
    const tokenNameInput = screen.getByPlaceholderText(/token name/i);
    const generateButton = screen.getByText('Generate');

    fireEvent.change(tokenNameInput, { target: { value: 'New Test Token' } });
    fireEvent.click(generateButton);

    expect(screen.getByText('New Test Token')).toBeInTheDocument();
    expect(analytics.track).toHaveBeenCalledWith('api_token_generated', {
      token_name: 'New Test Token',
    });
  });

  it('revokes a token', () => {
    render(<AdvancedSettings />);
    const revokeButton = screen.getByRole('button', { name: /revoke/i });
    fireEvent.click(revokeButton);
    expect(screen.queryByText('My First Token')).not.toBeInTheDocument();
    expect(analytics.track).toHaveBeenCalledWith('api_token_revoked', {
        token_name: 'My First Token',
    });
  });

  it('copies a token to clipboard', () => {
    render(<AdvancedSettings />);
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(analytics.track).toHaveBeenCalledWith('api_token_copied');
  });

  it('toggles token visibility', () => {
    render(<AdvancedSettings />);
    const tokenInput = screen.getByDisplayValue(/nexus_pat_/i);
    expect(tokenInput).toHaveAttribute('type', 'password');

    const visibilityButton = screen.getByRole('button', { name: /show/i });
    fireEvent.click(visibilityButton);
    expect(tokenInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(visibilityButton);
    expect(tokenInput).toHaveAttribute('type', 'password');
  });
}); 