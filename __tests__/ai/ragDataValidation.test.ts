/**
 * RAG System Data Validation Tests
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
      const testQueries = [
        { query: 'What are our Q1 sales targets?', expected: true },
        { query: '<script>alert("xss")</script>', expected: false },
        { query: 'DROP TABLE users; SELECT * FROM passwords;', expected: false },
        { query: 'Show me business performance metrics', expected: true },
        { query: '', expected: false }
      ];

      mockValidator.validateUserQuery.mockImplementation((query) => {
        const hasScript = query.includes('<script>') || query.includes('</script>');
        const hasSqlInjection = query.toUpperCase().includes('DROP TABLE') || 
                               query.toUpperCase().includes('DELETE FROM');
        const isEmpty = query.trim().length === 0;
        const isTooLong = query.length > 1000;

        return Promise.resolve({
          isValid: !hasScript && !hasSqlInjection && !isEmpty && !isTooLong,
          threats: [
            ...(hasScript ? ['XSS_ATTEMPT'] : []),
            ...(hasSqlInjection ? ['SQL_INJECTION'] : []),
            ...(isEmpty ? ['EMPTY_QUERY'] : []),
            ...(isTooLong ? ['QUERY_TOO_LONG'] : [])
          ],
          sanitizedQuery: query.replace(/<script.*?<\/script>/gi, '').trim(),
          queryLength: query.length,
          riskLevel: hasScript || hasSqlInjection ? 'high' : isEmpty ? 'medium' : 'low'
        });
      });

      for (const testCase of testQueries) {
        const result = await mockValidator.validateUserQuery(testCase.query);
        
        if (testCase.expected) {
          expect(result.isValid).toBe(true);
          expect(result.riskLevel).toBe('low');
          expect(result.threats).toHaveLength(0);
        } else {
          expect(result.isValid).toBe(false);
          expect(result.threats.length).toBeGreaterThan(0);
        }
      }
    });

    it('should validate user context data structure and content', async () => {
      const validUserContext = {
        userId: 'user-123',
        role: 'Sales Manager',
        department: 'Sales',
        experience_level: 'advanced',
        communication_style: 'detailed',
        preferences: {
          language: 'en',
          timezone: 'UTC'
        }
      };

      const invalidUserContext = {
        userId: null,
        role: '<script>alert("xss")</script>',
        department: '',
        experience_level: 'invalid_level',
        maliciousField: 'DROP TABLE users'
      };

      mockValidator.validateUserContext.mockImplementation((context) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!context.userId) errors.push('User ID is required');
        if (!context.role || context.role.includes('<script>')) errors.push('Invalid role format');
        if (!context.department) errors.push('Department is required');
        if (context.experience_level && ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(context.experience_level) === -1) {
          warnings.push('Invalid experience level');
        }
        if (context.maliciousField) errors.push('Malicious field detected');

        return Promise.resolve({
          isValid: errors.length === 0,
          errors,
          warnings,
          sanitizedContext: {
            userId: context.userId,
            role: context.role?.replace(/<script.*?<\/script>/gi, ''),
            department: context.department,
            experience_level: ['beginner', 'intermediate', 'advanced', 'expert'].includes(context.experience_level) ? 
                             context.experience_level : 'intermediate',
            communication_style: context.communication_style || 'balanced'
          },
          riskLevel: errors.some(e => e.includes('Malicious')) ? 'high' : 'low'
        });
      });

      const validResult = await mockValidator.validateUserContext(validUserContext);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      expect(validResult.riskLevel).toBe('low');

      const invalidResult = await mockValidator.validateUserContext(invalidUserContext);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
      expect(invalidResult.riskLevel).toBe('high');
    });

    it('should validate business data integrity and format', async () => {
      const validBusinessData = {
        sales: {
          pipeline: 1850000,
          deals: 25,
          quota: 2000000,
          conversion_rate: 0.15
        },
        marketing: {
          campaigns: 5,
          leads: 250,
          roi: 3.2,
          budget: 50000
        }
      };

      const invalidBusinessData = {
        sales: {
          pipeline: 'invalid_number',
          deals: -5,
          quota: null,
          conversion_rate: 1.5 // > 100%
        },
        marketing: {
          campaigns: 'not_a_number',
          leads: undefined,
          roi: -2.5,
          budget: 'unlimited'
        }
      };

      mockValidator.validateBusinessData.mockImplementation((data) => {
        const errors: string[] = [];
        const warnings: string[] = [];

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
            sales: {
              pipeline: typeof data.sales?.pipeline === 'number' ? Math.max(0, data.sales.pipeline) : 0,
              deals: typeof data.sales?.deals === 'number' ? Math.max(0, data.sales.deals) : 0,
              quota: typeof data.sales?.quota === 'number' ? data.sales.quota : 0,
              conversion_rate: typeof data.sales?.conversion_rate === 'number' ? 
                              Math.min(1, Math.max(0, data.sales.conversion_rate)) : 0
            },
            marketing: {
              campaigns: typeof data.marketing?.campaigns === 'number' ? data.marketing.campaigns : 0,
              leads: typeof data.marketing?.leads === 'number' ? data.marketing.leads : 0,
              roi: typeof data.marketing?.roi === 'number' ? data.marketing.roi : 0,
              budget: typeof data.marketing?.budget === 'number' ? data.marketing.budget : 0
            }
          }
        });
      });

      const validResult = await mockValidator.validateBusinessData(validBusinessData);
      expect(validResult.isValid).toBe(true);
      expect(validResult.dataQuality).toBe('high');
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = await mockValidator.validateBusinessData(invalidBusinessData);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.dataQuality).toBe('low');
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should sanitize malicious input while preserving legitimate content', async () => {
      const testInputs = [
        {
          input: 'What are our <script>alert("xss")</script> sales targets?',
          expected: 'What are our  sales targets?'
        },
        {
          input: 'Show me revenue; DROP TABLE users; --',
          expected: 'Show me revenue'
        },
        {
          input: 'Business performance <iframe src="evil.com"></iframe> analysis',
          expected: 'Business performance  analysis'
        },
        {
          input: 'Normal business query about Q1 results',
          expected: 'Normal business query about Q1 results'
        }
      ];

      mockValidator.sanitizeInput.mockImplementation((input) => {
        const sanitized = input
          .replace(/<script.*?<\/script>/gi, '')
          .replace(/<iframe.*?<\/iframe>/gi, '')
          .replace(/;\s*DROP\s+TABLE.*?(;|$)/gi, '')
          .replace(/--.*$/gm, '')
          .trim();

        const threatsRemoved = [
          ...(input.includes('<script>') ? ['XSS_SCRIPT'] : []),
          ...(input.includes('<iframe') ? ['XSS_IFRAME'] : []),
          ...(input.toUpperCase().includes('DROP TABLE') ? ['SQL_INJECTION'] : []),
          ...(input.includes('--') ? ['SQL_COMMENT'] : [])
        ];

        return Promise.resolve({
          originalInput: input,
          sanitizedInput: sanitized,
          threatsRemoved,
          isSafe: threatsRemoved.length === 0,
          sanitizationApplied: input !== sanitized
        });
      });

      for (const testCase of testInputs) {
        const result = await mockValidator.sanitizeInput(testCase.input);
        
        expect(result.sanitizedInput).toBe(testCase.expected);
        if (testCase.input === testCase.expected) {
          expect(result.isSafe).toBe(true);
          expect(result.sanitizationApplied).toBe(false);
          expect(result.threatsRemoved.length).toBe(0);
        } else {
          expect(result.sanitizationApplied).toBe(true);
          expect(result.threatsRemoved.length).toBeGreaterThan(0);
        }
      }
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
      const testResponses = [
        {
          response: 'Based on our Q1 sales data, performance shows strong growth with pipeline at $1.85M.',
          context: { sales: { pipeline: 1850000 } },
          expected: { valid: true, quality: 'high' }
        },
        {
          response: 'ERROR: Database connection failed. Raw SQL: SELECT * FROM users WHERE password = "admin"',
          context: {},
          expected: { valid: false, quality: 'low' }
        },
        {
          response: 'Our confidential client data shows...',
          context: { confidential: true },
          expected: { valid: false, quality: 'low' }
        }
      ];

      mockOutputValidator.validateRAGResponse.mockImplementation((response, context) => {
        const hasError = response.includes('ERROR:') || response.includes('Raw SQL:');
        const hasConfidentialData = response.includes('confidential') || response.includes('password');
        const hasValidBusinessData = response.includes('pipeline') || response.includes('performance');
        const isCoherent = response.length > 10 && !response.includes('undefined');

        return Promise.resolve({
          isValid: !hasError && !hasConfidentialData && isCoherent,
          qualityScore: hasValidBusinessData && isCoherent ? 0.9 : hasError ? 0.1 : 0.5,
          issues: [
            ...(hasError ? ['SYSTEM_ERROR_EXPOSED'] : []),
            ...(hasConfidentialData ? ['CONFIDENTIAL_DATA_LEAK'] : []),
            ...(!isCoherent ? ['INCOHERENT_RESPONSE'] : [])
          ],
          contextAlignment: context && hasValidBusinessData ? 0.95 : 0.5,
          riskLevel: hasError || hasConfidentialData ? 'high' : 'low'
        });
      });

      for (const testCase of testResponses) {
        const result = await mockOutputValidator.validateRAGResponse(testCase.response, testCase.context);
        
        expect(result.isValid).toBe(testCase.expected.valid);
        if (testCase.expected.valid) {
          expect(result.riskLevel).toBe('low');
          expect(result.issues).toHaveLength(0);
        } else {
          expect(result.riskLevel).toBe('high');
          expect(result.issues.length).toBeGreaterThan(0);
        }
      }
    });

    it('should validate context generation accuracy', async () => {
      const testContexts = [
        {
          userContext: { role: 'Sales Manager', department: 'Sales' },
          generatedContext: {
            role: 'Sales Manager',
            department: 'Sales',
            businessData: { sales: { pipeline: 1850000 } }
          },
          expected: { valid: true, accuracy: 'high' }
        },
        {
          userContext: { role: 'Marketing Director', department: 'Marketing' },
          generatedContext: {
            role: 'Sales Manager', // Mismatch
            department: 'Marketing',
            businessData: { finance: { budget: 50000 } } // Wrong department data
          },
          expected: { valid: false, accuracy: 'low' }
        }
      ];

      mockOutputValidator.validateContextGeneration.mockImplementation((userContext, generatedContext) => {
        const roleMatch = userContext.role === generatedContext.role;
        const departmentMatch = userContext.department === generatedContext.department;
        const hasRelevantData = generatedContext.businessData && 
                               Object.keys(generatedContext.businessData).some(key => 
                                 key.toLowerCase().includes(userContext.department.toLowerCase()));

        return Promise.resolve({
          isValid: roleMatch && departmentMatch && hasRelevantData,
          accuracyScore: (roleMatch ? 0.4 : 0) + (departmentMatch ? 0.3 : 0) + (hasRelevantData ? 0.3 : 0),
          mismatches: [
            ...(!roleMatch ? ['ROLE_MISMATCH'] : []),
            ...(!departmentMatch ? ['DEPARTMENT_MISMATCH'] : []),
            ...(!hasRelevantData ? ['IRRELEVANT_DATA'] : [])
          ],
          contextQuality: roleMatch && departmentMatch && hasRelevantData ? 'high' : 'low'
        });
      });

      for (const testCase of testContexts) {
        const result = await mockOutputValidator.validateContextGeneration(
          testCase.userContext, 
          testCase.generatedContext
        );
        
        expect(result.isValid).toBe(testCase.expected.valid);
        if (testCase.expected.valid) {
          expect(result.contextQuality).toBe('high');
          expect(result.mismatches).toHaveLength(0);
        } else {
          expect(result.contextQuality).toBe('low');
          expect(result.mismatches.length).toBeGreaterThan(0);
        }
      }
    });

    it('should validate vector search results relevance', async () => {
      const testVectorResults = [
        {
          query: 'sales performance',
          results: [
            { id: '1', content: 'Q1 sales performance shows strong growth', similarity: 0.95 },
            { id: '2', content: 'Sales team exceeded targets', similarity: 0.87 },
            { id: '3', content: 'Sales performance metrics and pipeline analysis', similarity: 0.82 }
          ],
          expected: { valid: true, relevance: 'high' }
        },
        {
          query: 'marketing campaigns',
          results: [
            { id: '1', content: 'Random unrelated content', similarity: 0.3 },
            { id: '2', content: 'Another irrelevant document', similarity: 0.25 },
            { id: '3', content: 'Marketing campaign success', similarity: 0.6 }
          ],
          expected: { valid: false, relevance: 'low' }
        }
      ];

      mockOutputValidator.validateVectorResults.mockImplementation((query, results) => {
        const queryKeywords = query.toLowerCase().split(' ');
        const relevantResults = results.filter(result => {
          const contentLower = result.content.toLowerCase();
          return queryKeywords.some(keyword => contentLower.includes(keyword)) && result.similarity > 0.5;
        });

        const averageSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
        const relevanceScore = relevantResults.length / results.length;

        return Promise.resolve({
          isValid: relevantResults.length >= results.length * 0.6, // At least 60% relevant
          relevanceScore,
          averageSimilarity,
          relevantResults: relevantResults.length,
          totalResults: results.length,
          qualityLevel: relevanceScore > 0.8 ? 'high' : relevanceScore > 0.5 ? 'medium' : 'low',
          recommendations: relevanceScore < 0.6 ? ['Improve vector indexing', 'Refine similarity threshold'] : []
        });
      });

      for (const testCase of testVectorResults) {
        const result = await mockOutputValidator.validateVectorResults(testCase.query, testCase.results);
        
        expect(result.isValid).toBe(testCase.expected.valid);
        if (testCase.expected.valid) {
          expect(result.qualityLevel).toBe('high');
          expect(result.recommendations).toHaveLength(0);
        } else {
          expect(result.qualityLevel).toBe('low');
          expect(result.recommendations.length).toBeGreaterThan(0);
        }
      }
    });

    it('should check for data leakage in responses', async () => {
      const testResponses = [
        {
          response: 'Our sales performance shows strong growth in Q1.',
          userRole: 'Sales Manager',
          expected: { safe: true, leakage: false }
        },
        {
          response: 'Confidential: CEO salary is $500K, password is admin123',
          userRole: 'Junior Employee',
          expected: { safe: false, leakage: true }
        },
        {
          response: 'Database connection string: server=prod.db.com;user=admin;pwd=secret',
          userRole: 'Manager',
          expected: { safe: false, leakage: true }
        }
      ];

      mockOutputValidator.checkDataLeakage.mockImplementation((response, userRole) => {
        const sensitivePatterns = [
          /password\s*[:=]\s*\w+/gi,
          /salary\s*[:=]\s*\$?\d+/gi,
          /connection\s*string/gi,
          /api\s*key/gi,
          /secret/gi,
          /confidential/gi
        ];

        const leakageDetected = sensitivePatterns.some(pattern => pattern.test(response));
        const hasUnauthorizedData = leakageDetected && !['Admin', 'Executive'].includes(userRole);

        return Promise.resolve({
          isSafe: !leakageDetected,
          dataLeakageDetected: leakageDetected,
          unauthorizedAccess: hasUnauthorizedData,
          sensitivePatterns: sensitivePatterns.filter(pattern => pattern.test(response)).length,
          riskLevel: leakageDetected ? 'critical' : 'low',
          recommendations: leakageDetected ? ['Remove sensitive data', 'Implement access controls'] : []
        });
      });

      for (const testCase of testResponses) {
        const result = await mockOutputValidator.checkDataLeakage(testCase.response, testCase.userRole);
        
        expect(result.isSafe).toBe(testCase.expected.safe);
        expect(result.dataLeakageDetected).toBe(testCase.expected.leakage);
        
        if (testCase.expected.leakage) {
          expect(result.riskLevel).toBe('critical');
          expect(result.recommendations.length).toBeGreaterThan(0);
        } else {
          expect(result.riskLevel).toBe('low');
        }
      }
    });
  });

  describe('Data Schema Validation', () => {
    const mockSchemaValidator = {
      validateUserContextSchema: jest.fn(),
      validateBusinessDataSchema: jest.fn(),
      validateRAGResponseSchema: jest.fn(),
      validateVectorDataSchema: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should validate user context schema compliance', async () => {
      const validSchema = {
        userId: 'string',
        role: 'string',
        department: 'string',
        experience_level: 'enum',
        preferences: 'object'
      };

      const testContexts = [
        {
          data: {
            userId: 'user-123',
            role: 'Sales Manager',
            department: 'Sales',
            experience_level: 'advanced',
            preferences: { theme: 'dark' }
          },
          expected: { valid: true, compliance: 100 }
        },
        {
          data: {
            userId: 123, // Should be string
            role: 'Sales Manager',
            department: null, // Should be string
            experience_level: 'invalid', // Should be enum
            preferences: { theme: 'dark' }, // Valid object
            extra_field: 'not allowed'
          },
          expected: { valid: false, compliance: 40 }
        }
      ];

      mockSchemaValidator.validateUserContextSchema.mockImplementation((data) => {
        const errors: string[] = [];
        let compliance = 0;
        const totalFields = 5;

        if (typeof data.userId === 'string') compliance++;
        else errors.push('userId must be string');

        if (typeof data.role === 'string') compliance++;
        else errors.push('role must be string');

        if (typeof data.department === 'string') compliance++;
        else errors.push('department must be string');

        if (['beginner', 'intermediate', 'advanced', 'expert'].includes(data.experience_level)) compliance++;
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

      for (const testCase of testContexts) {
        const result = await mockSchemaValidator.validateUserContextSchema(testCase.data);
        
        expect(result.isValid).toBe(testCase.expected.valid);
        expect(result.complianceScore).toBe(testCase.expected.compliance);
        
        if (!testCase.expected.valid) {
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.schemaViolations).toBeGreaterThan(0);
        }
      }
    });

    it('should validate business data schema structure', async () => {
      const validBusinessData = {
        sales: {
          pipeline: 1850000,
          deals: 25,
          quota: 2000000,
          conversion_rate: 0.15
        },
        marketing: {
          campaigns: 5,
          leads: 250,
          roi: 3.2,
          budget: 50000
        },
        finance: {
          revenue: 1200000,
          expenses: 800000,
          profit: 400000
        }
      };

      const invalidBusinessData = {
        sales: {
          pipeline: 'invalid', // Should be number
          deals: 25,
          quota: null // Should be number
        },
        marketing: 'invalid structure', // Should be object
        unknownDepartment: {
          data: 'not allowed'
        }
      };

      mockSchemaValidator.validateBusinessDataSchema.mockImplementation((data) => {
        const errors: string[] = [];
        const allowedDepartments = ['sales', 'marketing', 'finance', 'operations'];
        let validDepartments = 0;

        for (const dept in data) {
          if (!allowedDepartments.includes(dept)) {
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
            if (data[dept].quota !== null && typeof data[dept].quota !== 'number') {
              errors.push('sales.quota must be number');
            }
          }
        }

        return Promise.resolve({
          isValid: errors.length === 0,
          validDepartments,
          totalDepartments: Object.keys(data).length,
          errors,
          schemaCompliance: validDepartments / Object.keys(data).length,
          structureValid: errors.filter(e => e.includes('must be an object')).length === 0
        });
      });

      const validResult = await mockSchemaValidator.validateBusinessDataSchema(validBusinessData);
      expect(validResult.isValid).toBe(true);
      expect(validResult.schemaCompliance).toBe(1);
      expect(validResult.structureValid).toBe(true);

      const invalidResult = await mockSchemaValidator.validateBusinessDataSchema(invalidBusinessData);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
      expect(invalidResult.schemaCompliance).toBeLessThan(1);
    });
  });

  describe('Real-time Validation Monitoring', () => {
    const mockMonitor = {
      startValidationMonitoring: jest.fn(),
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
      expect(metrics.validationTypes.businessData.rate).toBeGreaterThan(0.95);
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
            timestamp: '2024-01-15T10:30:00Z',
            details: {
              normalRate: 0.95,
              currentRate: 0.75,
              threshold: 0.85
            }
          },
          {
            type: 'SLOW_VALIDATION_RESPONSE',
            description: 'Validation response time exceeding threshold',
            severity: 'low',
            affectedComponent: 'businessData',
            timestamp: '2024-01-15T10:35:00Z',
            details: {
              normalTime: 25,
              currentTime: 85,
              threshold: 50
            }
          }
        ],
        recommendedActions: [
          'Investigate vector search performance',
          'Check business data validation logic',
          'Monitor system resources'
        ]
      });

      const anomalies = await mockMonitor.detectValidationAnomalies();
      
      expect(anomalies.anomaliesDetected).toBe(true);
      expect(anomalies.anomalies).toHaveLength(2);
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
            { reason: 'Schema violation', count: 100 },
            { reason: 'Security threat detected', count: 50 }
          ]
        },
        trends: {
          validationVolume: 'increasing',
          successRate: 'stable',
          responseTime: 'improving'
        },
        recommendations: [
          'Implement stricter input validation',
          'Optimize schema validation performance',
          'Enhance security threat detection'
        ],
        systemHealth: 'good'
      });

      const report = await mockMonitor.generateValidationReport();
      
      expect(report.summary.successRate).toBeGreaterThan(0.9);
      expect(report.summary.topFailureReasons).toHaveLength(3);
      expect(report.trends.successRate).toBe('stable');
      expect(report.systemHealth).toBe('good');
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Performance Optimization', () => {
    const mockOptimizer = {
      optimizeValidationRules: jest.fn(),
      cacheValidationResults: jest.fn(),
      parallelizeValidation: jest.fn(),
      measureOptimizationImpact: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should optimize validation rules for performance', async () => {
      mockOptimizer.optimizeValidationRules.mockResolvedValue({
        optimizationApplied: true,
        rulesOptimized: 15,
        performanceImprovement: 0.35, // 35% improvement
        optimizations: [
          { rule: 'userContext', improvement: '25ms -> 18ms', type: 'algorithm' },
          { rule: 'businessData', improvement: '45ms -> 30ms', type: 'caching' },
          { rule: 'vectorResults', improvement: '60ms -> 40ms', type: 'parallel' }
        ],
        totalTimeSaved: 32 // milliseconds per validation
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
        cacheEfficiency: 0.82,
        recommendedCacheSize: '25 MB'
      });

      const result = await mockOptimizer.cacheValidationResults();
      
      expect(result.cachingEnabled).toBe(true);
      expect(result.cacheHitRate).toBeGreaterThan(0.7);
      expect(result.averageResponseTime.withCache).toBeLessThan(10);
      expect(result.averageResponseTime.improvement).toBeGreaterThan(0.7);
    });

    it('should parallelize validation processes', async () => {
      mockOptimizer.parallelizeValidation.mockResolvedValue({
        parallelizationEnabled: true,
        concurrentValidations: 4,
        throughputImprovement: 2.8, // 2.8x improvement
        resourceUtilization: {
          cpu: 0.65,
          memory: 0.45,
          efficiency: 0.88
        },
        validationsPerSecond: 125,
        latencyReduction: 0.6 // 60% reduction
      });

      const result = await mockOptimizer.parallelizeValidation();
      
      expect(result.parallelizationEnabled).toBe(true);
      expect(result.throughputImprovement).toBeGreaterThan(2.5);
      expect(result.resourceUtilization.efficiency).toBeGreaterThan(0.85);
      expect(result.validationsPerSecond).toBeGreaterThan(100);
    });
  });
}); 