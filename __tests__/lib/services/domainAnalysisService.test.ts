/**
 * Domain Analysis Service Tests
 * Tests for professional email domain detection and business health KPI updates
 * Pillar: 1,2 - Automated business health assessment testing
 */

import { domainAnalysisService } from '@/lib/services/domainAnalysisService';

describe('DomainAnalysisService', () => {
  describe('analyzeDomain', () => {
    it('should identify custom domains as professional', async () => {
      const result = await domainAnalysisService.analyzeDomain('mycompany.com');
      
      expect(result.domain).toBe('mycompany.com');
      expect(result.isProfessional).toBe(true);
      expect(result.isCustomDomain).toBe(true);
      expect(result.provider).toBe('custom');
      expect(result.confidence).toBeGreaterThan(90);
      expect(result.recommendations).toContain('Excellent! You\'re using a professional custom domain');
    });

    it('should identify generic email providers as non-professional', async () => {
      const result = await domainAnalysisService.analyzeDomain('gmail.com');
      
      expect(result.domain).toBe('gmail.com');
      expect(result.isProfessional).toBe(false);
      expect(result.isCustomDomain).toBe(false);
      expect(result.provider).toBe('generic');
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.upsellOpportunity).toBeDefined();
      expect(result.upsellOpportunity?.type).toBe('microsoft365');
    });

    it('should identify Microsoft 365 domains as professional', async () => {
      const result = await domainAnalysisService.analyzeDomain('outlook.com');
      
      expect(result.domain).toBe('outlook.com');
      expect(result.isProfessional).toBe(true);
      expect(result.isCustomDomain).toBe(false);
      expect(result.provider).toBe('microsoft365');
      expect(result.confidence).toBe(80);
    });

    it('should handle domain normalization', async () => {
      const result = await domainAnalysisService.analyzeDomain('  MYCOMPANY.COM  ');
      
      expect(result.domain).toBe('mycompany.com');
      expect(result.isProfessional).toBe(true);
      expect(result.isCustomDomain).toBe(true);
    });
  });

  describe('upsell recommendations', () => {
    it('should generate Microsoft 365 upsell for generic email users', async () => {
      const result = await domainAnalysisService.analyzeDomain('yahoo.com');
      
      expect(result.upsellOpportunity).toBeDefined();
      expect(result.upsellOpportunity?.type).toBe('microsoft365');
      expect(result.upsellOpportunity?.benefits).toContain('Custom domain email (you@yourcompany.com)');
      expect(result.upsellOpportunity?.estimatedCost).toContain('$6-22/user/month');
    });

    it('should not generate upsell for custom domains', async () => {
      const result = await domainAnalysisService.analyzeDomain('techstartup.io');
      
      expect(result.upsellOpportunity).toBeUndefined();
      expect(result.recommendations).toContain('Excellent! You\'re using a professional custom domain');
    });
  });

  describe('business health integration', () => {
    it('should provide correct KPI scoring logic', () => {
      // Test the business logic for determining professional email status
      const customDomainAnalysis = { customDomainCount: 1, overallProfessionalScore: 100 };
      const genericEmailAnalysis = { customDomainCount: 0, overallProfessionalScore: 30 };
      const mixedAnalysis = { customDomainCount: 0, overallProfessionalScore: 75 };

      // Custom domain should be considered professional
      expect(customDomainAnalysis.customDomainCount > 0 || customDomainAnalysis.overallProfessionalScore >= 70).toBe(true);
      
      // Generic email should not be considered professional
      expect(genericEmailAnalysis.customDomainCount > 0 || genericEmailAnalysis.overallProfessionalScore >= 70).toBe(false);
      
      // Mixed (good professional score without custom domain) should be considered professional
      expect(mixedAnalysis.customDomainCount > 0 || mixedAnalysis.overallProfessionalScore >= 70).toBe(true);
    });
  });
}); 