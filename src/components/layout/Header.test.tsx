/**
 * @file Header.test.tsx
 * @description Unit and snapshot tests for the Header layout component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

describe('Header', () => {
  const mockToggleSidebar = jest.fn();
  const breadcrumbs = [
    { label: 'Home', href: '/dashboard' },
    { label: 'Sales', href: '/sales' },
  ];
  const pageTitle = 'Sales Dashboard';

  beforeEach(() => {
    mockToggleSidebar.mockClear();
  });

  it('renders breadcrumbs and pageTitle', () => {
    render(
      <Header
        toggleSidebar={mockToggleSidebar}
        breadcrumbs={breadcrumbs}
        pageTitle={pageTitle}
      />
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText(pageTitle)).toBeInTheDocument();
  });

  it('calls toggleSidebar when menu button is clicked', () => {
    render(
      <Header
        toggleSidebar={mockToggleSidebar}
        breadcrumbs={breadcrumbs}
        pageTitle={pageTitle}
      />
    );
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    expect(mockToggleSidebar).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <Header
        toggleSidebar={mockToggleSidebar}
        breadcrumbs={breadcrumbs}
        pageTitle={pageTitle}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
}); 