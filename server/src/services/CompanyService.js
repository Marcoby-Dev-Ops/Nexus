/**
 * Company Service - Server-side company management
 * Handles company creation, association, and management operations
 * Includes business identity management and health monitoring
 */

const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

class CompanyService {
  constructor() {
    this.logger = logger;
    this.healthThresholds = {
      completion: { critical: 20, warning: 50, good: 80 },
      dataQuality: { critical: 30, warning: 60, good: 85 },
      lastActivity: { stale: 30, warning: 7 }
    };
  }

  /**
   * Create a new company and associate it with a user
   */
  async createCompany(userId, companyData, jwtPayload = null) {
    try {
      this.logger.info('Creating company', { userId, companyData });

      const {
        name,
        industry = 'Technology',
        size = '1-10',
        description = '',
        website = '',
        domain = '',
        businessType = '',
        fundingStage = '',
        revenueRange = ''
      } = companyData;

      // Create the company
      const companyResult = await query(
        `INSERT INTO companies (
          name, domain, industry, size, description, website, 
          owner_id, is_active, settings, subscription_plan, max_users,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        ) RETURNING *`,
        [
          name,
          domain,
          industry,
          size,
          description,
          website,
          userId,
          true,
          JSON.stringify({
            business_type: businessType,
            funding_stage: fundingStage,
            revenue_range: revenueRange
          }),
          'free',
          5
        ],
        jwtPayload
      );

      if (companyResult.error) {
        throw new Error(companyResult.error);
      }

      if (!companyResult.data || companyResult.data.length === 0) {
        throw new Error('Failed to create company');
      }

      const company = companyResult.data[0];
      this.logger.info('Company created successfully', { companyId: company.id, name: company.name });

      return {
        success: true,
        company,
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to create company', { userId, error: error.message });
      return {
        success: false,
        company: null,
        error: error.message
      };
    }
  }

  /**
   * Get company by owner ID
   */
  async getCompanyByOwner(userId, jwtPayload = null) {
    try {
      this.logger.info('Getting company by owner', { userId });

      const result = await query(
        'SELECT * FROM companies WHERE owner_id = $1 AND is_active = true',
        [userId],
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data || result.data.length === 0) {
        return {
          success: true,
          company: null,
          error: null
        };
      }

      return {
        success: true,
        company: result.data[0],
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to get company by owner', { userId, error: error.message });
      return {
        success: false,
        company: null,
        error: error.message
      };
    }
  }

  /**
   * Get company by ID
   */
  async getCompany(companyId, jwtPayload = null) {
    try {
      this.logger.info('Getting company', { companyId });

      const result = await query(
        'SELECT * FROM companies WHERE id = $1 AND is_active = true',
        [companyId],
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data || result.data.length === 0) {
        return {
          success: true,
          company: null,
          error: null
        };
      }

      return {
        success: true,
        company: result.data[0],
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to get company', { companyId, error: error.message });
      return {
        success: false,
        company: null,
        error: error.message
      };
    }
  }

  /**
   * Update company
   */
  async updateCompany(companyId, updateData, jwtPayload = null) {
    try {
      this.logger.info('Updating company', { companyId, updateData });

      const setClause = Object.keys(updateData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const values = [companyId, ...Object.values(updateData)];

      const result = await query(
        `UPDATE companies SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values,
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('Company not found or update failed');
      }

      return {
        success: true,
        company: result.data[0],
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to update company', { companyId, error: error.message });
      return {
        success: false,
        company: null,
        error: error.message
      };
    }
  }

  /**
   * Create or get company for user based on signup data
   */
  async ensureCompanyForUser(userId, signupData = {}, jwtPayload = null) {
    try {
      this.logger.info('Ensuring company for user', { userId, signupData });

      // First, check if user already has a company
      const existingCompany = await this.getCompanyByOwner(userId, jwtPayload);
      
      if (existingCompany.success && existingCompany.company) {
        this.logger.info('User already has a company', { 
          userId, 
          companyId: existingCompany.company.id,
          companyName: existingCompany.company.name 
        });
        return {
          success: true,
          company: existingCompany.company,
          created: false,
          error: null
        };
      }

      // Extract company data from signup data
      const companyData = {
        name: signupData.businessName || signupData.companyName || 'My Business',
        industry: signupData.industry || 'Technology',
        size: signupData.companySize || '1-10',
        description: signupData.description || '',
        website: signupData.website || '',
        domain: signupData.domain || '',
        businessType: signupData.businessType || '',
        fundingStage: signupData.fundingStage || '',
        revenueRange: signupData.revenueRange || ''
      };

      // Create new company
      const createResult = await this.createCompany(userId, companyData, jwtPayload);
      
      if (!createResult.success) {
        throw new Error(createResult.error);
      }

      this.logger.info('Company created for user', { 
        userId, 
        companyId: createResult.company.id,
        companyName: createResult.company.name 
      });

      return {
        success: true,
        company: createResult.company,
        created: true,
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to ensure company for user', { userId, error: error.message });
      return {
        success: false,
        company: null,
        created: false,
        error: error.message
      };
    }
  }

  /**
   * Associate user with existing company
   */
  async associateUserWithCompany(userId, companyId, role = 'member', jwtPayload = null) {
    try {
      this.logger.info('Associating user with company', { userId, companyId, role });

      // Update user profile with company association
      const result = await query(
        'UPDATE user_profiles SET company_id = $1, role = $2, updated_at = NOW() WHERE user_id = $3 RETURNING *',
        [companyId, role, userId],
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('User profile not found');
      }

      this.logger.info('User associated with company', { userId, companyId, role });

      return {
        success: true,
        profile: result.data[0],
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to associate user with company', { userId, companyId, error: error.message });
      return {
        success: false,
        profile: null,
        error: error.message
      };
    }
  }

  // ============================================================================
  // BUSINESS IDENTITY OPERATIONS
  // ============================================================================

  /**
   * Get business identity for a company
   */
  async getBusinessIdentity(companyId, jwtPayload = null) {
    try {
      this.logger.info('Getting business identity', { companyId });

      // Check if business_identity column exists
      const columnCheck = await query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'companies' AND column_name = 'business_identity'`,
        [],
        jwtPayload
      );

        if (columnCheck.error || !columnCheck.data || columnCheck.data.length === 0) {
          // Column doesn't exist, return default business identity structure
          this.logger.info('business_identity column not found, returning default identity structure', { companyId });
          const defaultIdentity = {
            foundation: {
              name: 'My Company',
              legalStructure: 'LLC',
              businessModel: 'B2B',
              companyStage: 'Startup'
            },
            missionVisionValues: {},
            productsServices: {},
            targetMarket: {},
            competitiveLandscape: {},
            businessOperations: {},
            financialContext: {},
            strategicContext: {}
          };
        return {
          success: true,
          data: defaultIdentity,
          error: null
        };
      }

      const result = await query(
        'SELECT business_identity FROM companies WHERE id = $1 AND is_active = true',
        [companyId],
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data || result.data.length === 0) {
        return {
          success: true,
          data: {
            foundation: {
              name: 'My Company',
              legalStructure: 'LLC',
              businessModel: 'B2B',
              companyStage: 'Startup'
            },
            missionVisionValues: {},
            productsServices: {},
            targetMarket: {},
            competitiveLandscape: {},
            businessOperations: {},
            financialContext: {},
            strategicContext: {}
          },
          error: null
        };
      }

      const businessIdentity = result.data[0].business_identity || {
        foundation: {
          name: 'My Company',
          legalStructure: 'LLC',
          businessModel: 'B2B',
          companyStage: 'Startup'
        },
        missionVisionValues: {},
        productsServices: {},
        targetMarket: {},
        competitiveLandscape: {},
        businessOperations: {},
        financialContext: {},
        strategicContext: {}
      };
      this.logger.info('Business identity retrieved', { companyId });

      return {
        success: true,
        data: businessIdentity,
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to get business identity', { companyId, error: error.message });
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Update business identity for a company
   */
  async updateBusinessIdentity(companyId, updates, jwtPayload = null) {
    try {
      this.logger.info('Updating business identity', { companyId, updates });

      // Get current business identity
      const currentResult = await query(
        'SELECT business_identity FROM companies WHERE id = $1 AND is_active = true',
        [companyId],
        jwtPayload
      );

      if (currentResult.error) {
        throw new Error(currentResult.error);
      }

      if (!currentResult.data || currentResult.data.length === 0) {
        throw new Error('Company not found');
      }

      // Merge updates with existing data
      const currentIdentity = currentResult.data[0].business_identity || {};
      const updatedIdentity = { ...currentIdentity, ...updates };

      // Update the company record
      const result = await query(
        'UPDATE companies SET business_identity = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(updatedIdentity), companyId],
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      this.logger.info('Business identity updated', { companyId });

      return {
        success: true,
        data: updatedIdentity,
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to update business identity', { companyId, error: error.message });
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Ensure business identity exists for a company
   */
  async ensureBusinessIdentity(companyId, identityData = {}, jwtPayload = null) {
    try {
      this.logger.info('Ensuring business identity exists', { companyId, identityData });

      // Check if company exists
      const companyResult = await query(
        'SELECT * FROM companies WHERE id = $1 AND is_active = true',
        [companyId],
        jwtPayload
      );

      if (companyResult.error) {
        throw new Error(companyResult.error);
      }

      if (!companyResult.data || companyResult.data.length === 0) {
        throw new Error('Company not found');
      }

      const company = companyResult.data[0];
      let businessIdentity = company.business_identity || {};

      // If no business identity exists, create a basic one
      if (!businessIdentity.foundation) {
        businessIdentity = {
          foundation: {
            name: company.name,
            industry: company.industry,
            companySize: company.size,
            website: company.website,
            ...identityData.foundation
          },
          ...identityData
        };
      } else {
        // Merge with existing data
        businessIdentity = { ...businessIdentity, ...identityData };
      }

      // Update the company record
      const result = await query(
        'UPDATE companies SET business_identity = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(businessIdentity), companyId],
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      this.logger.info('Business identity ensured', { companyId });

      return {
        success: true,
        data: businessIdentity,
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to ensure business identity', { companyId, error: error.message });
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  // ============================================================================
  // COMPANY HEALTH OPERATIONS
  // ============================================================================

  /**
   * Get company health metrics
   */
  async getCompanyHealth(companyId, jwtPayload = null) {
    try {
      this.logger.info('Getting company health', { companyId });

      // Check if business_identity column exists
      const columnCheck = await query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'companies' AND column_name = 'business_identity'`,
        [],
        jwtPayload
      );

      if (columnCheck.error || !columnCheck.data || columnCheck.data.length === 0) {
        // Column doesn't exist, return basic health metrics
        this.logger.info('business_identity column not found, returning basic health metrics', { companyId });
        
        const result = await query(
          'SELECT updated_at FROM companies WHERE id = $1 AND is_active = true',
          [companyId],
          jwtPayload
        );

        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.data || result.data.length === 0) {
          throw new Error('Company not found');
        }

        const company = result.data[0];
        const health = this.calculateHealthMetrics({
          foundation: { name: 'My Company', legalStructure: 'LLC', businessModel: 'B2B', companyStage: 'Startup' }
        }, company.updated_at);

        return {
          success: true,
          data: health,
          error: null
        };
      }

      const result = await query(
        'SELECT business_identity, updated_at FROM companies WHERE id = $1 AND is_active = true',
        [companyId],
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('Company not found');
      }

      const company = result.data[0];
      const businessIdentity = company.business_identity || {};
      const health = this.calculateHealthMetrics(businessIdentity, company.updated_at);

      return {
        success: true,
        data: health,
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to get company health', { companyId, error: error.message });
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Monitor company health and get recommendations
   */
  async monitorCompanyHealth(companyId, jwtPayload = null) {
    try {
      this.logger.info('Monitoring company health', { companyId });

      const healthResult = await this.getCompanyHealth(companyId, jwtPayload);
      if (!healthResult.success) {
        return healthResult;
      }

      const health = healthResult.data;
      const recommendations = this.generateRecommendations(health);

      const monitoredHealth = {
        ...health,
        recommendations,
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        data: monitoredHealth,
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to monitor company health', { companyId, error: error.message });
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Calculate health metrics for a company
   */
  calculateHealthMetrics(businessIdentity, lastUpdated) {
    const sections = [
      'foundation',
      'missionVisionValues',
      'productsServices',
      'targetMarket',
      'competitiveLandscape',
      'businessOperations',
      'financialContext',
      'strategicContext'
    ];

    const sectionScores = {};
    let totalScore = 0;

    sections.forEach(section => {
      const sectionData = businessIdentity[section];
      const score = this.calculateSectionScore(section, sectionData);
      sectionScores[section] = score;
      totalScore += score;
    });

    const overallScore = Math.round(totalScore / sections.length);
    const overallHealth = this.determineHealthStatus(overallScore);

    return {
      overall: overallHealth,
      sections: sectionScores,
      recommendations: [], // Empty recommendations for now
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate score for a specific section
   */
  calculateSectionScore(section, sectionData) {
    if (!sectionData || Object.keys(sectionData).length === 0) {
      return 0;
    }

    // Basic scoring based on data completeness
    const requiredFields = this.getRequiredFieldsForSection(section);
    let completedFields = 0;

    requiredFields.forEach(field => {
      if (sectionData[field] && 
          (typeof sectionData[field] === 'string' ? sectionData[field].trim() : true)) {
        completedFields++;
      }
    });

    return Math.round((completedFields / requiredFields.length) * 100);
  }

  /**
   * Get required fields for a section
   */
  getRequiredFieldsForSection(section) {
    const fieldMap = {
      foundation: ['name', 'industry', 'companySize'],
      missionVisionValues: ['missionStatement', 'visionStatement'],
      productsServices: ['offerings', 'uniqueValueProposition'],
      targetMarket: ['customerSegments', 'idealCustomerProfile'],
      competitiveLandscape: ['directCompetitors', 'competitivePositioning'],
      businessOperations: ['team', 'keyProcesses'],
      financialContext: ['revenue', 'financialHealth'],
      strategicContext: ['goals', 'strategicPriorities']
    };

    return fieldMap[section] || [];
  }

  /**
   * Determine overall health status
   */
  determineHealthStatus(score) {
    if (score < this.healthThresholds.completion.critical) {
      return 'critical';
    } else if (score < this.healthThresholds.completion.warning) {
      return 'poor';
    } else if (score < this.healthThresholds.completion.good) {
      return 'fair';
    } else if (score < 95) {
      return 'good';
    } else {
      return 'excellent';
    }
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations(health) {
    const recommendations = [];

    Object.entries(health.sections).forEach(([section, score]) => {
      if (score < 50) {
        recommendations.push({
          section,
          priority: 'high',
          message: `Complete your ${section} section to improve business identity`,
          action: `update_${section}`
        });
      } else if (score < 80) {
        recommendations.push({
          section,
          priority: 'medium',
          message: `Enhance your ${section} section for better business insights`,
          action: `enhance_${section}`
        });
      }
    });

    return recommendations.slice(0, 5);
  }

  // ============================================================================
  // AI CONTEXT OPERATIONS
  // ============================================================================

  /**
   * Get AI context for a company
   */
  async getAIContext(companyId, jwtPayload = null) {
    try {
      this.logger.info('Getting AI context', { companyId });

      const result = await query(
        'SELECT business_identity, name, industry, size FROM companies WHERE id = $1 AND is_active = true',
        [companyId],
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('Company not found');
      }

      const company = result.data[0];
      const businessIdentity = company.business_identity || {};

      // Create AI context from business identity
      const aiContext = {
        companyName: company.name,
        industry: company.industry,
        size: company.size,
        businessIdentity,
        contextSummary: this.generateContextSummary(businessIdentity)
      };

      return {
        success: true,
        data: aiContext,
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to get AI context', { companyId, error: error.message });
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Generate context summary for AI
   */
  generateContextSummary(businessIdentity) {
    const summary = [];
    
    if (businessIdentity.foundation) {
      summary.push(`Company: ${businessIdentity.foundation.name || 'Unknown'}`);
      summary.push(`Industry: ${businessIdentity.foundation.industry || 'Unknown'}`);
      summary.push(`Size: ${businessIdentity.foundation.companySize || 'Unknown'}`);
    }

    if (businessIdentity.missionVisionValues?.missionStatement) {
      summary.push(`Mission: ${businessIdentity.missionVisionValues.missionStatement}`);
    }

    if (businessIdentity.productsServices?.uniqueValueProposition) {
      summary.push(`Value Prop: ${businessIdentity.productsServices.uniqueValueProposition}`);
    }

    return summary.join(' | ');
  }

  /**
   * Get next recommended action for company
   */
  async getNextAction(companyId, jwtPayload = null) {
    try {
      this.logger.info('Getting next action', { companyId });

      const healthResult = await this.monitorCompanyHealth(companyId, jwtPayload);
      if (!healthResult.success) {
        return healthResult;
      }

      const health = healthResult.data;
      const recommendations = health.recommendations || [];

      if (recommendations.length === 0) {
        return {
          success: true,
          data: {
            action: 'maintain',
            priority: 'low',
            message: 'Your business identity is in good shape. Continue maintaining and updating as needed.'
          },
          error: null
        };
      }

      const nextAction = recommendations[0];
      return {
        success: true,
        data: nextAction,
        error: null
      };

    } catch (error) {
      this.logger.error('Failed to get next action', { companyId, error: error.message });
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }
}

module.exports = CompanyService;
