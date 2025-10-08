/**
 * Demo Configuration System
 * 
 * This system provides a complete demo experience with:
 * - Demo accounts with different permission levels
 * - Comprehensive mock data for all features
 * - Demo mode toggle functionality
 * - Realistic business scenarios
 */

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  company: string;
  avatar?: string;
  permissions: string[];
}

export interface DemoData {
  user: DemoAccount;
  business: {
    id: string;
    name: string;
    industry: string;
    size: string;
    revenue: number;
    employees: number;
    founded: string;
    location: string;
  };
  metrics: {
    revenue: number;
    growth: number;
    efficiency: number;
    health: number;
  };
  integrations: {
    connected: number;
    total: number;
    status: 'active' | 'warning' | 'error';
  };
  ai: {
    agents: number;
    conversations: number;
    accuracy: number;
    satisfaction: number;
  };
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo-admin',
    email: 'admin@nexus-demo.com',
    password: 'demo123',
    name: 'Sarah Johnson',
    role: 'admin',
    company: 'Nexus Technologies',
    avatar: '👩‍💼',
    permissions: ['admin', 'manage_users', 'view_analytics', 'manage_integrations']
  },
  {
    id: 'demo-manager',
    email: 'manager@nexus-demo.com',
    password: 'demo123',
    name: 'Michael Chen',
    role: 'manager',
    company: 'Nexus Technologies',
    avatar: '👨‍💼',
    permissions: ['view_analytics', 'manage_team', 'view_reports']
  },
  {
    id: 'demo-user',
    email: 'user@nexus-demo.com',
    password: 'demo123',
    name: 'Emily Rodriguez',
    role: 'user',
    company: 'Nexus Technologies',
    avatar: '👩‍💻',
    permissions: ['view_dashboard', 'use_ai', 'view_own_data']
  }
];

export const DEMO_BUSINESS_DATA = {
  'demo-admin': {
    business: {
      id: 'business-1',
      name: 'Nexus Technologies',
      industry: 'Technology',
      size: '50-200 employees',
      revenue: 2500000,
      employees: 85,
      founded: '2018',
      location: 'San Francisco, CA'
    },
    metrics: {
      revenue: 2500000,
      growth: 15.2,
      efficiency: 87,
      health: 92
    },
    integrations: {
      connected: 6,
      total: 8,
      status: 'active'
    },
    ai: {
      agents: 12,
      conversations: 2847,
      accuracy: 94.2,
      satisfaction: 4.8
    }
  },
  'demo-manager': {
    business: {
      id: 'business-2',
      name: 'Nexus Technologies',
      industry: 'Technology',
      size: '50-200 employees',
      revenue: 1800000,
      employees: 65,
      founded: '2018',
      location: 'San Francisco, CA'
    },
    metrics: {
      revenue: 1800000,
      growth: 12.8,
      efficiency: 82,
      health: 85
    },
    integrations: {
      connected: 4,
      total: 6,
      status: 'warning'
    },
    ai: {
      agents: 8,
      conversations: 1923,
      accuracy: 91.5,
      satisfaction: 4.6
    }
  },
  'demo-user': {
    business: {
      id: 'business-3',
      name: 'Nexus Technologies',
      industry: 'Technology',
      size: '50-200 employees',
      revenue: 1200000,
      employees: 45,
      founded: '2018',
      location: 'San Francisco, CA'
    },
    metrics: {
      revenue: 1200000,
      growth: 8.5,
      efficiency: 75,
      health: 78
    },
    integrations: {
      connected: 2,
      total: 4,
      status: 'error'
    },
    ai: {
      agents: 4,
      conversations: 847,
      accuracy: 88.3,
      satisfaction: 4.2
    }
  }
};

export const DEMO_MODE_CONFIG = {
  enabled: true,
  autoLogin: false,
  showDemoBanner: true,
  allowRealAuth: true,
  demoDataRefreshInterval: 30000, // 30 seconds
  demoSessionTimeout: 3600000, // 1 hour
};

export const DEMO_FEATURES = {
  dashboard: true,
  analytics: true,
  ai: true,
  integrations: true,
  billing: true,
  settings: true,
  onboarding: true
};

export const getDemoAccount = (email: string): DemoAccount | undefined => {
  return DEMO_ACCOUNTS.find(account => account.email === email);
};

export const getDemoData = (accountId: string): DemoData | null => {
  const account = DEMO_ACCOUNTS.find(acc => acc.id === accountId);
  const businessData = DEMO_BUSINESS_DATA[accountId as keyof typeof DEMO_BUSINESS_DATA];
  
  if (!account || !businessData) return null;
  
  return {
    user: account,
    ...businessData
  };
};

export const isDemoMode = (): boolean => {
  return DEMO_MODE_CONFIG.enabled;
};

/**
 * Check if demo mode should be available for the current user
 * This function can be used to conditionally disable demo features for authenticated users
 */
export const shouldShowDemoMode = (userEmail?: string | null): boolean => {
  // If demo mode is globally disabled, never show it
  if (!DEMO_MODE_CONFIG.enabled) {
    return false;
  }
  
  // If user is authenticated with a real account (non-demo), disable demo mode
  if (userEmail && !isDemoAccount(userEmail)) {
    return false;
  }
  
  return true;
};

export const isDemoAccount = (email: string): boolean => {
  return DEMO_ACCOUNTS.some(account => account.email === email);
}; 
