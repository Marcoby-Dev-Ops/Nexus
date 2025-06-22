import React from 'react';
import { render } from '@testing-library/react';
import SlashCommandMenu from '../../../src/components/chat/SlashCommandMenu';
import type { SlashCommand } from '../../../src/lib/services/slashCommandService';

const mockCommands: SlashCommand[] = [
  {
    slug: 'create-task',
    title: 'Create Task',
    description: 'Create a task in your project management tool',
    category: 'productivity',
  },
  {
    slug: 'send-invoice',
    title: 'Send Invoice',
    description: 'Send a Stripe invoice to a customer',
    category: 'finance',
  },
  {
    slug: 'update-crm',
    title: 'Update CRM',
    description: 'Update a customer record in HubSpot',
    category: 'sales',
  },
];

describe('SlashCommandMenu', () => {
  const defaultProps = {
    commands: mockCommands,
    selectedIndex: 0,
    onSelectCommand: jest.fn(),
    onMouseEnter: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders command menu with commands', () => {
    const { container } = render(<SlashCommandMenu {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it('renders loading state', () => {
    const { container } = render(
      <SlashCommandMenu {...defaultProps} commands={[]} loading={true} />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders no commands found state', () => {
    const { container } = render(
      <SlashCommandMenu 
        {...defaultProps} 
        commands={[]} 
        loading={false} 
        query="nonexistent" 
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders with selected command highlighted', () => {
    const { container } = render(
      <SlashCommandMenu {...defaultProps} selectedIndex={1} />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders commands without categories', () => {
    const commandsWithoutCategory = mockCommands.map(cmd => ({
      ...cmd,
      category: undefined,
    }));
    
    const { container } = render(
      <SlashCommandMenu {...defaultProps} commands={commandsWithoutCategory} />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders commands without descriptions', () => {
    const commandsWithoutDescription = mockCommands.map(cmd => ({
      ...cmd,
      description: undefined,
    }));
    
    const { container } = render(
      <SlashCommandMenu {...defaultProps} commands={commandsWithoutDescription} />
    );
    expect(container).toMatchSnapshot();
  });
}); 