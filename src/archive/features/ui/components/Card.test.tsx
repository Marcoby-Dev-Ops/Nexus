/**
 * @file Card.test.tsx
 * @description Unit and snapshot tests for the Card component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '@/shared/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Card>Snapshot Content</Card>);
    expect(asFragment()).toMatchSnapshot();
  });
}); 