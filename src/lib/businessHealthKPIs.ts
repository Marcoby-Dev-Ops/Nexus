/**
 * Business Health KPIs
 * Comprehensive set of Key Performance Indicators used to calculate business health scores
 */

export interface KPI {
  id: string;
  name: string;
  description: string;
  category: string;
  question: string;
  weight: number; // Out of 10
  dataType: 'number' | 'percentage' | 'currency' | 'boolean' | 'selection';
  options?: string[]; // For selection type
  thresholds?: {
    poor: number;
    fair: number;
    good: number;
    excellent: number;
  };
  unit?: string; // e.g., "$", "%", "days", etc.
  actionTask?: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  weight: number; // Relative importance in overall score
  color: string; // For UI visualization
  icon: string; // Icon name from lucide-react
}

// Define the categories
export const healthCategories: CategoryDefinition[] = [
  {
    id: 'sales',
    name: 'Sales',
    description: 'Measures your sales performance, lead generation, and conversion effectiveness',
    weight: 1.0,
    color: 'blue',
    icon: 'DollarSign'
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Evaluates your financial health, cash flow, and profitability',
    weight: 1.0,
    color: 'green',
    icon: 'BarChart'
  },
  {
    id: 'support',
    name: 'Support',
    description: 'Tracks customer support efficiency, resolution times, and satisfaction',
    weight: 0.8,
    color: 'purple',
    icon: 'LifeBuoy'
  },
  {
    id: 'maturity',
    name: 'Maturity',
    description: 'Assesses organizational structure, documentation, and process standardization',
    weight: 0.7,
    color: 'amber',
    icon: 'Gauge'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Measures marketing effectiveness, reach, and conversion',
    weight: 0.9,
    color: 'pink',
    icon: 'Megaphone'
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Evaluates operational efficiency, automation, and resource utilization',
    weight: 0.8,
    color: 'cyan',
    icon: 'Settings'
  }
];

// Define all KPIs by category
export const businessHealthKPIs: KPI[] = [
  // Sales KPIs
  {
    id: 'mrr_arr',
    name: 'Monthly Recurring Revenue (MRR)',
    description: 'The predictable revenue generated from subscriptions or recurring services each month',
    category: 'sales',
    question: 'What is your current monthly recurring revenue?',
    weight: 10,
    dataType: 'currency',
    unit: '$',
    thresholds: {
      poor: 5000,
      fair: 10000,
      good: 25000,
      excellent: 50000
    }
  },
  {
    id: 'new_leads',
    name: 'New Leads per Month',
    description: 'The number of new potential customers added to your sales pipeline monthly',
    category: 'sales',
    question: 'How many new leads have you added in the past 30 days?',
    weight: 8,
    dataType: 'number',
    thresholds: {
      poor: 10,
      fair: 25,
      good: 50,
      excellent: 100
    }
  },
  {
    id: 'conversion_rate',
    name: 'Lead-to-Customer Conversion Rate',
    description: 'The percentage of leads that convert to paying customers',
    category: 'sales',
    question: 'Of all leads last month, what % converted to customers?',
    weight: 9,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 5,
      fair: 10,
      good: 20,
      excellent: 30
    }
  },
  {
    id: 'pipeline_value',
    name: 'Sales Pipeline Value',
    description: 'The total potential revenue in your current sales pipeline',
    category: 'sales',
    question: 'What is the total value of all deals in your current sales pipeline?',
    weight: 7,
    dataType: 'currency',
    unit: '$',
    thresholds: {
      poor: 10000,
      fair: 50000,
      good: 100000,
      excellent: 250000
    }
  },
  {
    id: 'cac',
    name: 'Customer Acquisition Cost (CAC)',
    description: 'The average cost to acquire a new customer',
    category: 'sales',
    question: 'What is your average cost to acquire a new customer?',
    weight: 8,
    dataType: 'currency',
    unit: '$',
    thresholds: {
      poor: 1000,
      fair: 500,
      good: 250,
      excellent: 100
    }
  },
  
  // Finance KPIs
  {
    id: 'working_capital',
    name: 'Working Capital',
    description: 'Current assets minus current liabilities, indicating short-term financial health',
    category: 'finance',
    question: 'What is your current working capital (current assets - current liabilities)?',
    weight: 9,
    dataType: 'currency',
    unit: '$',
    thresholds: {
      poor: 10000,
      fair: 50000,
      good: 100000,
      excellent: 250000
    },
    actionTask: 'Upload your latest balance sheet'
  },
  {
    id: 'monthly_expenses',
    name: 'Monthly Operating Expenses',
    description: 'Total monthly costs to run your business',
    category: 'finance',
    question: 'What are your average monthly expenses?',
    weight: 8,
    dataType: 'currency',
    unit: '$',
    thresholds: {
      poor: 50000,
      fair: 30000,
      good: 20000,
      excellent: 10000
    }
  },
  {
    id: 'profit_margin',
    name: 'Profit Margin',
    description: 'Net profit as a percentage of revenue',
    category: 'finance',
    question: 'What was your net profit margin last month?',
    weight: 10,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 5,
      fair: 10,
      good: 20,
      excellent: 30
    }
  },
  {
    id: 'cash_runway',
    name: 'Cash Runway',
    description: 'How many months you can operate without new revenue',
    category: 'finance',
    question: 'Based on current spend, how many months can you operate without new revenue?',
    weight: 9,
    dataType: 'number',
    unit: 'months',
    thresholds: {
      poor: 3,
      fair: 6,
      good: 12,
      excellent: 18
    }
  },
  {
    id: 'ar_aging',
    name: 'Accounts Receivable Aging',
    description: 'Percentage of overdue invoices',
    category: 'finance',
    question: 'What % of invoices are 30/60/90 days overdue?',
    weight: 7,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 30,
      fair: 20,
      good: 10,
      excellent: 5
    }
  },
  
  // Support KPIs
  {
    id: 'first_contact_resolution',
    name: 'First Contact Resolution Rate',
    description: 'Percentage of support issues resolved on first contact',
    category: 'support',
    question: 'What % of support requests are resolved on the first contact?',
    weight: 9,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 50,
      fair: 65,
      good: 80,
      excellent: 90
    }
  },
  {
    id: 'time_to_resolution',
    name: 'Average Time to Resolution',
    description: 'Average time taken to resolve customer support tickets',
    category: 'support',
    question: 'What is your average time to resolve a support ticket?',
    weight: 8,
    dataType: 'number',
    unit: 'hours',
    thresholds: {
      poor: 48,
      fair: 24,
      good: 8,
      excellent: 4
    }
  },
  {
    id: 'csat',
    name: 'Customer Satisfaction Score (CSAT)',
    description: 'Average satisfaction rating from customers',
    category: 'support',
    question: 'What is your average customer satisfaction score?',
    weight: 10,
    dataType: 'number',
    unit: 'out of 10',
    thresholds: {
      poor: 6,
      fair: 7,
      good: 8,
      excellent: 9
    }
  },
  {
    id: 'ticket_volume',
    name: 'Support Ticket Volume',
    description: 'Number of support tickets opened monthly',
    category: 'support',
    question: 'How many support tickets were opened last month?',
    weight: 7,
    dataType: 'number',
    thresholds: {
      poor: 500,
      fair: 300,
      good: 200,
      excellent: 100
    }
  },
  {
    id: 'nps',
    name: 'Net Promoter Score (NPS)',
    description: 'Measure of customer loyalty and likelihood to recommend',
    category: 'support',
    question: 'What is your latest Net Promoter Score?',
    weight: 9,
    dataType: 'number',
    unit: 'score',
    thresholds: {
      poor: 20,
      fair: 40,
      good: 60,
      excellent: 80
    }
  },
  
  // Maturity KPIs
  {
    id: 'employee_headcount',
    name: 'Employee Headcount',
    description: 'Number of full-time employees',
    category: 'maturity',
    question: 'How many full-time employees do you have?',
    weight: 7,
    dataType: 'number',
    thresholds: {
      poor: 5,
      fair: 10,
      good: 25,
      excellent: 50
    }
  },
  {
    id: 'sop_coverage',
    name: 'SOP Coverage',
    description: 'Extent of documented standard operating procedures',
    category: 'maturity',
    question: 'Do you have documented SOPs for key business processes?',
    weight: 8,
    dataType: 'selection',
    options: ['None', 'Few', 'Most', 'All'],
    actionTask: 'Upload your SOP documentation or mark key processes with existing SOPs'
  },
  {
    id: 'key_employee_tenure',
    name: 'Key Employee Tenure',
    description: 'Average tenure of management team',
    category: 'maturity',
    question: 'What is the average tenure (in years) of your management team?',
    weight: 6,
    dataType: 'number',
    unit: 'years',
    thresholds: {
      poor: 1,
      fair: 2,
      good: 3,
      excellent: 5
    }
  },
  {
    id: 'strategic_planning',
    name: 'Strategic Planning Frequency',
    description: 'How often the business strategy is reviewed and updated',
    category: 'maturity',
    question: 'How often do you review or update your business strategy?',
    weight: 8,
    dataType: 'selection',
    options: ['Never', 'Annually', 'Quarterly', 'Monthly']
  },
  {
    id: 'compliance_status',
    name: 'Compliance Status',
    description: 'Compliance with relevant industry regulations',
    category: 'maturity',
    question: 'Are you compliant with relevant industry regulations?',
    weight: 9,
    dataType: 'boolean',
    actionTask: 'Complete the compliance checklist'
  },
  {
    id: 'professional_email_domain',
    name: 'Professional Email Domain',
    description: 'Using custom business domain for email communications',
    category: 'maturity',
    question: 'Do you use a custom business domain for your email (e.g., you@yourcompany.com)?',
    weight: 7,
    dataType: 'boolean',
    actionTask: 'Set up professional email with Microsoft 365 Business'
  },
  
  // Marketing KPIs
  {
    id: 'website_visitors',
    name: 'Monthly Website Visitors',
    description: 'Number of unique visitors to your website each month',
    category: 'marketing',
    question: 'How many unique visitors did your website receive last month?',
    weight: 8,
    dataType: 'number',
    thresholds: {
      poor: 1000,
      fair: 5000,
      good: 15000,
      excellent: 50000
    },
    actionTask: 'Connect Google Analytics for real-time marketing data'
  },
  {
    id: 'mqls',
    name: 'Marketing Qualified Leads (MQLs)',
    description: 'Number of leads that meet marketing qualification criteria',
    category: 'marketing',
    question: 'How many new MQLs were created in the past 30 days?',
    weight: 9,
    dataType: 'number',
    thresholds: {
      poor: 10,
      fair: 25,
      good: 50,
      excellent: 100
    }
  },
  {
    id: 'email_open_rate',
    name: 'Email Open Rate',
    description: 'Percentage of recipients who open marketing emails',
    category: 'marketing',
    question: 'What is your average marketing email open rate?',
    weight: 7,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 10,
      fair: 15,
      good: 25,
      excellent: 35
    }
  },
  {
    id: 'social_engagement',
    name: 'Social Media Engagement Rate',
    description: 'Average engagement with social media content',
    category: 'marketing',
    question: 'What is your average engagement rate on social channels?',
    weight: 6,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 1,
      fair: 2,
      good: 3,
      excellent: 5
    }
  },
  {
    id: 'campaign_roi',
    name: 'Marketing Campaign ROI',
    description: 'Return on investment from marketing campaigns',
    category: 'marketing',
    question: 'What was the ROI of your last major marketing campaign?',
    weight: 8,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 100,
      fair: 200,
      good: 300,
      excellent: 500
    }
  },
  
  // Operations KPIs
  {
    id: 'asset_utilization',
    name: 'Asset Utilization Rate',
    description: 'Percentage of business assets actively in use',
    category: 'operations',
    question: 'What % of your key business assets are actively in use?',
    weight: 7,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 50,
      fair: 65,
      good: 80,
      excellent: 90
    }
  },
  {
    id: 'service_uptime',
    name: 'Service Uptime',
    description: 'Percentage of time services/systems are operational',
    category: 'operations',
    question: 'What was your average service/system uptime last month?',
    weight: 9,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 95,
      fair: 97.5,
      good: 99,
      excellent: 99.9
    }
  },
  {
    id: 'automation_coverage',
    name: 'Process Automation Coverage',
    description: 'Percentage of routine operations that are automated',
    category: 'operations',
    question: 'What % of routine operations are automated?',
    weight: 8,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 20,
      fair: 40,
      good: 60,
      excellent: 80
    },
    actionTask: 'Identify manual processes that could be automated'
  },
  {
    id: 'on_time_completion',
    name: 'On-Time Project Completion',
    description: 'Percentage of projects completed on schedule',
    category: 'operations',
    question: 'What % of projects/tasks were completed on time last month?',
    weight: 8,
    dataType: 'percentage',
    unit: '%',
    thresholds: {
      poor: 60,
      fair: 75,
      good: 85,
      excellent: 95
    }
  },
  {
    id: 'vendor_performance',
    name: 'Vendor/Supplier Performance',
    description: 'Quality rating of vendor and supplier relationships',
    category: 'operations',
    question: 'How would you rate your vendor/supplier performance?',
    weight: 6,
    dataType: 'selection',
    options: ['Poor', 'Fair', 'Good', 'Excellent']
  }
];

/**
 * Helper function to get KPIs by category
 */
export function getKPIsByCategory(categoryId: string): KPI[] {
  return businessHealthKPIs.filter(kpi => kpi.category === categoryId);
}

/**
 * Helper function to get a category by ID
 */
export function getCategoryById(categoryId: string): CategoryDefinition | undefined {
  return healthCategories.find(category => category.id === categoryId);
}

/**
 * Calculate a score (0-100) for a KPI based on its value
 */
export function calculateKPIScore(kpi: KPI, value: number | string | boolean): number {
  if (kpi.dataType === 'boolean') {
    return value ? 100 : 0;
  }
  
  if (kpi.dataType === 'selection') {
    const options = kpi.options || [];
    const index = options.indexOf(value as string);
    return index >= 0 ? (index / (options.length - 1)) * 100 : 0;
  }
  
  // For number, percentage, and currency
  if (kpi.thresholds) {
    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
    if (isNaN(numValue)) return 0;
    
    const { poor, fair, good, excellent } = kpi.thresholds;
    
    // Handle inverse metrics (where lower is better)
    const isInverse = poor > excellent;
    
    if (isInverse) {
      if (numValue <= excellent) return 100;
      if (numValue <= good) return 80;
      if (numValue <= fair) return 60;
      if (numValue <= poor) return 40;
      return 20;
    } else {
      // Regular metrics (higher is better)
      if (numValue >= excellent) return 100;
      if (numValue >= good) return 80;
      if (numValue >= fair) return 60;
      if (numValue >= poor) return 40;
      return 20;
    }
  }
  
  return 0;
}

/**
 * Calculate overall category score based on KPI values
 */
export function calculateCategoryScore(
  categoryId: string, 
  kpiValues: Record<string, number | string | boolean>
): number {
  const categoryKPIs = getKPIsByCategory(categoryId);
  if (categoryKPIs.length === 0) return 0;
  
  let totalScore = 0;
  let totalWeight = 0;
  
  categoryKPIs.forEach(kpi => {
    if (kpiValues[kpi.id] !== undefined) {
      const score = calculateKPIScore(kpi, kpiValues[kpi.id]);
      totalScore += score * kpi.weight;
      totalWeight += kpi.weight;
    }
  });
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Calculate overall business health score
 */
export function calculateOverallHealthScore(
  kpiValues: Record<string, number | string | boolean>
): {
  overallScore: number;
  categoryScores: Record<string, number>;
} {
  const categoryScores: Record<string, number> = {};
  let weightedTotalScore = 0;
  let totalWeight = 0;
  
  healthCategories.forEach(category => {
    const score = calculateCategoryScore(category.id, kpiValues);
    categoryScores[category.id] = score;
    
    weightedTotalScore += score * category.weight;
    totalWeight += category.weight;
  });
  
  const overallScore = totalWeight > 0 ? Math.round(weightedTotalScore / totalWeight) : 0;
  
  return {
    overallScore,
    categoryScores
  };
} 