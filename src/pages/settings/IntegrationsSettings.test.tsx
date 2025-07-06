import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import IntegrationsSettings from './IntegrationsSettings';

// Mock analytics
const analyticsSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('IntegrationsSettings', () => {
  afterEach(() => {
    analyticsSpy.mockClear();
  });

  it('renders all integrations', () => {
    render(<IntegrationsSettings />);
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Jira')).toBeInTheDocument();
  });

  it('shows the correct connection status', () => {
    render(<IntegrationsSettings />);
    // GitHub is connected initially
    const githubRow = screen.getByText('GitHub').closest('div.flex.items-center.justify-between');
    expect(githubRow).toHaveTextContent('Disconnect');

    // Slack is not connected
    const slackRow = screen.getByText('Slack').closest('div.flex.items-center.justify-between');
    expect(slackRow).toHaveTextContent('Connect');
  });

  it('toggles connection status and tracks analytics', () => {
    render(<IntegrationsSettings />);
    const connectButton = screen.getByText('Connect'); // Connects Slack
    fireEvent.click(connectButton);

    expect(screen.getAllByText('Disconnect').length).toBe(2);
    expect(analyticsSpy).toHaveBeenCalledWith(
      '[Analytics] integration_connection_toggled',
      { integration_id: 'slack', connected: true }
    );

    const disconnectButton = screen.getAllByText('Disconnect')[0]; // Disconnects GitHub
    fireEvent.click(disconnectButton);
    
    expect(screen.getAllByText('Connect').length).toBe(2);
    expect(analyticsSpy).toHaveBeenCalledWith(
        '[Analytics] integration_connection_toggled',
        { integration_id: 'github', connected: false }
    );
  });
}); 