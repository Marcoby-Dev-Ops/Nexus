/**
 * @file Badge.test.tsx
 * @description Unit and snapshot tests for the Badge component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Badge from '@/shared/components/ui/Badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>Badge Content</Badge>);
    expect(screen.getByText('Badge Content')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Badge>Snapshot Badge</Badge>);
    expect(asFragment()).toMatchSnapshot();
  });
}); 