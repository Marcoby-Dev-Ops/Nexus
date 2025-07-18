import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from 'next-themes';
import AppearanceSettings from '@/domains/admin/user/pages/settings/AppearanceSettings';

// Mock the analytics module
jest.mock('./mockAnalytics', () => ({
  analytics: {
    track: jest.fn(),
  },
}));
import { analytics } from '@/domains/admin/user/pages/settings/mockAnalytics';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="system">
    {children}
  </ThemeProvider>
);

describe('AppearanceSettings', () => {
  it('renders theme options and reflects current theme', () => {
    render(
      <TestWrapper>
        <AppearanceSettings />
      </TestWrapper>
    );
    expect(screen.getByLabelText('Light')).toBeInTheDocument();
    expect(screen.getByLabelText('Dark')).toBeInTheDocument();
    expect(screen.getByLabelText('System')).toBeInTheDocument();
    expect(screen.getByLabelText('System')).toBeChecked();
  });

  it('changes theme and tracks analytics', () => {
    render(
      <TestWrapper>
        <AppearanceSettings />
      </TestWrapper>
    );

    const darkRadio = screen.getByLabelText('Dark');
    fireEvent.click(darkRadio);

    // The useTheme hook will update the value, let's check the radio group
    expect(darkRadio).toBeChecked();
    expect(analytics.track).toHaveBeenCalledWith('theme_changed', { theme: 'dark' });
  });
}); 