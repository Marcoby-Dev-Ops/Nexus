import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedLayout } from './UnifiedLayout';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { axe } from 'jest-axe';

describe('UnifiedLayout', () => {
  it('renders sidebar and topbar', () => {
    render(<MemoryRouter><UnifiedLayout><div>Test</div></UnifiedLayout></MemoryRouter>);
    expect(screen.getByText('Nexus')).toBeInTheDocument();
  });

  it('opens global search modal with Ctrl+K', () => {
    render(<MemoryRouter><UnifiedLayout><div>Test</div></UnifiedLayout></MemoryRouter>);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: /global search/i })).toBeInTheDocument();
  });

  it('navigates search results with keyboard', () => {
    render(<MemoryRouter><UnifiedLayout><div>Test</div></UnifiedLayout></MemoryRouter>);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByPlaceholderText(/search pages/i);
    fireEvent.change(input, { target: { value: 'dashboard' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    // Should navigate (simulate by checking modal closes)
    expect(screen.queryByRole('dialog', { name: /global search/i })).not.toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<MemoryRouter><UnifiedLayout><div>Test</div></UnifiedLayout></MemoryRouter>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 