/**
 * Domain Analysis Service
 * Analyzes email domains for professional status and business health KPI updates
 * Pillar: 1,2 - Automated business health assessment
 */

import { supabase } from '@/core/database/supabase';
import { logger } from '@/shared/utils/logger';

export interface DomainAnalysisResult {
  domain: string;
  isProfessional: boolean;
  isCustomDomain: boolean;
  provider: 'custom' | 'microsoft365' | 'google' | 'generic';
  confidence: number;
  recommendations: string[];
  upsellOpportunity?: {
    type: 'microsoft365' | 'google';
    benefits: string[];
    estimatedCost: string;
  };
}

export interface UserEmailAnalysis {
  customDomainCount: number;
  overallProfessionalScore: number;
  primaryDomain?: string;
  recommendations: string[];
}

export interface UpsellRecommendation {
  shouldShowUpsell: boolean;
  type: 'microsoft365' | 'google';
  benefits: string[];
  estimatedCost: string;
}

class DomainAnalysisService {
  private readonly PROFESSIONAL_DOMAINS = [
    'outlook.com',
    'office365.com',
    'microsoft365.com',
    'gmail.com',
    'googleworkspace.com',
    'google.com'
  ];

  private readonly GENERIC_DOMAINS = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'live.com',
    'aol.com',
    'icloud.com'
  ];

  async analyzeDomain(domain: string): Promise<DomainAnalysisResult> {
    const normalizedDomain = domain.toLowerCase().trim();
    
    // Check if it's a custom domain
    const isCustomDomain = !this.GENERIC_DOMAINS.includes(normalizedDomain) && 
                          !this.PROFESSIONAL_DOMAINS.includes(normalizedDomain);
    
    // Determine provider
    let provider: DomainAnalysisResult['provider'] = 'generic';
    if (isCustomDomain) {
      provider = 'custom';
    } else if (normalizedDomain.includes('outlook') || normalizedDomain.includes('office365') || normalizedDomain.includes('microsoft365')) {
      provider = 'microsoft365';
    } else if (normalizedDomain.includes('gmail') || normalizedDomain.includes('google')) {
      provider = 'google';
    }
    
    // Calculate confidence
    let confidence = 50;
    if (isCustomDomain) confidence = 95;
    else if (provider === 'microsoft365') confidence = 80;
    else if (provider === 'google') confidence = 70;
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (isCustomDomain) {
      recommendations.push('Excellent! You\'re using a professional custom domain');
    } else if (provider === 'microsoft365') {
      recommendations.push('Good! You\'re using Microsoft 365 for business');
    } else if (provider === 'google') {
      recommendations.push('Good! You\'re using Google Workspace for business');
    } else {
      recommendations.push('Consider upgrading to a professional email service');
    }
    
    // Generate upsell opportunity for generic domains
    let upsellOpportunity: DomainAnalysisResult['upsellOpportunity'] | undefined;
    if (provider === 'generic') {
      upsellOpportunity = {
        type: 'microsoft365',
        benefits: [
          'Custom domain email (you@yourcompany.com)',
          'Professional appearance',
          'Better deliverability',
          'Integrated calendar and contacts'
        ],
        estimatedCost: '$6-22/user/month'
      };
    }
    
    return {
      domain: normalizedDomain,
      isProfessional: isCustomDomain || provider !== 'generic',
      isCustomDomain,
      provider,
      confidence,
      recommendations,
      upsellOpportunity
    };
  }

  async analyzeUserEmailDomains(userId: string): Promise<UserEmailAnalysis> {
    try {
      // Get user's email addresses from database
      const { data: userEmails, error } = await supabase
        .from('user_emails')
        .select('email')
        .eq('user_id', userId);

      if (error) {
        logger.error({ error, userId }, 'Error fetching user emails');
        return {
          customDomainCount: 0,
          overallProfessionalScore: 0,
          recommendations: ['Unable to analyze email domains']
        };
      }

      const domains = userEmails?.map(email => {
        const domain = email.email.split('@')[1];
        return domain;
      }).filter(Boolean) || [];

      let customDomainCount = 0;
      let totalScore = 0;
      const recommendations: string[] = [];

      for (const domain of domains) {
        const analysis = await this.analyzeDomain(domain);
        if (analysis.isCustomDomain) {
          customDomainCount++;
        }
        totalScore += analysis.confidence;
      }

      const overallProfessionalScore = domains.length > 0 ? totalScore / domains.length : 0;
      const primaryDomain = domains[0];

      if (customDomainCount > 0) {
        recommendations.push('Excellent! You have custom domain emails');
      } else if (overallProfessionalScore >= 70) {
        recommendations.push('Good! You\'re using professional email services');
      } else {
        recommendations.push('Consider upgrading to professional email services');
      }

      return {
        customDomainCount,
        overallProfessionalScore,
        primaryDomain,
        recommendations
      };

    } catch (error) {
      logger.error({ error, userId }, 'Error analyzing user email domains');
      return {
        customDomainCount: 0,
        overallProfessionalScore: 0,
        recommendations: ['Error analyzing email domains']
      };
    }
  }

  async getMicrosoft365UpsellRecommendation(userId: string): Promise<UpsellRecommendation> {
    const analysis = await this.analyzeUserEmailDomains(userId);
    
    const shouldShowUpsell = analysis.customDomainCount === 0 && 
                             analysis.overallProfessionalScore < 70;

    return {
      shouldShowUpsell,
      type: 'microsoft365',
      benefits: [
        'Custom domain email (you@yourcompany.com)',
        'Professional appearance',
        'Better deliverability',
        'Integrated calendar and contacts',
        'Advanced security features'
      ],
      estimatedCost: '$6-22/user/month'
    };
  }

  async updateProfessionalEmailKPI(userId: string, companyId?: string): Promise<void> {
    try {
      const analysis = await this.analyzeUserEmailDomains(userId);
      const hasProfessionalEmail = analysis.customDomainCount > 0 || 
                                   analysis.overallProfessionalScore >= 70;

      // Update user's professional email status
      await supabase
        .from('users')
        .update({ 
          has_professional_email: hasProfessionalEmail,
          professional_email_score: analysis.overallProfessionalScore
        })
        .eq('id', userId);

      // Update company KPI if company ID is provided
      if (companyId) {
        const { data: companyUsers } = await supabase
          .from('users')
          .select('has_professional_email')
          .eq('company_id', companyId);

        const professionalEmailCount = companyUsers?.filter(u => u.has_professional_email).length || 0;
        const totalUsers = companyUsers?.length || 0;
        const professionalEmailPercentage = totalUsers > 0 ? (professionalEmailCount / totalUsers) * 100 : 0;

        await supabase
          .from('companies')
          .update({ 
            professional_email_percentage: professionalEmailPercentage,
            last_kpi_update: new Date().toISOString()
          })
          .eq('id', companyId);
      }

      logger.info({ 
        userId, 
        companyId, 
        hasProfessionalEmail, 
        score: analysis.overallProfessionalScore 
      }, 'Updated professional email KPI');

    } catch (error) {
      logger.error({ error, userId, companyId }, 'Error updating professional email KPI');
    }
  }
}

export const domainAnalysisService = new DomainAnalysisService(); 