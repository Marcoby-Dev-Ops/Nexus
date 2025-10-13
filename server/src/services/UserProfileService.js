/**
 * Unified User Profile Service
 * Consolidates all user profile operations into a single service
 */

const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const CompanyService = require('./CompanyService');
const companyService = new CompanyService();

class UserProfileService {
  constructor() {
    this.profileHealthThresholds = {
      completion: { critical: 20, warning: 50, good: 80 },
      dataQuality: { critical: 30, warning: 60, good: 85 },
      lastActivity: { stale: 30, warning: 7 }
    };
  }

  /**
   * Ensure user profile exists (main entry point)
   * Consolidates all profile creation logic and fetches data from Authentik
   */
  async ensureUserProfile(userId, userEmail = null, additionalData = {}, jwtPayload = null) {
    try {
      logger.info('Ensuring user profile exists', { userId, userEmail });

      // First, check if profile already exists
      const existingResult = await query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [userId],
        jwtPayload
      );

      if (existingResult.data && existingResult.data.length > 0) {
        // Profile exists, update last activity and return
        const updatedProfile = await query(
          `UPDATE user_profiles
           SET last_active_at = NOW(), updated_at = NOW()
           WHERE user_id = $1
           RETURNING *`,
          [userId],
          jwtPayload
        );

        logger.info('User profile already exists, updated last activity', { userId });
        return {
          success: true,
          profile: updatedProfile.data[0],
          created: false
        };
      }

      // Profile doesn't exist, create basic profile first
      logger.info('Profile not found, creating basic profile', { userId });
      
      const basicProfile = await this.createBasicProfile(userId, userEmail, additionalData, jwtPayload);
      
      if (!basicProfile.success) {
        throw new Error(basicProfile.error);
      }

      logger.info('Basic user profile created', { userId });
      // Attempt to provision a company for the user (best-effort).
      // We extract common signup/company fields from jwtPayload and additionalData.
      try {
        const signupData = {
          businessName: (jwtPayload && (jwtPayload.business_name || (jwtPayload.attributes && jwtPayload.attributes.business_name))) || additionalData.businessName || additionalData.companyName || null,
          companyName: (jwtPayload && (jwtPayload.company_name || (jwtPayload.attributes && jwtPayload.attributes.company_name))) || additionalData.companyName || additionalData.businessName || null,
          industry: (jwtPayload && (jwtPayload.industry || (jwtPayload.attributes && jwtPayload.attributes.industry))) || additionalData.industry || null,
          companySize: (jwtPayload && (jwtPayload.company_size || (jwtPayload.attributes && jwtPayload.attributes.company_size))) || additionalData.companySize || additionalData.company_size || null,
          website: (jwtPayload && jwtPayload.website) || additionalData.website || null,
          domain: (jwtPayload && jwtPayload.domain) || additionalData.domain || null,
          fundingStage: (jwtPayload && (jwtPayload.funding_stage || (jwtPayload.attributes && jwtPayload.attributes.funding_stage))) || additionalData.fundingStage || null,
          revenueRange: (jwtPayload && (jwtPayload.revenue_range || (jwtPayload.attributes && jwtPayload.attributes.revenue_range))) || additionalData.revenueRange || null
        };

        const provisioning = await companyService.ensureCompanyForUser(userId, signupData, jwtPayload);
        if (provisioning && provisioning.success && provisioning.company) {
          logger.info('Company provisioned for new user', { userId, companyId: provisioning.company.id });
          // Update user profile with company association
          try {
            await this.updateProfileData(userId, { company_id: provisioning.company.id, company_name: provisioning.company.name }, jwtPayload);
            // Refresh profile to include updates
            const updatedResult = await query('SELECT * FROM user_profiles WHERE user_id = $1', [userId], jwtPayload);
            const profile = updatedResult.data && updatedResult.data.length > 0 ? updatedResult.data[0] : basicProfile.profile;
            return {
              success: true,
              profile: profile,
              created: true
            };
          } catch (upErr) {
            logger.warn('Failed to update user profile with company info after provisioning', { userId, error: upErr.message });
            // Fall through to return basic profile
          }
        }
      } catch (provErr) {
        logger.warn('Company provisioning failed (non-blocking)', { userId, error: provErr && provErr.message ? provErr.message : provErr });
      }
      return {
        success: true,
        profile: basicProfile.profile,
        created: true
      };

    } catch (error) {
      logger.error('Failed to ensure user profile', { userId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create basic user profile
   */
  async createBasicProfile(userId, userEmail = null, additionalData = {}, jwtPayload = null) {
    try {
      const email = userEmail || `${userId}@authentik.local`;
      
      const result = await query(
        `INSERT INTO user_profiles (
          user_id, email, display_name, role, status, 
          onboarding_completed, profile_completion_percentage, 
          subscription_tier, signup_completed, business_profile_completed,
          last_active_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW()
        ) RETURNING *`,
        [
          userId,
          email,
          'User',
          'user',
          'active',
          false,
          0,
          'free',
          false,
          false
        ],
        jwtPayload
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('Failed to create user profile');
      }

      const profile = result.data[0];

      // Update with additional data if provided
      if (Object.keys(additionalData).length > 0) {
        await this.updateProfileData(userId, additionalData, jwtPayload);
        // Fetch updated profile
        const updatedResult = await query(
          'SELECT * FROM user_profiles WHERE user_id = $1',
          [userId],
          jwtPayload
        );
        if (updatedResult.data && updatedResult.data.length > 0) {
          return {
            success: true,
            profile: updatedResult.data[0]
          };
        }
      }

      return {
        success: true,
        profile
      };

    } catch (error) {
      logger.error('Failed to create basic profile', { userId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await query(
        `SELECT 
          user_id, email, first_name, last_name, phone, avatar_url, bio,
          company_name, job_title, location, website, social_links,
          preferences, onboarding_completed, created_at, updated_at,
          last_active_at, last_login, profile_completion_percentage
        FROM user_profiles 
        WHERE user_id = $1`,
        [userId]
      );

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        profile: data?.[0] || null
      };

    } catch (error) {
      logger.error('Failed to get user profile', { userId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update profile data
   */
  async updateProfileData(userId, updateData, jwtPayload = null) {
    try {
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic update query
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (updateFields.length === 0) {
        return { success: true, message: 'No updates needed' };
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(userId);

      const sql = `
        UPDATE user_profiles 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramCount}
        RETURNING *
      `;

      const { data, error } = await query(sql, values, jwtPayload);

      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }

      logger.info('Profile updated', { userId, updatedFields: Object.keys(updateData) });
      return {
        success: true,
        profile: data?.[0]
      };

    } catch (error) {
      logger.error('Failed to update profile', { userId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update last activity timestamp
   */
  async updateLastActivity(userId, jwtPayload = null) {
    try {
      await query(
        'UPDATE user_profiles SET last_active_at = NOW() WHERE user_id = $1',
        [userId],
        jwtPayload
      );
    } catch (error) {
      logger.warn('Failed to update last activity', { userId, error: error.message });
      // Don't throw - this is not critical
    }
  }

  /**
   * Monitor user profile health
   */
  async monitorProfileHealth(userId) {
    try {
      const profileResult = await this.getUserProfile(userId);
      if (!profileResult.success || !profileResult.profile) {
        return {
          success: false,
          error: 'User profile not found',
          health: 'critical'
        };
      }

      const profile = profileResult.profile;
      const metrics = this.calculateHealthMetrics(profile);
      const health = this.determineHealthStatus(metrics);
      const recommendations = this.generateRecommendations(profile, metrics);

      return {
        success: true,
        userId,
        health,
        metrics,
        profile: {
          exists: true,
          completion: metrics.completion,
          dataQuality: metrics.dataQuality,
          lastActivity: metrics.lastActivity
        },
        recommendations,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Profile health monitoring failed', { userId, error: error.message });
      return {
        success: false,
        error: error.message,
        health: 'error'
      };
    }
  }

  /**
   * Calculate health metrics
   */
  calculateHealthMetrics(profile) {
    const metrics = {
      completion: this.calculateCompletionScore(profile),
      dataQuality: this.calculateDataQualityScore(profile),
      lastActivity: this.calculateActivityScore(profile),
      onboarding: profile.onboarding_completed ? 100 : 0
    };

    metrics.overall = Math.round(
      (metrics.completion * 0.4) +
      (metrics.dataQuality * 0.3) +
      (metrics.lastActivity * 0.2) +
      (metrics.onboarding * 0.1)
    );

    return metrics;
  }

  /**
   * Calculate profile completion score
   */
  calculateCompletionScore(profile) {
    const fields = [
      'first_name', 'last_name', 'email', 'phone', 'avatar_url',
      'company_name', 'job_title', 'location', 'bio'
    ];

    let completed = 0;
    fields.forEach(field => {
      if (profile[field] && profile[field].toString().trim() !== '') {
        completed++;
      }
    });

    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Calculate data quality score
   */
  calculateDataQualityScore(profile) {
    let score = 0;
    let factors = 0;

    // Email quality
    if (profile.email) {
      factors++;
      if (profile.email.includes('@') && !profile.email.includes('authentik.local')) {
        score += 100;
      } else {
        score += 30; // Placeholder email
      }
    }

    // Name quality
    if (profile.first_name && profile.last_name) {
      factors++;
      score += 100;
    } else if (profile.first_name || profile.last_name) {
      factors++;
      score += 60;
    }

    // Company information
    if (profile.company_name && profile.job_title) {
      factors++;
      score += 100;
    } else if (profile.company_name || profile.job_title) {
      factors++;
      score += 50;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  /**
   * Calculate activity score
   */
  calculateActivityScore(profile) {
    const now = new Date();
    const lastActivity = new Date(profile.last_active_at || profile.updated_at);
    const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);

    if (daysSinceActivity <= 1) return 100;
    if (daysSinceActivity <= 7) return 80;
    if (daysSinceActivity <= 30) return 60;
    if (daysSinceActivity <= 90) return 30;
    return 10;
  }

  /**
   * Determine overall health status
   */
  determineHealthStatus(metrics) {
    if (metrics.overall < this.profileHealthThresholds.completion.critical) {
      return 'critical';
    } else if (metrics.overall < this.profileHealthThresholds.completion.warning) {
      return 'warning';
    } else {
      return 'good';
    }
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations(profile, metrics) {
    const recommendations = [];

    if (metrics.completion < 50) {
      if (!profile.first_name || !profile.last_name) {
        recommendations.push({
          type: 'completion',
          priority: 'high',
          message: 'Add your first and last name to improve profile completeness',
          action: 'update_name'
        });
      }

      if (!profile.company_name) {
        recommendations.push({
          type: 'completion',
          priority: 'medium',
          message: 'Add your company name for better business insights',
          action: 'update_company'
        });
      }
    }

    if (metrics.dataQuality < 70) {
      if (profile.email && profile.email.includes('authentik.local')) {
        recommendations.push({
          type: 'data_quality',
          priority: 'high',
          message: 'Update your email address for better communication',
          action: 'update_email'
        });
      }
    }

    if (!profile.onboarding_completed) {
      recommendations.push({
        type: 'onboarding',
        priority: 'high',
        message: 'Complete your onboarding to unlock all features',
        action: 'complete_onboarding'
      });
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Validate profile completeness
   */
  async validateProfile(userId) {
    try {
      const healthResult = await this.monitorProfileHealth(userId);
      if (!healthResult.success) {
        return {
          success: false,
          valid: false,
          error: healthResult.error
        };
      }

      const isValid = healthResult.health === 'good' || healthResult.health === 'warning';
      const isComplete = healthResult.metrics.completion >= 80;

      return {
        success: true,
        valid: isValid,
        complete: isComplete,
        health: healthResult.health,
        metrics: healthResult.metrics,
        recommendations: healthResult.recommendations
      };

    } catch (error) {
      logger.error('Profile validation failed', { userId, error: error.message });
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const userProfileService = new UserProfileService();
module.exports = userProfileService;
