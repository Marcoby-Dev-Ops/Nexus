import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// --- Types ---
export interface IntegrationStatus {
  id: string;
  name: string;
  status: 'active' | 'syncing' | 'error' | 'paused';
  lastSync: string;
}

export interface BusinessHealth {
  score: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  summary: string;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'alert' | 'trend' | 'optimization';
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  createdAt: string;
}

export interface SystemContextValue {
  integrationStatus: IntegrationStatus[];
  businessHealth: BusinessHealth;
  aiInsights: AIInsight[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const SystemContext = createContext<SystemContextValue | undefined>(undefined);

// --- Mock Data ---
const MOCK_INTEGRATIONS: IntegrationStatus[] = [
  {
    id: 'paypal',
    name: 'PayPal',
    status: 'active',
    lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'office-365',
    name: 'Microsoft 365',
    status: 'paused',
    lastSync: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ninjarmm',
    name: 'NinjaRMM',
    status: 'error',
    lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

const MOCK_BUSINESS_HEALTH: BusinessHealth = {
  score: 78,
  trend: 'up',
  summary: 'Business health is improving, with strong revenue growth and stable operations.'
};

const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    title: 'Revenue Growth Opportunity',
    description: 'PayPal data shows 23% increase in transaction volume this month. Consider increasing inventory for top-selling products.',
    type: 'opportunity',
    impact: 'high',
    actionable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Email Response Time Optimization',
    description: 'Microsoft 365 data indicates average email response time has increased by 40%. Consider setting up auto-responders.',
    type: 'optimization',
    impact: 'medium',
    actionable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'System Health Alert',
    description: 'NinjaRMM reports 3 devices with critical updates pending. Immediate action recommended.',
    type: 'alert',
    impact: 'high',
    actionable: true,
    createdAt: new Date().toISOString(),
  },
];

// --- Stub Fetch Functions ---
async function fetchIntegrationStatus(): Promise<IntegrationStatus[]> {
  // TODO: Replace with real fetch from Supabase or API
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_INTEGRATIONS), 400));
}

async function fetchBusinessHealth(): Promise<BusinessHealth> {
  // TODO: Replace with real fetch from Supabase or API
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_BUSINESS_HEALTH), 300));
}

async function fetchAIInsights(): Promise<AIInsight[]> {
  // TODO: Replace with real fetch from Supabase or API
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_AI_INSIGHTS), 350));
}

// --- Provider ---
export const SystemContextProvider = ({ children }: { children: ReactNode }) => {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus[]>([]);
  const [businessHealth, setBusinessHealth] = useState<BusinessHealth>(MOCK_BUSINESS_HEALTH);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [integrations, health, insights] = await Promise.all([
      fetchIntegrationStatus(),
      fetchBusinessHealth(),
      fetchAIInsights(),
    ]);
    setIntegrationStatus(integrations);
    setBusinessHealth(health);
    setAIInsights(insights);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value: SystemContextValue = {
    integrationStatus,
    businessHealth,
    aiInsights,
    loading,
    refresh,
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
};

// --- Hook ---
export function useSystemContext() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystemContext must be used within a SystemContextProvider');
  return ctx;
} 