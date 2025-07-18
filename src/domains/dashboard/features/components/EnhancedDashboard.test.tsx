import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnhancedDashboard from '@/domains/dashboard/features/components/EnhancedDashboard';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { dashboardService } from '@/core/services/dashboardService';
import { analyticsService } from '@/core/services/analyticsService';

// Mock child components and services
jest.mock('@shared/contexts/AuthContext');
jest.mock('@core/dashboardService');
jest.mock('@core/analyticsService');

jest.mock('./OrganizationalHealthScore', () => () => <div>OrganizationalHealthScore</div>);
jest.mock('./CrossDepartmentMatrix', () => () => <div>CrossDepartmentMatrix</div>);
jest.mock('./TrinityInsightsEngine', () => () => <div>TrinityInsightsEngine</div>);
jest.mock('./QuickActionsPanel', () => ({ QuickActionsPanel: () => <div>QuickActionsPanel</div> }));
jest.mock('./Pins', () => ({ Pins: () => <div>Pins</div> }));
jest.mock('./Recents', () => ({ Recents: () => <div>Recents</div> }));

jest.mock('@shared/shared/components/dashboard/SecurityDashboard', () => ({ SecurityDashboard: () => <div>SecurityDashboard Content</div> }));
jest.mock('@shared/shared/components/dashboard/VARLeadDashboard', () => ({ VARLeadDashboard: () => <div>VARLeadDashboard Content</div> }));
jest.mock('@shared/shared/components/dashboard/ModelManagementDashboard', () => ({ ModelManagementDashboard: () => <div>ModelManagementDashboard Content</div> }));
jest.mock('@shared/shared/components/dashboard/CentralizedAppsHub', () => ({ CentralizedAppsHub: () => <div>CentralizedAppsHub Content</div> }));

const mockUseAuth = useAuth as jest.Mock;
const mockGetDashboardData = dashboardService.getDashboardData as jest.Mock;
const mockAnalyticsTrack = analyticsService.track as jest.Mock;

describe('EnhancedDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', name: 'Test User', onboardingCompleted: true, role: 'admin', department: 'finance' },
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

  it('renders executive actions for allowed roles', () => {
    render(<EnhancedDashboard />);
    expect(screen.getByText('Executive Actions')).toBeInTheDocument();
    expect(screen.getByText('Generate Board Report')).toBeInTheDocument();
  });

  it('does not render executive actions for disallowed roles', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', name: 'Test User', onboardingCompleted: true, role: 'user', department: 'marketing' },
      completeOnboarding: jest.fn(),
    });
    render(<EnhancedDashboard />);
    expect(screen.queryByText('Executive Actions')).not.toBeInTheDocument();
  });

  it('fires analytics event on executive action button click', () => {
    render(<EnhancedDashboard />);
    fireEvent.click(screen.getByText('Generate Board Report'));
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('executive_action_board_report', expect.objectContaining({ userId: 'test-user' }));
    fireEvent.click(screen.getByText('Department Analysis'));
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('executive_action_department_analysis', expect.objectContaining({ userId: 'test-user' }));
    fireEvent.click(screen.getByText('Forecast Review'));
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('executive_action_forecast_review', expect.objectContaining({ userId: 'test-user' }));
    fireEvent.click(screen.getByText('Risk Assessment'));
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('executive_action_risk_assessment', expect.objectContaining({ userId: 'test-user' }));
  });

  it('auto-refreshes dashboard data every 5 minutes', async () => {
    jest.useFakeTimers();
    render(<EnhancedDashboard />);
    expect(mockGetDashboardData).toHaveBeenCalledTimes(1);
    // Advance timers by 5 minutes (300000 ms)
    await waitFor(() => {
      jest.advanceTimersByTime(300000);
    });
    expect(mockGetDashboardData).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
}); 