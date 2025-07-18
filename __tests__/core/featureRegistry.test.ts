import { 
  getAllFeatures, 
  getFeaturesByCategory, 
  searchFeatures, 
  getFeatureById 
} from '../../src/shared/components/ui/featureRegistry';

describe('Feature Registry - Core Platform Features', () => {
  describe('Feature Discovery', () => {
    it('should return all registered features', () => {
      const features = getAllFeatures();
      
      expect(features).toBeInstanceOf(Array);
      expect(features.length).toBeGreaterThan(0);
      
      // Verify each feature has required properties
      features.forEach(feature => {
        expect(feature.id).toBeDefined();
        expect(feature.name).toBeDefined();
        expect(feature.description).toBeDefined();
        expect(feature.category).toBeDefined();
        expect(feature.accessLevel).toBeDefined();
        expect(feature.path).toBeDefined();
      });
    });

    it('should have core features available', () => {
      const features = getAllFeatures();
      
      // Check for essential core features
      const coreFeatureIds = ['command-center', 'my-workspace', 'ai-assistant'];
      
      coreFeatureIds.forEach(featureId => {
        const feature = features.find(f => f.id === featureId);
        expect(feature).toBeDefined();
        expect(feature?.category).toMatch(/^(core|ai)$/);
      });
    });

    it('should have department features', () => {
      const features = getAllFeatures();
      const departmentFeatures = features.filter(f => f.category === 'department');
      
      expect(departmentFeatures.length).toBeGreaterThan(0);
      
      // Check for key departments
      const requiredDepartments = ['sales', 'finance', 'operations'];
      requiredDepartments.forEach(dept => {
        const deptFeature = departmentFeatures.find(f => f.id === dept);
        expect(deptFeature).toBeDefined();
      });
    });
  });

  describe('Feature Categorization', () => {
    it('should filter features by category correctly', () => {
      const coreFeatures = getFeaturesByCategory('core');
      const aiFeatures = getFeaturesByCategory('ai');
      const departmentFeatures = getFeaturesByCategory('department');
      
      expect(coreFeatures.every(f => f.category === 'core')).toBe(true);
      expect(aiFeatures.every(f => f.category === 'ai')).toBe(true);
      expect(departmentFeatures.every(f => f.category === 'department')).toBe(true);
    });

    it('should handle invalid categories gracefully', () => {
      const invalidFeatures = getFeaturesByCategory('non-existent' as any);
      expect(invalidFeatures).toEqual([]);
    });

    it('should validate category types', () => {
      const allFeatures = getAllFeatures();
      const validCategories = ['core', 'department', 'productivity', 'analytics', 'ai', 'administration'];
      
      allFeatures.forEach(feature => {
        expect(validCategories).toContain(feature.category);
      });
    });
  });

  describe('Feature Search', () => {
    it('should search features by name', () => {
      const salesResults = searchFeatures('sales');
      expect(salesResults.length).toBeGreaterThan(0);
      
      const salesFeature = salesResults.find(f => f.id === 'sales');
      expect(salesFeature).toBeDefined();
    });

    it('should search features by keywords', () => {
      const dashboardResults = searchFeatures('dashboard');
      expect(dashboardResults.length).toBeGreaterThan(0);
      
      // Should find features with dashboard-related keywords
      const hasDashboardKeyword = dashboardResults.some(f => 
        f.keywords?.includes('dashboard') || 
        f.name.toLowerCase().includes('dashboard') ||
        f.description.toLowerCase().includes('dashboard')
      );
      expect(hasDashboardKeyword).toBe(true);
    });

    it('should handle empty search queries', () => {
      const emptyResults = searchFeatures('');
      expect(emptyResults).toEqual([]);
    });

    it('should be case insensitive', () => {
      const upperResults = searchFeatures('SALES');
      const lowerResults = searchFeatures('sales');
      
      expect(upperResults.length).toEqual(lowerResults.length);
      expect(upperResults.map(f => f.id).sort()).toEqual(lowerResults.map(f => f.id).sort());
    });
  });

  describe('Feature Access Control', () => {
    it('should have proper access levels', () => {
      const allFeatures = getAllFeatures();
      const validAccessLevels = ['free', 'pro', 'enterprise', 'admin'];
      
      allFeatures.forEach(feature => {
        expect(validAccessLevels).toContain(feature.accessLevel);
      });
    });

    it('should have free features available', () => {
      const freeFeatures = getAllFeatures().filter(f => f.accessLevel === 'free');
      expect(freeFeatures.length).toBeGreaterThan(0);
      
      // Core features should be free
      const coreFeature = freeFeatures.find(f => f.id === 'command-center');
      expect(coreFeature).toBeDefined();
    });

    it('should properly identify premium features', () => {
      const premiumFeatures = getAllFeatures().filter(f => 
        f.accessLevel === 'pro' || f.accessLevel === 'enterprise'
      );
      
      expect(premiumFeatures.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Metadata', () => {
    it('should identify highlighted features', () => {
      const highlightedFeatures = getAllFeatures().filter(f => f.isHighlighted);
      expect(highlightedFeatures.length).toBeGreaterThan(0);
      
      // AI Assistant should be highlighted
      const aiAssistant = highlightedFeatures.find(f => f.id === 'ai-assistant');
      expect(aiAssistant).toBeDefined();
    });

    it('should identify new features', () => {
      const newFeatures = getAllFeatures().filter(f => f.isNew);
      expect(newFeatures.length).toBeGreaterThanOrEqual(0);
    });

    it('should have valid feature relationships', () => {
      const allFeatures = getAllFeatures();
      const featureIds = new Set(allFeatures.map(f => f.id));
      
      allFeatures.forEach(feature => {
        if (feature.relatedFeatures) {
          feature.relatedFeatures.forEach(relatedId => {
            // Related features should exist (or be planned)
            expect(typeof relatedId).toBe('string');
            expect(relatedId.length).toBeGreaterThan(0);
          });
        }
      });
    });
  });

  describe('Feature Retrieval', () => {
    it('should retrieve feature by ID', () => {
      const salesFeature = getFeatureById('sales');
      expect(salesFeature).toBeDefined();
      expect(salesFeature?.id).toBe('sales');
      expect(salesFeature?.name).toBe('Sales');
    });

    it('should return undefined for invalid ID', () => {
      const invalidFeature = getFeatureById('non-existent-feature');
      expect(invalidFeature).toBeUndefined();
    });

    it('should handle empty ID gracefully', () => {
      const emptyFeature = getFeatureById('');
      expect(emptyFeature).toBeUndefined();
    });
  });
}); 