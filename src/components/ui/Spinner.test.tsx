/**
 * @file Spinner.test.tsx
 * @description Unit and snapshot tests for the Spinner component.
 */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Spinner from './Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Spinner />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 