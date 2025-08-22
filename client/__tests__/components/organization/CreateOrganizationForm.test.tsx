import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateOrganizationForm } from '@/components/organization/CreateOrganizationForm';
import { useAuth } from '@/hooks/index';
import { useOrganization } from '@/shared/hooks/useOrganization';
import { useToast } from '@/shared/ui/components/Toast';

// Mock the hooks
jest.mock('@/hooks/index');
jest.mock('@/shared/hooks/useOrganization');
jest.mock('@/shared/ui/components/Toast');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseOrganization = useOrganization as jest.MockedFunction<typeof useOrganization>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('CreateOrganizationForm', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  const mockCreateOrganization = jest.fn();
  const mockToast = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn()
    });

    mockUseOrganization.mockReturnValue({
      createOrganization: mockCreateOrganization,
      joinOrganization: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn()
    });

    mockUseToast.mockReturnValue({
      toast: mockToast
    });
  });

  it('renders the form correctly', () => {
    render(<CreateOrganizationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Create Organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Organization Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Organization' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    mockCreateOrganization.mockResolvedValue({
      success: true,
      orgId: 'test-org-id',
      profileId: 'test-profile-id'
    });

    render(<CreateOrganizationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByLabelText('Organization Name *');
    const descriptionInput = screen.getByLabelText('Description');
    const submitButton = screen.getByRole('button', { name: 'Create Organization' });

    fireEvent.change(nameInput, { target: { value: 'Test Organization' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateOrganization).toHaveBeenCalledWith({
        tenantId: 'test-user-id',
        name: 'Test Organization',
        description: 'Test Description',
        userId: 'test-user-id'
      });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith('test-org-id', 'test-profile-id');
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success!',
      description: 'Organization created successfully',
      variant: 'default'
    });
  });

  it('handles form submission failure', async () => {
    mockCreateOrganization.mockResolvedValue({
      success: false,
      error: 'Failed to create organization'
    });

    render(<CreateOrganizationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByLabelText('Organization Name *');
    const submitButton = screen.getByRole('button', { name: 'Create Organization' });

    fireEvent.change(nameInput, { target: { value: 'Test Organization' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create organization',
        variant: 'destructive'
      });
    });
  });

  it('shows error when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn()
    });

    render(<CreateOrganizationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const submitButton = screen.getByRole('button', { name: 'Create Organization' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Authentication Required',
        description: 'You must be logged in to create an organization',
        variant: 'destructive'
      });
    });
  });

  it('shows error when organization name is empty', async () => {
    render(<CreateOrganizationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const submitButton = screen.getByRole('button', { name: 'Create Organization' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Organization Name Required',
        description: 'Please enter an organization name',
        variant: 'destructive'
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<CreateOrganizationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables submit button when loading', () => {
    mockUseOrganization.mockReturnValue({
      createOrganization: mockCreateOrganization,
      joinOrganization: jest.fn(),
      isLoading: true,
      error: null,
      clearError: jest.fn()
    });

    render(<CreateOrganizationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const submitButton = screen.getByRole('button', { name: 'Creating...' });
    expect(submitButton).toBeDisabled();
  });
});
