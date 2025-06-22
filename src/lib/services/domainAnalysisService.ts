/**
 * Domain Analysis Service
 * Analyzes email domains to detect business professionalism indicators
 * Pillar: 1,2 - Automated business health assessment and upsell opportunities
 */

import { supabase } from '../supabase';
import { logger } from '../security/logger';

export interface DomainAnalysis {
  domain: string;
  isProfessional: boolean;
  isCustomDomain: boolean;
  provider: 'microsoft365' | 'google_workspace' | 'custom' | 'generic';
  confidence: number; // 0-100
  recommendations: string[];
  upsellOpportunity?: {
    type: 'microsoft365' | 'google_workspace';
    description: string;
    benefits: string[];
    estimatedCost: string;
  };
}

export interface EmailDomainSummary {
  totalEmails: number;
  uniqueDomains: string[];
  professionalDomainCount: number;
  genericDomainCount: number;
  customDomainCount: number;
  primaryDomain?: string;
  overallProfessionalScore: number; // 0-100
  recommendations: string[];
  upsellOpportunities: DomainAnalysis['upsellOpportunity'][];
}

// Common generic email providers
const GENERIC_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'aol.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'ymail.com',
  'protonmail.com',
  'mail.com',
  'zoho.com'
];

// Business email providers
const BUSINESS_PROVIDERS = {
  'outlook.com': 'microsoft365',
  'office365.com': 'microsoft365',
  'gmail.com': 'google_workspace', // Could be either, need more analysis
  'googlemail.com': 'google_workspace'
} as const;

class DomainAnalysisService {
  /**
   * Analyze a single email domain
   */
  async analyzeDomain(domain: string): Promise<DomainAnalysis> {
    const normalizedDomain = domain.toLowerCase().trim();
    
    // Check if it's a generic provider
    const isGeneric = GENERIC_PROVIDERS.includes(normalizedDomain);
    
    // Determine provider type
    let provider: DomainAnalysis['provider'] = 'custom';
    if (isGeneric) {
      provider = 'generic';
    } else if (normalizedDomain in BUSINESS_PROVIDERS) {
      provider = BUSINESS_PROVIDERS[normalizedDomain as keyof typeof BUSINESS_PROVIDERS];
    }
    
    // Custom domains are professional by default
    const isCustomDomain = !isGeneric && provider === 'custom';
    const isProfessional = isCustomDomain || provider === 'microsoft365' || provider === 'google_workspace';
    
    // Calculate confidence score
    let confidence = 50;
    if (isCustomDomain) {
      confidence = 95; // High confidence for custom domains
    } else if (provider === 'microsoft365' || provider === 'google_workspace') {
      confidence = 80; // Good confidence for business providers
    } else if (isGeneric) {
      confidence = 90; // High confidence it's not professional
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    let upsellOpportunity: DomainAnalysis['upsellOpportunity'];
    
    if (!isProfessional) {
      recommendations.push('Consider upgrading to a professional email with your own domain');
      recommendations.push('Professional email increases customer trust and brand recognition');
      
      upsellOpportunity = {
        type: 'microsoft365',
        description: 'Upgrade to Microsoft 365 Business for professional email',
        benefits: [
          'Custom domain email (you@yourcompany.com)',
          '50GB mailbox per user',
          'Advanced security and compliance',
          'Integrated Office apps',
          'Professional appearance and credibility'
        ],
        estimatedCost: '$6-22/user/month'
      };
    } else if (isCustomDomain) {
      recommendations.push('Excellent! You\'re using a professional custom domain');
      recommendations.push('Consider adding email security features like DMARC/SPF');
    }
    
    return {
      domain: normalizedDomain,
      isProfessional,
      isCustomDomain,
      provider,
      confidence,
      recommendations,
      upsellOpportunity
    };
  }
  
  /**
   * Analyze all email domains for a user/organization
   */
  async analyzeUserEmailDomains(userId: string): Promise<EmailDomainSummary> {
    try {
      // Get all email addresses from various sources
      const emailSources = await Promise.all([
        this.getEmailsFromInbox(userId),
        this.getEmailsFromAccounts(userId),
        this.getEmailsFromProfile(userId)
      ]);
      
      const allEmails = emailSources.flat();
      const uniqueDomains = [...new Set(allEmails.map(email => email.split('@')[1]).filter(Boolean))];
      
      // Analyze each domain
      const domainAnalyses = await Promise.all(
        uniqueDomains.map(domain => this.analyzeDomain(domain))
      );
      
      // Calculate summary statistics
      const professionalDomains = domainAnalyses.filter(d => d.isProfessional);
      const customDomains = domainAnalyses.filter(d => d.isCustomDomain);
      const genericDomains = domainAnalyses.filter(d => d.provider === 'generic');
      
      // Determine primary domain (most common custom domain or first professional)
      const domainCounts = new Map<string, number>();
      allEmails.forEach(email => {
        const domain = email.split('@')[1];
        if (domain) {
          domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
        }
      });
      
      const primaryDomain = customDomains.length > 0 
        ? customDomains[0].domain 
        : professionalDomains.length > 0 
          ? professionalDomains[0].domain 
          : uniqueDomains[0];
      
      // Calculate overall professional score
      const totalDomains = uniqueDomains.length;
      const professionalScore = totalDomains > 0 
        ? Math.round((professionalDomains.length / totalDomains) * 100)
        : 0;
      
      // Aggregate recommendations and upsell opportunities
      const allRecommendations = domainAnalyses.flatMap(d => d.recommendations);
      const uniqueRecommendations = [...new Set(allRecommendations)];
      
      const upsellOpportunities = domainAnalyses
        .map(d => d.upsellOpportunity)
        .filter(Boolean) as DomainAnalysis['upsellOpportunity'][];
      
      return {
        totalEmails: allEmails.length,
        uniqueDomains,
        professionalDomainCount: professionalDomains.length,
        genericDomainCount: genericDomains.length,
        customDomainCount: customDomains.length,
        primaryDomain,
        overallProfessionalScore: professionalScore,
        recommendations: uniqueRecommendations,
        upsellOpportunities
      };
      
    } catch (error) {
      logger.error({ error, userId }, 'Error analyzing user email domains');
      throw error;
    }
  }
  
  /**
   * Update business health KPI based on domain analysis
   */
  async updateProfessionalEmailKPI(userId: string, companyId?: string): Promise<boolean> {
    try {
      const analysis = await this.analyzeUserEmailDomains(userId);
      
      // Determine if user has professional email
      const hasProfessionalEmail = analysis.customDomainCount > 0 || 
                                   analysis.overallProfessionalScore >= 70;
      
      const snapshot = {
        // org_id will be injected by the edge function from the JWT
        department_id: 'maturity', // This KPI is in the 'maturity' category
        kpi_id: 'professional_email_domain',
        value: hasProfessionalEmail,
        source: 'automated_domain_analysis',
        captured_at: new Date().toISOString(),
      };

      // Update the KPI using the secure edge function
      const { error } = await supabase.functions.invoke('upsert_kpis', {
        body: { snapshots: [snapshot] },
      });
      
      if (error) {
        logger.error({ error, userId }, 'Failed to update professional email KPI via function');
        throw error;
      }
      
      logger.info({ 
        userId, 
        hasProfessionalEmail, 
        customDomains: analysis.customDomainCount,
        professionalScore: analysis.overallProfessionalScore 
      }, 'Updated professional email KPI');
      
      return hasProfessionalEmail;
      
    } catch (error) {
      logger.error({ error, userId }, 'Error updating professional email KPI');
      throw error;
    }
  }
  
  /**
   * Get email addresses from inbox items
   */
  private async getEmailsFromInbox(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('ai_inbox_items')
        .select('sender_email, recipient_email')
        .eq('user_id', userId)
        .limit(1000);
      
      if (error) throw error;
      
      const emails: string[] = [];
      data?.forEach(item => {
        if (item.sender_email) emails.push(item.sender_email);
        if (item.recipient_email) emails.push(item.recipient_email);
      });
      
      return emails.filter(Boolean);
    } catch (error) {
      logger.error({ error, userId }, 'Error fetching emails from inbox');
      return [];
    }
  }
  
  /**
   * Get email addresses from email accounts
   */
  private async getEmailsFromAccounts(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('ai_email_accounts')
        .select('email_address')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return data?.map(account => account.email_address).filter(Boolean) || [];
    } catch (error) {
      logger.error({ error, userId }, 'Error fetching emails from accounts');
      return [];
    }
  }
  
  /**
   * Get email addresses from user profile
   */
  private async getEmailsFromProfile(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email, business_email')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      const emails: string[] = [];
      if (data?.email) emails.push(data.email);
      if (data?.business_email) emails.push(data.business_email);
      
      return emails.filter(Boolean);
    } catch (error) {
      logger.error({ error, userId }, 'Error fetching emails from profile');
      return [];
    }
  }
  
  /**
   * Get Microsoft 365 upsell recommendations
   */
  async getMicrosoft365UpsellRecommendation(userId: string): Promise<{
    shouldShowUpsell: boolean;
    recommendation: {
      title: string;
      description: string;
      benefits: string[];
      pricing: string;
      ctaText: string;
      urgency: 'low' | 'medium' | 'high';
    } | null;
  }> {
    try {
      const analysis = await this.analyzeUserEmailDomains(userId);
      
      // Show upsell if user doesn't have professional email
      const shouldShowUpsell = analysis.customDomainCount === 0 && 
                               analysis.overallProfessionalScore < 70;
      
      if (!shouldShowUpsell) {
        return { shouldShowUpsell: false, recommendation: null };
      }
      
      // Determine urgency based on business size/activity
      let urgency: 'low' | 'medium' | 'high' = 'medium';
      if (analysis.totalEmails > 100) urgency = 'high';
      if (analysis.totalEmails < 20) urgency = 'low';
      
      return {
        shouldShowUpsell: true,
        recommendation: {
          title: 'Upgrade to Professional Email',
          description: 'Boost your business credibility with a custom domain email address powered by Microsoft 365.',
          benefits: [
            'Custom domain email (you@yourcompany.com)',
            'Enhanced security and compliance features',
            '50GB mailbox with advanced filtering',
            'Integrated Office apps (Word, Excel, PowerPoint)',
            'Professional appearance increases customer trust',
            '99.9% uptime guarantee'
          ],
          pricing: 'Starting at $6/user/month',
          ctaText: 'Set Up Professional Email',
          urgency
        }
      };
      
    } catch (error) {
      logger.error({ error, userId }, 'Error generating Microsoft 365 upsell recommendation');
      return { shouldShowUpsell: false, recommendation: null };
    }
  }
}

export const domainAnalysisService = new DomainAnalysisService(); 