/**
 * @file Sidebar.test.tsx
 * @description Unit and snapshot tests for the Sidebar layout component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  const mockToggleSidebar = jest.fn();

  beforeEach(() => {
    mockToggleSidebar.mockClear();
  });

  it('renders sidebar content', () => {
    render(<Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('shows open/close state', () => {
    const { rerender } = render(<Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />);
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');
    rerender(<Sidebar isOpen={false} toggleSidebar={mockToggleSidebar} />);
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false');
  });

  it('calls toggleSidebar when toggle button is clicked', () => {
    render(<Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />);
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    expect(mockToggleSidebar).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<Sidebar isOpen={true} toggleSidebar={mockToggleSidebar} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 