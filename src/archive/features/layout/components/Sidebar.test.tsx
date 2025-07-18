/**
 * @file Sidebar.test.tsx
 * @description Unit and snapshot tests for the Sidebar layout component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Sidebar', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('renders sidebar content', () => {
    renderWithRouter(<Sidebar isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Nexus')).toBeInTheDocument();
  });

  it('is hidden when isOpen is false', () => {
    const { container } = renderWithRouter(<Sidebar isOpen={false} onClose={mockOnClose} />);
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('-translate-x-full');
  });

  it('is visible when isOpen is true', () => {
    const { container } = renderWithRouter(<Sidebar isOpen={true} onClose={mockOnClose} />);
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('translate-x-0');
  });

  it('calls onClose when close button is clicked', () => {
    renderWithRouter(<Sidebar isOpen={true} onClose={mockOnClose} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('matches snapshot when open', () => {
    const { asFragment } = renderWithRouter(<Sidebar isOpen={true} onClose={mockOnClose} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot when closed', () => {
    const { asFragment } = renderWithRouter(<Sidebar isOpen={false} onClose={mockOnClose} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders navigation items from config', () => {
    render(<Sidebar isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace/i)).toBeInTheDocument();
  });

  it('close button is keyboard accessible and has aria-label', async () => {
    render(<Sidebar isOpen={true} onClose={jest.fn()} />);
    const closeButton = screen.getByLabelText(/close/i);
    expect(closeButton).toBeInTheDocument();
    closeButton.focus();
    expect(closeButton).toHaveFocus();
    await userEvent.keyboard('{Enter}');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Sidebar isOpen={true} onClose={jest.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 