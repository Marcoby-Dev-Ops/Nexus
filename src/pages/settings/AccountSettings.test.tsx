import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountSettings from './AccountSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

// Mock dependencies
var mockTrack: jest.Mock;
jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/NotificationContext');
jest.mock('./AccountSettings', () => {
  const originalModule = jest.requireActual('./AccountSettings');
  mockTrack = jest.fn();
  return {
    ...originalModule,
    analytics: {
      track: mockTrack,
    },
  };
});


const mockUseAuth = useAuth as jest.Mock;
const mockUseNotifications = useNotifications as jest.Mock;

describe('AccountSettings', () => {
  const mockUpdateProfile = jest.fn();
  const mockUpdateCompany = jest.fn();
  const mockAddNotification = jest.fn();

  const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
    profile: {
      first_name: 'John',
      last_name: 'Doe',
    },
    company: {
      name: 'Test Inc.',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
      updateCompany: mockUpdateCompany,
    });
    mockUseNotifications.mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  it('renders the form with user data', () => {
    render(<AccountSettings />);
    expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/organization name/i)).toHaveValue('Test Inc.');
  });

  it('updates profile on form submit and tracks analytics', async () => {
    render(<AccountSettings />);
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    const saveButton = screen.getByRole('button', { name: /save all/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
      expect(mockTrack).toHaveBeenCalledWith('profile_updated', {
        user_id: 'test-user',
        updated_fields: expect.any(Array),
      });
      expect(mockAddNotification).toHaveBeenCalledWith({
        message: 'Profile updated successfully',
        type: 'success',
      });
    });
  });

  it('handles profile update errors', async () => {
    const error = new Error('Update failed');
    mockUpdateProfile.mockRejectedValue(error);
    render(<AccountSettings />);

    const saveButton = screen.getByRole('button', { name: /save all/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        message: 'Update failed',
        type: 'error',
      });
    });
  });
}); 