import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OrganizationalHealthScore from '../../src/components/dashboard/OrganizationalHealthScore';
import { useAuth } from '../../src/hooks/useAuth';
import { businessHealthService } from '../../src/lib/services/businessHealthService';
import { useToast } from '../../src/components/ui/Toast';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/services/businessHealthService');
jest.mock('@/components/ui/Toast');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockBusinessHealthService = businessHealthService as jest.Mocked<typeof businessHealthService>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const mockShowToast = jest.fn();

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('BusinessHealthScore Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue({ showToast: mockShowToast });
  });

  const mockHealthData = {
    kpiValues: {
      mrr_arr: 35000,
      new_leads: 45,
      conversion_rate: 15,
      profit_margin: 18,
      cash_runway: 9,
    },
    categoryScores: {
      sales: 75,
      finance: 82,
      support: 68,
      marketing: 71,
      operations: 79,
      maturity: 65,
    },
    overallScore: 73,
    lastUpdated: '2024-01-15T10:00:00Z',
    completionPercentage: 85,
    missingKPIs: ['nps', 'csat'],
  };

  it('renders loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    expect(screen.getByText('Loading your business health assessment...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays business health score with real data', async () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(mockHealthData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('73')).toBeInTheDocument();
      expect(screen.getByText('73/100')).toBeInTheDocument();
    });

    expect(screen.getByText('Business Health')).toBeInTheDocument();
    expect(screen.getByText('Overall assessment of your business key performance indicators')).toBeInTheDocument();
  });

  it('falls back to mock data when no company_id', async () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: null } as any,
      loading: false,
    } as any);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/\d+/)).toBeInTheDocument(); // Some score should be displayed
    });

    expect(mockBusinessHealthService.fetchBusinessHealthData).not.toHaveBeenCalled();
  });

  it('displays category scores and progress bars', async () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(mockHealthData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
    });

    // Check that progress bars are rendered
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(1); // Loading + category progress bars
  });

  it('shows "Show All Categories" button when there are more than 3 categories', async () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(mockHealthData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Show All Categories')).toBeInTheDocument();
    });
  });

  it('expands to show all categories when button is clicked', async () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(mockHealthData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Show All Categories')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Show All Categories'));

    await waitFor(() => {
      expect(screen.getByText('Show Less')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
      expect(screen.getByText('Operations')).toBeInTheDocument();
      expect(screen.getByText('Maturity')).toBeInTheDocument();
    });
  });

  it('displays recent improvements section', async () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(mockHealthData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Improvements')).toBeInTheDocument();
      expect(screen.getByText('Maturity score increased by 15%')).toBeInTheDocument();
      expect(screen.getByText('Finance health improved to 78%')).toBeInTheDocument();
    });
  });

  it('navigates to detailed analysis when button is clicked', async () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(mockHealthData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('View Detailed Analysis')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Detailed Analysis'));

    expect(mockNavigate).toHaveBeenCalledWith('/analytics/business-health');
  });

  it('handles API errors gracefully', async () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    const mockError = new Error('Failed to fetch business health data');
    mockBusinessHealthService.fetchBusinessHealthData.mockRejectedValue(mockError);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('There was a problem loading your business health data.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to load business health score',
      type: 'error',
    });
  });

  it('applies correct color classes based on score', async () => {
    const highScoreData = {
      ...mockHealthData,
      overallScore: 85,
      categoryScores: { ...mockHealthData.categoryScores, sales: 90 },
    };

    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(highScoreData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      const scoreElement = screen.getByText('85');
      expect(scoreElement).toHaveClass('text-emerald-500'); // High score color
    });
  });

  it('shows medium score color for scores between 60-79', async () => {
    const mediumScoreData = {
      ...mockHealthData,
      overallScore: 65,
    };

    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(mediumScoreData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      const scoreElement = screen.getByText('65');
      expect(scoreElement).toHaveClass('text-amber-500'); // Medium score color
    });
  });

  it('shows low score color for scores below 60', async () => {
    const lowScoreData = {
      ...mockHealthData,
      overallScore: 45,
    };

    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(lowScoreData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      const scoreElement = screen.getByText('45');
      expect(scoreElement).toHaveClass('text-red-500'); // Low score color
    });
  });

  it('formats last updated date correctly', async () => {
    mockUseAuth.mockReturnValue({
      user: { company_id: 'test-company-id' } as any,
      loading: false,
    } as any);

    mockBusinessHealthService.fetchBusinessHealthData.mockResolvedValue(mockHealthData);

    render(
      <TestWrapper>
        <OrganizationalHealthScore />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Last updated')).toBeInTheDocument();
      // Date formatting may vary by locale, so just check that some date is displayed
      expect(screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4}/)).toBeInTheDocument();
    });
  });
}); 