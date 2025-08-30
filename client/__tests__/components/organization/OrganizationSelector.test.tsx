import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrganizationSelector } from '@/shared/components/organization/OrganizationSelector';
import { useOrganizationStore } from '@/shared/stores/organizationStore';

// Mock the organization store
jest.mock('@/shared/stores/organizationStore', () => ({
  useOrganizationStore: jest.fn()
}));

const mockUseOrganizationStore = useOrganizationStore as jest.MockedFunction<typeof useOrganizationStore>;

describe('OrganizationSelector', () => {
  const mockOrgs = [
    { id: '1', name: 'Acme Corp', role: 'owner' },
    { id: '2', name: 'Tech Startup', role: 'admin' }
  ];

  beforeEach(() => {
    mockUseOrganizationStore.mockReturnValue({
      orgs: mockOrgs,
      activeOrgId: '1',
      setActiveOrg: jest.fn(),
      getActiveOrg: jest.fn().mockReturnValue(mockOrgs[0]),
      loading: false,
      currentOrg: null,
      currentOrgMembers: [],
      loadMemberships: jest.fn(),
      loadOrganizationDetails: jest.fn(),
      loadOrganizationMembers: jest.fn(),
      clearCurrentOrg: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders organization selector with active organization', () => {
    render(<OrganizationSelector />);
    
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows dropdown when clicked', () => {
    render(<OrganizationSelector />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Tech Startup')).toBeInTheDocument();
  });

  it('calls setActiveOrg when organization is selected', () => {
    const mockSetActiveOrg = jest.fn();
    mockUseOrganizationStore.mockReturnValue({
      orgs: mockOrgs,
      activeOrgId: '1',
      setActiveOrg: mockSetActiveOrg,
      getActiveOrg: jest.fn().mockReturnValue(mockOrgs[0]),
      loading: false,
      currentOrg: null,
      currentOrgMembers: [],
      loadMemberships: jest.fn(),
      loadOrganizationDetails: jest.fn(),
      loadOrganizationMembers: jest.fn(),
      clearCurrentOrg: jest.fn()
    });

    render(<OrganizationSelector />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const techStartupButton = screen.getByText('Tech Startup');
    fireEvent.click(techStartupButton);
    
    expect(mockSetActiveOrg).toHaveBeenCalledWith('2');
  });

  it('does not render when no organizations exist', () => {
    mockUseOrganizationStore.mockReturnValue({
      orgs: [],
      activeOrgId: null,
      setActiveOrg: jest.fn(),
      getActiveOrg: jest.fn().mockReturnValue(null),
      loading: false,
      currentOrg: null,
      currentOrgMembers: [],
      loadMemberships: jest.fn(),
      loadOrganizationDetails: jest.fn(),
      loadOrganizationMembers: jest.fn(),
      clearCurrentOrg: jest.fn()
    });

    const { container } = render(<OrganizationSelector />);
    expect(container.firstChild).toBeNull();
  });

  it('shows check mark for active organization', () => {
    render(<OrganizationSelector />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Check that the active organization has a check mark
    const activeOrgItem = screen.getByText('Acme Corp').closest('button');
    expect(activeOrgItem).toHaveClass('bg-accent');
  });
});
