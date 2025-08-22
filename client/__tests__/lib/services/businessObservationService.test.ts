import { businessObservationService } from '../../../src/lib/services/businessObservationService';
import * as domainAnalysisModule from '../../../src/lib/services/domainAnalysisService';

// Mock dependencies
jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

jest.mock('../../../src/lib/security/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

// Mock the domainAnalysisService
jest.mock('../../../src/lib/services/domainAnalysisService', () => ({
  domainAnalysisService: {
    analyzeUserEmailDomains: jest.fn()
  }
}));

describe('BusinessObservationService', () => {
  const mockUserId = 'user-123';
  const mockCompanyId = 'company-456';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset domain analysis mock to default behavior
    (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockResolvedValue({
      totalEmails: 5,
      customDomainCount: 0,
      genericDomainCount: 5,
      overallProfessionalScore: 30,
      emailsByDomain: {
        'gmail.com': Array(5).fill('user@gmail.com')
      }
    });
    
    // Reset Supabase mock to default behavior with proper method chaining
    const supabaseMock = jest.requireMock('../../../src/lib/supabase');
    supabaseMock.supabase.from.mockImplementation((table: string) => {
      if (table === 'ai_integrations') {
        // For integrations: .select('*').eq('company_id', companyId).eq('status', 'active')
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [] // No integrations by default to trigger integration observation
              })
            })
          })
        };
      }
      if (table === 'ai_user_profiles') {
        // For user profiles: .select('security_settings').eq('user_id', userId).single()
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { security_settings: { mfa_enabled: false } } // MFA not enabled by default to trigger security observation
              })
            })
          })
        };
      }
      // Fallback for any other tables - ensure all methods return proper mock objects
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null }),
            single: jest.fn().mockResolvedValue({ data: null })
          })
        })
      };
    });
  });

  describe('generateBusinessObservations', () => {
    it('should generate professional email opportunity observation for users with generic email', async () => {
      // The mock is already set up in beforeEach, so we just need to override the domain analysis
      const mockDomainAnalysis = {
        totalEmails: 5,
        customDomainCount: 0,
        genericDomainCount: 3,
        overallProfessionalScore: 30,
        emailsByDomain: {
          'gmail.com': ['user@gmail.com', 'contact@gmail.com'],
          'yahoo.com': ['info@yahoo.com']
        }
      };

      (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockResolvedValue(mockDomainAnalysis);

      const observations = await businessObservationService.generateBusinessObservations(mockUserId, mockCompanyId);

      expect(observations).toHaveLength(4); // email, integration, performance, security
      
      const emailObservation = observations.find(obs => obs.category === 'Business Credibility');
      expect(emailObservation).toBeDefined();
      expect(emailObservation?.type).toBe('opportunity');
      expect(emailObservation?.title).toBe('Professional Email Domain Opportunity');
      expect(emailObservation?.priority).toBe('medium'); // Low email count = medium priority
      expect(emailObservation?.insights).toContain('42% of customers are more likely to trust businesses with professional email addresses');
      expect(emailObservation?.actionItems).toContain('Set up Microsoft 365 Business with custom domain');
      expect(emailObservation?.automationPotential?.canAutomate).toBe(true);
    });

    it('should generate high priority observation for businesses with many generic emails', async () => {
      const mockDomainAnalysis = {
        totalEmails: 75,
        customDomainCount: 0,
        genericDomainCount: 75,
        overallProfessionalScore: 20,
        emailsByDomain: {
          'gmail.com': Array(50).fill('user@gmail.com'),
          'yahoo.com': Array(25).fill('user@yahoo.com')
        }
      };

      (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockResolvedValue(mockDomainAnalysis);

      const observations = await businessObservationService.generateBusinessObservations(mockUserId, mockCompanyId);

      const emailObservation = observations.find(obs => obs.category === 'Business Credibility');
      expect(emailObservation?.priority).toBe('high'); // Many emails = high priority
      expect(emailObservation?.estimatedImpact.businessValue).toBeGreaterThan(5000); // Higher value for larger businesses
    });

    it('should generate email security observation for users with professional email', async () => {
      const mockDomainAnalysis = {
        totalEmails: 10,
        customDomainCount: 8,
        genericDomainCount: 2,
        overallProfessionalScore: 85,
        emailsByDomain: {
          'company.com': Array(8).fill('user@company.com'),
          'gmail.com': Array(2).fill('personal@gmail.com')
        }
      };

      (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockResolvedValue(mockDomainAnalysis);

      const observations = await businessObservationService.generateBusinessObservations(mockUserId, mockCompanyId);

      const securityObservation = observations.find(obs => obs.category === 'Email Security');
      expect(securityObservation).toBeDefined();
      expect(securityObservation?.type).toBe('opportunity');
      expect(securityObservation?.title).toBe('Email Security Enhancement Opportunity');
      expect(securityObservation?.insights).toContain('DMARC, SPF, and DKIM records prevent email spoofing');
      expect(securityObservation?.actionItems).toContain('Configure DMARC, SPF, and DKIM DNS records');
    });

    it('should not generate professional email opportunity for businesses already using professional email', async () => {
      const mockDomainAnalysis = {
        totalEmails: 15,
        customDomainCount: 15,
        genericDomainCount: 0,
        overallProfessionalScore: 95,
        emailsByDomain: {
          'company.com': Array(15).fill('user@company.com')
        }
      };

      (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockResolvedValue(mockDomainAnalysis);

      const observations = await businessObservationService.generateBusinessObservations(mockUserId, mockCompanyId);

      const emailOpportunity = observations.find(obs => 
        obs.category === 'Business Credibility' && obs.type === 'opportunity'
      );
      expect(emailOpportunity).toBeUndefined();

      // Should still have email security recommendation
      const emailSecurity = observations.find(obs => obs.category === 'Email Security');
      expect(emailSecurity).toBeDefined();
    });

    it('should generate integration opportunity observation for businesses with few integrations', async () => {
      // Mock domain analysis to return generic email usage
      const mockDomainAnalysis = {
        totalEmails: 5,
        customDomainCount: 0,
        genericDomainCount: 5,
        overallProfessionalScore: 30,
        emailsByDomain: {
          'gmail.com': Array(5).fill('user@gmail.com')
        }
      };

      (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockResolvedValue(mockDomainAnalysis);

      // Mock supabase to return few integrations
      const supabaseMock = jest.requireMock('../../../src/lib/supabase');
      supabaseMock.supabase.from.mockImplementation((table: string) => {
        if (table === 'ai_integrations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ id: 1, name: 'Basic Integration' }] // Only 1 integration
                })
              })
            })
          };
        }
        if (table === 'ai_user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { security_settings: { mfa_enabled: false } } // MFA not enabled
                })
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn()
          })
        };
      });

      const observations = await businessObservationService.generateBusinessObservations(mockUserId, mockCompanyId);

      const integrationObservation = observations.find(obs => obs.category === 'Business Automation');
      expect(integrationObservation).toBeDefined();
      expect(integrationObservation?.type).toBe('opportunity');
      expect(integrationObservation?.title).toBe('Integration Opportunities Detected');
      expect(integrationObservation?.insights).toContain('Businesses with 5+ integrations report 40% time savings');
      expect(integrationObservation?.actionItems).toContain('Connect your CRM for automated lead tracking');
    });

    it('should sort observations by priority and confidence', async () => {
      const mockDomainAnalysis = {
        totalEmails: 50,
        customDomainCount: 0,
        genericDomainCount: 50,
        overallProfessionalScore: 25,
        emailsByDomain: {
          'gmail.com': Array(50).fill('user@gmail.com')
        }
      };

      (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockResolvedValue(mockDomainAnalysis);

      const observations = await businessObservationService.generateBusinessObservations(mockUserId, mockCompanyId);

      // Should be sorted by priority (critical > high > medium > low) then confidence
      for (let i = 0; i < observations.length - 1; i++) {
        const current = observations[i];
        const next = observations[i + 1];
        
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const currentPriorityValue = priorityOrder[current.priority];
        const nextPriorityValue = priorityOrder[next.priority];
        
        if (currentPriorityValue === nextPriorityValue) {
          expect(current.confidence).toBeGreaterThanOrEqual(next.confidence);
        } else {
          expect(currentPriorityValue).toBeGreaterThanOrEqual(nextPriorityValue);
        }
      }
    });

    it('should handle errors gracefully', async () => {
      (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

      // Mock Supabase to also fail
      const supabaseMock = jest.requireMock('../../../src/lib/supabase');
      supabaseMock.supabase.from.mockImplementation(() => {
        throw new Error('Database error');
      });

      const observations = await businessObservationService.generateBusinessObservations(mockUserId, mockCompanyId);

      expect(observations).toEqual([]); // Should return empty array on error
    });
  });

  describe('getBusinessInsights', () => {
    it('should convert observations to BusinessInsight format', async () => {
      const mockDomainAnalysis = {
        totalEmails: 10,
        customDomainCount: 0,
        genericDomainCount: 10,
        overallProfessionalScore: 30,
        emailsByDomain: {
          'gmail.com': Array(10).fill('user@gmail.com')
        }
      };

      (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockResolvedValue(mockDomainAnalysis);

      const insights = await businessObservationService.getBusinessInsights(mockUserId, mockCompanyId);

      expect(insights).toHaveLength(4);
      
      const emailInsight = insights.find(insight => insight.category === 'Business Credibility');
      expect(emailInsight).toBeDefined();
      expect(emailInsight?.type).toBe('opportunity');
      expect(emailInsight?.metrics.impact).toBeGreaterThan(0);
      expect(emailInsight?.metrics.confidence).toBe(0.92);
      expect(emailInsight?.suggestedActions).toHaveLength(5);
      expect(emailInsight?.automationPotential).toBeDefined();
      expect(emailInsight?.status).toBe('active');
    });

    it('should filter insights by page relevance when pageId provided', async () => {
      const mockDomainAnalysis = {
        totalEmails: 5,
        customDomainCount: 0,
        genericDomainCount: 5,
        overallProfessionalScore: 30,
        emailsByDomain: {
          'gmail.com': Array(5).fill('user@gmail.com')
        }
      };

      (domainAnalysisModule.domainAnalysisService.analyzeUserEmailDomains as jest.Mock).mockResolvedValue(mockDomainAnalysis);

      const dashboardInsights = await businessObservationService.getBusinessInsights(mockUserId, mockCompanyId, 'dashboard');
      const settingsInsights = await businessObservationService.getBusinessInsights(mockUserId, mockCompanyId, 'settings');

      expect(dashboardInsights.length).toBeGreaterThan(0);
      expect(settingsInsights.length).toBeGreaterThan(0);
      
      // All insights should be relevant to the specified page
      dashboardInsights.forEach(insight => {
        expect(insight.context.pageRelevance).toContain('dashboard');
      });
      
      settingsInsights.forEach(insight => {
        expect(insight.context.pageRelevance).toContain('settings');
      });
    });
  });

  describe('calculateEmailUpgradeValue', () => {
    it('should calculate higher value for larger businesses', async () => {
      const service = businessObservationService as any;

      const smallBusiness = { totalEmails: 10, genericDomainCount: 10 };
      const mediumBusiness = { totalEmails: 60, genericDomainCount: 60 };
      const largeBusiness = { totalEmails: 120, genericDomainCount: 120 };

      const smallValue = service.calculateEmailUpgradeValue(smallBusiness);
      const mediumValue = service.calculateEmailUpgradeValue(mediumBusiness);
      const largeValue = service.calculateEmailUpgradeValue(largeBusiness);

      expect(mediumValue).toBeGreaterThan(smallValue);
      expect(largeValue).toBeGreaterThan(mediumValue);
    });
  });
});