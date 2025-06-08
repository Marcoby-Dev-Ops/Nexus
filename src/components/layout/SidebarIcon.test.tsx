/**
 * @file SidebarIcon.test.tsx
 * @description Unit and snapshot tests for the SidebarIcon component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SidebarIcon from './SidebarIcon';

describe('SidebarIcon', () => {
  it('renders children', () => {
    render(<SidebarIcon><span>🏠</span></SidebarIcon>);
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SidebarIcon className="test-class"><span>🏠</span></SidebarIcon>
    );
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<SidebarIcon><span>🏠</span></SidebarIcon>);
    expect(asFragment()).toMatchSnapshot();
  });
}); 