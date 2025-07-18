/**
 * @file ActivityFeed.test.tsx
 * @description Unit and snapshot tests for the ActivityFeed dashboard component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivityFeed from './ActivityFeed';
import { ActivityFeed as ActivityFeedNamed } from './ActivityFeed';

describe('ActivityFeed', () => {
  const activities = [
    { type: 'login', user: 'Alice', description: 'Logged in', timestamp: '2024-06-10', context: 'sales' },
    { type: 'deal', user: 'Bob', description: 'Closed deal with Acme Corp', timestamp: '2024-06-09', context: 'sales' },
    { type: 'invoice', user: 'Carol', description: 'Sent invoice to Beta LLC', timestamp: '2024-06-08', context: 'finance' },
  ];

  it('renders activities', () => {
    render(<ActivityFeed activities={activities} context="sales" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).not.toBeInTheDocument();
  });

  it('filters activities by type', () => {
    render(<ActivityFeed activities={activities} context="sales" />);
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeSelect, { target: { value: 'deal' } });
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Alice')).not.toBeInTheDocument();
  });

  it('filters activities by user', () => {
    render(<ActivityFeed activities={activities} context="sales" />);
    const userSelect = screen.getByRole('combobox', { name: /user/i });
    fireEvent.change(userSelect, { target: { value: 'Alice' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).not.toBeInTheDocument();
  });

  it('shows empty state when no activities match filters', () => {
    render(<ActivityFeed activities={activities} context="sales" />);
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeSelect, { target: { value: 'nonexistent' } });
    expect(screen.getByText('No recent activity.')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<ActivityFeed activities={activities} context="sales" />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 