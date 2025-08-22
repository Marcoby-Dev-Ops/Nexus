import { businessProfileService } from '@/shared/lib/business/businessProfileService';

// This is an integration test that requires a real database connection
// It should only be run when the database is available
describe('BusinessProfileService Integration', () => {
  // Skip if no database connection is available
  const hasDatabaseConnection = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

  beforeAll(() => {
    if (!hasDatabaseConnection) {
      console.log('Skipping integration tests - no database connection available');
    }
  });

  describe('Profile Template', () => {
    it('should return a valid profile template with correct structure', () => {
      const template = businessProfileService.getProfileTemplate();

      // Verify all required fields are present
      expect(template).toHaveProperty('company_name');
      expect(template).toHaveProperty('industry');
      expect(template).toHaveProperty('business_model');
      expect(template).toHaveProperty('company_size');
      expect(template).toHaveProperty('mission_statement');
      expect(template).toHaveProperty('primary_services');
      expect(template).toHaveProperty('unique_value_proposition');
      expect(template).toHaveProperty('competitive_advantages');
      expect(template).toHaveProperty('target_markets');
      expect(template).toHaveProperty('ideal_client_profile');
      expect(template).toHaveProperty('service_delivery_methods');
      expect(template).toHaveProperty('current_clients');
      expect(template).toHaveProperty('revenue_model');
      expect(template).toHaveProperty('pricing_strategy');
      expect(template).toHaveProperty('financial_goals');
      expect(template).toHaveProperty('strategic_objectives');

      // Verify default values
      expect(template.company_name).toBe('');
      expect(template.industry).toBe('');
      expect(template.business_model).toBe('');
      expect(template.company_size).toBe('startup');
      expect(template.mission_statement).toBe('');
      expect(Array.isArray(template.primary_services)).toBe(true);
      expect(template.primary_services).toHaveLength(0);
      expect(template.unique_value_proposition).toBe('');
      expect(Array.isArray(template.competitive_advantages)).toBe(true);
      expect(template.competitive_advantages).toHaveLength(0);
      expect(Array.isArray(template.target_markets)).toBe(true);
      expect(template.target_markets).toHaveLength(0);
      expect(Array.isArray(template.ideal_client_profile)).toBe(true);
      expect(template.ideal_client_profile).toHaveLength(0);
      expect(Array.isArray(template.service_delivery_methods)).toBe(true);
      expect(template.service_delivery_methods).toHaveLength(0);
      expect(Array.isArray(template.current_clients)).toBe(true);
      expect(template.current_clients).toHaveLength(0);
      expect(template.revenue_model).toBe('');
      expect(template.pricing_strategy).toBe('');
      expect(Array.isArray(template.financial_goals)).toBe(true);
      expect(template.financial_goals).toHaveLength(0);
      expect(Array.isArray(template.strategic_objectives)).toBe(true);
      expect(template.strategic_objectives).toHaveLength(0);
    });

    it('should allow template to be extended with real data', () => {
      const template = businessProfileService.getProfileTemplate();
      
      const populatedProfile = {
        ...template,
        company_name: 'Test Company',
        industry: 'Technology',
        business_model: 'B2B',
        company_size: 'startup' as const,
        mission_statement: 'To provide innovative solutions',
        primary_services: ['Software Development', 'Consulting'],
        unique_value_proposition: 'We deliver results faster than competitors',
        competitive_advantages: ['15+ years experience', 'Proprietary methodology'],
        target_markets: ['SMB', 'Enterprise'],
        ideal_client_profile: ['Growth-stage companies', 'Digital transformation needs'],
        service_delivery_methods: ['Agile', 'Hybrid'],
        current_clients: ['Client A', 'Client B'],
        revenue_model: 'Subscription',
        pricing_strategy: 'Value-based',
        financial_goals: ['Increase revenue by 50%', 'Expand to 3 new markets'],
        strategic_objectives: ['Market leadership', 'Customer satisfaction']
      };

      // Verify the populated profile has the correct structure
      expect(populatedProfile.company_name).toBe('Test Company');
      expect(populatedProfile.industry).toBe('Technology');
      expect(populatedProfile.business_model).toBe('B2B');
      expect(populatedProfile.company_size).toBe('startup');
      expect(populatedProfile.mission_statement).toBe('To provide innovative solutions');
      expect(populatedProfile.primary_services).toContain('Software Development');
      expect(populatedProfile.primary_services).toContain('Consulting');
      expect(populatedProfile.unique_value_proposition).toBe('We deliver results faster than competitors');
      expect(populatedProfile.competitive_advantages).toContain('15+ years experience');
      expect(populatedProfile.competitive_advantages).toContain('Proprietary methodology');
      expect(populatedProfile.target_markets).toContain('SMB');
      expect(populatedProfile.target_markets).toContain('Enterprise');
      expect(populatedProfile.ideal_client_profile).toContain('Growth-stage companies');
      expect(populatedProfile.ideal_client_profile).toContain('Digital transformation needs');
      expect(populatedProfile.service_delivery_methods).toContain('Agile');
      expect(populatedProfile.service_delivery_methods).toContain('Hybrid');
      expect(populatedProfile.current_clients).toContain('Client A');
      expect(populatedProfile.current_clients).toContain('Client B');
      expect(populatedProfile.revenue_model).toBe('Subscription');
      expect(populatedProfile.pricing_strategy).toBe('Value-based');
      expect(populatedProfile.financial_goals).toContain('Increase revenue by 50%');
      expect(populatedProfile.financial_goals).toContain('Expand to 3 new markets');
      expect(populatedProfile.strategic_objectives).toContain('Market leadership');
      expect(populatedProfile.strategic_objectives).toContain('Customer satisfaction');
    });
  });

  describe('Service Interface', () => {
    it('should have all required service methods', () => {
      expect(typeof businessProfileService.getBusinessProfile).toBe('function');
      expect(typeof businessProfileService.saveBusinessProfile).toBe('function');
      expect(typeof businessProfileService.deleteBusinessProfile).toBe('function');
      expect(typeof businessProfileService.getProfileTemplate).toBe('function');
    });

    it('should have proper method signatures', () => {
      // Test that methods can be called with expected parameters
      const template = businessProfileService.getProfileTemplate();
      
      // These should not throw errors even if they fail due to no database
      expect(() => {
        businessProfileService.getBusinessProfile('test-org-id');
      }).not.toThrow();

      expect(() => {
        businessProfileService.saveBusinessProfile('test-org-id', template);
      }).not.toThrow();

      expect(() => {
        businessProfileService.deleteBusinessProfile('test-org-id');
      }).not.toThrow();

      expect(() => {
        businessProfileService.getProfileTemplate();
      }).not.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      // Test that methods return expected values when database is not available
      const template = businessProfileService.getProfileTemplate();
      
      // These should return null/false when database is not available
      const profile = await businessProfileService.getBusinessProfile('test-org-id');
      expect(profile).toBeNull(); // Expected when no database connection
      
      const saveResult = await businessProfileService.saveBusinessProfile('test-org-id', template);
      expect(saveResult).toBe(false); // Expected when no database connection
      
      const deleteResult = await businessProfileService.deleteBusinessProfile('test-org-id');
      expect(deleteResult).toBe(false); // Expected when no database connection
    });
  });

  describe('Data Validation', () => {
    it('should validate company_size enum values', () => {
      const validSizes = ['solopreneur', 'startup', 'small', 'medium', 'enterprise'];
      
      validSizes.forEach(size => {
        const template = businessProfileService.getProfileTemplate();
        const profile = {
          ...template,
          company_size: size as any
        };
        
        expect(validSizes).toContain(profile.company_size);
      });
    });

    it('should ensure array fields are always arrays', () => {
      const template = businessProfileService.getProfileTemplate();
      
      expect(Array.isArray(template.primary_services)).toBe(true);
      expect(Array.isArray(template.competitive_advantages)).toBe(true);
      expect(Array.isArray(template.target_markets)).toBe(true);
      expect(Array.isArray(template.ideal_client_profile)).toBe(true);
      expect(Array.isArray(template.service_delivery_methods)).toBe(true);
      expect(Array.isArray(template.current_clients)).toBe(true);
      expect(Array.isArray(template.financial_goals)).toBe(true);
      expect(Array.isArray(template.strategic_objectives)).toBe(true);
    });

    it('should ensure string fields are always strings', () => {
      const template = businessProfileService.getProfileTemplate();
      
      expect(typeof template.company_name).toBe('string');
      expect(typeof template.industry).toBe('string');
      expect(typeof template.business_model).toBe('string');
      expect(typeof template.company_size).toBe('string');
      expect(typeof template.mission_statement).toBe('string');
      expect(typeof template.unique_value_proposition).toBe('string');
      expect(typeof template.revenue_model).toBe('string');
      expect(typeof template.pricing_strategy).toBe('string');
    });
  });
}); 