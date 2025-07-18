/**
 * @file Header.test.tsx
 * @description Unit and snapshot tests for the Header layout component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Header } from './Header';

expect.extend(toHaveNoViolations);

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

  it('renders header and navigation', () => {
    render(<Header onSidebarToggle={jest.fn()} onThemePanelToggle={jest.fn()} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('sidebar toggle button is keyboard accessible and has aria-label', async () => {
    render(<Header onSidebarToggle={jest.fn()} onThemePanelToggle={jest.fn()} />);
    const toggleButton = screen.getByRole('button', { name: /open sidebar/i });
    expect(toggleButton).toBeInTheDocument();
    toggleButton.focus();
    expect(toggleButton).toHaveFocus();
    await userEvent.keyboard('{Enter}');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Header onSidebarToggle={jest.fn()} onThemePanelToggle={jest.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 