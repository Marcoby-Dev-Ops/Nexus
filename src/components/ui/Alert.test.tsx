/**
 * @file Alert.test.tsx
 * @description Unit and snapshot tests for the Alert component.
 */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Alert from './Alert';

describe('Alert', () => {
  it('renders without crashing', () => {
    render(<Alert>Test Alert</Alert>);
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Alert>Snapshot Alert</Alert>);
    expect(asFragment()).toMatchSnapshot();
  });
}); 