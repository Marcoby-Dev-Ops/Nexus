/**
 * @file FinanceHome.test.tsx
 * @description Unit and snapshot tests for the FinanceHome component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FinanceHome from './FinanceHome';

describe('FinanceHome', () => {
  it('renders finance home title', () => {
    render(<FinanceHome />);
    expect(screen.getByText(/finance/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<FinanceHome />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 