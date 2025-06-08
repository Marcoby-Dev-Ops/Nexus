/**
 * @file Marketplace.test.tsx
 * @description Unit and snapshot tests for the Marketplace component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Marketplace from './Marketplace';

describe('Marketplace', () => {
  it('renders marketplace title', () => {
    render(<Marketplace />);
    expect(screen.getByText(/marketplace/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Marketplace />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 