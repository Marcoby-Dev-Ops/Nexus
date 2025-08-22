import { businessProfileService, BusinessProfile } from '@/shared/lib/business/businessProfileService';

// Mock the supabase import
jest.mock('@/core/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}));

// Mock the logger import
jest.mock('@/core/auth/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

describe('BusinessProfileService', () => {
  describe('getProfileTemplate', () => {
    it('should return a valid profile template', () => {
      const template = businessProfileService.getProfileTemplate();

      expect(template).toEqual({
        company_name: '',
        industry: '',
        business_model: '',
        company_size: 'startup',
        mission_statement: '',
        primary_services: [],
        unique_value_proposition: '',
        competitive_advantages: [],
        target_markets: [],
        ideal_client_profile: [],
        service_delivery_methods: [],
        current_clients: [],
        revenue_model: '',
        pricing_strategy: '',
        financial_goals: [],
        strategic_objectives: []
      });
    });

    it('should have correct data types for all fields', () => {
      const template = businessProfileService.getProfileTemplate();

      expect(typeof template.company_name).toBe('string');
      expect(typeof template.industry).toBe('string');
      expect(typeof template.business_model).toBe('string');
      expect(typeof template.company_size).toBe('string');
      expect(typeof template.mission_statement).toBe('string');
      expect(Array.isArray(template.primary_services)).toBe(true);
      expect(typeof template.unique_value_proposition).toBe('string');
      expect(Array.isArray(template.competitive_advantages)).toBe(true);
      expect(Array.isArray(template.target_markets)).toBe(true);
      expect(Array.isArray(template.ideal_client_profile)).toBe(true);
      expect(Array.isArray(template.service_delivery_methods)).toBe(true);
      expect(Array.isArray(template.current_clients)).toBe(true);
      expect(typeof template.revenue_model).toBe('string');
      expect(typeof template.pricing_strategy).toBe('string');
      expect(Array.isArray(template.financial_goals)).toBe(true);
      expect(Array.isArray(template.strategic_objectives)).toBe(true);
    });
  });

  describe('BusinessProfile interface', () => {
    it('should have all required fields', () => {
      const profile: BusinessProfile = {
        org_id: 'test-org-id',
        company_name: 'Test Company',
        industry: 'Technology',
        business_model: 'B2B',
        company_size: 'startup',
        mission_statement: 'Test mission',
        primary_services: ['Service 1'],
        unique_value_proposition: 'Test value prop',
        competitive_advantages: ['Advantage 1'],
        target_markets: ['Market 1'],
        ideal_client_profile: ['Client 1'],
        service_delivery_methods: ['Method 1'],
        current_clients: ['Client A'],
        revenue_model: 'Subscription',
        pricing_strategy: 'Value-based',
        financial_goals: ['Goal 1'],
        strategic_objectives: ['Objective 1']
      };

      expect(profile.org_id).toBe('test-org-id');
      expect(profile.company_name).toBe('Test Company');
      expect(profile.industry).toBe('Technology');
      expect(profile.business_model).toBe('B2B');
      expect(profile.company_size).toBe('startup');
      expect(profile.mission_statement).toBe('Test mission');
      expect(Array.isArray(profile.primary_services)).toBe(true);
      expect(profile.unique_value_proposition).toBe('Test value prop');
      expect(Array.isArray(profile.competitive_advantages)).toBe(true);
      expect(Array.isArray(profile.target_markets)).toBe(true);
      expect(Array.isArray(profile.ideal_client_profile)).toBe(true);
      expect(Array.isArray(profile.service_delivery_methods)).toBe(true);
      expect(Array.isArray(profile.current_clients)).toBe(true);
      expect(profile.revenue_model).toBe('Subscription');
      expect(profile.pricing_strategy).toBe('Value-based');
      expect(Array.isArray(profile.financial_goals)).toBe(true);
      expect(Array.isArray(profile.strategic_objectives)).toBe(true);
    });

    it('should accept valid company_size values', () => {
      const validSizes: BusinessProfile['company_size'][] = [
        'solopreneur',
        'startup',
        'small',
        'medium',
        'enterprise'
      ];

      validSizes.forEach(size => {
        const profile: BusinessProfile = {
          org_id: 'test-org-id',
          company_name: 'Test Company',
          industry: 'Technology',
          business_model: 'B2B',
          company_size: size,
          mission_statement: 'Test mission',
          primary_services: [],
          unique_value_proposition: '',
          competitive_advantages: [],
          target_markets: [],
          ideal_client_profile: [],
          service_delivery_methods: [],
          current_clients: [],
          revenue_model: '',
          pricing_strategy: '',
          financial_goals: [],
          strategic_objectives: []
        };

        expect(profile.company_size).toBe(size);
      });
    });
  });

  describe('Service methods exist', () => {
    it('should have getBusinessProfile method', () => {
      expect(typeof businessProfileService.getBusinessProfile).toBe('function');
    });

    it('should have saveBusinessProfile method', () => {
      expect(typeof businessProfileService.saveBusinessProfile).toBe('function');
    });

    it('should have deleteBusinessProfile method', () => {
      expect(typeof businessProfileService.deleteBusinessProfile).toBe('function');
    });

    it('should have getProfileTemplate method', () => {
      expect(typeof businessProfileService.getProfileTemplate).toBe('function');
    });
  });
}); 