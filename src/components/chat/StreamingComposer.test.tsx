import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StreamingComposer } from './StreamingComposer';
import * as slashCommandService from '@/lib/services/slashCommandService';

// Mock the slash command service
jest.mock('@/lib/services/slashCommandService', () => ({
  getSlashCommands: jest.fn(),
  filterSlashCommands: jest.fn(),
}));

const mockSlashCommandService = slashCommandService as jest.Mocked<typeof slashCommandService>;

describe('StreamingComposer', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    jest.resetModules();
    (import.meta as any).env = { ...originalEnv, VITE_CHAT_V2: '1' };

    // Mock default commands
    mockSlashCommandService.getSlashCommands.mockResolvedValue([
      { slug: 'create-task', title: 'Create Task', description: 'Create a task in your PM tool', category: 'productivity' },
      { slug: 'send-invoice', title: 'Send Invoice', description: 'Send a Stripe invoice', category: 'finance' },
    ]);
    
    mockSlashCommandService.filterSlashCommands.mockImplementation((commands, query) => {
      return commands.filter(cmd => cmd.slug.toLowerCase().includes(query.toLowerCase()));
    });
  });

  it('renders textarea', () => {
    render(<StreamingComposer agentId="executive" />);
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('loads slash commands on mount', async () => {
    render(<StreamingComposer agentId="executive" />);
    
    await waitFor(() => {
      expect(mockSlashCommandService.getSlashCommands).toHaveBeenCalledTimes(1);
    });
  });

  it('shows slash-command suggestions', async () => {
    render(<StreamingComposer agentId="executive" />);
    
    // Wait for commands to load
    await waitFor(() => {
      expect(mockSlashCommandService.getSlashCommands).toHaveBeenCalled();
    });
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: '/cr' } });
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching commands', async () => {
    // Make the service return a pending promise
    let resolveCommands: (commands: any[]) => void;
    const commandsPromise = new Promise<any[]>((resolve) => {
      resolveCommands = resolve;
    });
    mockSlashCommandService.getSlashCommands.mockReturnValue(commandsPromise);
    
    render(<StreamingComposer agentId="executive" />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: '/' } });
    
    // Should show loading state
    expect(screen.getByText('Loading commands...')).toBeInTheDocument();
    
    // Resolve the promise
    resolveCommands!([]);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading commands...')).not.toBeInTheDocument();
    });
  });
}); 