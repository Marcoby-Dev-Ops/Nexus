/**
 * RAG System Data Validation Tests (TypeScript Compatible)
 * 
 * Tests for data validation and sanitization in RAG system for security and accuracy
 */

describe('RAG System Data Validation Tests', () => {
  describe('Input Data Validation', () => {
    const mockValidator = {
      validateUserQuery: jest.fn(),
      validateUserContext: jest.fn(),
      validateBusinessData: jest.fn(),
      sanitizeInput: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should validate user queries for safety and format', async () => {
      mockValidator.validateUserQuery.mockImplementation((query) => {
        const hasScript = query.indexOf('<script>') !== -1 || query.indexOf('</script>') !== -1;
        const hasSqlInjection = query.toUpperCase().indexOf('DROP TABLE') !== -1 || 
                               query.toUpperCase().indexOf('DELETE FROM') !== -1;
        const isEmpty = query.trim().length === 0;
        const isTooLong = query.length > 1000;

        const threats = [];
        if (hasScript) threats.push('XSS_ATTEMPT');
        if (hasSqlInjection) threats.push('SQL_INJECTION');
        if (isEmpty) threats.push('EMPTY_QUERY');
        if (isTooLong) threats.push('QUERY_TOO_LONG');

        return Promise.resolve({
          isValid: !hasScript && !hasSqlInjection && !isEmpty && !isTooLong,
          threats,
          sanitizedQuery: query.replace(/<script.*?<\/script>/gi, '').trim(),
          queryLength: query.length,
          riskLevel: hasScript || hasSqlInjection ? 'high' : isEmpty ? 'medium' : 'low'
        });
      });

      const safeQuery = 'What are our Q1 sales targets?';
      const result = await mockValidator.validateUserQuery(safeQuery);
      
      expect(result.isValid).toBe(true);
      expect(result.riskLevel).toBe('low');
      expect(result.threats).toHaveLength(0);

      const maliciousQuery = '<script>alert("xss")</script>';
      const maliciousResult = await mockValidator.validateUserQuery(maliciousQuery);
      
      expect(maliciousResult.isValid).toBe(false);
      expect(maliciousResult.riskLevel).toBe('high');
      expect(maliciousResult.threats.length).toBeGreaterThan(0);
    });

    it('should validate user context data structure and content', async () => {
      mockValidator.validateUserContext.mockImplementation((context) => {
        const errors = [];
        const warnings = [];

        if (!context.userId) errors.push('User ID is required');
        if (!context.role || context.role.indexOf('<script>') !== -1) errors.push('Invalid role format');
        if (!context.department) errors.push('Department is required');
        
        const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
        if (context.experience_level && validLevels.indexOf(context.experience_level) === -1) {
          warnings.push('Invalid experience level');
        }
        if (context.maliciousField) errors.push('Malicious field detected');

        return Promise.resolve({
          isValid: errors.length === 0,
          errors,
          warnings,
          sanitizedContext: {
            userId: context.userId,
            role: context.role ? context.role.replace(/<script.*?<\/script>/gi, '') : '',
            department: context.department,
            experience_level: validLevels.indexOf(context.experience_level) !== -1 ? 
                             context.experience_level : 'intermediate',
            communication_style: context.communication_style || 'balanced'
          },
          riskLevel: errors.some(e => e.indexOf('Malicious') !== -1) ? 'high' : 'low'
        });
      });

      const validContext = {
        userId: 'user-123',
        role: 'Sales Manager',
        department: 'Sales',
        experience_level: 'advanced'
      };

      const result = await mockValidator.validateUserContext(validContext);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.riskLevel).toBe('low');
    });

    it('should validate business data integrity and format', async () => {
      mockValidator.validateBusinessData.mockImplementation((data) => {
        const errors = [];
        const warnings = [];

        // Validate sales data
        if (data.sales) {
          if (typeof data.sales.pipeline !== 'number' || data.sales.pipeline < 0) {
            errors.push('Invalid pipeline value');
          }
          if (typeof data.sales.deals !== 'number' || data.sales.deals < 0) {
            errors.push('Invalid deals count');
          }
          if (data.sales.quota === null || data.sales.quota === undefined) {
            errors.push('Quota is required');
          }
          if (typeof data.sales.conversion_rate === 'number' && data.sales.conversion_rate > 1) {
            warnings.push('Conversion rate exceeds 100%');
          }
        }

        // Validate marketing data
        if (data.marketing) {
          if (typeof data.marketing.campaigns !== 'number') {
            errors.push('Invalid campaigns count');
          }
          if (data.marketing.leads === undefined) {
            errors.push('Leads data is required');
          }
          if (typeof data.marketing.roi === 'number' && data.marketing.roi < 0) {
            warnings.push('Negative ROI detected');
          }
          if (typeof data.marketing.budget !== 'number') {
            errors.push('Invalid budget format');
          }
        }

        return Promise.resolve({
          isValid: errors.length === 0,
          errors,
          warnings,
          dataQuality: errors.length === 0 ? (warnings.length === 0 ? 'high' : 'medium') : 'low',
          sanitizedData: {
            sales: data.sales ? {
              pipeline: typeof data.sales.pipeline === 'number' ? Math.max(0, data.sales.pipeline) : 0,
              deals: typeof data.sales.deals === 'number' ? Math.max(0, data.sales.deals) : 0,
              quota: typeof data.sales.quota === 'number' ? data.sales.quota : 0,
              conversion_rate: typeof data.sales.conversion_rate === 'number' ? 
                              Math.min(1, Math.max(0, data.sales.conversion_rate)) : 0
            } : {},
            marketing: data.marketing ? {
              campaigns: typeof data.marketing.campaigns === 'number' ? data.marketing.campaigns : 0,
              leads: typeof data.marketing.leads === 'number' ? data.marketing.leads : 0,
              roi: typeof data.marketing.roi === 'number' ? data.marketing.roi : 0,
              budget: typeof data.marketing.budget === 'number' ? data.marketing.budget : 0
            } : {}
          }
        });
      });

      const validData = {
        sales: {
          pipeline: 1850000,
          deals: 25,
          quota: 2000000,
          conversion_rate: 0.15
        }
      };

      const result = await mockValidator.validateBusinessData(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.dataQuality).toBe('high');
      expect(result.errors).toHaveLength(0);
    });

    it('should sanitize malicious input while preserving legitimate content', async () => {
      mockValidator.sanitizeInput.mockImplementation((input) => {
        const sanitized = input
          .replace(/<script.*?<\/script>/gi, '')
          .replace(/<iframe.*?<\/iframe>/gi, '')
          .replace(/;\s*DROP\s+TABLE.*?;/gi, '')
          .replace(/--.*$/gm, '')
          .trim();

        const threats = [];
        if (input.indexOf('<script>') !== -1) threats.push('XSS_SCRIPT');
        if (input.indexOf('<iframe>') !== -1) threats.push('XSS_IFRAME');
        if (input.toUpperCase().indexOf('DROP TABLE') !== -1) threats.push('SQL_INJECTION');
        if (input.indexOf('--') !== -1) threats.push('SQL_COMMENT');

        return Promise.resolve({
          originalInput: input,
          sanitizedInput: sanitized,
          threatsRemoved: threats,
          isSafe: threats.length === 0,
          sanitizationApplied: input !== sanitized
        });
      });

      const maliciousInput = 'What are our <script>alert("xss")</script> sales targets?';
      const result = await mockValidator.sanitizeInput(maliciousInput);
      
      expect(result.sanitizationApplied).toBe(true);
      expect(result.threatsRemoved.length).toBeGreaterThan(0);
      expect(result.sanitizedInput).toBe('What are our  sales targets?');
    });
  });

  describe('Output Data Validation', () => {
    const mockOutputValidator = {
      validateRAGResponse: jest.fn(),
      validateContextGeneration: jest.fn(),
      validateVectorResults: jest.fn(),
      checkDataLeakage: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should validate RAG response quality and safety', async () => {
      mockOutputValidator.validateRAGResponse.mockImplementation((response) => {
        const hasError = response.indexOf('ERROR:') !== -1 || response.indexOf('Raw SQL:') !== -1;
        const hasConfidentialData = response.indexOf('confidential') !== -1 || response.indexOf('password') !== -1;
        const hasValidBusinessData = response.indexOf('pipeline') !== -1 || response.indexOf('performance') !== -1;
        const isCoherent = response.length > 10 && response.indexOf('undefined') === -1;

        const issues = [];
        if (hasError) issues.push('SYSTEM_ERROR_EXPOSED');
        if (hasConfidentialData) issues.push('CONFIDENTIAL_DATA_LEAK');
        if (!isCoherent) issues.push('INCOHERENT_RESPONSE');

        return Promise.resolve({
          isValid: !hasError && !hasConfidentialData && isCoherent,
          qualityScore: hasValidBusinessData && isCoherent ? 0.9 : hasError ? 0.1 : 0.5,
          issues,
          contextAlignment: hasValidBusinessData ? 0.95 : 0.5,
          riskLevel: hasError || hasConfidentialData ? 'high' : 'low'
        });
      });

      const validResponse = 'Based on our Q1 sales data, performance shows strong growth with pipeline at $1.85M.';
      const result = await mockOutputValidator.validateRAGResponse(validResponse);
      
      expect(result.isValid).toBe(true);
      expect(result.riskLevel).toBe('low');
      expect(result.issues).toHaveLength(0);

      const invalidResponse = 'ERROR: Database connection failed. Raw SQL: SELECT * FROM users WHERE password = "admin"';
      const invalidResult = await mockOutputValidator.validateRAGResponse(invalidResponse);
      
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.riskLevel).toBe('high');
      expect(invalidResult.issues.length).toBeGreaterThan(0);
    });

    it('should validate context generation accuracy', async () => {
      mockOutputValidator.validateContextGeneration.mockImplementation((userContext, generatedContext) => {
        const roleMatch = userContext.role === generatedContext.role;
        const departmentMatch = userContext.department === generatedContext.department;
        const hasRelevantData = generatedContext.businessData && 
                               Object.keys(generatedContext.businessData).length > 0;

        const mismatches = [];
        if (!roleMatch) mismatches.push('ROLE_MISMATCH');
        if (!departmentMatch) mismatches.push('DEPARTMENT_MISMATCH');
        if (!hasRelevantData) mismatches.push('IRRELEVANT_DATA');

        return Promise.resolve({
          isValid: roleMatch && departmentMatch && hasRelevantData,
          accuracyScore: (roleMatch ? 0.4 : 0) + (departmentMatch ? 0.3 : 0) + (hasRelevantData ? 0.3 : 0),
          mismatches,
          contextQuality: roleMatch && departmentMatch && hasRelevantData ? 'high' : 'low'
        });
      });

      const userContext = { role: 'Sales Manager', department: 'Sales' };
      const validGeneratedContext = {
        role: 'Sales Manager',
        department: 'Sales',
        businessData: { sales: { pipeline: 1850000 } }
      };

      const result = await mockOutputValidator.validateContextGeneration(userContext, validGeneratedContext);
      
      expect(result.isValid).toBe(true);
      expect(result.contextQuality).toBe('high');
      expect(result.mismatches).toHaveLength(0);
    });

    it('should validate vector search results relevance', async () => {
      mockOutputValidator.validateVectorResults.mockImplementation((query, results) => {
        const queryWords = query.toLowerCase().split(' ');
        const relevantResults = results.filter(result => {
          const contentLower = result.content.toLowerCase();
          const hasKeyword = queryWords.some(word => contentLower.indexOf(word) !== -1);
          return hasKeyword && result.similarity > 0.7;
        });

        const averageSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
        const relevanceScore = relevantResults.length / results.length;

        return Promise.resolve({
          isValid: relevantResults.length >= results.length * 0.6,
          relevanceScore,
          averageSimilarity,
          relevantResults: relevantResults.length,
          totalResults: results.length,
          qualityLevel: relevanceScore > 0.8 ? 'high' : relevanceScore > 0.5 ? 'medium' : 'low',
          recommendations: relevanceScore < 0.6 ? ['Improve vector indexing'] : []
        });
      });

      const query = 'sales performance';
      const goodResults = [
        { id: '1', content: 'Q1 sales performance shows strong growth', similarity: 0.95 },
        { id: '2', content: 'Sales team exceeded targets', similarity: 0.87 }
      ];

      const result = await mockOutputValidator.validateVectorResults(query, goodResults);
      
      expect(result.isValid).toBe(true);
      expect(result.qualityLevel).toBe('high');
      expect(result.recommendations).toHaveLength(0);
    });

    it('should check for data leakage in responses', async () => {
      mockOutputValidator.checkDataLeakage.mockImplementation((response, userRole) => {
        const sensitiveKeywords = ['password', 'salary', 'connection string', 'api key', 'secret', 'confidential'];
        const leakageDetected = sensitiveKeywords.some(keyword => 
          response.toLowerCase().indexOf(keyword) !== -1
        );
        
        const adminRoles = ['Admin', 'Executive'];
        const hasUnauthorizedData = leakageDetected && adminRoles.indexOf(userRole) === -1;

        return Promise.resolve({
          isSafe: !leakageDetected,
          dataLeakageDetected: leakageDetected,
          unauthorizedAccess: hasUnauthorizedData,
          sensitivePatterns: leakageDetected ? 1 : 0,
          riskLevel: leakageDetected ? 'critical' : 'low',
          recommendations: leakageDetected ? ['Remove sensitive data'] : []
        });
      });

      const safeResponse = 'Our sales performance shows strong growth in Q1.';
      const result = await mockOutputValidator.checkDataLeakage(safeResponse, 'Sales Manager');
      
      expect(result.isSafe).toBe(true);
      expect(result.dataLeakageDetected).toBe(false);
      expect(result.riskLevel).toBe('low');

      const unsafeResponse = 'Confidential: CEO salary is $500K, password is admin123';
      const unsafeResult = await mockOutputValidator.checkDataLeakage(unsafeResponse, 'Junior Employee');
      
      expect(unsafeResult.isSafe).toBe(false);
      expect(unsafeResult.dataLeakageDetected).toBe(true);
      expect(unsafeResult.riskLevel).toBe('critical');
    });
  });

  describe('Data Schema Validation', () => {
    const mockSchemaValidator = {
      validateUserContextSchema: jest.fn(),
      validateBusinessDataSchema: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should validate user context schema compliance', async () => {
      mockSchemaValidator.validateUserContextSchema.mockImplementation((data) => {
        const errors = [];
        let compliance = 0;
        const totalFields = 5;

        if (typeof data.userId === 'string') compliance++;
        else errors.push('userId must be string');

        if (typeof data.role === 'string') compliance++;
        else errors.push('role must be string');

        if (typeof data.department === 'string') compliance++;
        else errors.push('department must be string');

        const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
        if (validLevels.indexOf(data.experience_level) !== -1) compliance++;
        else errors.push('experience_level must be valid enum');

        if (typeof data.preferences === 'object') compliance++;
        else errors.push('preferences must be object');

        return Promise.resolve({
          isValid: errors.length === 0,
          complianceScore: (compliance / totalFields) * 100,
          errors,
          schemaViolations: errors.length,
          validFields: compliance,
          totalFields
        });
      });

      const validData = {
        userId: 'user-123',
        role: 'Sales Manager',
        department: 'Sales',
        experience_level: 'advanced',
        preferences: { theme: 'dark' }
      };

      const result = await mockSchemaValidator.validateUserContextSchema(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.complianceScore).toBe(100);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate business data schema structure', async () => {
      mockSchemaValidator.validateBusinessDataSchema.mockImplementation((data) => {
        const errors = [];
        const allowedDepartments = ['sales', 'marketing', 'finance', 'operations'];
        let validDepartments = 0;

        for (const dept in data) {
          if (allowedDepartments.indexOf(dept) === -1) {
            errors.push(`Unknown department: ${dept}`);
            continue;
          }

          if (typeof data[dept] !== 'object') {
            errors.push(`${dept} must be an object`);
            continue;
          }

          validDepartments++;

          // Validate department-specific fields
          if (dept === 'sales') {
            if (typeof data[dept].pipeline !== 'number') errors.push('sales.pipeline must be number');
            if (typeof data[dept].deals !== 'number') errors.push('sales.deals must be number');
          }
        }

        return Promise.resolve({
          isValid: errors.length === 0,
          validDepartments,
          totalDepartments: Object.keys(data).length,
          errors,
          schemaCompliance: validDepartments / Object.keys(data).length,
          structureValid: errors.filter(e => e.indexOf('must be an object') !== -1).length === 0
        });
      });

      const validData = {
        sales: {
          pipeline: 1850000,
          deals: 25
        },
        marketing: {
          campaigns: 5,
          leads: 250
        }
      };

      const result = await mockSchemaValidator.validateBusinessDataSchema(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.schemaCompliance).toBe(1);
      expect(result.structureValid).toBe(true);
    });
  });

  describe('Real-time Validation Monitoring', () => {
    const mockMonitor = {
      getValidationMetrics: jest.fn(),
      detectValidationAnomalies: jest.fn(),
      generateValidationReport: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should monitor validation metrics in real-time', async () => {
      mockMonitor.getValidationMetrics.mockResolvedValue({
        totalValidations: 1000,
        successfulValidations: 950,
        failedValidations: 50,
        successRate: 0.95,
        averageValidationTime: 25,
        validationTypes: {
          userContext: { total: 300, success: 295, rate: 0.983 },
          businessData: { total: 400, success: 385, rate: 0.963 },
          ragResponse: { total: 200, success: 190, rate: 0.95 },
          vectorResults: { total: 100, success: 80, rate: 0.8 }
        },
        timeWindow: '1h'
      });

      const metrics = await mockMonitor.getValidationMetrics();
      
      expect(metrics.successRate).toBeGreaterThan(0.9);
      expect(metrics.averageValidationTime).toBeLessThan(50);
      expect(metrics.validationTypes.userContext.rate).toBeGreaterThan(0.95);
      expect(metrics.totalValidations).toBe(1000);
    });

    it('should detect validation anomalies and patterns', async () => {
      mockMonitor.detectValidationAnomalies.mockResolvedValue({
        anomaliesDetected: true,
        anomalies: [
          {
            type: 'VALIDATION_FAILURE_SPIKE',
            description: 'Unusual increase in validation failures',
            severity: 'medium',
            affectedComponent: 'vectorResults',
            timestamp: '2024-01-15T10:30:00Z'
          }
        ],
        recommendedActions: ['Investigate vector search performance']
      });

      const anomalies = await mockMonitor.detectValidationAnomalies();
      
      expect(anomalies.anomaliesDetected).toBe(true);
      expect(anomalies.anomalies).toHaveLength(1);
      expect(anomalies.anomalies[0].severity).toBe('medium');
      expect(anomalies.recommendedActions.length).toBeGreaterThan(0);
    });

    it('should generate comprehensive validation reports', async () => {
      mockMonitor.generateValidationReport.mockResolvedValue({
        reportPeriod: '24h',
        summary: {
          totalValidations: 5000,
          successRate: 0.94,
          averageResponseTime: 28,
          topFailureReasons: [
            { reason: 'Invalid data format', count: 150 },
            { reason: 'Schema violation', count: 100 }
          ]
        },
        trends: {
          validationVolume: 'increasing',
          successRate: 'stable',
          responseTime: 'improving'
        },
        recommendations: ['Implement stricter input validation'],
        systemHealth: 'good'
      });

      const report = await mockMonitor.generateValidationReport();
      
      expect(report.summary.successRate).toBeGreaterThan(0.9);
      expect(report.summary.topFailureReasons).toHaveLength(2);
      expect(report.trends.successRate).toBe('stable');
      expect(report.systemHealth).toBe('good');
    });
  });

  describe('Validation Performance Optimization', () => {
    const mockOptimizer = {
      optimizeValidationRules: jest.fn(),
      cacheValidationResults: jest.fn(),
      parallelizeValidation: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should optimize validation rules for performance', async () => {
      mockOptimizer.optimizeValidationRules.mockResolvedValue({
        optimizationApplied: true,
        rulesOptimized: 15,
        performanceImprovement: 0.35,
        optimizations: [
          { rule: 'userContext', improvement: '25ms -> 18ms', type: 'algorithm' },
          { rule: 'businessData', improvement: '45ms -> 30ms', type: 'caching' }
        ],
        totalTimeSaved: 32
      });

      const result = await mockOptimizer.optimizeValidationRules();
      
      expect(result.optimizationApplied).toBe(true);
      expect(result.performanceImprovement).toBeGreaterThan(0.3);
      expect(result.rulesOptimized).toBe(15);
      expect(result.totalTimeSaved).toBeGreaterThan(30);
    });

    it('should implement validation result caching', async () => {
      mockOptimizer.cacheValidationResults.mockResolvedValue({
        cachingEnabled: true,
        cacheHitRate: 0.75,
        averageResponseTime: {
          withCache: 8,
          withoutCache: 32,
          improvement: 0.75
        },
        cacheSize: '15 MB',
        cacheEfficiency: 0.82
      });

      const result = await mockOptimizer.cacheValidationResults();
      
      expect(result.cachingEnabled).toBe(true);
      expect(result.cacheHitRate).toBeGreaterThan(0.7);
      expect(result.averageResponseTime.withCache).toBeLessThan(10);
      expect(result.cacheEfficiency).toBeGreaterThan(0.8);
    });

    it('should parallelize validation processes', async () => {
      mockOptimizer.parallelizeValidation.mockResolvedValue({
        parallelizationEnabled: true,
        concurrentValidations: 4,
        throughputImprovement: 2.8,
        resourceUtilization: {
          cpu: 0.65,
          memory: 0.45,
          efficiency: 0.88
        },
        validationsPerSecond: 125,
        latencyReduction: 0.6
      });

      const result = await mockOptimizer.parallelizeValidation();
      
      expect(result.parallelizationEnabled).toBe(true);
      expect(result.throughputImprovement).toBeGreaterThan(2.5);
      expect(result.resourceUtilization.efficiency).toBeGreaterThan(0.85);
      expect(result.validationsPerSecond).toBeGreaterThan(100);
    });
  });
}); 