/**
 * Data Connectivity Health Service
 * Provides business health data based on connected and verified data sources
 */

export interface ConnectedSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  dataQuality: number;
  verificationStatus: 'verified' | 'pending' | 'failed';
}

export interface UnconnectedSource {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'unavailable';
  estimatedImpact: number;
}

export interface ConnectivityHealthData {
  overallScore: number;
  dataQualityScore: number;
  completionPercentage: number;
  connectedSources: ConnectedSource[];
  unconnectedSources: UnconnectedSource[];
  lastUpdated: string;
  recommendations: string[];
}

export const dataConnectivityHealthService = {
  async getConnectivityStatus(userId: string): Promise<ConnectivityHealthData> {
    // Mock implementation - in a real app, this would fetch from a database
    const connectedSources: ConnectedSource[] = [
      {
        id: '1',
        name: 'HubSpot CRM',
        type: 'crm',
        status: 'active',
        lastSync: new Date().toISOString(),
        dataQuality: 95,
        verificationStatus: 'verified'
      },
      {
        id: '2',
        name: 'Google Analytics',
        type: 'analytics',
        status: 'active',
        lastSync: new Date().toISOString(),
        dataQuality: 88,
        verificationStatus: 'verified'
      }
    ];

    const unconnectedSources: UnconnectedSource[] = [
      {
        id: '3',
        name: 'Stripe Payments',
        type: 'payments',
        status: 'available',
        estimatedImpact: 25
      },
      {
        id: '4',
        name: 'Slack Workspace',
        type: 'communication',
        status: 'available',
        estimatedImpact: 15
      },
      {
        id: '5',
        name: 'QuickBooks',
        type: 'accounting',
        status: 'available',
        estimatedImpact: 30
      }
    ];

    const overallScore = Math.floor((connectedSources.length / (connectedSources.length + unconnectedSources.length)) * 100);
    const dataQualityScore = Math.floor(connectedSources.reduce((sum, source) => sum + source.dataQuality, 0) / connectedSources.length);
    const completionPercentage = Math.floor((connectedSources.length / (connectedSources.length + unconnectedSources.length)) * 100);

    return {
      overallScore,
      dataQualityScore,
      completionPercentage,
      connectedSources,
      unconnectedSources,
      lastUpdated: new Date().toISOString(),
      recommendations: [
        'Connect Stripe to improve payment tracking',
        'Add Slack for team communication insights',
        'Integrate QuickBooks for financial health monitoring'
      ]
    };
  }
}; 