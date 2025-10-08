import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { businessHealthService } from '@/core/services/BusinessHealthService';
import { dataConnectivityHealthService } from '@/services/business/dataConnectivityHealthService';
import { analyticsService } from '@/services/core/AnalyticsService';
import { logger } from '@/shared/utils/logger';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId: string;
}

export interface SystemStatus {
  home: {
    insights: number;
    alerts: number;
    lastUpdated: string;
  };
  workspace: {
    actions: number;
    automations: number;
    decisions: number;
  };
  fire: {
    focus: number;
    insight: number;
    roadmap: number;
    execute: number;
  };
  integrations: {
    connected: number;
    insights: number;
    dataPoints: number;
  };
}

export interface BusinessData {
  id: string;
  name: string;
  health: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    summary: string;
  };
  metrics: {
    revenue: number;
    growth: number;
    efficiency: number;
  };
}

interface DataContextType {
  profile: UserProfile | null;
  systemStatus: SystemStatus | null;
  businessData: BusinessData | null;
  loading: boolean;
  error: string | null;
  warnings: string[];
  refreshAll: () => Promise<void>;
  clearError: () => void;
  clearWarnings: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user } = useEnhancedAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load real data from services
      const [healthResult, connectivityResult, metricsResult] = await Promise.all([
        businessHealthService.readLatest(),
        dataConnectivityHealthService.getConnectivityStatus(user.id),
        analyticsService.getBusinessMetrics(user.id)
      ]);

      // Set profile data from user
      setProfile({
        id: user.id,
        firstName: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        role: user.user_metadata?.role || 'user',
        companyId: user.user_metadata?.company_id || 'default',
      });

      // Set system status based on real data
      const realSystemStatus: SystemStatus = {
        home: {
          insights: connectivityResult.success ? (connectivityResult.data?.connectedSources.length || 0) * 3 : 0,
          alerts: connectivityResult.success ? (connectivityResult.data?.unconnectedSources.length || 0) : 0,
          lastUpdated: new Date().toISOString(),
        },
        workspace: {
          actions: metricsResult.success ? (metricsResult.data?.actions || 0) : 0,
          automations: metricsResult.success ? (metricsResult.data?.automations || 0) : 0,
          decisions: metricsResult.success ? (metricsResult.data?.decisions || 0) : 0,
        },
        fire: {
          focus: healthResult.success ? (healthResult.data?.category_scores?.focus || 0) : 0,
          insight: healthResult.success ? (healthResult.data?.category_scores?.insight || 0) : 0,
          roadmap: healthResult.success ? (healthResult.data?.category_scores?.roadmap || 0) : 0,
          execute: healthResult.success ? (healthResult.data?.category_scores?.execute || 0) : 0,
        },
        integrations: {
          connected: connectivityResult.success ? (connectivityResult.data?.connectedSources.length || 0) : 0,
          insights: connectivityResult.success ? (connectivityResult.data?.insights || 0) : 0,
          dataPoints: connectivityResult.success ? (connectivityResult.data?.dataPoints || 0) : 0,
        },
      };
      setSystemStatus(realSystemStatus);

      // Set business data based on real metrics
      const realBusinessData: BusinessData = {
        id: 'business-1',
        name: 'Nexus Business',
        health: {
          score: healthResult.success ? (healthResult.data?.overall_score || 0) : 0,
          trend: healthResult.success ? 'up' : 'stable',
          summary: healthResult.success ? 'Real-time business health monitoring active' : 'Health monitoring not available',
        },
        metrics: {
          revenue: metricsResult.success ? (metricsResult.data?.revenue || 0) : 0,
          growth: metricsResult.success ? (metricsResult.data?.growth || 0) : 0,
          efficiency: metricsResult.success ? (metricsResult.data?.efficiency || 0) : 0,
        },
      };
      setBusinessData(realBusinessData);

      // Set warnings based on data quality
      const newWarnings: string[] = [];
      if (!healthResult.success) {
        newWarnings.push('Business health data unavailable');
      }
      if (!connectivityResult.success) {
        newWarnings.push('Integration connectivity data unavailable');
      }
      if (!metricsResult.success) {
        newWarnings.push('Business metrics data unavailable');
      }
      setWarnings(newWarnings);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setWarnings(['Some data may be outdated']);
      logger.error('Error loading data context', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await loadData();
  };

  const clearError = () => {
    setError(null);
  };

  const clearWarnings = () => {
    setWarnings([]);
  };

  // Load data when user changes
  useEffect(() => {
    loadData();
  }, [user]);

  const value: DataContextType = {
    profile,
    systemStatus,
    businessData,
    loading,
    error,
    warnings,
    refreshAll,
    clearError,
    clearWarnings,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 
