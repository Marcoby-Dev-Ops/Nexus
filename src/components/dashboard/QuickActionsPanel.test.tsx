import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuickActionsPanel } from './QuickActionsPanel';
import * as QAP from './QuickActionsPanel';

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the user context and config from within the module
jest.mock('./QuickActionsPanel', () => {
    const original = jest.requireActual('./QuickActionsPanel');
    return {
        ...original,
        // Override the internal 'user' and 'quickActions' for testing
        user: { permissions: ['all'], department: 'Sales' },
        quickActions: [
            { id: 'chat', label: 'AI Chat', icon: '💬', type: 'global', handlerType: 'ai_chat', permission: 'all' },
            { id: 'notes', label: 'View Notes', icon: '📝', type: 'global', handlerType: 'crud_read', entity: 'Note', permission: 'all' },
            { id: 'sales-report', label: 'Sales Report', icon: '📈', type: 'department', handlerType: 'custom', department: 'Sales', permission: 'sales_read' },
            { id: 'hr-onboard', label: 'Onboard User', icon: '👤', type: 'department', handlerType: 'custom', department: 'HR', permission: 'hr_write' },
        ],
    };
});


describe('QuickActionsPanel', () => {

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('renders available actions for the user', () => {
    renderWithRouter(<QuickActionsPanel />);
    expect(screen.getByRole('button', { name: /ai chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view notes/i })).toBeInTheDocument();
  });

  it('filters out actions based on permissions and context', () => {
    // We expect 'Sales Report' not to show because the mock user permissions is 'all', not 'sales_read'
    // We expect 'Onboard User' not to show because the user is in the 'Sales' department, not 'HR'
    renderWithRouter(<QuickActionsPanel />);
    expect(screen.queryByRole('button', { name: /sales report/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /onboard user/i })).not.toBeInTheDocument();
  });

  it('navigates to the correct path on action click', () => {
    renderWithRouter(<QuickActionsPanel />);

    fireEvent.click(screen.getByRole('button', { name: /ai chat/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/ai-chat');

    fireEvent.click(screen.getByRole('button', { name: /view notes/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/notes');
  });

  it('displays a message when no actions are available', () => {
    // Override the mock to have a user with no matching actions
    (QAP as any).user = { permissions: ['none'], department: 'Marketing' };
    renderWithRouter(<QuickActionsPanel />);
    expect(screen.getByText(/no quick actions available/i)).toBeInTheDocument();
  });
}); 