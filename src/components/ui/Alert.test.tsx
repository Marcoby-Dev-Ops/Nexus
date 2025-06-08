/**
 * @file Alert.test.tsx
 * @description Unit and snapshot tests for the Alert component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Alert from './Alert';

describe('Alert', () => {
  it('renders with message', () => {
    render(<Alert message="Test Alert" />);
    expect(screen.getByText('Test Alert')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Alert message="Snapshot Alert" />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 