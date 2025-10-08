import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { unifiedPlaybookService } from '../../services/playbook/UnifiedPlaybookService';

interface PlaybookItem {
  id: string;
  name: string;
  description: string;
  itemType: string;
  orderIndex: number;
  isRequired: boolean;
  componentName: string | null;
  validationSchema: any;
  status: 'completed' | 'in_progress' | 'pending' | 'blocked';
  completedAt: string | null;
  responseData: any;
  canStart: boolean;
}

interface PlaybookSummary {
  totalItems: number;
  completedItems: number;
  requiredItems: number;
  completedRequiredItems: number;
  progressPercentage: number;
  nextItemId: string | null;
  canComplete: boolean;
}

interface PlaybookDetails {
  playbook: any;
  progress: any;
  items: PlaybookItem[];
  summary: PlaybookSummary;
}

interface PlaybookViewerProps {
  playbookName: string;
  onItemComplete?: (itemId: string, responseData: any) => void;
  onPlaybookComplete?: () => void;
}

const PlaybookViewer: React.FC<PlaybookViewerProps> = ({
  playbookName,
  onItemComplete,
  onPlaybookComplete
}) => {
  const { user } = useAuth();
  const [playbookDetails, setPlaybookDetails] = useState<PlaybookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [completingItem, setCompletingItem] = useState<string | null>(null);

  const playbookService = new ConsolidatedPlaybookService();

  useEffect(() => {
    if (user?.id) {
      loadPlaybookDetails();
    }
  }, [user?.id, playbookName]);

  const loadPlaybookDetails = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await playbookService.getPlaybookDetails(user.id, playbookName);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setPlaybookDetails(response.data);
        // Set the first available item as active
        const firstAvailableItem = response.data.items.find(item => item.canStart);
        setActiveItemId(firstAvailableItem?.id || null);
      }
    } catch (err) {
      setError('Failed to load playbook details');
      // console.error('Error loading playbook details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemComplete = async (itemId: string, responseData: any) => {
    if (!user?.id || !playbookDetails) return;

    setCompletingItem(itemId);

    try {
      const response = await playbookService.completePlaybookItem(
        user.id,
        playbookDetails.playbook.id,
        itemId,
        responseData
      );

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        // Reload playbook details to get updated progress
        await loadPlaybookDetails();
        
        // Call the callback
        onItemComplete?.(itemId, responseData);

        // If playbook is completed, call the completion callback
        if (response.data.playbookCompleted) {
          onPlaybookComplete?.();
        }
      }
    } catch (err) {
      setError('Failed to complete item');
      // console.error('Error completing item:', err);
    } finally {
      setCompletingItem(null);
    }
  };

  const getStatusIcon = (status: PlaybookItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'blocked':
        return (
          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = (status: PlaybookItem['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50';
      case 'blocked':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading playbook...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadPlaybookDetails}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!playbookDetails) {
    return (
      <div className="p-6 text-center text-gray-600">
        No playbook details available
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Playbook Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {playbookDetails.playbook.name}
        </h1>
        <p className="text-gray-600 mb-4">
          {playbookDetails.playbook.description}
        </p>
        
        {/* Progress Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
            <span className="text-2xl font-bold text-blue-600">
              {playbookDetails.summary.progressPercentage}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${playbookDetails.summary.progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{playbookDetails.summary.completedItems}</div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{playbookDetails.summary.totalItems}</div>
              <div className="text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{playbookDetails.summary.completedRequiredItems}</div>
              <div className="text-gray-600">Required Done</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{playbookDetails.summary.requiredItems}</div>
              <div className="text-gray-600">Required Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Playbook Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Items</h2>
        
        {playbookDetails.items.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-6 transition-all duration-200 ${getStatusColor(item.status)} ${
              activeItemId === item.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(item.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {item.orderIndex}. {item.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {item.isRequired && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.itemType}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{item.description}</p>
                
                {item.completedAt && (
                  <div className="text-sm text-green-600 mb-4">
                    ✓ Completed on {new Date(item.completedAt).toLocaleDateString()}
                  </div>
                )}
                
                {/* Item Action */}
                {item.canStart && !item.completedAt && (
                  <div className="mt-4">
                    <button
                      onClick={() => setActiveItemId(item.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Start This Item
                    </button>
                  </div>
                )}
                
                {item.status === 'blocked' && (
                  <div className="mt-4 text-sm text-gray-500">
                    Complete previous required items to unlock this item
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Item Completion Modal/Form */}
      {activeItemId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Complete Item
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter your response..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setActiveItemId(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // In a real implementation, you'd get the response data from the form
                      handleItemComplete(activeItemId, { response: 'Sample response' });
                      setActiveItemId(null);
                    }}
                    disabled={completingItem === activeItemId}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {completingItem === activeItemId ? 'Completing...' : 'Complete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaybookViewer;
