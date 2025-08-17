import { callRPC, callEdgeFunction, selectData, selectOne, insertOne, updateOne } from '@/lib/api-client';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// CORE TYPES & INTERFACES
// ============================================================================

export interface MaturityDomain {
  id: string;
  name: string;
  description: string;
  subDimensions: MaturitySubDimension[];
  weight: number; // 0-1, relative importance
  bestPracticeMetrics: BestPracticeMetric[];
}

export interface MaturitySubDimension {
  id: string;
  name: string;
  description: string;
  questions: MaturityQuestion[];
  weight: number; // 0-1 within domain
}

export interface MaturityQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'scale' | 'boolean' | 'integration_check';
  options?: string[];
  scaleRange?: { min: number; max: number; labels: string[] };
  integrationCheck?: {
    source: string;
    metric: string;
    threshold: number;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  };
  weight: number; // 0-1 within sub-dimension
}

export interface BestPracticeMetric {
  id: string;
  name: string;
  description: string;
  target: number;
  unit: string;
  source: string; // e.g., "industry_benchmark", "iso_9001", "lean_startup"
}

export interface MaturityScore {
  domainId: string;
  domainName: string;
  score: number; // 0-5
  level: MaturityLevel;
  percentile: number; // 0-100, compared to similar companies
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
  subDimensionScores: SubDimensionScore[];
  recommendations: MaturityRecommendation[];
}

export interface SubDimensionScore {
  id: string;
  name: string;
  score: number;
  level: MaturityLevel;
  insights: string[];
}

export type MaturityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface MaturityLevelDefinition {
  level: MaturityLevel;
  name: string;
  description: string;
  executiveInterpretation: string;
  characteristics: string[];
}

export interface MaturityRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  domain: string;
  title: string;
  context: string;
  action: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedTime: string;
  nexusModule: string;
  automationTemplate?: string;
  successMetrics: string[];
  relatedRecommendations: string[];
}

export interface MaturityProfile {
  userId: string;
  companyId: string;
  overallScore: number;
  overallLevel: MaturityLevel;
  domainScores: MaturityScore[];
  recommendations: MaturityRecommendation[];
  lastAssessment: string;
  nextAssessment: string;
  improvementHistory: ImprovementEvent[];
  benchmarkData: BenchmarkData;
}

export interface ImprovementEvent {
  id: string;
  date: string;
  type: 'level_up' | 'recommendation_completed' | 'integration_added' | 'metric_improvement';
  domain: string;
  description: string;
  impact: string;
  scoreChange: number;
}

export interface BenchmarkData {
  companySize: string;
  industry: string;
  region: string;
  peerGroup: string;
  percentileRankings: Record<string, number>;
  topPerformers: TopPerformer[];
}

export interface TopPerformer {
  domain: string;
  averageScore: number;
  bestPractices: string[];
  commonTraits: string[];
}

// ============================================================================
// MATURITY FRAMEWORK SERVICE
// ============================================================================

export class MaturityFrameworkService extends BaseService {
  private readonly tableName = 'maturity_assessments';
  private readonly recommendationsTable = 'maturity_recommendations';
  private readonly improvementsTable = 'maturity_improvements';

  // ============================================================================
  // DOMAIN DEFINITIONS (Based on Nexus Maturity Framework v1)
  // ============================================================================

  private readonly maturityDomains: MaturityDomain[] = [
    {
      id: 'sales',
      name: 'Sales',
      description: 'Lead management, pipeline health, win rate, and forecast accuracy',
      weight: 0.25,
      subDimensions: [
        {
          id: 'lead-management',
          name: 'Lead Management',
          description: 'How effectively you capture, qualify, and nurture leads',
          weight: 0.3,
          questions: [
            {
              id: 'lead-capture-rate',
              text: 'What percentage of website visitors become leads?',
              type: 'scale',
              scaleRange: { min: 0, max: 100, labels: ['0%', '25%', '50%', '75%', '100%'] },
              weight: 0.4
            },
            {
              id: 'lead-qualification',
              text: 'Do you have a standardized lead qualification process?',
              type: 'boolean',
              weight: 0.3
            },
            {
              id: 'lead-nurturing',
              text: 'How automated is your lead nurturing process?',
              type: 'multiple_choice',
              options: ['Manual', 'Partially automated', 'Fully automated', 'AI-powered'],
              weight: 0.3
            }
          ]
        },
        {
          id: 'pipeline-health',
          name: 'Pipeline Health',
          description: 'Pipeline velocity, deal aging, and conversion rates',
          weight: 0.4,
          questions: [
            {
              id: 'stale-deals',
              text: 'What percentage of deals are stale (>30 days without activity)?',
              type: 'integration_check',
              integrationCheck: {
                source: 'crm',
                metric: 'stale_deals_percentage',
                threshold: 10,
                operator: 'lt'
              },
              weight: 0.5
            },
            {
              id: 'win-rate',
              text: 'What is your current win rate?',
              type: 'integration_check',
              integrationCheck: {
                source: 'crm',
                metric: 'win_rate',
                threshold: 30,
                operator: 'gte'
              },
              weight: 0.5
            }
          ]
        },
        {
          id: 'forecast-accuracy',
          name: 'Forecast Accuracy',
          description: 'How accurate are your sales forecasts?',
          weight: 0.3,
          questions: [
            {
              id: 'forecast-variance',
              text: 'What is your average forecast variance?',
              type: 'scale',
              scaleRange: { min: 0, max: 50, labels: ['0%', '10%', '20%', '30%', '50%+'] },
              weight: 1.0
            }
          ]
        }
      ],
      bestPracticeMetrics: [
        {
          id: 'win-rate-target',
          name: 'Win Rate',
          description: 'Percentage of deals that close successfully',
          target: 30,
          unit: '%',
          source: 'industry_benchmark'
        },
        {
          id: 'stale-deals-target',
          name: 'Stale Deals',
          description: 'Percentage of deals without recent activity',
          target: 10,
          unit: '%',
          source: 'industry_benchmark'
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Campaign tracking, lead source attribution, and ROI visibility',
      weight: 0.2,
      subDimensions: [
        {
          id: 'campaign-tracking',
          name: 'Campaign Tracking',
          description: 'How well you track campaign performance and attribution',
          weight: 0.4,
          questions: [
            {
              id: 'campaign-attribution',
              text: 'Can you track which campaigns generate which leads?',
              type: 'boolean',
              weight: 0.5
            },
            {
              id: 'roi-tracking',
              text: 'Do you track ROI for all marketing campaigns?',
              type: 'boolean',
              weight: 0.5
            }
          ]
        },
        {
          id: 'content-effectiveness',
          name: 'Content Effectiveness',
          description: 'Content performance and optimization',
          weight: 0.3,
          questions: [
            {
              id: 'content-analytics',
              text: 'Do you analyze content performance and optimize based on data?',
              type: 'boolean',
              weight: 1.0
            }
          ]
        },
        {
          id: 'lead-generation',
          name: 'Lead Generation',
          description: 'Lead generation strategies and effectiveness',
          weight: 0.3,
          questions: [
            {
              id: 'lead-sources',
              text: 'How many different lead generation channels do you use?',
              type: 'scale',
              scaleRange: { min: 1, max: 10, labels: ['1', '3', '5', '7', '10+'] },
              weight: 1.0
            }
          ]
        }
      ],
      bestPracticeMetrics: [
        {
          id: 'campaign-roi',
          name: 'Campaign ROI',
          description: 'Average return on marketing investment',
          target: 500,
          unit: '%',
          source: 'industry_benchmark'
        }
      ]
    },
    {
      id: 'operations',
      name: 'Operations',
      description: 'Process standardization, workflow automation, and quality control',
      weight: 0.2,
      subDimensions: [
        {
          id: 'process-standardization',
          name: 'Process Standardization',
          description: 'How well your core processes are documented and standardized',
          weight: 0.4,
          questions: [
            {
              id: 'process-documentation',
              text: 'Are your core business processes documented?',
              type: 'boolean',
              weight: 0.5
            },
            {
              id: 'process-compliance',
              text: 'What percentage of team members follow documented processes?',
              type: 'scale',
              scaleRange: { min: 0, max: 100, labels: ['0%', '25%', '50%', '75%', '100%'] },
              weight: 0.5
            }
          ]
        },
        {
          id: 'workflow-automation',
          name: 'Workflow Automation',
          description: 'Automation of repetitive tasks and workflows',
          weight: 0.3,
          questions: [
            {
              id: 'automation-level',
              text: 'What percentage of repetitive tasks are automated?',
              type: 'scale',
              scaleRange: { min: 0, max: 100, labels: ['0%', '25%', '50%', '75%', '100%'] },
              weight: 1.0
            }
          ]
        },
        {
          id: 'quality-control',
          name: 'Quality Control',
          description: 'Quality assurance and control measures',
          weight: 0.3,
          questions: [
            {
              id: 'quality-metrics',
              text: 'Do you track quality metrics for your core processes?',
              type: 'boolean',
              weight: 1.0
            }
          ]
        }
      ],
      bestPracticeMetrics: [
        {
          id: 'process-efficiency',
          name: 'Process Efficiency',
          description: 'Time saved through process optimization',
          target: 30,
          unit: '%',
          source: 'lean_startup'
        }
      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      description: 'Cashflow predictability, expense control, and reporting cadence',
      weight: 0.15,
      subDimensions: [
        {
          id: 'cashflow-management',
          name: 'Cashflow Management',
          description: 'Cashflow tracking and predictability',
          weight: 0.4,
          questions: [
            {
              id: 'cashflow-forecast',
              text: 'How far ahead can you accurately forecast cashflow?',
              type: 'multiple_choice',
              options: ['1 month', '3 months', '6 months', '12 months'],
              weight: 0.5
            },
            {
              id: 'cashflow-variance',
              text: 'What is your average cashflow forecast variance?',
              type: 'scale',
              scaleRange: { min: 0, max: 50, labels: ['0%', '10%', '20%', '30%', '50%+'] },
              weight: 0.5
            }
          ]
        },
        {
          id: 'expense-control',
          name: 'Expense Control',
          description: 'Expense tracking and control measures',
          weight: 0.3,
          questions: [
            {
              id: 'expense-tracking',
              text: 'Do you track all expenses in real-time?',
              type: 'boolean',
              weight: 1.0
            }
          ]
        },
        {
          id: 'financial-reporting',
          name: 'Financial Reporting',
          description: 'Financial reporting and analysis',
          weight: 0.3,
          questions: [
            {
              id: 'reporting-cadence',
              text: 'How often do you review financial reports?',
              type: 'multiple_choice',
              options: ['Monthly', 'Weekly', 'Daily', 'Real-time'],
              weight: 1.0
            }
          ]
        }
      ],
      bestPracticeMetrics: [
        {
          id: 'cashflow-variance-target',
          name: 'Cashflow Variance',
          description: 'Average variance between forecast and actual cashflow',
          target: 10,
          unit: '%',
          source: 'financial_best_practice'
        }
      ]
    },
    {
      id: 'leadership',
      name: 'Leadership & Strategy',
      description: 'Goal setting, decision cadence, and organizational alignment',
      weight: 0.1,
      subDimensions: [
        {
          id: 'goal-setting',
          name: 'Goal Setting',
          description: 'Strategic goal setting and alignment',
          weight: 0.4,
          questions: [
            {
              id: 'okr-implementation',
              text: 'Do you use OKRs or similar goal-setting framework?',
              type: 'boolean',
              weight: 0.5
            },
            {
              id: 'goal-alignment',
              text: 'How well are individual goals aligned with company objectives?',
              type: 'scale',
              scaleRange: { min: 0, max: 100, labels: ['0%', '25%', '50%', '75%', '100%'] },
              weight: 0.5
            }
          ]
        },
        {
          id: 'decision-making',
          name: 'Decision Making',
          description: 'Decision-making processes and cadence',
          weight: 0.3,
          questions: [
            {
              id: 'decision-cadence',
              text: 'How quickly can you make and implement strategic decisions?',
              type: 'multiple_choice',
              options: ['Weeks', 'Days', 'Hours', 'Minutes'],
              weight: 1.0
            }
          ]
        },
        {
          id: 'strategic-alignment',
          name: 'Strategic Alignment',
          description: 'Alignment across departments and teams',
          weight: 0.3,
          questions: [
            {
              id: 'team-alignment',
              text: 'How well aligned are your teams with company strategy?',
              type: 'scale',
              scaleRange: { min: 0, max: 100, labels: ['0%', '25%', '50%', '75%', '100%'] },
              weight: 1.0
            }
          ]
        }
      ],
      bestPracticeMetrics: [
        {
          id: 'goal-achievement',
          name: 'Goal Achievement',
          description: 'Percentage of strategic goals achieved',
          target: 80,
          unit: '%',
          source: 'balanced_scorecard'
        }
      ]
    },
    {
      id: 'people',
      name: 'People & Culture',
      description: 'Role clarity, onboarding, and retention',
      weight: 0.1,
      subDimensions: [
        {
          id: 'role-clarity',
          name: 'Role Clarity',
          description: 'Clear role definitions and responsibilities',
          weight: 0.4,
          questions: [
            {
              id: 'job-descriptions',
              text: 'Do all team members have clear job descriptions?',
              type: 'boolean',
              weight: 0.5
            },
            {
              id: 'responsibility-clarity',
              text: 'How clear are team members about their responsibilities?',
              type: 'scale',
              scaleRange: { min: 0, max: 100, labels: ['0%', '25%', '50%', '75%', '100%'] },
              weight: 0.5
            }
          ]
        },
        {
          id: 'onboarding',
          name: 'Onboarding',
          description: 'Employee onboarding and training',
          weight: 0.3,
          questions: [
            {
              id: 'onboarding-process',
              text: 'Do you have a standardized onboarding process?',
              type: 'boolean',
              weight: 1.0
            }
          ]
        },
        {
          id: 'retention',
          name: 'Retention',
          description: 'Employee retention and satisfaction',
          weight: 0.3,
          questions: [
            {
              id: 'retention-rate',
              text: 'What is your employee retention rate?',
              type: 'scale',
              scaleRange: { min: 0, max: 100, labels: ['0%', '25%', '50%', '75%', '100%'] },
              weight: 1.0
            }
          ]
        }
      ],
      bestPracticeMetrics: [
        {
          id: 'retention-target',
          name: 'Employee Retention',
          description: 'Annual employee retention rate',
          target: 80,
          unit: '%',
          source: 'hr_best_practice'
        }
      ]
    }
  ];

  private readonly maturityLevels: MaturityLevelDefinition[] = [
    {
      level: 0,
      name: 'Non-Existent',
      description: 'No process or metric tracking',
      executiveInterpretation: 'Critical gaps that need immediate attention',
      characteristics: ['No documented processes', 'No metrics tracked', 'Ad-hoc decision making']
    },
    {
      level: 1,
      name: 'Emerging',
      description: 'Ad-hoc processes, partial data',
      executiveInterpretation: 'Basic foundation exists but needs structure',
      characteristics: ['Some processes exist', 'Limited data collection', 'Inconsistent execution']
    },
    {
      level: 2,
      name: 'Developing',
      description: 'Processes in place, inconsistent tracking',
      executiveInterpretation: 'Good progress, focus on consistency',
      characteristics: ['Processes documented', 'Regular data collection', 'Inconsistent quality']
    },
    {
      level: 3,
      name: 'Functional',
      description: 'Standardized processes, regular reporting',
      executiveInterpretation: 'Solid foundation, ready for optimization',
      characteristics: ['Standardized processes', 'Regular reporting', 'Consistent execution']
    },
    {
      level: 4,
      name: 'Optimizing',
      description: 'Data-driven decisions, automation adoption',
      executiveInterpretation: 'High performance, focus on continuous improvement',
      characteristics: ['Data-driven decisions', 'Automation adoption', 'Continuous improvement']
    },
    {
      level: 5,
      name: 'Scalable',
      description: 'Predictable, high-performance, continuous improvement',
      executiveInterpretation: 'World-class performance, sustainable growth',
      characteristics: ['Predictable performance', 'High automation', 'Continuous innovation']
    }
  ];

  // ============================================================================
  // CORE METHODS
  // ============================================================================

  async conductInitialAssessment(userId: string, companyId: string, surveyResponses: Record<string, any>): Promise<ServiceResponse<MaturityProfile>> {
    try {
      logger.info(`Conducting initial maturity assessment for user ${userId}, company ${companyId}`);

      // 1. Calculate domain scores
      const domainScores: MaturityScore[] = [];
      let totalWeightedScore = 0;
      let totalWeight = 0;

      for (const domain of this.maturityDomains) {
        const score = await this.calculateDomainScore(domain, surveyResponses, userId, companyId);
        domainScores.push(score);
        
        totalWeightedScore += score.score * domain.weight;
        totalWeight += domain.weight;
      }

      const overallScore = totalWeight / totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
      const overallLevel = this.getMaturityLevel(overallScore);

      // 2. Generate recommendations
      const recommendations = await this.generateRecommendations(domainScores, userId, companyId);

      // 3. Get benchmark data
      const benchmarkData = await this.getBenchmarkData(companyId);

      // 4. Create maturity profile
      const profile: MaturityProfile = {
        userId,
        companyId,
        overallScore,
        overallLevel,
        domainScores,
        recommendations,
        lastAssessment: new Date().toISOString(),
        nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        improvementHistory: [],
        benchmarkData
      };

      // 5. Save to database
      await this.saveMaturityProfile(profile);

      return {
        success: true,
        data: profile,
        error: null
      };

    } catch (error) {
      logger.error('Error conducting initial assessment:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to conduct maturity assessment'
      };
    }
  }

  async calculateDomainScore(domain: MaturityDomain, surveyResponses: Record<string, any>, userId: string, companyId: string): Promise<MaturityScore> {
    let totalScore = 0;
    let totalWeight = 0;
    const subDimensionScores: SubDimensionScore[] = [];

    // Calculate scores for each sub-dimension
    for (const subDim of domain.subDimensions) {
      let subDimScore = 0;
      let subDimWeight = 0;
      const insights: string[] = [];

      // Calculate scores for each question
      for (const question of subDim.questions) {
        const questionScore = await this.calculateQuestionScore(question, surveyResponses, userId, companyId);
        subDimScore += questionScore.score * question.weight;
        subDimWeight += question.weight;
        
        if (questionScore.insight) {
          insights.push(questionScore.insight);
        }
      }

      const finalSubDimScore = subDimWeight > 0 ? subDimScore / subDimWeight : 0;
      const subDimLevel = this.getMaturityLevel(finalSubDimScore);

      subDimensionScores.push({
        id: subDim.id,
        name: subDim.name,
        score: finalSubDimScore,
        level: subDimLevel,
        insights
      });

      totalScore += finalSubDimScore * subDim.weight;
      totalWeight += subDim.weight;
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const level = this.getMaturityLevel(finalScore);
    const percentile = await this.calculatePercentile(domain.id, finalScore, companyId);
    const trend = await this.calculateTrend(domain.id, userId, companyId);

    return {
      domainId: domain.id,
      domainName: domain.name,
      score: finalScore,
      level,
      percentile,
      trend,
      lastUpdated: new Date().toISOString(),
      subDimensionScores,
      recommendations: [] // Will be populated by generateRecommendations
    };
  }

  async calculateQuestionScore(question: MaturityQuestion, surveyResponses: Record<string, any>, userId: string, companyId: string): Promise<{ score: number; insight?: string }> {
    let score = 0;
    let insight: string | undefined;

    switch (question.type) {
      case 'boolean':
        const booleanValue = surveyResponses[question.id];
        score = booleanValue ? 3 : 0; // Boolean questions get level 3 if true, 0 if false
        break;

      case 'multiple_choice':
        const choiceValue = surveyResponses[question.id];
        const choiceIndex = question.options?.indexOf(choiceValue) ?? -1;
        const optionsLength = question.options?.length ?? 1;
        score = choiceIndex >= 0 ? (choiceIndex / (optionsLength - 1)) * 5 : 0;
        break;

      case 'scale':
        const scaleValue = surveyResponses[question.id];
        const scaleRange = question.scaleRange!;
        score = ((scaleValue - scaleRange.min) / (scaleRange.max - scaleRange.min)) * 5;
        break;

      case 'integration_check':
        const integrationScore = await this.checkIntegrationMetric(question.integrationCheck!, userId, companyId);
        score = integrationScore.score;
        insight = integrationScore.insight;
        break;

      default:
        score = 0;
    }

    return { score: Math.min(5, Math.max(0, score)), insight };
  }

  async checkIntegrationMetric(check: MaturityQuestion['integrationCheck'], userId: string, companyId: string): Promise<{ score: number; insight?: string }> {
    try {
      if (!check) {
        return { score: 0, insight: 'No integration check configured' };
      }

      // This would integrate with actual data sources
      // For now, return mock data based on the metric
      const mockData: Record<string, { value: number; score: number; insight: string }> = {
        'stale_deals_percentage': { value: 25, score: 2, insight: '25% of deals are stale - industry best practice is <10%' },
        'win_rate': { value: 28, score: 2.5, insight: 'Win rate of 28% - target is 30%' },
        'campaign_roi': { value: 450, score: 3, insight: 'Campaign ROI of 450% - good but can be optimized' }
      };

      const data = mockData[check.metric] || { value: 0, score: 0, insight: 'No data available' };
      
      return {
        score: data.score,
        insight: data.insight
      };

    } catch (error) {
      logger.error('Error checking integration metric:', error);
      return { score: 0, insight: 'Unable to check integration metric' };
    }
  }

  getMaturityLevel(score: number): MaturityLevel {
    if (score < 1) return 0;
    if (score < 2) return 1;
    if (score < 3) return 2;
    if (score < 4) return 3;
    if (score < 4.5) return 4;
    return 5;
  }

  async generateRecommendations(domainScores: MaturityScore[], userId: string, companyId: string): Promise<MaturityRecommendation[]> {
    const recommendations: MaturityRecommendation[] = [];

    for (const domainScore of domainScores) {
      if (domainScore.score < 3) { // Focus on domains below functional level
        const domainRecommendations = await this.generateDomainRecommendations(domainScore, userId, companyId);
        recommendations.push(...domainRecommendations);
      }
    }

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async generateDomainRecommendations(domainScore: MaturityScore, userId: string, companyId: string): Promise<MaturityRecommendation[]> {
    const recommendations: MaturityRecommendation[] = [];

    // Generate recommendations based on domain and score level
    switch (domainScore.domainId) {
      case 'sales':
        if (domainScore.score < 2) {
          recommendations.push({
            id: 'sales-1',
            priority: 'high',
            domain: 'sales',
            title: 'Implement Lead Qualification Process',
            context: 'Your sales process lacks structured lead qualification, leading to inefficient pipeline management.',
            action: 'Create a standardized lead qualification checklist and scoring system.',
            impact: 'Improve conversion rates by 20-30% and reduce time spent on unqualified leads.',
            effort: 'medium',
            estimatedTime: '2-3 days',
            nexusModule: 'sales-hub',
            automationTemplate: 'lead-qualification-workflow',
            successMetrics: ['Lead conversion rate', 'Sales cycle length', 'Pipeline velocity'],
            relatedRecommendations: []
          });
        }
        if (domainScore.score < 3) {
          recommendations.push({
            id: 'sales-2',
            priority: 'medium',
            domain: 'sales',
            title: 'Set Up Pipeline Hygiene Automation',
            context: `Your pipeline has ${domainScore.subDimensionScores.find(s => s.id === 'pipeline-health')?.insights[0] || 'stale deals'} - industry best practice is <10%.`,
            action: 'Create automated alerts for deals idle >14 days and implement follow-up sequences.',
            impact: 'Reduce stale deals by 50% and improve forecast accuracy.',
            effort: 'low',
            estimatedTime: '1 day',
            nexusModule: 'sales-hub',
            automationTemplate: 'pipeline-hygiene-automation',
            successMetrics: ['Stale deals percentage', 'Deal velocity', 'Forecast accuracy'],
            relatedRecommendations: []
          });
        }
        break;

      case 'marketing':
        if (domainScore.score < 2) {
          recommendations.push({
            id: 'marketing-1',
            priority: 'high',
            domain: 'marketing',
            title: 'Implement Campaign Attribution',
            context: 'You cannot track which campaigns generate which leads, making ROI optimization impossible.',
            action: 'Set up UTM tracking and lead source attribution in your CRM.',
            impact: 'Gain visibility into campaign performance and optimize marketing spend.',
            effort: 'medium',
            estimatedTime: '2-3 days',
            nexusModule: 'marketing-hub',
            automationTemplate: 'campaign-attribution-setup',
            successMetrics: ['Campaign ROI', 'Lead source quality', 'Marketing spend efficiency'],
            relatedRecommendations: []
          });
        }
        break;

      case 'operations':
        if (domainScore.score < 2) {
          recommendations.push({
            id: 'operations-1',
            priority: 'high',
            domain: 'operations',
            title: 'Document Core Processes',
            context: 'Your core business processes are not documented, leading to inconsistency and inefficiency.',
            action: 'Create process documentation for your top 3 business processes.',
            impact: 'Improve consistency, reduce errors, and enable process optimization.',
            effort: 'medium',
            estimatedTime: '3-5 days',
            nexusModule: 'operations-hub',
            automationTemplate: 'process-documentation-template',
            successMetrics: ['Process efficiency', 'Error rates', 'Training time'],
            relatedRecommendations: []
          });
        }
        break;

      case 'finance':
        if (domainScore.score < 2) {
          recommendations.push({
            id: 'finance-1',
            priority: 'high',
            domain: 'finance',
            title: 'Implement Real-Time Expense Tracking',
            context: 'You cannot track expenses in real-time, making cashflow management difficult.',
            action: 'Set up automated expense tracking and categorization.',
            impact: 'Improve cashflow visibility and reduce financial surprises.',
            effort: 'low',
            estimatedTime: '1-2 days',
            nexusModule: 'finance-hub',
            automationTemplate: 'expense-tracking-automation',
            successMetrics: ['Cashflow predictability', 'Expense control', 'Financial reporting accuracy'],
            relatedRecommendations: []
          });
        }
        break;
    }

    return recommendations;
  }

  async calculatePercentile(domainId: string, score: number, companyId: string): Promise<number> {
    // This would query benchmark data from the database
    // For now, return mock percentile based on score
    const mockPercentiles: Record<string, number> = {
      'sales': score * 15 + 10, // 10-85 range
      'marketing': score * 12 + 15, // 15-75 range
      'operations': score * 10 + 20, // 20-70 range
      'finance': score * 8 + 25, // 25-65 range
      'leadership': score * 6 + 30, // 30-60 range
      'people': score * 5 + 35 // 35-60 range
    };

    return Math.min(100, Math.max(0, mockPercentiles[domainId] || 50));
  }

  async calculateTrend(domainId: string, userId: string, companyId: string): Promise<'improving' | 'declining' | 'stable'> {
    // This would compare current score with historical data
    // For now, return 'stable' for initial assessment
    return 'stable';
  }

  async getBenchmarkData(companyId: string): Promise<BenchmarkData> {
    // This would query benchmark data from the database
    // For now, return mock data
    return {
      companySize: 'small',
      industry: 'technology',
      region: 'north_america',
      peerGroup: 'tech_smb',
      percentileRankings: {
        'sales': 65,
        'marketing': 45,
        'operations': 55,
        'finance': 40,
        'leadership': 50,
        'people': 60
      },
      topPerformers: [
        {
          domain: 'sales',
          averageScore: 4.2,
          bestPractices: ['Automated lead scoring', 'Pipeline hygiene automation', 'Forecast accuracy tracking'],
          commonTraits: ['Data-driven decisions', 'Regular pipeline reviews', 'Strong CRM adoption']
        }
      ]
    };
  }

  async saveMaturityProfile(profile: MaturityProfile): Promise<void> {
    try {
      await insertOne(this.tableName, {
        user_id: profile.userId,
        company_id: profile.companyId,
        overall_score: profile.overallScore,
        overall_level: profile.overallLevel,
        domain_scores: profile.domainScores,
        recommendations: profile.recommendations,
        last_assessment: profile.lastAssessment,
        next_assessment: profile.nextAssessment,
        improvement_history: profile.improvementHistory,
        benchmark_data: profile.benchmarkData
      });

      logger.info(`Maturity profile saved for user ${profile.userId}`);
    } catch (error) {
      logger.error('Error saving maturity profile:', error);
      throw error;
    }
  }

  async getMaturityProfile(userId: string, companyId: string): Promise<ServiceResponse<MaturityProfile>> {
    try {
      const profile = await selectOne(this.tableName, {
        user_id: userId,
        company_id: companyId
      });

      if (!profile) {
        return {
          success: false,
          error: 'Maturity profile not found'
        };
      }

      return {
        success: true,
        data: profile as MaturityProfile,
        message: 'Maturity profile retrieved successfully'
      };

    } catch (error) {
      logger.error('Error retrieving maturity profile:', error);
      return {
        success: false,
        error: 'Failed to retrieve maturity profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateMaturityScore(domainId: string, newScore: number, userId: string, companyId: string): Promise<ServiceResponse<void>> {
    try {
      // Update the specific domain score
      const profile = await this.getMaturityProfile(userId, companyId);
      if (!profile.success || !profile.data) {
        return { success: false, error: 'Profile not found' };
      }

      const updatedDomainScores = profile.data.domainScores.map(score => 
        score.domainId === domainId 
          ? { ...score, score: newScore, level: this.getMaturityLevel(newScore), lastUpdated: new Date().toISOString() }
          : score
      );

      // Recalculate overall score
      const totalWeightedScore = updatedDomainScores.reduce((sum, score) => {
        const domain = this.maturityDomains.find(d => d.id === score.domainId);
        return sum + (score.score * (domain?.weight || 0));
      }, 0);

      const totalWeight = this.maturityDomains.reduce((sum, domain) => sum + domain.weight, 0);
      const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

      // Update profile
      await updateOne(this.tableName, 
        { user_id: userId, company_id: companyId },
        {
          overall_score: overallScore,
          overall_level: this.getMaturityLevel(overallScore),
          domain_scores: updatedDomainScores,
          last_assessment: new Date().toISOString()
        }
      );

      return { success: true, message: 'Maturity score updated successfully' };

    } catch (error) {
      logger.error('Error updating maturity score:', error);
      return {
        success: false,
        error: 'Failed to update maturity score',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getMaturityLevels(): MaturityLevelDefinition[] {
    return this.maturityLevels;
  }

  getMaturityDomains(): MaturityDomain[] {
    return this.maturityDomains;
  }
}

export const maturityFrameworkService = new MaturityFrameworkService();
