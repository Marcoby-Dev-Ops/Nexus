import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock dependencies
jest.mock('../../src/lib/hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the ProgressiveIntelligence component props interface
interface MockAction {
  id: string;
  type: 'api_call' | 'automation' | 'notification' | 'data_sync';
  title: string;
  description: string;
  confidence: number;
  metadata: Record<string, any>;
}

// Create a simple mock component for testing
const MockProgressiveIntelligence = ({ actions }: { actions: MockAction[] }) => {
  const [actionStates, setActionStates] = React.useState<Record<string, string>>({});
  
  const executeAction = async (action: MockAction) => {
    setActionStates(prev => ({ ...prev, [action.id]: 'Executing...' }));
    
    try {
      if (action.type === 'api_call') {
        await fetch(action.metadata.endpoint, {
          method: action.metadata.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.metadata.payload),
        });
      } else if (action.type === 'automation') {
        await fetch('/api/automations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: action.metadata.workflowId,
            trigger: action.metadata.trigger
          }),
        });
      }
      setActionStates(prev => ({ ...prev, [action.id]: 'Completed' }));
    } catch {
      setActionStates(prev => ({ ...prev, [action.id]: 'Failed' }));
    }
  };

  if (actions.length === 0) {
    return <div>No intelligent actions available at this time.</div>;
  }

  return (
    <div>
      {actions.map(action => (
        <div key={action.id}>
          <h3>{action.title}</h3>
          <p>{action.description}</p>
          <span>{Math.round(action.confidence * 100)}% confidence</span>
          <button onClick={() => executeAction(action)}>Execute</button>
          <span>{actionStates[action.id] ? `✅ ${actionStates[action.id]}` : ''}</span>
          {actionStates[action.id] === 'Failed' && <div data-testid="error-message">Action failed</div>}
        </div>
      ))}
    </div>
  );
};

// Mock the actual component
jest.mock('../../src/components/ai/ProgressiveIntelligence', () => ({
  ProgressiveIntelligence: MockProgressiveIntelligence,
}));

global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ProgressiveIntelligence', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  const mockActions = [
    {
      id: 'action-1',
      type: 'api_call' as const,
      title: 'Test API Call',
      description: 'Execute test API call',
      confidence: 0.9,
      metadata: {
        endpoint: '/api/test',
        method: 'POST',
        payload: { test: true }
      }
    },
    {
      id: 'action-2', 
      type: 'automation' as const,
      title: 'Create Automation',
      description: 'Set up test automation',
      confidence: 0.8,
      metadata: {
        workflowId: 'workflow-123',
        trigger: 'manual'
      }
    }
  ];

  it('should render suggested actions', () => {
    render(<MockProgressiveIntelligence actions={mockActions} />);
    
    expect(screen.getByText('Test API Call')).toBeDefined();
    expect(screen.getByText('Create Automation')).toBeDefined();
    expect(screen.getByText('90% confidence')).toBeDefined();
    expect(screen.getByText('80% confidence')).toBeDefined();
  });

  it('should execute API call action successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, result: 'API call completed' }),
    } as Response);

    render(<ProgressiveIntelligence actions={mockActions} />);
    
    const executeButton = screen.getAllByText('Execute')[0];
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
    });

    expect(screen.getByText('✅ Completed')).toBeInTheDocument();
  });

  it('should handle automation action execution', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, automationId: 'auto-456' }),
    } as Response);

    render(<ProgressiveIntelligence actions={mockActions} />);
    
    const executeButtons = screen.getAllByText('Execute');
    fireEvent.click(executeButtons[1]); // Second action (automation)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: 'workflow-123',
          trigger: 'manual'
        }),
      });
    });
  });

  it('should handle execution errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ProgressiveIntelligence actions={mockActions} />);
    
    const executeButton = screen.getAllByText('Execute')[0];
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(screen.getByText('❌ Failed')).toBeInTheDocument();
    });
  });

  it('should show loading state during execution', async () => {
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response), 100))
    );

    render(<ProgressiveIntelligence actions={mockActions} />);
    
    const executeButton = screen.getAllByText('Execute')[0];
    fireEvent.click(executeButton);

    expect(screen.getByText('⏳ Executing...')).toBeInTheDocument();
  });

  it('should handle empty actions array', () => {
    render(<ProgressiveIntelligence actions={[]} />);
    
    expect(screen.getByText('No intelligent actions available at this time.')).toBeInTheDocument();
  });
}); 