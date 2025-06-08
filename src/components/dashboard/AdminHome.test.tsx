/**
 * @file AdminHome.test.tsx
 * @description Unit and snapshot tests for the AdminHome component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminHome from './AdminHome';

describe('AdminHome', () => {
  it('renders all major sections', () => {
    render(<AdminHome />);
    
    // Check for section headers
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Team Management')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('renders user management table with correct data', () => {
    render(<AdminHome />);
    
    // Check table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check user data
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@email.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders team management list with correct data', () => {
    render(<AdminHome />);
    
    // Check team data
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('5 members')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('3 members')).toBeInTheDocument();
  });

  it('renders system settings with correct data', () => {
    render(<AdminHome />);
    
    // Check system settings
    expect(screen.getByText('Branding:')).toBeInTheDocument();
    expect(screen.getByText('Nexus OS')).toBeInTheDocument();
    expect(screen.getByText('Integrations:')).toBeInTheDocument();
    expect(screen.getByText('QuickBooks, Slack')).toBeInTheDocument();
    expect(screen.getByText('Preferences:')).toBeInTheDocument();
    expect(screen.getByText('Dark mode enabled')).toBeInTheDocument();
  });

  it('renders activity log with correct data', () => {
    render(<AdminHome />);
    
    // Check activity log entries
    expect(screen.getByText('Invited user')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('(2024-06-10)')).toBeInTheDocument();
    expect(screen.getByText('Changed logo')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('(2024-06-09)')).toBeInTheDocument();
  });

  it('renders AI insights with correct data', () => {
    render(<AdminHome />);
    
    // Check AI insights
    expect(screen.getByText('Carol has not accepted her invite (3 days).')).toBeInTheDocument();
    expect(screen.getByText('No security issues detected.')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    render(<AdminHome />);
    
    // Check quick action buttons
    expect(screen.getByText('Invite User')).toBeInTheDocument();
    expect(screen.getByText('Add Team')).toBeInTheDocument();
    expect(screen.getByText('Change Logo')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<AdminHome />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 