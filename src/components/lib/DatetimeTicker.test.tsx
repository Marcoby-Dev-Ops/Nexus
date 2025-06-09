/**
 * @file DatetimeTicker.test.tsx
 * @description Unit and snapshot tests for the DatetimeTicker component.
 */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import DatetimeTicker from '../lib/DatetimeTicker';

describe('DatetimeTicker', () => {
  it('renders without crashing', () => {
    render(<DatetimeTicker />);
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<DatetimeTicker />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 