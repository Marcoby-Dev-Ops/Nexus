/**
 * @file AppShell.test.tsx
 * @description Unit and snapshot tests for the AppShell layout component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-router-dom hooks and components
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

// Mock Sidebar and Header
jest.mock('./Sidebar', () => ({
  __esModule: true,
  default: ({ isOpen, toggleSidebar }: any) => (
    <div data-testid="sidebar" data-open={isOpen} onClick={toggleSidebar}>Sidebar</div>
  ),
}));
jest.mock('./Header', () => ({
  __esModule: true,
  default: ({ toggleSidebar, breadcrumbs, subtitle }: any) => (
    <div data-testid="header">
      <button onClick={toggleSidebar}>Toggle</button>
      <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
      <div data-testid="subtitle">{subtitle}</div>
    </div>
  ),
}));

import AppShell from './AppShell';
import { useLocation } from 'react-router-dom';

describe('AppShell', () => {
  beforeEach(() => {
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/dashboard' });
  });

  it('renders Sidebar, Header, and Outlet', () => {
    render(<AppShell />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('toggles sidebar when Sidebar or Header toggle is clicked', () => {
    render(<AppShell />);
    const sidebar = screen.getByTestId('sidebar');
    // Sidebar starts closed (false)
    expect(sidebar).toHaveAttribute('data-open', 'false');
    // Click to open
    fireEvent.click(sidebar);
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');
    // Click to close
    fireEvent.click(sidebar);
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false');
  });

  it('passes correct breadcrumbs and subtitle to Header', () => {
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/sales' });
    render(<AppShell />);
    expect(screen.getByTestId('breadcrumbs').textContent).toContain('Sales');
    expect(screen.getByTestId('subtitle').textContent).toContain('Sales Dashboard');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<AppShell />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 