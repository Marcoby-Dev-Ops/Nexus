/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Microsoft365EmailSetup from '../../../src/components/ai/Microsoft365EmailSetup';
import { useNotifications } from '../../../src/contexts/NotificationContext';
import { unifiedInboxService } from '../../../src/lib/services/unifiedInboxService';
import { supabase } from '../../../src/lib/supabase';

// Mock dependencies
jest.mock('../../../src/contexts/NotificationContext');
jest.mock('../../../src/lib/services/unifiedInboxService');
jest.mock('../../../src/lib/supabase');

const mockAddNotification = jest.fn();
const mockGetEmailAccounts = jest.fn();
const mockAddEmailAccount = jest.fn();
const mockStartEmailSync = jest.fn();
const mockGetSyncJobs = jest.fn();
const mockGetUser = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  
  (useNotifications as jest.Mock).mockReturnValue({
    addNotification: mockAddNotification
  });
  
  (unifiedInboxService.getEmailAccounts as jest.Mock) = mockGetEmailAccounts;
  (unifiedInboxService.addEmailAccount as jest.Mock) = mockAddEmailAccount;
  (unifiedInboxService.startEmailSync as jest.Mock) = mockStartEmailSync;
  (unifiedInboxService.getSyncJobs as jest.Mock) = mockGetSyncJobs;
  
  (supabase.auth.getUser as jest.Mock) = mockGetUser;
});

describe('Microsoft365EmailSetup', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User'
    }
  };

  it('renders loading state initially', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockGetEmailAccounts.mockResolvedValue([]);

    render(<Microsoft365EmailSetup onEmailAccountCreated={() => {}} />);

    expect(screen.getByText('Checking Microsoft 365 email setup...')).toBeInTheDocument();
  });

  it('shows setup button when no email account exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockGetEmailAccounts.mockResolvedValue([]);

    render(<Microsoft365EmailSetup onEmailAccountCreated={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Connected Microsoft Account:')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Set Up Microsoft 365 Email')).toBeInTheDocument();
    });
  });

  it('shows existing account status when email account exists', async () => {
    const mockEmailAccount = {
      id: '123',
      email_address: 'test@example.com',
      provider: 'outlook',
      sync_status: 'success'
    };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockGetEmailAccounts.mockResolvedValue([mockEmailAccount]);

    render(<Microsoft365EmailSetup onEmailAccountCreated={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Email account is set up:')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Status: success')).toBeInTheDocument();
      expect(screen.getByText('Sync Emails Now')).toBeInTheDocument();
    });
  });

  it('creates email account when setup button is clicked', async () => {
    const mockEmailAccount = {
      id: '123',
      email_address: 'test@example.com',
      provider: 'outlook',
      sync_status: 'pending'
    };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockGetEmailAccounts.mockResolvedValue([]);
    mockAddEmailAccount.mockResolvedValue(mockEmailAccount);
    mockStartEmailSync.mockResolvedValue();
    mockGetSyncJobs.mockResolvedValue([]);

    const onEmailAccountCreated = jest.fn();
    render(<Microsoft365EmailSetup onEmailAccountCreated={onEmailAccountCreated} />);

    await waitFor(() => {
      expect(screen.getByText('Set Up Microsoft 365 Email')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Set Up Microsoft 365 Email'));

    await waitFor(() => {
      expect(mockAddEmailAccount).toHaveBeenCalledWith({
        email_address: 'test@example.com',
        display_name: 'Test User',
        provider: 'outlook',
        sync_enabled: true
      });
      expect(mockStartEmailSync).toHaveBeenCalledWith('123', 'full_sync');
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Microsoft 365 email account created successfully!'
      });
    });
  });

  it('handles sync button click', async () => {
    const mockEmailAccount = {
      id: '123',
      email_address: 'test@example.com',
      provider: 'outlook',
      sync_status: 'success'
    };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockGetEmailAccounts.mockResolvedValue([mockEmailAccount]);
    mockStartEmailSync.mockResolvedValue();
    mockGetSyncJobs.mockResolvedValue([]);

    render(<Microsoft365EmailSetup />);

    await waitFor(() => {
      expect(screen.getByText('Sync Emails Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sync Emails Now'));

    await waitFor(() => {
      expect(mockStartEmailSync).toHaveBeenCalledWith('123', 'full_sync');
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Email sync started! Your emails will appear in the inbox shortly.'
      });
    });
  });

  it('handles errors during account creation', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockGetEmailAccounts.mockResolvedValue([]);
    mockAddEmailAccount.mockRejectedValue(new Error('Failed to create account'));

    render(<Microsoft365EmailSetup />);

    await waitFor(() => {
      expect(screen.getByText('Set Up Microsoft 365 Email')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Set Up Microsoft 365 Email'));

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to create email account. Please try again.'
      });
    });
  });

  it('handles missing user email', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { ...mockUser, email: null } } });
    mockGetEmailAccounts.mockResolvedValue([]);

    render(<Microsoft365EmailSetup />);

    await waitFor(() => {
      expect(screen.getByText('Set Up Microsoft 365 Email')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Set Up Microsoft 365 Email'));

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'No email address found in your Microsoft account'
      });
    });
  });

  it('monitors sync job status', async () => {
    const mockEmailAccount = {
      id: '123',
      email_address: 'test@example.com',
      provider: 'outlook',
      sync_status: 'success'
    };

    const mockSyncJob = {
      id: 'job-123',
      status: 'completed',
      total_messages: 10,
      processed_messages: 10
    };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockGetEmailAccounts.mockResolvedValue([mockEmailAccount]);
    mockStartEmailSync.mockResolvedValue();
    mockGetSyncJobs.mockResolvedValue([mockSyncJob]);

    render(<Microsoft365EmailSetup />);

    await waitFor(() => {
      expect(screen.getByText('Sync Emails Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sync Emails Now'));

    // Wait for sync status to be checked
    await waitFor(() => {
      expect(mockGetSyncJobs).toHaveBeenCalledWith('123');
    }, { timeout: 5000 });
  });
}); 