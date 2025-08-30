/**
 * departmentConfigs.ts
 * Configuration data for unified department pages
 * Updated to follow project standards and use helper functions
 * 
 * Pillar: 1 (Efficient Automation) - Centralized department configuration
 */

import { Activity, Package, Settings, Users, TrendingUp, Target, Handshake, UserPlus, FileText, Plus, Wrench, CreditCard, Receipt, Calculator, Monitor, Shield, Code, Heart, Scale, Briefcase } from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { callEdgeFunction } from '@/lib/api-client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DepartmentConfig {
  title: string;
  subtitle: string;
  kpis: Array<{ title: string; value: string | number; delta?: string }>;
  quickActions: Array<{ 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    onClick: () => Promise<void> | void;
  }>;
  charts: {
    primary: { title: string; description: string; data: Array<{ name: string; value: number }> };
    secondary: { title: string; description: string; data: Array<{ name: string; value: number }> };
  };
  activities: Array<{ description: string; status: string; time: string; type: string }>;
  businessInsights?: {
    crossDepartmentalImpact: string[];
    keyBusinessDrivers: string[];
    commonChallenges: string[];
    bestPractices: string[];
    aiRecommendations: string[];
  };
  educationalContent?: {
    whatThisMeans: string;
    whyItMatters: string;
    howToImprove: string[];
    industryBenchmarks: string;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Log department action with context
 */
const logDepartmentAction = async (department: string, action: string, details?: any): Promise<void> => {
  try {
          await callEdgeFunction('log_department_action', {
      department,
      action,
      details,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    logger.error('Failed to log department action', { department, action, error });
  }
};

/**
 * Create a quick action handler with logging
 */
const createQuickAction = (department: string, action: string) => {
  return async (): Promise<void> => {
    try {
      logger.info(`Department action: ${action}`, { department });
      await logDepartmentAction(department, action);
    } catch (error) {
      logger.error(`Failed to execute department action: ${action}`, { department, error });
    }
  };
};

// ============================================================================
// DEPARTMENT CONFIGURATIONS
// ============================================================================

// ===== OPERATIONS CONFIGURATION =====
export const operationsConfig: DepartmentConfig = {
  title: "Operations Center",
  subtitle: "Streamline workflows, manage inventory, and optimize business processes",
  kpis: [
    { title: 'Active Workflows', value: '48', delta: '+12.5%' },
    { title: 'Inventory Items', value: '1,284', delta: '+8.3%' },
    { title: 'Process Efficiency', value: '94.2%', delta: '+5.2%' },
    { title: 'Team Productivity', value: '87.5%', delta: '+3.1%' },
  ],
  quickActions: [
    { label: 'New Workflow', icon: Activity, onClick: createQuickAction('operations', 'new_workflow') },
    { label: 'Check Inventory', icon: Package, onClick: createQuickAction('operations', 'check_inventory') },
    { label: 'Process Report', icon: FileText, onClick: createQuickAction('operations', 'process_report') },
    { label: 'Maintenance', icon: Wrench, onClick: createQuickAction('operations', 'maintenance') },
  ],
  charts: {
    primary: {
      title: "Active Workflows",
      description: "Current workflow distribution",
      data: [
        { name: 'Order Processing', value: 32 },
        { name: 'Inventory Management', value: 28 },
        { name: 'Quality Control', value: 18 },
        { name: 'Shipping', value: 15 },
        { name: 'Returns', value: 8 },
      ]
    },
    secondary: {
      title: "Team Productivity",
      description: "Monthly productivity trends",
      data: [
        { name: 'Jan', value: 85 },
        { name: 'Feb', value: 82 },
        { name: 'Mar', value: 88 },
        { name: 'Apr', value: 90 },
        { name: 'May', value: 86 },
        { name: 'Jun', value: 94 },
      ]
    }
  },
  activities: [
    { description: 'Workflow: Order Processing Updated', status: 'Completed', time: '2 hours ago', type: 'workflow' },
    { description: 'Inventory: Low Stock Alert - Widget A', status: 'Pending', time: '4 hours ago', type: 'inventory' },
    { description: 'Process: Quality Check Completed', status: 'Completed', time: '6 hours ago', type: 'process' },
    { description: 'Team: Training Session Scheduled', status: 'Scheduled', time: '1 day ago', type: 'team' },
  ],
  businessInsights: {
    crossDepartmentalImpact: ['Sales', 'Finance'],
    keyBusinessDrivers: ['Workflow Automation', 'Inventory Accuracy'],
    commonChallenges: ['Bottlenecks', 'Manual Errors'],
    bestPractices: [
      'Automate routine tasks to reduce errors',
      'Schedule regular inventory audits',
      'Monitor workflow KPIs weekly'
    ],
    aiRecommendations: [
      'Optimize workflow steps for efficiency',
      'Predict inventory shortages using trends',
      'Flag bottlenecks for process review'
    ]
  },
  educationalContent: {
    whatThisMeans: 'Operations efficiency is high, with strong productivity and low error rates.',
    whyItMatters: 'Efficient operations reduce costs and improve customer satisfaction.',
    howToImprove: [
      'Use the Workflow Playbook to standardize processes',
      'Leverage automation tools for repetitive tasks',
      'Review the Inventory Guide for best practices'
    ],
    industryBenchmarks: 'Top quartile operations teams achieve >95% process efficiency and <2% error rate.'
  }
};

// ===== SALES CONFIGURATION =====
export const salesConfig: DepartmentConfig = {
  title: "Sales Dashboard",
  subtitle: "Track deals, manage pipelines, and analyze sales performance",
  kpis: [
    { title: 'Monthly Revenue', value: '$124,580', delta: '+12.5%' },
    { title: 'Active Deals', value: '32', delta: '+8.3%' },
    { title: 'Pipeline Value', value: '$456,200', delta: '+15.2%' },
    { title: 'Conversion Rate', value: '24.8%', delta: '+2.1%' },
  ],
  quickActions: [
    { label: 'New Deal', icon: Handshake, onClick: createQuickAction('sales', 'new_deal') },
    { label: 'Add Contact', icon: UserPlus, onClick: createQuickAction('sales', 'add_contact') },
    { label: 'Create Proposal', icon: FileText, onClick: createQuickAction('sales', 'create_proposal') },
    { label: 'Schedule Follow-up', icon: Plus, onClick: createQuickAction('sales', 'schedule_followup') },
  ],
  charts: {
    primary: {
      title: "Revenue Trend",
      description: "Monthly sales performance",
      data: [
        { name: 'Jan', value: 65000 },
        { name: 'Feb', value: 59000 },
        { name: 'Mar', value: 80000 },
        { name: 'Apr', value: 81000 },
        { name: 'May', value: 56000 },
        { name: 'Jun', value: 124580 },
      ]
    },
    secondary: {
      title: "Sales Pipeline",
      description: "Active deals by stage",
      data: [
        { name: 'Prospects', value: 45 },
        { name: 'Qualified', value: 32 },
        { name: 'Proposal', value: 18 },
        { name: 'Negotiation', value: 12 },
        { name: 'Closed Won', value: 8 },
      ]
    }
  },
  activities: [
    { description: 'Deal: Acme Corp - $45,000', status: 'Completed', time: '2 hours ago', type: 'deal' },
    { description: 'Contact: Follow-up with TechStart Inc', status: 'Pending', time: '4 hours ago', type: 'contact' },
    { description: 'Proposal: Global Solutions submitted', status: 'Completed', time: '6 hours ago', type: 'deal' },
    { description: 'Meeting: Innovation Labs scheduled', status: 'Scheduled', time: '1 day ago', type: 'contact' },
  ],
  businessInsights: {
    crossDepartmentalImpact: ['Marketing', 'Finance'],
    keyBusinessDrivers: ['Lead Quality', 'Pipeline Velocity'],
    commonChallenges: ['Long sales cycles', 'Low conversion rates'],
    bestPractices: [
      'Qualify leads early and often',
      'Automate follow-ups for stalled deals',
      'Review pipeline weekly with the team'
    ],
    aiRecommendations: [
      'Prioritize high-value leads for outreach this week',
      'Follow up with 3 deals in negotiation stage',
      'Consider offering a limited-time discount to close deals faster'
    ]
  },
  educationalContent: {
    whatThisMeans: 'Sales performance is trending upward this quarter. Strong conversion rates and pipeline value indicate healthy growth.',
    whyItMatters: 'Consistent sales growth drives revenue and enables business expansion.',
    howToImprove: [
      'Use the Sales Playbook to standardize outreach',
      'Leverage CRM automation for follow-ups',
      'Review the Product Info section for new features to pitch'
    ],
    industryBenchmarks: 'Average B2B conversion rate: 21%. Top performers achieve 30%+.'
  }
};

// ===== FINANCE CONFIGURATION =====
export const financeConfig: DepartmentConfig = {
  title: "Finance Hub",
  subtitle: "Manage invoices, expenses, and financial reports with automated reconciliation",
  kpis: [
    { title: 'Monthly Revenue', value: '$124,580', delta: '+12.5%' },
    { title: 'Outstanding Invoices', value: '8', delta: '-15.3%' },
    { title: 'Monthly Expenses', value: '$73,420', delta: '+5.2%' },
    { title: 'Profit Margin', value: '41.2%', delta: '+3.1%' },
  ],
  quickActions: [
    { label: 'New Invoice', icon: Receipt, onClick: createQuickAction('finance', 'new_invoice') },
    { label: 'Record Expense', icon: CreditCard, onClick: createQuickAction('finance', 'record_expense') },
    { label: 'Generate Report', icon: FileText, onClick: createQuickAction('finance', 'generate_report') },
    { label: 'Calculate Tax', icon: Calculator, onClick: createQuickAction('finance', 'calculate_tax') },
  ],
  charts: {
    primary: {
      title: "Revenue Trend",
      description: "Monthly revenue performance",
      data: [
        { name: 'Jan', value: 65000 },
        { name: 'Feb', value: 59000 },
        { name: 'Mar', value: 80000 },
        { name: 'Apr', value: 81000 },
        { name: 'May', value: 56000 },
        { name: 'Jun', value: 124580 },
      ]
    },
    secondary: {
      title: "Expense Breakdown",
      description: "Monthly expense categories",
      data: [
        { name: 'Salaries', value: 45000 },
        { name: 'Marketing', value: 12000 },
        { name: 'Operations', value: 8500 },
        { name: 'Software', value: 5200 },
        { name: 'Office', value: 3200 },
      ]
    }
  },
  activities: [
    { description: 'Invoice: INV-2024-001 sent to Acme Corp', status: 'Completed', time: '2 hours ago', type: 'invoice' },
    { description: 'Expense: Office supplies $234.50', status: 'Pending', time: '4 hours ago', type: 'expense' },
    { description: 'Payment: TechStart Inc - $32,000 received', status: 'Completed', time: '6 hours ago', type: 'invoice' },
    { description: 'Report: Monthly P&L generated', status: 'Scheduled', time: '1 day ago', type: 'expense' },
  ],
  businessInsights: {
    crossDepartmentalImpact: ['Sales', 'Operations'],
    keyBusinessDrivers: ['Revenue Growth', 'Expense Control'],
    commonChallenges: ['Late payments', 'Budget overruns'],
    bestPractices: [
      'Automate invoicing and reminders',
      'Review expenses weekly',
      'Reconcile accounts at month-end'
    ],
    aiRecommendations: [
      'Flag overdue invoices for follow-up',
      'Suggest cost-saving measures for high expense categories',
      'Recommend early payment discounts to clients'
    ]
  },
  educationalContent: {
    whatThisMeans: 'Finance health is stable with positive cash flow and improving margins.',
    whyItMatters: 'Strong financial management enables strategic investments and business growth.',
    howToImprove: [
      'Use the Invoice Playbook to standardize billing',
      'Automate expense tracking with integrated tools',
      'Review the Tax Guide for compliance tips'
    ],
    industryBenchmarks: 'Median DSO (days sales outstanding): 45 days. Top quartile: <30 days.'
  }
};

// ===== SUPPORT CONFIGURATION =====
export const supportConfig: DepartmentConfig = {
  title: "Support Center",
  subtitle: "Manage customer tickets, knowledge base, and team performance",
  kpis: [
    { title: 'Open Tickets', value: '23', delta: '-18.5%' },
    { title: 'Avg Response Time', value: '2.4h', delta: '-25.3%' },
    { title: 'Customer Satisfaction', value: '94.8%', delta: '+5.2%' },
    { title: 'Resolution Rate', value: '87.5%', delta: '+3.1%' },
  ],
  quickActions: [
    { label: 'New Ticket', icon: Plus, onClick: createQuickAction('support', 'new_ticket') },
    { label: 'Knowledge Base', icon: FileText, onClick: createQuickAction('support', 'knowledge_base') },
    { label: 'Team Status', icon: Users, onClick: createQuickAction('support', 'team_status') },
    { label: 'Escalate Issue', icon: TrendingUp, onClick: createQuickAction('support', 'escalate_issue') },
  ],
  charts: {
    primary: {
      title: "Ticket Volume",
      description: "Daily ticket creation trends",
      data: [
        { name: 'Mon', value: 12 },
        { name: 'Tue', value: 8 },
        { name: 'Wed', value: 15 },
        { name: 'Thu', value: 11 },
        { name: 'Fri', value: 9 },
        { name: 'Sat', value: 4 },
      ]
    },
    secondary: {
      title: "Resolution Time",
      description: "Average resolution time by category",
      data: [
        { name: 'Technical', value: 4.2 },
        { name: 'Billing', value: 2.1 },
        { name: 'General', value: 1.8 },
        { name: 'Bug Report', value: 6.5 },
        { name: 'Feature Request', value: 8.3 },
      ]
    }
  },
  activities: [
    { description: 'Ticket #1234: Login issue resolved', status: 'Completed', time: '2 hours ago', type: 'team' },
    { description: 'Escalation: Payment processing bug', status: 'Pending', time: '4 hours ago', type: 'team' },
    { description: 'Knowledge Base: Updated FAQ section', status: 'Completed', time: '6 hours ago', type: 'team' },
    { description: 'Training: New agent onboarding', status: 'Scheduled', time: '1 day ago', type: 'team' },
  ]
};

// ===== MARKETING CONFIGURATION =====
export const marketingConfig: DepartmentConfig = {
  title: "Marketing Hub",
  subtitle: "Campaign management, analytics, and lead generation",
  kpis: [
    { title: 'Campaign ROI', value: '342%', delta: '+28.5%' },
    { title: 'Lead Generation', value: '156', delta: '+15.3%' },
    { title: 'Conversion Rate', value: '12.8%', delta: '+5.2%' },
    { title: 'Email Open Rate', value: '24.5%', delta: '+3.1%' },
  ],
  quickActions: [
    { label: 'New Campaign', icon: Plus, onClick: createQuickAction('marketing', 'new_campaign') },
    { label: 'Email Blast', icon: FileText, onClick: createQuickAction('marketing', 'email_blast') },
    { label: 'Analytics Report', icon: TrendingUp, onClick: createQuickAction('marketing', 'analytics_report') },
    { label: 'Lead Import', icon: Users, onClick: createQuickAction('marketing', 'lead_import') },
  ],
  charts: {
    primary: {
      title: "Campaign Performance",
      description: "Monthly campaign ROI trends",
      data: [
        { name: 'Jan', value: 280 },
        { name: 'Feb', value: 310 },
        { name: 'Mar', value: 295 },
        { name: 'Apr', value: 330 },
        { name: 'May', value: 315 },
        { name: 'Jun', value: 342 },
      ]
    },
    secondary: {
      title: "Lead Sources",
      description: "Lead generation by channel",
      data: [
        { name: 'Organic Search', value: 45 },
        { name: 'Social Media', value: 32 },
        { name: 'Email Campaign', value: 28 },
        { name: 'Paid Ads', value: 35 },
        { name: 'Referrals', value: 16 },
      ]
    }
  },
  activities: [
    { description: 'Campaign: Summer Sale launched', status: 'Completed', time: '2 hours ago', type: 'team' },
    { description: 'Email: Newsletter scheduled for tomorrow', status: 'Pending', time: '4 hours ago', type: 'team' },
    { description: 'Analytics: Q2 report generated', status: 'Completed', time: '6 hours ago', type: 'team' },
    { description: 'Social: LinkedIn post scheduled', status: 'Scheduled', time: '1 day ago', type: 'team' },
  ]
};

// ===== MATURITY CONFIGURATION =====
export const maturityConfig: DepartmentConfig = {
  title: "Maturity Assessment",
  subtitle: "Business maturity tracking and improvement recommendations",
  kpis: [
    { title: 'Overall Maturity', value: '73%', delta: '+8.5%' },
    { title: 'Process Automation', value: '68%', delta: '+12.3%' },
    { title: 'Data Quality', value: '81%', delta: '+5.2%' },
    { title: 'Team Efficiency', value: '76%', delta: '+6.1%' },
  ],
  quickActions: [
    { label: 'Run Assessment', icon: Target, onClick: createQuickAction('maturity', 'run_assessment') },
    { label: 'View Recommendations', icon: FileText, onClick: createQuickAction('maturity', 'view_recommendations') },
    { label: 'Progress Report', icon: TrendingUp, onClick: createQuickAction('maturity', 'progress_report') },
    { label: 'Benchmark Analysis', icon: Settings, onClick: createQuickAction('maturity', 'benchmark_analysis') },
  ],
  charts: {
    primary: {
      title: "Maturity Trends",
      description: "Monthly maturity score progression",
      data: [
        { name: 'Jan', value: 65 },
        { name: 'Feb', value: 67 },
        { name: 'Mar', value: 69 },
        { name: 'Apr', value: 71 },
        { name: 'May', value: 72 },
        { name: 'Jun', value: 73 },
      ]
    },
    secondary: {
      title: "Category Scores",
      description: "Maturity scores by business area",
      data: [
        { name: 'Operations', value: 78 },
        { name: 'Technology', value: 82 },
        { name: 'People', value: 71 },
        { name: 'Strategy', value: 69 },
        { name: 'Culture', value: 74 },
      ]
    }
  },
  activities: [
    { description: 'Assessment: Operations maturity updated', status: 'Completed', time: '2 hours ago', type: 'process' },
    { description: 'Recommendation: Implement workflow automation', status: 'Pending', time: '4 hours ago', type: 'process' },
    { description: 'Report: Q2 maturity report generated', status: 'Completed', time: '6 hours ago', type: 'process' },
    { description: 'Benchmark: Industry comparison scheduled', status: 'Scheduled', time: '1 day ago', type: 'process' },
  ]
};

// ===== HUMAN RESOURCES CONFIGURATION =====
export const hrConfig: DepartmentConfig = {
  title: "Human Resources",
  subtitle: "Employee management, recruitment, and organizational development",
  kpis: [
    { title: 'Employee Count', value: '47', delta: '+15.2%' },
    { title: 'Employee Satisfaction', value: '4.2/5', delta: '+0.3' },
    { title: 'Time to Hire', value: '18 days', delta: '-5 days' },
    { title: 'Retention Rate', value: '94.5%', delta: '+2.1%' },
  ],
  quickActions: [
    { label: 'New Employee', icon: UserPlus, onClick: createQuickAction('hr', 'new_employee') },
    { label: 'Post Job', icon: Briefcase, onClick: createQuickAction('hr', 'post_job') },
    { label: 'Performance Review', icon: Target, onClick: createQuickAction('hr', 'performance_review') },
    { label: 'Training Plan', icon: FileText, onClick: createQuickAction('hr', 'training_plan') },
  ],
  charts: {
    primary: {
      title: "Headcount Growth",
      description: "Monthly employee growth",
      data: [
        { name: 'Jan', value: 38 },
        { name: 'Feb', value: 40 },
        { name: 'Mar', value: 42 },
        { name: 'Apr', value: 44 },
        { name: 'May', value: 45 },
        { name: 'Jun', value: 47 },
      ]
    },
    secondary: {
      title: "Department Distribution",
      description: "Employees by department",
      data: [
        { name: 'Engineering', value: 18 },
        { name: 'Sales', value: 12 },
        { name: 'Marketing', value: 8 },
        { name: 'Operations', value: 6 },
        { name: 'Other', value: 3 },
      ]
    }
  },
  activities: [
    { description: 'Onboarding: 3 new developers started', status: 'Completed', time: '2 hours ago', type: 'team' },
    { description: 'Interview: Senior Sales Manager candidate', status: 'Scheduled', time: '4 hours ago', type: 'team' },
    { description: 'Review: Q2 performance reviews completed', status: 'Completed', time: '1 day ago', type: 'team' },
    { description: 'Training: Leadership development program', status: 'Pending', time: '2 days ago', type: 'team' },
  ]
};

// ===== INFORMATION TECHNOLOGY CONFIGURATION =====
export const itConfig: DepartmentConfig = {
  title: "Information Technology",
  subtitle: "Infrastructure management, security, and technical support",
  kpis: [
    { title: 'System Uptime', value: '99.8%', delta: '+0.2%' },
    { title: 'Security Score', value: '94/100', delta: '+3' },
    { title: 'Avg Resolution Time', value: '2.1h', delta: '-0.5h' },
    { title: 'User Satisfaction', value: '4.6/5', delta: '+0.1' },
  ],
  quickActions: [
    { label: 'System Monitor', icon: Monitor, onClick: createQuickAction('it', 'system_monitor') },
    { label: 'Security Scan', icon: Shield, onClick: createQuickAction('it', 'security_scan') },
    { label: 'User Support', icon: Users, onClick: createQuickAction('it', 'user_support') },
    { label: 'Infrastructure', icon: Settings, onClick: createQuickAction('it', 'infrastructure') },
  ],
  charts: {
    primary: {
      title: "System Performance",
      description: "Daily system uptime and performance",
      data: [
        { name: 'Mon', value: 99.9 },
        { name: 'Tue', value: 99.7 },
        { name: 'Wed', value: 99.8 },
        { name: 'Thu', value: 99.9 },
        { name: 'Fri', value: 99.8 },
        { name: 'Sat', value: 99.9 },
      ]
    },
    secondary: {
      title: "Support Tickets",
      description: "IT support ticket categories",
      data: [
        { name: 'Password Reset', value: 25 },
        { name: 'Software Issues', value: 18 },
        { name: 'Hardware', value: 12 },
        { name: 'Network', value: 8 },
        { name: 'Security', value: 5 },
      ]
    }
  },
  activities: [
    { description: 'Security: Monthly vulnerability scan completed', status: 'Completed', time: '2 hours ago', type: 'team' },
    { description: 'Infrastructure: Server maintenance scheduled', status: 'Scheduled', time: '4 hours ago', type: 'team' },
    { description: 'Support: Password reset for 5 users', status: 'Completed', time: '6 hours ago', type: 'team' },
    { description: 'Backup: Weekly backup verification', status: 'Completed', time: '1 day ago', type: 'team' },
  ]
};

// ===== PRODUCT/ENGINEERING CONFIGURATION =====
export const productConfig: DepartmentConfig = {
  title: "Product & Engineering",
  subtitle: "Product development, feature planning, and technical innovation",
  kpis: [
    { title: 'Sprint Velocity', value: '42 pts', delta: '+8 pts' },
    { title: 'Code Quality', value: '94%', delta: '+2%' },
    { title: 'Feature Delivery', value: '87%', delta: '+5%' },
    { title: 'Bug Resolution', value: '1.8 days', delta: '-0.3 days' },
  ],
  quickActions: [
    { label: 'New Feature', icon: Plus, onClick: createQuickAction('product', 'new_feature') },
    { label: 'Code Review', icon: Code, onClick: createQuickAction('product', 'code_review') },
    { label: 'Sprint Plan', icon: Target, onClick: createQuickAction('product', 'sprint_plan') },
    { label: 'Release Notes', icon: FileText, onClick: createQuickAction('product', 'release_notes') },
  ],
  charts: {
    primary: {
      title: "Development Velocity",
      description: "Sprint points completed over time",
      data: [
        { name: 'Sprint 1', value: 32 },
        { name: 'Sprint 2', value: 38 },
        { name: 'Sprint 3', value: 35 },
        { name: 'Sprint 4', value: 41 },
        { name: 'Sprint 5', value: 39 },
        { name: 'Sprint 6', value: 42 },
      ]
    },
    secondary: {
      title: "Feature Categories",
      description: "Development effort by feature type",
      data: [
        { name: 'New Features', value: 45 },
        { name: 'Bug Fixes', value: 25 },
        { name: 'Improvements', value: 20 },
        { name: 'Tech Debt', value: 10 },
      ]
    }
  },
  activities: [
    { description: 'Feature: User dashboard v2.0 deployed', status: 'Completed', time: '2 hours ago', type: 'team' },
    { description: 'Bug: Critical payment issue fixed', status: 'Completed', time: '4 hours ago', type: 'team' },
    { description: 'Sprint: Planning for next sprint', status: 'Scheduled', time: '6 hours ago', type: 'team' },
    { description: 'Review: Code review for API endpoints', status: 'Pending', time: '1 day ago', type: 'team' },
  ]
};

// ===== CUSTOMER SUCCESS CONFIGURATION =====
export const customerSuccessConfig: DepartmentConfig = {
  title: "Customer Success",
  subtitle: "Customer retention, expansion, and satisfaction management",
  kpis: [
    { title: 'Customer Health', value: '8.4/10', delta: '+0.3' },
    { title: 'Churn Rate', value: '2.1%', delta: '-0.5%' },
    { title: 'NPS Score', value: '67', delta: '+5' },
    { title: 'Expansion Revenue', value: '$45,200', delta: '+18%' },
  ],
  quickActions: [
    { label: 'Health Check', icon: Heart, onClick: createQuickAction('customer_success', 'health_check') },
    { label: 'Customer Meeting', icon: Users, onClick: createQuickAction('customer_success', 'customer_meeting') },
    { label: 'Success Plan', icon: Target, onClick: createQuickAction('customer_success', 'success_plan') },
    { label: 'Feedback Survey', icon: FileText, onClick: createQuickAction('customer_success', 'feedback_survey') },
  ],
  charts: {
    primary: {
      title: "Customer Health Trends",
      description: "Monthly customer health score",
      data: [
        { name: 'Jan', value: 7.8 },
        { name: 'Feb', value: 8.0 },
        { name: 'Mar', value: 8.1 },
        { name: 'Apr', value: 8.2 },
        { name: 'May', value: 8.3 },
        { name: 'Jun', value: 8.4 },
      ]
    },
    secondary: {
      title: "Churn Analysis",
      description: "Churn rate by customer segment",
      data: [
        { name: 'Enterprise', value: 1.2 },
        { name: 'Mid-Market', value: 2.8 },
        { name: 'SMB', value: 3.5 },
        { name: 'Startup', value: 4.1 },
      ]
    }
  },
  activities: [
    { description: 'Success: Quarterly business review with Acme Corp', status: 'Completed', time: '2 hours ago', type: 'team' },
    { description: 'Risk: Identified churn risk for TechStart Inc', status: 'Pending', time: '4 hours ago', type: 'team' },
    { description: 'Expansion: Upsell opportunity with Global Solutions', status: 'Scheduled', time: '6 hours ago', type: 'team' },
    { description: 'Survey: NPS survey sent to 50 customers', status: 'Completed', time: '1 day ago', type: 'team' },
  ]
};

// ===== LEGAL/COMPLIANCE CONFIGURATION =====
export const legalConfig: DepartmentConfig = {
  title: "Legal & Compliance",
  subtitle: "Contract management, regulatory compliance, and risk mitigation",
  kpis: [
    { title: 'Contract Turnaround', value: '5.2 days', delta: '-1.3 days' },
    { title: 'Compliance Score', value: '98%', delta: '+2%' },
    { title: 'Active Contracts', value: '142', delta: '+8' },
    { title: 'Risk Assessment', value: 'Low', delta: 'Stable' },
  ],
  quickActions: [
    { label: 'New Contract', icon: FileText, onClick: createQuickAction('legal', 'new_contract') },
    { label: 'Compliance Check', icon: Shield, onClick: createQuickAction('legal', 'compliance_check') },
    { label: 'Risk Review', icon: Scale, onClick: createQuickAction('legal', 'risk_review') },
    { label: 'Legal Research', icon: Settings, onClick: createQuickAction('legal', 'legal_research') },
  ],
  charts: {
    primary: {
      title: "Contract Pipeline",
      description: "Monthly contract processing",
      data: [
        { name: 'Jan', value: 18 },
        { name: 'Feb', value: 22 },
        { name: 'Mar', value: 20 },
        { name: 'Apr', value: 25 },
        { name: 'May', value: 28 },
        { name: 'Jun', value: 24 },
      ]
    },
    secondary: {
      title: "Compliance Areas",
      description: "Compliance status by area",
      data: [
        { name: 'Data Privacy', value: 98 },
        { name: 'Financial', value: 97 },
        { name: 'Employment', value: 99 },
        { name: 'IP Protection', value: 96 },
        { name: 'Regulatory', value: 98 },
      ]
    }
  },
  activities: [
    { description: 'Contract: MSA with Enterprise Client executed', status: 'Completed', time: '2 hours ago', type: 'team' },
    { description: 'Compliance: GDPR audit scheduled', status: 'Scheduled', time: '4 hours ago', type: 'team' },
    { description: 'Risk: IP protection review completed', status: 'Completed', time: '6 hours ago', type: 'team' },
    { description: 'Research: New regulation impact assessment', status: 'Pending', time: '1 day ago', type: 'team' },
  ]
};

// ============================================================================
// EXPORT ALL CONFIGURATIONS
// ============================================================================

export const departmentConfigs = {
  operations: operationsConfig,
  sales: salesConfig,
  finance: financeConfig,
  support: supportConfig,
  marketing: marketingConfig,
  maturity: maturityConfig,
  hr: hrConfig,
  it: itConfig,
  product: productConfig,
  customerSuccess: customerSuccessConfig,
  legal: legalConfig,
} as const;

export type DepartmentType = keyof typeof departmentConfigs; 
