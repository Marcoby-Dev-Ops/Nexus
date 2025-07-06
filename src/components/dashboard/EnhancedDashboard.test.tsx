import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnhancedDashboard from './EnhancedDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/lib/services/dashboardService';

// Mock child components and services
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/services/dashboardService');

jest.mock('./OrganizationalHealthScore', () => () => <div>OrganizationalHealthScore</div>);
jest.mock('./CrossDepartmentMatrix', () => () => <div>CrossDepartmentMatrix</div>);
jest.mock('./TrinityInsightsEngine', () => () => <div>TrinityInsightsEngine</div>);
jest.mock('./QuickActionsPanel', () => ({ QuickActionsPanel: () => <div>QuickActionsPanel</div> }));
jest.mock('./Pins', () => ({ Pins: () => <div>Pins</div> }));
jest.mock('./Recents', () => ({ Recents: () => <div>Recents</div> }));

jest.mock('@/components/dashboard/SecurityDashboard', () => ({ SecurityDashboard: () => <div>SecurityDashboard Content</div> }));
jest.mock('@/components/dashboard/VARLeadDashboard', () => ({ VARLeadDashboard: () => <div>VARLeadDashboard Content</div> }));
jest.mock('@/components/dashboard/ModelManagementDashboard', () => ({ ModelManagementDashboard: () => <div>ModelManagementDashboard Content</div> }));
jest.mock('@/components/dashboard/CentralizedAppsHub', () => ({ CentralizedAppsHub: () => <div>CentralizedAppsHub Content</div> }));

const mockUseAuth = useAuth as jest.Mock;
const mockGetDashboardData = dashboardService.getDashboardData as jest.Mock;

describe('EnhancedDashboard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', name: 'Test User', onboardingCompleted: true },
      completeOnboarding: jest.fn(),
    });
    mockGetDashboardData.mockResolvedValue({
      metrics: {
        think: {},
        see: {},
        act: {},
      },
      activities: [],
    });
  });

  it('renders all the tabs', () => {
    render(<EnhancedDashboard />);
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /security/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /var leads/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /model management/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /centralized apps/i })).toBeInTheDocument();
  });

  it('shows the Overview content by default', () => {
    render(<EnhancedDashboard />);
    expect(screen.getByText('Your Daily AI Briefing')).toBeInTheDocument();
    expect(screen.getByText('Trinity Overview')).toBeInTheDocument();
  });

  it('switches to the Security tab and shows its content', async () => {
    render(<EnhancedDashboard />);
    
    fireEvent.click(screen.getByRole('tab', { name: /security/i }));

    await waitFor(() => {
      expect(screen.getByText('SecurityDashboard Content')).toBeInTheDocument();
    });
  });
}); 