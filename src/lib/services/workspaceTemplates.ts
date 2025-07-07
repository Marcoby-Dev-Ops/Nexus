import type { WorkspaceLayout, WorkspaceTemplate } from './workspaceComponentRegistry';

// Template definitions for different roles and use cases
export const WORKSPACE_TEMPLATES: Record<WorkspaceTemplate, WorkspaceLayout> = {
  'executive-dashboard': {
    id: 'template-executive-dashboard',
    name: 'Executive Dashboard',
    description: 'High-level business metrics and strategic insights for executives and leadership',
    author: 'Nexus Team',
    isPublic: true,
    tags: ['executive', 'leadership', 'strategy', 'metrics'],
    templateType: 'executive-dashboard',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    components: [
      {
        id: 'exec-business-metrics',
        componentId: 'business-metrics',
        position: { x: 0, y: 0 },
        size: { width: 8, height: 6 },
        config: {
          displayMode: 'executive',
          showTrends: true,
          timeframe: '90d'
        },
        visible: true
      },
      {
        id: 'exec-ai-performance',
        componentId: 'ai-performance',
        position: { x: 8, y: 0 },
        size: { width: 4, height: 3 },
        config: {
          showCosts: true,
          showROI: true,
          compact: true
        },
        visible: true
      },
      {
        id: 'exec-next-actions',
        componentId: 'next-best-action',
        position: { x: 8, y: 3 },
        size: { width: 4, height: 3 },
        config: {
          priority: 'high',
          executiveMode: true
        },
        visible: true
      },
      {
        id: 'exec-security-overview',
        componentId: 'security-dashboard',
        position: { x: 0, y: 6 },
        size: { width: 6, height: 4 },
        config: {
          summaryMode: true,
          alertsOnly: true
        },
        visible: true
      },
      {
        id: 'exec-team-communication',
        componentId: 'communication-dashboard',
        position: { x: 6, y: 6 },
        size: { width: 6, height: 4 },
        config: {
          executiveSummary: true,
          showTrends: true
        },
        visible: true
      },
      {
        id: 'exec-calendar',
        componentId: 'calendar-widget',
        position: { x: 0, y: 10 },
        size: { width: 6, height: 4 },
        config: {
          showOnlyMeetings: true,
          executiveView: true
        },
        visible: true
      },
      {
        id: 'exec-alerts',
        componentId: 'proactive-alerts',
        position: { x: 6, y: 10 },
        size: { width: 6, height: 4 },
        config: {
          criticalOnly: true,
          executiveFormat: true
        },
        visible: true
      }
    ],
    theme: {
      name: 'Executive',
      colors: {
        primary: '#1e40af',
        secondary: '#64748b',
        accent: '#0ea5e9',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1e293b'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '16px',
        lineHeight: '1.5'
      },
      spacing: {
        base: 16,
        scale: 1.2
      }
    }
  },

  'sales-workspace': {
    id: 'template-sales-workspace',
    name: 'Sales Workspace',
    description: 'CRM integration, pipeline management, and sales performance tracking',
    author: 'Nexus Team',
    isPublic: true,
    tags: ['sales', 'crm', 'pipeline', 'revenue'],
    templateType: 'sales-workspace',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    components: [
      {
        id: 'sales-tasks',
        componentId: 'tasks-widget',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 6 },
        config: {
          filterBy: 'sales',
          showPriority: true,
          autoRefresh: true
        },
        visible: true
      },
      {
        id: 'sales-calendar',
        componentId: 'calendar-widget',
        position: { x: 4, y: 0 },
        size: { width: 8, height: 6 },
        config: {
          showMeetings: true,
          showDeals: true,
          colorByPriority: true
        },
        visible: true
      },
      {
        id: 'sales-email',
        componentId: 'email-widget',
        position: { x: 0, y: 6 },
        size: { width: 6, height: 5 },
        config: {
          filterProspects: true,
          showFollowUps: true,
          quickReply: true
        },
        visible: true
      },
      {
        id: 'sales-metrics',
        componentId: 'business-metrics',
        position: { x: 6, y: 6 },
        size: { width: 6, height: 5 },
        config: {
          salesFocus: true,
          showPipeline: true,
          showConversion: true
        },
        visible: true
      },
      {
        id: 'sales-actions',
        componentId: 'quick-actions-widget',
        position: { x: 0, y: 11 },
        size: { width: 4, height: 3 },
        config: {
          salesActions: true,
          showCRM: true
        },
        visible: true
      },
      {
        id: 'sales-ai-insights',
        componentId: 'next-best-action',
        position: { x: 4, y: 11 },
        size: { width: 4, height: 3 },
        config: {
          salesFocus: true,
          showLeadScoring: true
        },
        visible: true
      },
      {
        id: 'sales-recent',
        componentId: 'recent-activity',
        position: { x: 8, y: 11 },
        size: { width: 4, height: 3 },
        config: {
          salesActivities: true,
          showDeals: true
        },
        visible: true
      }
    ],
    theme: {
      name: 'Sales',
      colors: {
        primary: '#059669',
        secondary: '#6b7280',
        accent: '#10b981',
        background: '#f0fdf4',
        surface: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '15px',
        lineHeight: '1.4'
      },
      spacing: {
        base: 14,
        scale: 1.1
      }
    }
  },

  'marketing-hub': {
    id: 'template-marketing-hub',
    name: 'Marketing Hub',
    description: 'Campaign management, analytics, and content creation tools',
    author: 'Nexus Team',
    isPublic: true,
    tags: ['marketing', 'campaigns', 'analytics', 'content'],
    templateType: 'marketing-hub',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    components: [
      {
        id: 'marketing-ideas',
        componentId: 'ideas-widget',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 6 },
        config: {
          marketingFocus: true,
          showCampaigns: true,
          categoryFilter: 'marketing'
        },
        visible: true
      },
      {
        id: 'marketing-metrics',
        componentId: 'business-metrics',
        position: { x: 4, y: 0 },
        size: { width: 8, height: 6 },
        config: {
          marketingMetrics: true,
          showROAS: true,
          showEngagement: true
        },
        visible: true
      },
      {
        id: 'marketing-communication',
        componentId: 'communication-dashboard',
        position: { x: 0, y: 6 },
        size: { width: 12, height: 5 },
        config: {
          marketingChannels: true,
          showSentiment: true,
          showReach: true
        },
        visible: true
      },
      {
        id: 'marketing-tasks',
        componentId: 'tasks-widget',
        position: { x: 0, y: 11 },
        size: { width: 4, height: 4 },
        config: {
          marketingTasks: true,
          showDeadlines: true,
          showCampaigns: true
        },
        visible: true
      },
      {
        id: 'marketing-calendar',
        componentId: 'calendar-widget',
        position: { x: 4, y: 11 },
        size: { width: 4, height: 4 },
        config: {
          marketingEvents: true,
          showLaunches: true,
          colorByCampaign: true
        },
        visible: true
      },
      {
        id: 'marketing-ai',
        componentId: 'ai-performance',
        position: { x: 8, y: 11 },
        size: { width: 4, height: 4 },
        config: {
          marketingAI: true,
          showContentGeneration: true,
          showOptimization: true
        },
        visible: true
      }
    ],
    theme: {
      name: 'Marketing',
      colors: {
        primary: '#7c3aed',
        secondary: '#6b7280',
        accent: '#a855f7',
        background: '#faf5ff',
        surface: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '15px',
        lineHeight: '1.4'
      },
      spacing: {
        base: 14,
        scale: 1.1
      }
    }
  },

  'developer-console': {
    id: 'template-developer-console',
    name: 'Developer Console',
    description: 'Development tools, system monitoring, and technical metrics',
    author: 'Nexus Team',
    isPublic: true,
    tags: ['development', 'monitoring', 'technical', 'devops'],
    templateType: 'developer-console',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    components: [
      {
        id: 'dev-security',
        componentId: 'security-dashboard',
        position: { x: 0, y: 0 },
        size: { width: 8, height: 6 },
        config: {
          developerMode: true,
          showVulnerabilities: true,
          showLogs: true
        },
        visible: true
      },
      {
        id: 'dev-ai-performance',
        componentId: 'ai-performance',
        position: { x: 8, y: 0 },
        size: { width: 4, height: 6 },
        config: {
          technicalMetrics: true,
          showLatency: true,
          showUsage: true
        },
        visible: true
      },
      {
        id: 'dev-tasks',
        componentId: 'tasks-widget',
        position: { x: 0, y: 6 },
        size: { width: 4, height: 5 },
        config: {
          developmentTasks: true,
          showSprints: true,
          showBugs: true
        },
        visible: true
      },
      {
        id: 'dev-metrics',
        componentId: 'business-metrics',
        position: { x: 4, y: 6 },
        size: { width: 8, height: 5 },
        config: {
          technicalMetrics: true,
          showPerformance: true,
          showUptime: true
        },
        visible: true
      },
      {
        id: 'dev-alerts',
        componentId: 'proactive-alerts',
        position: { x: 0, y: 11 },
        size: { width: 6, height: 4 },
        config: {
          technicalAlerts: true,
          showErrors: true,
          showPerformance: true
        },
        visible: true
      },
      {
        id: 'dev-actions',
        componentId: 'quick-actions-widget',
        position: { x: 6, y: 11 },
        size: { width: 6, height: 4 },
        config: {
          developerActions: true,
          showDeployment: true,
          showMonitoring: true
        },
        visible: true
      }
    ],
    theme: {
      name: 'Developer',
      colors: {
        primary: '#1f2937',
        secondary: '#6b7280',
        accent: '#3b82f6',
        background: '#f9fafb',
        surface: '#ffffff',
        text: '#111827'
      },
      typography: {
        fontFamily: 'JetBrains Mono',
        fontSize: '14px',
        lineHeight: '1.5'
      },
      spacing: {
        base: 12,
        scale: 1.0
      }
    }
  },

  'hr-dashboard': {
    id: 'template-hr-dashboard',
    name: 'HR Dashboard',
    description: 'Employee management, recruitment, and HR analytics',
    author: 'Nexus Team',
    isPublic: true,
    tags: ['hr', 'employees', 'recruitment', 'analytics'],
    templateType: 'hr-dashboard',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    components: [
      {
        id: 'hr-tasks',
        componentId: 'tasks-widget',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 6 },
        config: {
          hrTasks: true,
          showRecruitment: true,
          showOnboarding: true
        },
        visible: true
      },
      {
        id: 'hr-calendar',
        componentId: 'calendar-widget',
        position: { x: 4, y: 0 },
        size: { width: 8, height: 6 },
        config: {
          hrEvents: true,
          showInterviews: true,
          showReviews: true
        },
        visible: true
      },
      {
        id: 'hr-metrics',
        componentId: 'business-metrics',
        position: { x: 0, y: 6 },
        size: { width: 8, height: 5 },
        config: {
          hrMetrics: true,
          showTurnover: true,
          showSatisfaction: true
        },
        visible: true
      },
      {
        id: 'hr-communication',
        componentId: 'communication-dashboard',
        position: { x: 8, y: 6 },
        size: { width: 4, height: 5 },
        config: {
          hrChannels: true,
          showEngagement: true,
          showFeedback: true
        },
        visible: true
      },
      {
        id: 'hr-email',
        componentId: 'email-widget',
        position: { x: 0, y: 11 },
        size: { width: 6, height: 4 },
        config: {
          hrEmails: true,
          showApplications: true,
          showInternal: true
        },
        visible: true
      },
      {
        id: 'hr-actions',
        componentId: 'quick-actions-widget',
        position: { x: 6, y: 11 },
        size: { width: 6, height: 4 },
        config: {
          hrActions: true,
          showRecruitment: true,
          showEmployee: true
        },
        visible: true
      }
    ],
    theme: {
      name: 'HR',
      colors: {
        primary: '#dc2626',
        secondary: '#6b7280',
        accent: '#ef4444',
        background: '#fef2f2',
        surface: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '15px',
        lineHeight: '1.4'
      },
      spacing: {
        base: 14,
        scale: 1.1
      }
    }
  },

  'finance-center': {
    id: 'template-finance-center',
    name: 'Finance Center',
    description: 'Financial analytics, budget tracking, and accounting tools',
    author: 'Nexus Team',
    isPublic: true,
    tags: ['finance', 'accounting', 'budget', 'analytics'],
    templateType: 'finance-center',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    components: [
      {
        id: 'finance-metrics',
        componentId: 'business-metrics',
        position: { x: 0, y: 0 },
        size: { width: 8, height: 6 },
        config: {
          financeMetrics: true,
          showRevenue: true,
          showExpenses: true,
          showProfit: true
        },
        visible: true
      },
      {
        id: 'finance-ai',
        componentId: 'ai-performance',
        position: { x: 8, y: 0 },
        size: { width: 4, height: 6 },
        config: {
          financialAI: true,
          showCosts: true,
          showROI: true,
          showBudget: true
        },
        visible: true
      },
      {
        id: 'finance-tasks',
        componentId: 'tasks-widget',
        position: { x: 0, y: 6 },
        size: { width: 4, height: 5 },
        config: {
          financeTasks: true,
          showBilling: true,
          showReports: true
        },
        visible: true
      },
      {
        id: 'finance-alerts',
        componentId: 'proactive-alerts',
        position: { x: 4, y: 6 },
        size: { width: 4, height: 5 },
        config: {
          financeAlerts: true,
          showBudget: true,
          showCashFlow: true
        },
        visible: true
      },
      {
        id: 'finance-actions',
        componentId: 'next-best-action',
        position: { x: 8, y: 6 },
        size: { width: 4, height: 5 },
        config: {
          financeActions: true,
          showOptimization: true,
          showForecasting: true
        },
        visible: true
      },
      {
        id: 'finance-calendar',
        componentId: 'calendar-widget',
        position: { x: 0, y: 11 },
        size: { width: 6, height: 4 },
        config: {
          financeEvents: true,
          showDeadlines: true,
          showReporting: true
        },
        visible: true
      },
      {
        id: 'finance-recent',
        componentId: 'recent-activity',
        position: { x: 6, y: 11 },
        size: { width: 6, height: 4 },
        config: {
          financeActivities: true,
          showTransactions: true,
          showReports: true
        },
        visible: true
      }
    ],
    theme: {
      name: 'Finance',
      colors: {
        primary: '#0891b2',
        secondary: '#6b7280',
        accent: '#06b6d4',
        background: '#f0f9ff',
        surface: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '15px',
        lineHeight: '1.4'
      },
      spacing: {
        base: 14,
        scale: 1.1
      }
    }
  },

  'operations-control': {
    id: 'template-operations-control',
    name: 'Operations Control',
    description: 'Process management, workflow optimization, and operational metrics',
    author: 'Nexus Team',
    isPublic: true,
    tags: ['operations', 'processes', 'workflow', 'efficiency'],
    templateType: 'operations-control',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    components: [
      {
        id: 'ops-tasks',
        componentId: 'tasks-widget',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 6 },
        config: {
          operationsTasks: true,
          showProcesses: true,
          showWorkflows: true
        },
        visible: true
      },
      {
        id: 'ops-metrics',
        componentId: 'business-metrics',
        position: { x: 4, y: 0 },
        size: { width: 8, height: 6 },
        config: {
          operationsMetrics: true,
          showEfficiency: true,
          showThroughput: true
        },
        visible: true
      },
      {
        id: 'ops-alerts',
        componentId: 'proactive-alerts',
        position: { x: 0, y: 6 },
        size: { width: 6, height: 5 },
        config: {
          operationsAlerts: true,
          showBottlenecks: true,
          showDowntime: true
        },
        visible: true
      },
      {
        id: 'ops-ai',
        componentId: 'ai-performance',
        position: { x: 6, y: 6 },
        size: { width: 6, height: 5 },
        config: {
          operationsAI: true,
          showAutomation: true,
          showOptimization: true
        },
        visible: true
      },
      {
        id: 'ops-actions',
        componentId: 'quick-actions-widget',
        position: { x: 0, y: 11 },
        size: { width: 4, height: 4 },
        config: {
          operationsActions: true,
          showWorkflows: true,
          showProcesses: true
        },
        visible: true
      },
      {
        id: 'ops-communication',
        componentId: 'communication-dashboard',
        position: { x: 4, y: 11 },
        size: { width: 8, height: 4 },
        config: {
          operationsChannels: true,
          showTeamComm: true,
          showUpdates: true
        },
        visible: true
      }
    ],
    theme: {
      name: 'Operations',
      colors: {
        primary: '#ea580c',
        secondary: '#6b7280',
        accent: '#f97316',
        background: '#fff7ed',
        surface: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '15px',
        lineHeight: '1.4'
      },
      spacing: {
        base: 14,
        scale: 1.1
      }
    }
  },

  'customer-success': {
    id: 'template-customer-success',
    name: 'Customer Success',
    description: 'Customer support, satisfaction tracking, and success metrics',
    author: 'Nexus Team',
    isPublic: true,
    tags: ['customer', 'support', 'success', 'satisfaction'],
    templateType: 'customer-success',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    components: [
      {
        id: 'cs-email',
        componentId: 'email-widget',
        position: { x: 0, y: 0 },
        size: { width: 6, height: 6 },
        config: {
          customerEmails: true,
          showSupport: true,
          showTickets: true
        },
        visible: true
      },
      {
        id: 'cs-tasks',
        componentId: 'tasks-widget',
        position: { x: 6, y: 0 },
        size: { width: 6, height: 6 },
        config: {
          customerTasks: true,
          showFollowUps: true,
          showResolution: true
        },
        visible: true
      },
      {
        id: 'cs-metrics',
        componentId: 'business-metrics',
        position: { x: 0, y: 6 },
        size: { width: 8, height: 5 },
        config: {
          customerMetrics: true,
          showSatisfaction: true,
          showRetention: true
        },
        visible: true
      },
      {
        id: 'cs-ai',
        componentId: 'next-best-action',
        position: { x: 8, y: 6 },
        size: { width: 4, height: 5 },
        config: {
          customerSuccess: true,
          showRecommendations: true,
          showRisk: true
        },
        visible: true
      },
      {
        id: 'cs-communication',
        componentId: 'communication-dashboard',
        position: { x: 0, y: 11 },
        size: { width: 8, height: 4 },
        config: {
          customerChannels: true,
          showSentiment: true,
          showFeedback: true
        },
        visible: true
      },
      {
        id: 'cs-actions',
        componentId: 'quick-actions-widget',
        position: { x: 8, y: 11 },
        size: { width: 4, height: 4 },
        config: {
          customerActions: true,
          showSupport: true,
          showOutreach: true
        },
        visible: true
      }
    ],
    theme: {
      name: 'Customer Success',
      colors: {
        primary: '#16a34a',
        secondary: '#6b7280',
        accent: '#22c55e',
        background: '#f0fdf4',
        surface: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '15px',
        lineHeight: '1.4'
      },
      spacing: {
        base: 14,
        scale: 1.1
      }
    }
  },

  'blank': {
    id: 'template-blank',
    name: 'Blank Canvas',
    description: 'Start from scratch and build your own custom workspace',
    author: 'Nexus Team',
    isPublic: true,
    tags: ['blank', 'custom', 'flexible'],
    templateType: 'blank',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    components: [],
    theme: {
      name: 'Default',
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#8b5cf6',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '14px',
        lineHeight: '1.5'
      },
      spacing: {
        base: 16,
        scale: 1.0
      }
    }
  }
};

// Template utilities
export const getTemplatesByRole = (role: string): WorkspaceTemplate[] => {
  const roleTemplateMap: Record<string, WorkspaceTemplate[]> = {
    'executive': ['executive-dashboard', 'finance-center'],
    'ceo': ['executive-dashboard', 'finance-center'],
    'cto': ['developer-console', 'operations-control'],
    'cmo': ['marketing-hub', 'customer-success'],
    'cfo': ['finance-center', 'executive-dashboard'],
    'sales': ['sales-workspace', 'customer-success'],
    'marketing': ['marketing-hub', 'customer-success'],
    'developer': ['developer-console', 'operations-control'],
    'hr': ['hr-dashboard', 'operations-control'],
    'finance': ['finance-center', 'operations-control'],
    'operations': ['operations-control', 'developer-console'],
    'support': ['customer-success', 'operations-control'],
    'manager': ['executive-dashboard', 'operations-control']
  };

  return roleTemplateMap[role.toLowerCase()] || ['blank'];
};

export const getTemplatesByDepartment = (department: string): WorkspaceTemplate[] => {
  const deptTemplateMap: Record<string, WorkspaceTemplate[]> = {
    'sales': ['sales-workspace', 'customer-success'],
    'marketing': ['marketing-hub', 'customer-success'],
    'engineering': ['developer-console', 'operations-control'],
    'product': ['developer-console', 'customer-success'],
    'finance': ['finance-center', 'executive-dashboard'],
    'hr': ['hr-dashboard', 'operations-control'],
    'operations': ['operations-control', 'executive-dashboard'],
    'support': ['customer-success', 'operations-control'],
    'executive': ['executive-dashboard', 'finance-center']
  };

  return deptTemplateMap[department.toLowerCase()] || ['blank'];
};

export const getTemplateRecommendations = (userProfile: {
  role?: string;
  department?: string;
  experience?: string;
  goals?: string[];
}): { template: WorkspaceTemplate; score: number; reason: string }[] => {
  const recommendations: { template: WorkspaceTemplate; score: number; reason: string }[] = [];

  // Role-based recommendations
  if (userProfile.role) {
    const roleTemplates = getTemplatesByRole(userProfile.role);
    roleTemplates.forEach(template => {
      recommendations.push({
        template,
        score: 90,
        reason: `Perfect match for ${userProfile.role} role`
      });
    });
  }

  // Department-based recommendations
  if (userProfile.department) {
    const deptTemplates = getTemplatesByDepartment(userProfile.department);
    deptTemplates.forEach(template => {
      const existing = recommendations.find(r => r.template === template);
      if (existing) {
        existing.score += 10;
        existing.reason += ` and ${userProfile.department} department`;
      } else {
        recommendations.push({
          template,
          score: 80,
          reason: `Great fit for ${userProfile.department} department`
        });
      }
    });
  }

  // Experience-based adjustments
  if (userProfile.experience === 'beginner') {
    recommendations.forEach(rec => {
      if (rec.template === 'blank') {
        rec.score -= 30;
        rec.reason += ' (simplified for beginners)';
      }
    });
  } else if (userProfile.experience === 'expert') {
    recommendations.push({
      template: 'blank',
      score: 70,
      reason: 'Full customization for expert users'
    });
  }

  // Goals-based recommendations
  if (userProfile.goals) {
    userProfile.goals.forEach(goal => {
      switch (goal.toLowerCase()) {
        case 'analytics':
          recommendations.push({
            template: 'executive-dashboard',
            score: 85,
            reason: 'Excellent for analytics and insights'
          });
          break;
        case 'productivity':
          recommendations.push({
            template: 'operations-control',
            score: 85,
            reason: 'Optimized for productivity and efficiency'
          });
          break;
        case 'collaboration':
          recommendations.push({
            template: 'customer-success',
            score: 80,
            reason: 'Great for team collaboration'
          });
          break;
      }
    });
  }

  // Remove duplicates and sort by score
  const uniqueRecommendations = recommendations.reduce((acc, curr) => {
    const existing = acc.find(r => r.template === curr.template);
    if (existing) {
      existing.score = Math.max(existing.score, curr.score);
    } else {
      acc.push(curr);
    }
    return acc;
  }, [] as typeof recommendations);

  return uniqueRecommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 recommendations
};

export default WORKSPACE_TEMPLATES; 