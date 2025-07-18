import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import NotificationsSettings from '@/domains/admin/user/pages/settings/NotificationsSettings';

// Mock analytics
const analyticsSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('NotificationsSettings', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    analyticsSpy.mockClear();
    jest.useRealTimers();
  });

  it('renders all notification toggles', async () => {
    render(<NotificationsSettings />);
    act(() => {
      jest.advanceTimersByTime(300); // For mockFetchPreferences
    });
    expect(await screen.findByText('Email Notifications')).toBeInTheDocument();
    expect(await screen.findByText('Push Notifications')).toBeInTheDocument();
    expect(await screen.findByText('In-App Notifications')).toBeInTheDocument();
  });

  it('toggles notification preferences and tracks analytics', async () => {
    render(<NotificationsSettings />);
    act(() => {
      jest.advanceTimersByTime(300); // For mockFetchPreferences
    });
    
    const emailSwitchContainer = await screen.findByText('Email Notifications');
    const emailSwitch = emailSwitchContainer.parentElement?.querySelector('button[role="switch"]');
    
    expect(emailSwitch).toBeInTheDocument();
    fireEvent.click(emailSwitch!);
    
    expect(analyticsSpy).toHaveBeenCalledWith(
      '[Analytics] notification_preference_toggled',
      expect.objectContaining({ type: 'email', value: false }) // Assuming initial state is true
    );
  });

  it('saves preferences and tracks analytics', async () => {
    render(<NotificationsSettings />);
    // Initial load
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);

    // Saving process
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('saved-button')).toBeInTheDocument();
    expect(screen.getByTestId('saved-button')).toHaveTextContent('Saved');

    expect(analyticsSpy).toHaveBeenCalledWith(
      '[Analytics] notification_preferences_saved',
      expect.any(Object)
    );
  });
}); 