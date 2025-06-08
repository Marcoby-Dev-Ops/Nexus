/**
 * @file DatetimeTicker.test.tsx
 * @description Unit and snapshot tests for the DatetimeTicker component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DatetimeTicker from './lib/DatetimeTicker';

describe('DatetimeTicker', () => {
  it('renders current time label', () => {
    render(<DatetimeTicker />);
    expect(screen.getByText(/am|pm/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<DatetimeTicker />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 