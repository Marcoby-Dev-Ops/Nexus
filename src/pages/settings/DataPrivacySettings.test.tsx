import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DataPrivacySettings from './DataPrivacySettings';

// Mock the analytics module
jest.mock('./mockAnalytics', () => ({
  analytics: {
    track: jest.fn(),
  },
}));
import { analytics } from './mockAnalytics';

// Mock alert
global.alert = jest.fn();

describe('DataPrivacySettings', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (analytics.track as jest.Mock).mockClear();
    (global.alert as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders all sections', () => {
    render(<DataPrivacySettings />);
    expect(screen.getByText('Data Export')).toBeInTheDocument();
    expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('toggles privacy settings and tracks analytics', () => {
    render(<DataPrivacySettings />);
    const shareDataSwitch = screen.getByLabelText(/share usage data/i);
    fireEvent.click(shareDataSwitch);
    expect(analytics.track).toHaveBeenCalledWith('privacy_setting_toggled', {
      setting: 'shareData',
      value: false,
    });
  });

  it('handles data export and shows alert', async () => {
    render(<DataPrivacySettings />);
    const exportButton = screen.getByText('Export My Data');
    fireEvent.click(exportButton);
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveTextContent('Exporting...');
    expect(analytics.track).toHaveBeenCalledWith('data_export_requested');

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(global.alert).toHaveBeenCalledWith('Your data export has started. You will receive an email when it is complete.');
    expect(exportButton).not.toBeDisabled();
  });

  it('handles account deletion flow and shows alert', async () => {
    render(<DataPrivacySettings />);
    const deleteButton = screen.getByText('Request Account Deletion');
    fireEvent.click(deleteButton); // Opens dialog

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);
    
    expect(analytics.track).toHaveBeenCalledWith('account_deletion_requested');

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(global.alert).toHaveBeenCalledWith('Your account deletion request has been received. This is irreversible.');
  });
}); 