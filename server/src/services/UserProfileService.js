/**
 * Unified User Profile Service
 * Consolidates all user profile operations into a single service
 */

const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

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
        // Profile exists, update last activity
        const lastActiveUpdate = await query(
          `UPDATE user_profiles
           SET last_active_at = NOW(), updated_at = NOW()
           WHERE user_id = $1
           RETURNING *`,
          [userId],
          jwtPayload
        );

        let profile = lastActiveUpdate.data?.[0] || existingResult.data[0];

        // Opportunistically apply any provided profile data (e.g., display name from Authentik)
        if (additionalData && Object.keys(additionalData).length > 0) {
          const updateResult = await this.updateProfileData(userId, additionalData, jwtPayload);
          if (updateResult.success && updateResult.profile) {
            profile = updateResult.profile;
          }
        }

        logger.info('User profile already exists, updated last activity', { userId });
        return {
          success: true,
          profile,
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
          subscription_tier, signup_completed, enrollment_flow_completed, business_profile_completed,
          last_active_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), NOW()
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
      // Whitelist of actual columns in user_profiles to prevent invalid-column errors
      const allowed = new Set([
        'first_name','last_name','email','business_email','personal_email','phone','mobile','work_phone','avatar_url','bio',
        'company_name','job_title','role','department','display_name','location','timezone','work_location','website',
        'linkedin_url','github_url','twitter_url','social_links','skills','certifications','languages','address',
        'emergency_contact','preferences','status','onboarding_completed','profile_completion_percentage','subscription_tier',
        'signup_completed','enrollment_flow_completed','business_profile_completed',
        'last_active_at','last_login',
        'signup_completed_at','enrollment_flow_completed_at','business_profile_completed_at',
        'identity_snapshot'
      ]);

      const sanitized = {};
      const ignored = {};
      for (const [k,v] of Object.entries(updateData || {})) {
        if (v === null || v === undefined) continue;
        if (allowed.has(k)) {
          sanitized[k] = v;
        } else {
          ignored[k] = v;
        }
      }

      if (Object.keys(ignored).length) {
        logger.debug('Ignoring non-profile fields in updateProfileData', { userId, ignoredKeys: Object.keys(ignored) });
      }

      const updateFields = [];
      const values = [];
      let paramCount = 1;

      // Gather current flags if any completion flags are present to set timestamps only on transitions
      const needsFlagCheck = ['signup_completed','enrollment_flow_completed','business_profile_completed'].some(f => f in sanitized);
      let current = null;
      if (needsFlagCheck) {
        const { data: rows } = await query(
          'SELECT signup_completed, enrollment_flow_completed, business_profile_completed FROM user_profiles WHERE user_id = $1',
          [userId],
          jwtPayload
        );
        current = rows && rows[0] ? rows[0] : {};
      }

      // Build dynamic update query with transition-aware timestamp setting
      Object.entries(sanitized).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (['signup_completed','enrollment_flow_completed','business_profile_completed'].includes(key)) {
          const prev = current ? current[key] : undefined;
            // If transitioning false->true set corresponding *_at if not already provided
          if (value === true && prev === false) {
            const tsCol = `${key}_at`;
            if (!sanitized[tsCol]) { // don't override explicitly supplied timestamp
              updateFields.push(`${tsCol} = $${paramCount}`);
              values.push(new Date());
              paramCount++;
            }
          }
        }
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
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
