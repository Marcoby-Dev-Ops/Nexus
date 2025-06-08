/**
 * @file theme-provider.test.tsx
 * @description Unit and snapshot tests for the theme-provider component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from './theme-provider';

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <div>Theme Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Theme Content')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <ThemeProvider>
        <div>Snapshot Theme</div>
      </ThemeProvider>
    );
    expect(asFragment()).toMatchSnapshot();
  });
}); 