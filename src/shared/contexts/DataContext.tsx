import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/index';

// Types
export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatar?: string;
  role?: string;
  companyId?: string;
}

export interface SystemStatus {
  home?: {
    insights: number;
    alerts: number;
    lastUpdated?: string;
  };
  workspace?: {
    actions: number;
    automations: number;
    decisions: number;
  };
  fire?: {
    focus: number;
    insight: number;
    roadmap: number;
    execute: number;
  };
  integrations?: {
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

export interface DataContextType {
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

// Create context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider component
interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Mock data for development - replace with actual API calls
  const mockSystemStatus: SystemStatus = {
    home: {
      insights: 12,
      alerts: 3,
      lastUpdated: new Date().toISOString(),
    },
    workspace: {
      actions: 8,
      automations: 5,
      decisions: 2,
    },
    fire: {
      focus: 75,
      insight: 60,
      roadmap: 45,
      execute: 30,
    },
    integrations: {
      connected: 4,
      insights: 15,
      dataPoints: 1200,
    },
  };

  const mockBusinessData: BusinessData = {
    id: 'business-1',
    name: 'Nexus Business',
    health: {
      score: 85,
      trend: 'up',
      summary: 'Strong performance with positive growth indicators',
    },
    metrics: {
      revenue: 125000,
      growth: 12.5,
      efficiency: 78,
    },
  };

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock API calls - replace with actual implementations
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      // Set mock profile data
      setProfile({
        id: user.id,
        firstName: 'John',
        lastName: 'Doe',
        email: user.email || '',
        role: 'admin',
        companyId: 'company-1',
      });

      // Set mock system status
      setSystemStatus(mockSystemStatus);

      // Set mock business data
      setBusinessData(mockBusinessData);

      // Clear any existing warnings
      setWarnings([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setWarnings(['Some data may be outdated']);
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

// Hook to use the data context
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 