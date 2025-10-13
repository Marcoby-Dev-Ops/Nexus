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
        // Profile exists, sync with latest Authentik data and update last activity
        const authentikData = this.extractAuthentikUserData(jwtPayload);
        
        // Prepare update data with Authentik sync + activity update
        const updateData = {
          ...authentikData.profileData,
          last_active_at: 'NOW()',
          updated_at: 'NOW()'
        };

        // Only update if we have Authentik data to sync
        if (Object.keys(authentikData.profileData).length > 0) {
          try {
            const syncResult = await this.updateProfileData(userId, authentikData.profileData, jwtPayload);
            if (syncResult.success) {
              logger.info('User profile synced with Authentik data on login', { 
                userId, 
                updatedFields: Object.keys(authentikData.profileData)
              });
            }
          } catch (syncError) {
            logger.warn('Failed to sync Authentik data on login', { 
              userId, 
              error: syncError.message 
            });
          }
        }

        // Always update last activity
        const updatedProfile = await query(
          `UPDATE user_profiles
           SET last_active_at = NOW(), updated_at = NOW()
           WHERE user_id = $1
           RETURNING *`,
          [userId],
          jwtPayload
        );

        logger.info('User profile exists, synced with Authentik and updated activity', { userId });
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
      // Extract comprehensive Authentik signup data and sync to user profile
      const authentikData = this.extractAuthentikUserData(jwtPayload);
      
      // Update user profile with Authentik data
      if (Object.keys(authentikData.profileData).length > 0) {
        try {
          await this.updateProfileData(userId, authentikData.profileData, jwtPayload);
          logger.info('User profile updated with Authentik data', { 
            userId, 
            updatedFields: Object.keys(authentikData.profileData) 
          });
        } catch (updateError) {
          logger.warn('Failed to update profile with Authentik data', { 
            userId, 
            error: updateError.message 
          });
        }
      }

      // Attempt to provision a company for the user (best-effort).
      try {
        const signupData = authentikData.companyData;

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
   * Create basic user profile with Authentik data sync
   */
  async createBasicProfile(userId, userEmail = null, additionalData = {}, jwtPayload = null) {
    try {
      // Extract Authentik data for initial profile creation
      const authentikData = this.extractAuthentikUserData(jwtPayload);
      
      // Merge Authentik data with defaults and additional data
      const email = userEmail || authentikData.profileData.email || `${userId}@authentik.local`;
      const displayName = authentikData.profileData.display_name || 
                         (authentikData.profileData.first_name && authentikData.profileData.last_name) 
                           ? `${authentikData.profileData.first_name} ${authentikData.profileData.last_name}`.trim()
                           : 'User';
      const completionPercentage = authentikData.profileData.profile_completion_percentage || 0;
      const signupCompleted = authentikData.profileData.signup_completed || false;
      const onboardingCompleted = authentikData.profileData.onboarding_completed || false;
      const businessProfileCompleted = authentikData.profileData.business_profile_completed || false;
      
      // Create the initial profile with Authentik data
      const result = await query(
        `INSERT INTO user_profiles (
          user_id, email, display_name, first_name, last_name, phone, 
          company_name, role, status, 
          onboarding_completed, profile_completion_percentage, 
          subscription_tier, signup_completed, business_profile_completed,
          last_active_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW(), NOW()
        ) RETURNING *`,
        [
          userId,
          email,
          displayName,
          authentikData.profileData.first_name || null,
          authentikData.profileData.last_name || null,
          authentikData.profileData.phone || null,
          authentikData.profileData.company_name || null,
          'user',
          'active',
          onboardingCompleted,
          completionPercentage,
          'free',
          signupCompleted,
          businessProfileCompleted
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

  /**
   * Extract and map Authentik user data from JWT payload
   * Maps Authentik attributes to our user profile and company schema
   */
  extractAuthentikUserData(jwtPayload) {
    if (!jwtPayload) {
      return { profileData: {}, companyData: {} };
    }

    const attrs = jwtPayload.attributes || {};
    
    // Extract user profile data
    const profileData = {};
    
    // Basic user information
    if (jwtPayload.email) profileData.email = jwtPayload.email;
    if (jwtPayload.name) profileData.display_name = jwtPayload.name;
    if (attrs.first_name) profileData.first_name = attrs.first_name;
    if (attrs.last_name) profileData.last_name = attrs.last_name;
    if (attrs.phone) profileData.phone = attrs.phone;
    
    // Professional information
    if (attrs.business_name) profileData.company_name = attrs.business_name;
    
    // Signup completion tracking
    if (attrs.signup_completed === true) {
      profileData.signup_completed = true;
      profileData.onboarding_completed = attrs.enrollment_flow_completed === true;
      profileData.business_profile_completed = attrs.business_profile_completed === true;
    }
    
    // Calculate profile completion percentage based on available data
    const completionFields = [
      'first_name', 'last_name', 'email', 'phone', 'company_name',
      'signup_completed', 'business_profile_completed'
    ];
    const completedFields = completionFields.filter(field => 
      profileData[field] || attrs[field] || jwtPayload[field]
    ).length;
    const completionPercentage = Math.round((completedFields / completionFields.length) * 100);
    profileData.profile_completion_percentage = completionPercentage;

    // Extract company data for provisioning
    const companyData = {
      businessName: attrs.business_name || null,
      companyName: attrs.business_name || null,
      industry: attrs.industry || null,
      companySize: attrs.company_size || null,
      businessType: attrs.business_type || null,
      fundingStage: attrs.funding_stage || null,
      revenueRange: attrs.revenue_range || null,
      website: jwtPayload.website || null,
      domain: jwtPayload.domain || null
    };

    logger.info('Extracted Authentik user data', { 
      hasProfileData: Object.keys(profileData).length > 0,
      hasCompanyData: Object.values(companyData).some(v => v !== null),
      profileFields: Object.keys(profileData),
      completionPercentage
    });

    return { profileData, companyData };
  }
}

// Export singleton instance
const userProfileService = new UserProfileService();
module.exports = userProfileService;
