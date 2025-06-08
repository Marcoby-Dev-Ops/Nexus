/**
 * @file Breadcrumbs.test.tsx
 * @description Unit and snapshot tests for the Breadcrumbs component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Breadcrumbs from './Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders breadcrumb items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
    ];
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
    ];
    const { asFragment } = render(<Breadcrumbs items={items} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 