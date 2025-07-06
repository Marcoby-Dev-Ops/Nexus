import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedDepartmentPage } from './UnifiedPages';
import { operationsConfig } from '@/config/departmentConfigs';
import { Lightbulb } from 'lucide-react';

// eslint-disable-next-line no-var
var mockTrack: jest.Mock;
// eslint-disable-next-line no-var
var mockInit: jest.Mock;

jest.mock('@/lib/services/analyticsService', () => {
  mockTrack = jest.fn();
  mockInit = jest.fn();
  return {
    analyticsService: {
      init: mockInit,
      track: mockTrack,
      reset: jest.fn(),
    },
  };
});

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

// Mock the BarChart component as it's complex and not the focus of this test
jest.mock('@/components/dashboard/SimpleBarChart', () => ({
  SimpleBarChart: () => <div data-testid="mock-bar-chart" />,
}));

describe('UnifiedDepartmentPage', () => {
  const mockConfig = {
    ...operationsConfig,
    title: 'Test Department',
    quickActions: [
      {
        label: 'Test Action',
        icon: Lightbulb,
        onClick: jest.fn(),
      },
    ],
  };

  beforeEach(() => {
    mockTrack.mockClear();
    mockInit.mockClear();
    (mockConfig.quickActions[0].onClick as jest.Mock).mockClear();
  });

  it('initializes analytics and tracks page view on render', () => {
    render(<UnifiedDepartmentPage config={mockConfig} />);
    expect(mockInit).toHaveBeenCalledWith('test-user-id', { department: 'Test Department' });
    expect(mockTrack).toHaveBeenCalledWith('department_page_viewed', {
      department: 'Test Department',
    });
  });

  it('renders the page title and subtitle', () => {
    render(<UnifiedDepartmentPage config={mockConfig} />);
    expect(screen.getByText('Test Department')).toBeInTheDocument();
    expect(screen.getByText(mockConfig.subtitle)).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    render(<UnifiedDepartmentPage config={mockConfig} />);
    expect(screen.getByText(mockConfig.kpis[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockConfig.kpis[0].value)).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    render(<UnifiedDepartmentPage config={mockConfig} />);
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });

  it('calls onClick and tracks analytics when a quick action is clicked', () => {
    render(<UnifiedDepartmentPage config={mockConfig} />);
    const actionButton = screen.getByText('Test Action');
    fireEvent.click(actionButton);

    expect(mockConfig.quickActions[0].onClick).toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith('department_quick_action_clicked', {
      department: 'Test Department',
      action: 'Test Action',
    });
  });

  it('renders charts', () => {
    render(<UnifiedDepartmentPage config={mockConfig} />);
    expect(screen.getByText(mockConfig.charts.primary.title)).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-bar-chart')).toHaveLength(2);
  });

  it('renders the activity feed', () => {
    render(<UnifiedDepartmentPage config={mockConfig} />);
    expect(screen.getByText('Activity Stream')).toBeInTheDocument();
    expect(screen.getByText(mockConfig.activities[0].description)).toBeInTheDocument();
  });

  it('renders business insights and education panels if provided in config', () => {
    render(<UnifiedDepartmentPage config={mockConfig} />);
    expect(screen.getByText('Strategic Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Knowledge Hub')).toBeInTheDocument();
  });
}); 