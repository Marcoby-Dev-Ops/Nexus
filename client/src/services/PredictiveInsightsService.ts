/**
 * Predictive Insights Service
 * 
 * Analyzes business patterns to provide predictive insights
 * and create wow moments through proactive recommendations.
 */

export interface PredictiveInsight {
  id: string;
  type: 'revenue' | 'efficiency' | 'risk' | 'opportunity' | 'customer';
  title: string;
  description: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  impact: {
    value: string;
    metric: string;
    direction: 'positive' | 'negative';
  };
  action: {
    label: string;
    description: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
  };
  data: {
    historical: any[];
    current: any;
    projected: any;
  };
}

export interface BusinessPattern {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  confidence: number;
  lastDetected: string;
  nextPrediction: string;
  impact: 'high' | 'medium' | 'low';
}

export class PredictiveInsightsService {
  private static instance: PredictiveInsightsService;
  private patterns: Map<string, BusinessPattern> = new Map();
  private insights: Map<string, PredictiveInsight> = new Map();

  private constructor() {
    this.initializePatterns();
  }

  public static getInstance(): PredictiveInsightsService {
    if (!PredictiveInsightsService.instance) {
      PredictiveInsightsService.instance = new PredictiveInsightsService();
    }
    return PredictiveInsightsService.instance;
  }

  /**
   * Initialize common business patterns
   */
  private initializePatterns(): void {
    const patterns: BusinessPattern[] = [
      {
        id: 'seasonal-revenue',
        name: 'Seasonal Revenue Patterns',
        description: 'Revenue fluctuations based on seasonal trends',
        frequency: 'monthly',
        confidence: 85,
        lastDetected: new Date().toISOString(),
        nextPrediction: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        impact: 'high'
      },
      {
        id: 'customer-churn',
        name: 'Customer Churn Patterns',
        description: 'Predictive indicators of customer churn',
        frequency: 'weekly',
        confidence: 78,
        lastDetected: new Date().toISOString(),
        nextPrediction: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        impact: 'high'
      },
      {
        id: 'conversion-optimization',
        name: 'Conversion Rate Optimization',
        description: 'Opportunities to improve conversion rates',
        frequency: 'daily',
        confidence: 92,
        lastDetected: new Date().toISOString(),
        nextPrediction: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        impact: 'medium'
      },
      {
        id: 'operational-efficiency',
        name: 'Operational Efficiency Trends',
        description: 'Patterns in operational efficiency and bottlenecks',
        frequency: 'weekly',
        confidence: 81,
        lastDetected: new Date().toISOString(),
        nextPrediction: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        impact: 'medium'
      }
    ];

    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  /**
   * Generate predictive insights based on business data
   */
  async generateInsights(businessData: any): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    try {
      // Revenue prediction
      if (businessData.revenue) {
        const revenueInsight = await this.analyzeRevenuePatterns(businessData.revenue);
        if (revenueInsight) insights.push(revenueInsight);
      }

      // Customer behavior prediction
      if (businessData.customers) {
        const customerInsight = await this.analyzeCustomerPatterns(businessData.customers);
        if (customerInsight) insights.push(customerInsight);
      }

      // Operational efficiency prediction
      if (businessData.operations) {
        const operationsInsight = await this.analyzeOperationsPatterns(businessData.operations);
        if (operationsInsight) insights.push(operationsInsight);
      }

      // Market opportunity prediction
      if (businessData.market) {
        const marketInsight = await this.analyzeMarketPatterns(businessData.market);
        if (marketInsight) insights.push(marketInsight);
      }

      // Risk prediction
      const riskInsight = await this.analyzeRiskPatterns(businessData);
      if (riskInsight) insights.push(riskInsight);

    } catch (error) {
      console.error('Error generating predictive insights:', error);
    }

    return insights;
  }

  /**
   * Analyze revenue patterns for predictions
   */
  private async analyzeRevenuePatterns(revenueData: any): Promise<PredictiveInsight | null> {
    const currentRevenue = revenueData.current || 0;
    const historicalRevenue = revenueData.historical || [];
    const growthRate = revenueData.growthRate || 0;

    if (historicalRevenue.length < 3) return null;

    // Calculate trend
    const recentTrend = this.calculateTrend(historicalRevenue.slice(-6));
    const projectedRevenue = currentRevenue * (1 + recentTrend);

    if (projectedRevenue > currentRevenue * 1.2) {
      return {
        id: 'revenue-growth-opportunity',
        type: 'revenue',
        title: '🚀 Revenue Growth Opportunity',
        description: `Based on current trends, your revenue is projected to grow ${((projectedRevenue / currentRevenue - 1) * 100).toFixed(1)}% in the next quarter`,
        prediction: `Revenue will reach $${projectedRevenue.toLocaleString()} in 90 days`,
        confidence: 87,
        timeframe: '90 days',
        impact: {
          value: `+$${(projectedRevenue - currentRevenue).toLocaleString()}`,
          metric: 'Revenue',
          direction: 'positive'
        },
        action: {
          label: 'Accelerate Growth',
          description: 'Implement growth strategies to exceed projections',
          priority: 'high'
        },
        data: {
          historical: historicalRevenue,
          current: currentRevenue,
          projected: projectedRevenue
        }
      };
    }

    return null;
  }

  /**
   * Analyze customer patterns for predictions
   */
  private async analyzeCustomerPatterns(customerData: any): Promise<PredictiveInsight | null> {
    const churnRate = customerData.churnRate || 0;
    const acquisitionRate = customerData.acquisitionRate || 0;
    const customerLifetimeValue = customerData.ltv || 0;

    if (churnRate > 0.05) {
      return {
        id: 'customer-churn-risk',
        type: 'customer',
        title: '⚠️ Customer Churn Risk',
        description: `Your churn rate of ${(churnRate * 100).toFixed(1)}% is above industry average. We predict ${Math.round(churnRate * customerData.totalCustomers)} customers will churn this month`,
        prediction: `Customer base will decrease by ${(churnRate * 100).toFixed(1)}% in 30 days`,
        confidence: 91,
        timeframe: '30 days',
        impact: {
          value: `-$${(churnRate * customerData.totalCustomers * customerLifetimeValue).toLocaleString()}`,
          metric: 'Revenue',
          direction: 'negative'
        },
        action: {
          label: 'Retention Campaign',
          description: 'Launch targeted retention campaigns to reduce churn',
          priority: 'immediate'
        },
        data: {
          historical: customerData.historical || [],
          current: { churnRate, acquisitionRate, ltv: customerLifetimeValue },
          projected: { churnRate: churnRate * 1.1 }
        }
      };
    }

    return null;
  }

  /**
   * Analyze operations patterns for predictions
   */
  private async analyzeOperationsPatterns(operationsData: any): Promise<PredictiveInsight | null> {
    const efficiency = operationsData.efficiency || 0;
    const bottlenecks = operationsData.bottlenecks || [];
    const automationOpportunities = operationsData.automationOpportunities || [];

    if (efficiency < 0.7 && automationOpportunities.length > 0) {
      return {
        id: 'efficiency-automation',
        type: 'efficiency',
        title: '⚡ Automation Opportunity',
        description: `Your operational efficiency is ${(efficiency * 100).toFixed(1)}%. We've identified ${automationOpportunities.length} processes that can be automated`,
        prediction: `Automation can improve efficiency to ${Math.min(0.95, efficiency + 0.2).toFixed(1)}%`,
        confidence: 89,
        timeframe: '60 days',
        impact: {
          value: `+${Math.round((0.2 * 40 * 4))} hours/week`,
          metric: 'Productivity',
          direction: 'positive'
        },
        action: {
          label: 'Implement Automation',
          description: 'Set up automated workflows for identified processes',
          priority: 'high'
        },
        data: {
          historical: operationsData.historical || [],
          current: { efficiency, bottlenecks },
          projected: { efficiency: Math.min(0.95, efficiency + 0.2) }
        }
      };
    }

    return null;
  }

  /**
   * Analyze market patterns for predictions
   */
  private async analyzeMarketPatterns(marketData: any): Promise<PredictiveInsight | null> {
    const marketGrowth = marketData.growth || 0;
    const marketShare = marketData.share || 0;
    const competitiveAdvantage = marketData.competitiveAdvantage || 0;

    if (marketGrowth > 0.15 && marketShare < 0.1) {
      return {
        id: 'market-expansion',
        type: 'opportunity',
        title: '📈 Market Expansion Ready',
        description: `Your market is growing ${(marketGrowth * 100).toFixed(1)}% annually, but you only have ${(marketShare * 100).toFixed(1)}% market share`,
        prediction: `You can capture ${Math.min(0.05, marketGrowth * 0.3).toFixed(1)}% additional market share in 6 months`,
        confidence: 83,
        timeframe: '6 months',
        impact: {
          value: `+$${(marketData.totalMarketSize * marketGrowth * 0.3).toLocaleString()}`,
          metric: 'Revenue',
          direction: 'positive'
        },
        action: {
          label: 'Scale Marketing',
          description: 'Increase marketing investment to capture market growth',
          priority: 'high'
        },
        data: {
          historical: marketData.historical || [],
          current: { growth: marketGrowth, share: marketShare },
          projected: { share: Math.min(0.15, marketShare + marketGrowth * 0.3) }
        }
      };
    }

    return null;
  }

  /**
   * Analyze risk patterns for predictions
   */
  private async analyzeRiskPatterns(businessData: any): Promise<PredictiveInsight | null> {
    const cashFlow = businessData.cashFlow || 0;
    const burnRate = businessData.burnRate || 0;
    const runway = businessData.runway || 0;

    if (runway < 6 && burnRate > 0) {
      return {
        id: 'cash-flow-risk',
        type: 'risk',
        title: '💸 Cash Flow Risk',
        description: `Your runway is ${runway} months. At current burn rate, you'll need additional funding in ${Math.ceil(runway)} months`,
        prediction: `Cash flow will become critical in ${Math.ceil(runway)} months`,
        confidence: 94,
        timeframe: `${Math.ceil(runway)} months`,
        impact: {
          value: `-$${(burnRate * runway * 1000000).toLocaleString()}`,
          metric: 'Cash Flow',
          direction: 'negative'
        },
        action: {
          label: 'Financial Planning',
          description: 'Develop funding strategy and optimize cash flow',
          priority: 'immediate'
        },
        data: {
          historical: businessData.financialHistory || [],
          current: { cashFlow, burnRate, runway },
          projected: { runway: Math.max(0, runway - 1) }
        }
      };
    }

    return null;
  }

  /**
   * Calculate trend from historical data
   */
  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = data.reduce((sum, _, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope / (sumY / n); // Normalize by average
  }

  /**
   * Get all detected patterns
   */
  getPatterns(): BusinessPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get insights by type
   */
  getInsightsByType(type: string): PredictiveInsight[] {
    return Array.from(this.insights.values()).filter(insight => insight.type === type);
  }

  /**
   * Get high-priority insights
   */
  getHighPriorityInsights(): PredictiveInsight[] {
    return Array.from(this.insights.values()).filter(insight => 
      insight.action.priority === 'immediate' || insight.action.priority === 'high'
    );
  }
}

export const predictiveInsightsService = PredictiveInsightsService.getInstance();
