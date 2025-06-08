/**
 * @file Layout.test.tsx
 * @description Unit and snapshot tests for the Layout layout component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from './Layout';

describe('Layout', () => {
  it('renders children', () => {
    render(
      <Layout>
        <div data-testid="child">Child Content</div>
      </Layout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <Layout>
        <div>Snapshot Child</div>
      </Layout>
    );
    expect(asFragment()).toMatchSnapshot();
  });
}); 