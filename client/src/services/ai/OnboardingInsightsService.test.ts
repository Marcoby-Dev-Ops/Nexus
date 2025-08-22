import { OnboardingInsightsService, type OnboardingContext } from './OnboardingInsightsService';

describe('OnboardingInsightsService', () => {
  let service: OnboardingInsightsService;

  beforeEach(() => {
    service = new OnboardingInsightsService();
  });

  describe('generateOnboardingInsights', () => {
    it('should generate insights for a valid context', async () => {
      const context: OnboardingContext = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          company: 'TechCorp',
          industry: 'Technology',
          companySize: '10-50',
          keyPriorities: ['Revenue Growth', 'Operational Efficiency']
        },
        selectedIntegrations: ['hubspot', 'quickbooks'],
        selectedTools: {
          revenue: ['salesforce'],
          cash: ['quickbooks'],
          delivery: ['asana']
        },
        maturityScore: 45
      };

      const result = await service.generateOnboardingInsights(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Verify insight structure
      const insight = result.data[0];
      expect(insight).toHaveProperty('id');
      expect(insight).toHaveProperty('type');
      expect(insight).toHaveProperty('title');
      expect(insight).toHaveProperty('description');
      expect(insight).toHaveProperty('impact');
      expect(insight).toHaveProperty('confidence');
      expect(insight).toHaveProperty('action');
      expect(insight).toHaveProperty('reasoning');
      expect(insight).toHaveProperty('category');
    });

    it('should handle empty context gracefully', async () => {
      const context: OnboardingContext = {
        user: {
          firstName: '',
          lastName: '',
          company: '',
          industry: '',
          companySize: '',
          keyPriorities: []
        },
        selectedIntegrations: [],
        selectedTools: {},
        maturityScore: 0
      };

      const result = await service.generateOnboardingInsights(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should calculate maturity score correctly', () => {
      const context: OnboardingContext = {
        user: {
          firstName: 'Jane',
          lastName: 'Smith',
          company: 'StartupXYZ',
          industry: 'SaaS',
          companySize: '1-10',
          keyPriorities: ['Customer Acquisition', 'Product Development']
        },
        selectedIntegrations: ['hubspot'],
        selectedTools: {
          revenue: ['stripe'],
          delivery: ['notion']
        },
        maturityScore: 30
      };

      const insights = [
        {
          id: 'test-1',
          type: 'opportunity' as const,
          title: 'Test Insight',
          description: 'Test description',
          impact: 'High' as const,
          confidence: 85,
          action: 'Test action',
          reasoning: 'Test reasoning',
          category: 'Test Category'
        }
      ];

      const score = service.calculateMaturityScore(context, insights);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateMaturityScore', () => {
    it('should return base score for minimal context', () => {
      const context: OnboardingContext = {
        user: {
          firstName: '',
          lastName: '',
          company: '',
          industry: '',
          companySize: '',
          keyPriorities: []
        },
        selectedIntegrations: [],
        selectedTools: {},
        maturityScore: 0
      };

      const insights: any[] = [];

      const score = service.calculateMaturityScore(context, insights);

      expect(score).toBe(45); // Base score
    });

    it('should add points for integrations', () => {
      const context: OnboardingContext = {
        user: {
          firstName: '',
          lastName: '',
          company: '',
          industry: '',
          companySize: '',
          keyPriorities: []
        },
        selectedIntegrations: ['hubspot', 'quickbooks', 'stripe'],
        selectedTools: {},
        maturityScore: 0
      };

      const insights: any[] = [];

      const score = service.calculateMaturityScore(context, insights);

      expect(score).toBe(60); // 45 base + (3 * 5) for integrations
    });

    it('should add points for tool coverage', () => {
      const context: OnboardingContext = {
        user: {
          firstName: '',
          lastName: '',
          company: '',
          industry: '',
          companySize: '',
          keyPriorities: []
        },
        selectedIntegrations: [],
        selectedTools: {
          revenue: ['stripe'],
          cash: ['quickbooks'],
          delivery: ['asana'],
          people: ['slack']
        },
        maturityScore: 0
      };

      const insights: any[] = [];

      const score = service.calculateMaturityScore(context, insights);

      expect(score).toBe(57); // 45 base + (4 * 3) for tool categories
    });
  });
});
