import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedLayout } from './UnifiedLayout';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { axe } from 'jest-axe';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext');
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

  it('has no a11y violations', async () => {
    const { container } = renderWithProviders(<UnifiedLayout><div>Test</div></UnifiedLayout>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 