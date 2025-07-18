import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UnifiedCommunicationDashboard } from './UnifiedCommunicationDashboard';
import { communicationAnalyticsService } from '@/core/services/communicationAnalyticsService';

// Mock the service
jest.mock('@core/communicationAnalyticsService');

const mockCommunicationService = communicationAnalyticsService as jest.Mocked<typeof communicationAnalyticsService>;

const mockUnifiedInsights = {
  platformComparison: {
    slack: { connected: true, messageVolume: 1000, activeUsers: 100, responseTime: 10 },
    teams: { connected: true, messageVolume: 500, activeUsers: 50, responseTime: 20, meetingVolume: 20 },
    recommendation: { primaryPlatform: 'slack', reasoning: 'Higher engagement on Slack.' },
  },
  efficiencyMetrics: {
    communicationEfficiency: 85,
    overallResponseTime: 15,
    collaborationScore: 90,
    recommendations: [{ title: 'Test Rec', description: 'A test recommendation', priority: 'high', expectedImpact: 'High' }],
  },
};

const mockHealthScore = {
  overall: 88,
  slack: 90,
  teams: 85,
};

describe('UnifiedCommunicationDashboard', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockCommunicationService.getUnifiedInsights.mockResolvedValue(mockUnifiedInsights);
    mockCommunicationService.getCommunicationHealthScore.mockResolvedValue(mockHealthScore);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading state initially', () => {
    mockCommunicationService.getUnifiedInsights.mockReturnValue(new Promise(() => {}));
    render(<UnifiedCommunicationDashboard />);
    expect(screen.getByText(/loading communication analytics/i)).toBeInTheDocument();
  });

  it('fetches and displays dashboard data correctly', async () => {
    render(<UnifiedCommunicationDashboard />);

    await waitFor(() => {
        // Check Health Score
        expect(screen.getByText('Communication Health')).toBeInTheDocument();
        expect(screen.getByText('88%')).toBeInTheDocument();

        // Check Platform Status
        expect(screen.getByText('Slack Integration')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument(); // Slack message count

        // Check Insights
        expect(screen.getByText('Cross-Platform Insights')).toBeInTheDocument();
        expect(screen.getByText(/is your primary communication platform/)).toBeInTheDocument();
        expect(screen.getByText('Test Rec')).toBeInTheDocument();
    });
  });
  
  it('refetches data when timeframe is changed', async () => {
    render(<UnifiedCommunicationDashboard />);
    
    await waitFor(() => {
        expect(communicationAnalyticsService.getUnifiedInsights).toHaveBeenCalledTimes(1);
    });

    const timeframeButton = screen.getByRole('button', { name: '90d' });
    fireEvent.click(timeframeButton);

    await waitFor(() => {
        expect(communicationAnalyticsService.getUnifiedInsights).toHaveBeenCalledTimes(2);
    });
  });

  it('handles data fetching errors', async () => {
    mockCommunicationService.getUnifiedInsights.mockRejectedValue(new Error('API Error'));
    console.error = jest.fn(); // Suppress console error for this test
    render(<UnifiedCommunicationDashboard />);

    await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to load dashboard data:', expect.any(Error));
        expect(screen.queryByText(/loading communication analytics/i)).not.toBeInTheDocument();
    });
  });
  
  it('auto-refreshes data at intervals', async () => {
    render(<UnifiedCommunicationDashboard />);
    
    await waitFor(() => {
      expect(communicationAnalyticsService.getUnifiedInsights).toHaveBeenCalledTimes(1);
    });

    // Advance timers by 5 minutes (300000 ms)
    await act(async () => {
        jest.advanceTimersByTime(300000);
    });

    await waitFor(() => {
      expect(communicationAnalyticsService.getUnifiedInsights).toHaveBeenCalledTimes(2);
    });
  });
}); 