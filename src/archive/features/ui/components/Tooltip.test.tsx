/**
 * @file Tooltip.test.tsx
 * @description Unit and snapshot tests for the Tooltip component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tooltip } from '@/shared/components/ui/Tooltip';

describe('Tooltip', () => {
  it('renders children', () => {
    render(<Tooltip content="Tooltip text"><span>Hover me</span></Tooltip>);
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip on hover', () => {
    render(<Tooltip content="Tooltip text"><span>Hover me</span></Tooltip>);
    fireEvent.mouseOver(screen.getByText('Hover me'));
    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Tooltip content="Tooltip text"><span>Hover me</span></Tooltip>);
    expect(asFragment()).toMatchSnapshot();
  });
}); 