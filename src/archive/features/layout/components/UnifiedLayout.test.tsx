import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedLayout } from '@/shared/features/layout/components/UnifiedLayout';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { NotificationProvider } from '@/shared/core/hooks/NotificationContext';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import userEvent from '@testing-library/user-event';

jest.mock('@shared/contexts/AuthContext');
const mockUseAuth = useAuth as jest.Mock;

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <NotificationProvider>
        {ui}
      </NotificationProvider>
    </MemoryRouter>
  );
};

expect.extend(toHaveNoViolations);

describe('UnifiedLayout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
      signOut: jest.fn(),
    });
  });

  it('renders sidebar and topbar', () => {
    renderWithProviders(<UnifiedLayout><div>Test</div></UnifiedLayout>);
    expect(screen.getByText('Nexus')).toBeInTheDocument();
  });

  it('opens global search modal with Ctrl+K', () => {
    renderWithProviders(<UnifiedLayout><div>Test</div></UnifiedLayout>);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: /global search/i })).toBeInTheDocument();
  });

  it('navigates search results with keyboard', () => {
    renderWithProviders(<UnifiedLayout><div>Test</div></UnifiedLayout>);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByPlaceholderText(/search pages/i);
    fireEvent.change(input, { target: { value: 'dashboard' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    // Should navigate (simulate by checking modal closes)
    expect(screen.queryByRole('dialog', { name: /global search/i })).not.toBeInTheDocument();
  });

  it('renders children and navigation', () => {
    render(
      <UnifiedLayout>
        <div>Test Content</div>
      </UnifiedLayout>
    );
    expect(screen.getByText(/test content/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('layout is keyboard accessible', async () => {
    render(
      <UnifiedLayout>
        <div>Test Content</div>
      </UnifiedLayout>
    );
    // Tab to sidebar close button
    await userEvent.tab();
    const closeButton = screen.getByLabelText(/close/i);
    expect(closeButton).toHaveFocus();
  });

  it('has no a11y violations', async () => {
    const { container } = renderWithProviders(<UnifiedLayout><div>Test</div></UnifiedLayout>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <UnifiedLayout>
        <div>Test Content</div>
      </UnifiedLayout>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 