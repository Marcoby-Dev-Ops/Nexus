/**
 * @file QuickLaunchTiles.test.tsx
 * @description Unit and snapshot tests for the QuickLaunchTiles dashboard component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuickLaunchTiles from '@/domains/dashboard/features/components/QuickLaunchTiles';

describe('QuickLaunchTiles', () => {
  const mockActions = [
    {
      label: 'New Deal',
      description: 'Create a new sales deal',
      icon: 'plus',
      onClick: jest.fn(),
    },
    {
      label: 'Reports',
      description: 'View sales reports',
      icon: 'chart',
      onClick: jest.fn(),
    },
    {
      label: 'Contacts',
      description: 'Manage contacts',
      icon: 'users',
      onClick: jest.fn(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all actions', () => {
    render(<QuickLaunchTiles actions={mockActions} />);
    expect(screen.getByText('New Deal')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
  });

  it('calls onClick handler when action is clicked', () => {
    render(<QuickLaunchTiles actions={mockActions} />);
    fireEvent.click(screen.getByText('New Deal'));
    expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);
  });

  it('renders action descriptions', () => {
    render(<QuickLaunchTiles actions={mockActions} />);
    expect(screen.getByText('Create a new sales deal')).toBeInTheDocument();
    expect(screen.getByText('View sales reports')).toBeInTheDocument();
    expect(screen.getByText('Manage contacts')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<QuickLaunchTiles actions={mockActions} />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 