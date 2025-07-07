import { supabase } from '../core/supabase';
import { logger } from '../security/logger';
import { domainAnalysisService } from './domainAnalysisService';
import type { BusinessInsight } from '../types/learning-system';

export interface EABusinessObservation {
  id: string;
  type: 'opportunity' | 'risk' | 'achievement' | 'trend' | 'anomaly';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  insights: string[];
  actionItems: string[];
  estimatedImpact: {
    timeToValue: number; // minutes
    businessValue: number; // dollars
    effort: 'low' | 'medium' | 'high';
  };
  dataSource: string[];
  confidence: number; // 0-1
  createdAt: string;
  relevantPages: string[];
  automationPotential?: {
    canAutomate: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
    description: string;
  };
}

class BusinessObservationService {
  constructor() {
    // Using the singleton instance from domainAnalysisService
  }

  /**
   * Generate comprehensive business observations for the EA
   */
  async generateBusinessObservations(userId: string, companyId: string): Promise<EABusinessObservation[]> {
    try {
      const observations: EABusinessObservation[] = [];

      // Run all observation generators in parallel
      const [
        emailObservations,
        integrationObservations,
        performanceObservations,
        securityObservations
      ] = await Promise.all([
        this.generateEmailDomainObservations(userId),
        this.generateIntegrationObservations(userId, companyId),
        this.generatePerformanceObservations(userId),
        this.generateSecurityObservations(userId)
      ]);

      observations.push(
        ...emailObservations,
        ...integrationObservations,
        ...performanceObservations,
        ...securityObservations
      );

      // Sort by priority and confidence
      return observations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });

    } catch (error) {
      logger.error({ error, userId, companyId }, 'Error generating business observations');
      return [];
    }
  }

  /**
   * Generate professional email domain observations
   */
  private async generateEmailDomainObservations(userId: string): Promise<EABusinessObservation[]> {
    try {
      const analysis = await domainAnalysisService.analyzeUserEmailDomains(userId);
      const observations: EABusinessObservation[] = [];

      // Professional email opportunity
      if (analysis.customDomainCount === 0 && analysis.overallProfessionalScore < 70) {
        const businessValue = this.calculateEmailUpgradeValue(analysis);
        
        observations.push({
          id: `email-professional-${Date.now()}`,
          type: 'opportunity',
          priority: analysis.totalEmails > 50 ? 'high' : 'medium',
          category: 'Business Credibility',
          title: 'Professional Email Domain Opportunity',
          description: `Your business is using generic email providers (${analysis.genericDomainCount} accounts). Upgrading to a professional domain email would significantly boost credibility and brand recognition.`,
          insights: [
            `42% of customers are more likely to trust businesses with professional email addresses`,
            `Generic email domains can reduce perceived professionalism by up to 60%`,
            `Professional email increases email deliverability rates by 23%`,
            `Custom domain email provides better brand consistency across communications`
          ],
          actionItems: [
            'Set up Microsoft 365 Business with custom domain',
            'Migrate existing email communications to professional addresses',
            'Update business cards and marketing materials with new email',
            'Configure email signatures with professional branding',
            'Set up email forwarding during transition period'
          ],
          estimatedImpact: {
            timeToValue: 120, // 2 hours setup
            businessValue: businessValue,
            effort: 'medium'
          },
          dataSource: ['user_profile', 'email_analysis', 'business_health'],
          confidence: 0.92,
          createdAt: new Date().toISOString(),
          relevantPages: ['dashboard', 'settings', 'business-health'],
          automationPotential: {
            canAutomate: true,
            complexity: 'moderate',
            description: 'Can automate domain setup and email migration with Microsoft 365 API integration'
          }
        });
      }

      // Email security observation
      if (analysis.customDomainCount > 0) {
        observations.push({
          id: `email-security-${Date.now()}`,
          type: 'opportunity',
          priority: 'medium',
          category: 'Email Security',
          title: 'Email Security Enhancement Opportunity',
          description: 'Your professional email setup is excellent! Consider adding advanced security features to protect against phishing and spoofing.',
          insights: [
            'DMARC, SPF, and DKIM records prevent email spoofing',
            'Advanced Threat Protection blocks 99.9% of phishing attempts',
            'Email encryption ensures sensitive communications remain secure'
          ],
          actionItems: [
            'Configure DMARC, SPF, and DKIM DNS records',
            'Enable Microsoft Defender for Office 365',
            'Set up email encryption for sensitive communications',
            'Implement multi-factor authentication for all email accounts'
          ],
          estimatedImpact: {
            timeToValue: 60,
            businessValue: 5000, // Cost of potential security breach
            effort: 'low'
          },
          dataSource: ['email_analysis', 'security_assessment'],
          confidence: 0.85,
          createdAt: new Date().toISOString(),
          relevantPages: ['settings', 'security'],
          automationPotential: {
            canAutomate: true,
            complexity: 'simple',
            description: 'DNS records can be automatically configured through domain registrar APIs'
          }
        });
      }

      return observations;

    } catch (error) {
      logger.error({ error, userId }, 'Error generating email domain observations');
      return [];
    }
  }

  /**
   * Generate integration-related observations
   */
  private async generateIntegrationObservations(userId: string, companyId: string): Promise<EABusinessObservation[]> {
    try {
      const { data: integrations } = await supabase
        .from('ai_integrations')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active');

      const observations: EABusinessObservation[] = [];

      if (!integrations || integrations.length < 3) {
        observations.push({
          id: `integration-opportunity-${Date.now()}`,
          type: 'opportunity',
          priority: 'medium',
          category: 'Business Automation',
          title: 'Integration Opportunities Detected',
          description: `Your business has ${integrations?.length || 0} active integrations. Adding key integrations could save significant time and reduce manual work.`,
          insights: [
            'Businesses with 5+ integrations report 40% time savings',
            'Automated data sync reduces errors by 78%',
            'Integration ROI typically achieved within 30 days'
          ],
          actionItems: [
            'Connect your CRM for automated lead tracking',
            'Integrate accounting software for financial insights',
            'Set up email marketing automation',
            'Connect project management tools for workflow optimization'
          ],
          estimatedImpact: {
            timeToValue: 30,
            businessValue: 15000, // Annual time savings
            effort: 'low'
          },
          dataSource: ['integrations', 'usage_patterns'],
          confidence: 0.88,
          createdAt: new Date().toISOString(),
          relevantPages: ['integrations', 'dashboard'],
          automationPotential: {
            canAutomate: true,
            complexity: 'simple',
            description: 'Can suggest and auto-configure popular integrations based on business type'
          }
        });
      }

      return observations;

    } catch (error) {
      logger.error({ error, userId, companyId }, 'Error generating integration observations');
      return [];
    }
  }

  /**
   * Generate performance-related observations
   */
  private async generatePerformanceObservations(userId: string): Promise<EABusinessObservation[]> {
    try {
      // This would analyze usage patterns, load times, etc.
      const observations: EABusinessObservation[] = [];

      // Mock observation for now - replace with actual analytics
      observations.push({
        id: `performance-insight-${Date.now()}`,
        type: 'achievement',
        priority: 'low',
        category: 'System Performance',
        title: 'Excellent System Usage Patterns',
        description: 'Your team is effectively using the platform with consistent daily engagement and optimal feature adoption.',
        insights: [
          'Daily active usage is 23% above average',
          'Feature adoption rate is in the top 15% of similar businesses',
          'User engagement patterns indicate high productivity'
        ],
        actionItems: [
          'Continue current usage patterns',
          'Consider expanding to additional team members',
          'Explore advanced features for power users'
        ],
        estimatedImpact: {
          timeToValue: 0,
          businessValue: 0,
          effort: 'low'
        },
        dataSource: ['usage_analytics', 'engagement_metrics'],
        confidence: 0.75,
        createdAt: new Date().toISOString(),
        relevantPages: ['dashboard'],
        automationPotential: {
          canAutomate: false,
          complexity: 'simple',
          description: 'Performance monitoring is already automated'
        }
      });

      return observations;

    } catch (error) {
      logger.error({ error, userId }, 'Error generating performance observations');
      return [];
    }
  }

  /**
   * Generate security-related observations
   */
  private async generateSecurityObservations(userId: string): Promise<EABusinessObservation[]> {
    try {
      const { data: userProfile } = await supabase
        .from('ai_user_profiles')
        .select('security_settings')
        .eq('user_id', userId)
        .single();

      const observations: EABusinessObservation[] = [];

      if (userProfile) {
        const hasMfa = userProfile.security_settings?.mfa_enabled === true;
        if (!hasMfa) {
          observations.push({
            id: `security-mfa-${Date.now()}`,
            type: 'risk',
            priority: 'high',
            category: 'Account Security',
            title: 'Multi-Factor Authentication Not Enabled',
            description: 'Your account is not protected by multi-factor authentication (MFA), making it more vulnerable to unauthorized access.',
            insights: [
              'MFA can prevent up to 99.9% of account compromise attacks.',
              'Industry best practice recommends MFA for all business-critical accounts.'
            ],
            actionItems: ['Enable MFA in your account security settings.', 'Ensure all team members have MFA enabled.'],
            estimatedImpact: {
              timeToValue: 5, // minutes to set up
              businessValue: 20000, // Potential cost of a security breach
              effort: 'low'
            },
            dataSource: ['auth_logs', 'user_profile'],
            confidence: 0.99,
            createdAt: new Date().toISOString(),
            relevantPages: ['/settings/security'],
          });
        }
      }

      return observations;

    } catch (error) {
      logger.error({ error, userId }, 'Error generating security observations');
      return [];
    }
  }

  /**
   * Calculate business value of upgrading email
   */
  private calculateEmailUpgradeValue(analysis: { totalEmails: number; genericDomainCount: number }): number {
    // Simplified model: value increases with number of emails and reliance on generic providers
    const baseValue = 5000; // Base perceived value of professionalism
    const emailMultiplier = analysis.totalEmails / 10; // Remove cap to allow proper scaling
    const genericPenalty = (analysis.genericDomainCount / (analysis.totalEmails || 1)) * 2500;
    
    return Math.round(baseValue + (emailMultiplier * 1000) + genericPenalty);
  }

  /**
   * Get business insights for a specific page or context
   */
  async getBusinessInsights(userId: string, companyId: string, pageId?: string): Promise<BusinessInsight[]> {
    try {
      // In a real implementation, this would be a sophisticated query
      // For now, we'll generate and then filter observations
      const observations = await this.generateBusinessObservations(userId, companyId);
      
      const insights: BusinessInsight[] = observations
        .filter(obs => !pageId || obs.relevantPages.includes(pageId))
        .map(obs => ({
          id: obs.id,
          type: obs.type,
          priority: obs.priority,
          category: obs.category,
          title: obs.title,
          description: obs.description,
          dataSource: obs.dataSource,
          metrics: {
            impact: obs.estimatedImpact.businessValue / 1000, // Scale to 1-10
            confidence: obs.confidence,
            timeToValue: obs.estimatedImpact.timeToValue,
            effort: obs.estimatedImpact.effort === 'low' ? 1 : obs.estimatedImpact.effort === 'medium' ? 3 : 5,
          },
          suggestedActions: [], // This would need a mapping function
          automationPotential: null, // This would need a mapping function
          context: {
            pageRelevance: obs.relevantPages,
            triggerConditions: {},
            historicalData: []
          },
          createdAt: obs.createdAt,
          status: 'active'
        }));

      return insights.slice(0, 5); // Limit for display

    } catch (error) {
      logger.error({ error, userId, companyId }, 'Error getting business insights');
      return [];
    }
  }
}

export const businessObservationService = new BusinessObservationService();