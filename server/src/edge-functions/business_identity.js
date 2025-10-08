const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');
const { generateEmbedding } = require('../database/vectorSearch');

/**
 * Business Identity Edge Function
 * Handles business identity data updates and validation
 */
async function business_identity(payload, user) {
  try {
    const { action, data, step } = payload;

    if (!user) {
      throw createError('User not authenticated', 401);
    }

    switch (action) {
      case 'update_company_foundation':
        return await updateCompanyFoundation(data, user);
      
      case 'update_industry_business_model':
        return await updateIndustryBusinessModel(data, user);
      
      case 'update_mission_vision':
        return await updateMissionVision(data, user);
      
      case 'update_core_values':
        return await updateCoreValues(data, user);
      
      case 'update_strategic_context':
        return await updateStrategicContext(data, user);
      
      case 'get_identity_status':
        return await getIdentityStatus(user);
      
      case 'validate_identity_completion':
        return await validateIdentityCompletion(user);
      
      default:
        throw createError(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('Business identity handler error:', error);
    throw error;
  }
}

/**
 * Update company foundation data
 */
async function updateCompanyFoundation(data, user) {
  try {
    const {
      name,
      legalName,
      legalStructure,
      foundedDate,
      headquarters,
      website,
      email,
      phone
    } = data;

    // Update user profile with company information
    await query(`
      UPDATE user_profiles 
      SET 
        company_name = $1,
        business_email = $2,
        phone = $3,
        website = $4,
        address = $5,
        updated_at = NOW()
      WHERE user_id = $6
    `, [
      name,
      email,
      phone,
      website,
      JSON.stringify(headquarters),
      user.id
    ]);

    // Check if company exists for this owner
    const existingCompany = await query(`
      SELECT id FROM companies WHERE owner_id = $1
    `, [user.id]);

    let companyResult;
    if (existingCompany.data && existingCompany.data.length > 0) {
      // Update existing company
      companyResult = await query(`
        UPDATE companies SET
          name = $1,
          website = $2,
          address = $3,
          contact_info = $4,
          updated_at = NOW()
        WHERE owner_id = $5
        RETURNING id
      `, [
        name,
        website,
        JSON.stringify(headquarters),
        JSON.stringify({ 
          email, 
          phone, 
          legalName, 
          legalStructure, 
          foundedDate 
        }),
        user.id
      ]);
    } else {
      // Create new company
      companyResult = await query(`
        INSERT INTO companies (
          name, 
          website, 
          address, 
          contact_info, 
          owner_id
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        name,
        website,
        JSON.stringify(headquarters),
        JSON.stringify({ 
          email, 
          phone, 
          legalName, 
          legalStructure, 
          foundedDate 
        }),
        user.id
      ]);
    }

    // Update business_identity column with foundation data
    const foundationData = {
      foundation: {
        name,
        legalName,
        legalStructure,
        foundedDate,
        headquarters,
        website,
        email,
        phone
      }
    };

    await query(`
      UPDATE companies SET 
        business_identity = COALESCE(business_identity, '{}'::jsonb) || $1::jsonb,
        updated_at = NOW()
      WHERE id = $2
    `, [JSON.stringify(foundationData), companyResult.data[0].id]);

    // Also sync core fields into top-level columns for easier querying
    try {
      const colFields = [];
      const colValues = [];
      let idx = 1;

      if (name) {
        colFields.push(`foundation_name = $${idx++}`);
        colValues.push(name);
        colFields.push(`name = $${idx++}`);
        colValues.push(name);
      }
      if (website) {
        colFields.push(`website = $${idx++}`);
        colValues.push(website);
      }
      if (headquarters && Object.keys(headquarters || {}).length > 0) {
        colFields.push(`address = $${idx++}`);
        colValues.push(JSON.stringify(headquarters));
      }
      const contact = {};
      if (email) contact.email = email;
      if (phone) contact.phone = phone;
      if (legalName) contact.legalName = legalName;
      if (legalStructure) contact.legalStructure = legalStructure;
      if (Object.keys(contact).length > 0) {
        colFields.push(`contact_info = COALESCE(contact_info, '{}'::jsonb) || $${idx++}::jsonb`);
        colValues.push(JSON.stringify(contact));
      }

      if (colFields.length > 0) {
        colValues.push(companyResult.data[0].id);
        await query(`UPDATE companies SET ${colFields.join(', ')}, updated_at = NOW() WHERE id = $${idx}`, colValues);
      }
    } catch (e) {
      console.error('Failed to sync company columns after foundation update:', e);
    }

    // Store in vector database for AI reference
    await storeBusinessIdentityInVectorDB({
      userId: user.id,
      companyId: companyResult.data[0].id,
      data: {
        type: 'company_foundation',
        name,
        legalName,
        legalStructure,
        foundedDate,
        headquarters,
        website,
        email,
        phone
      }
    });

    return {
      success: true,
      data: {
        companyId: companyResult.data[0].id,
        message: 'Company foundation updated successfully'
      }
    };

  } catch (error) {
    console.error('Error updating company foundation:', error);
    throw createError('Failed to update company foundation', 500);
  }
}

/**
 * Update industry and business model data
 */
async function updateIndustryBusinessModel(data, user) {
  try {
    const {
      industry,
      sector,
      businessModel,
      companyStage,
      companySize,
      revenueRange
    } = data;

    // Update user profile
    await query(`
      UPDATE user_profiles 
      SET 
        preferences = COALESCE(preferences, '{}'::jsonb) || $1,
        updated_at = NOW()
      WHERE user_id = $2
    `, [
      JSON.stringify({
        industry,
        sector,
        businessModel,
        companyStage,
        companySize,
        revenueRange
      }),
      user.id
    ]);

    // Update company record
    await query(`
      UPDATE companies 
      SET 
        industry = $1,
        size = $2,
        settings = COALESCE(settings, '{}'::jsonb) || $3,
        updated_at = NOW()
      WHERE owner_id = $4
    `, [
      industry,
      companySize,
      JSON.stringify({
        sector,
        businessModel,
        companyStage,
        revenueRange
      }),
      user.id
    ]);

    // Get company ID for this user
    const companyResult = await query(`
      SELECT id FROM companies WHERE owner_id = $1
    `, [user.id]);

    if (companyResult.data && companyResult.data.length > 0) {
      const companyId = companyResult.data[0].id;

      // Update business_identity column with industry/business model data
      const industryData = {
        industryBusinessModel: {
          industry,
          sector,
          businessModel,
          companyStage,
          companySize,
          revenueRange
        }
      };

      await query(`
        UPDATE companies SET 
          business_identity = COALESCE(business_identity, '{}'::jsonb) || $1::jsonb,
          updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(industryData), companyId]);

      // Store in vector database for AI reference
      await storeBusinessIdentityInVectorDB({
        userId: user.id,
        companyId: companyId,
        data: {
          type: 'industry_business_model',
          industry,
          sector,
          businessModel,
          companyStage,
          companySize,
          revenueRange
        }
      });
    }

    return {
      success: true,
      data: {
        message: 'Industry and business model updated successfully'
      }
    };

  } catch (error) {
    console.error('Error updating industry business model:', error);
    throw createError('Failed to update industry and business model', 500);
  }
}

/**
 * Update mission and vision data
 */
async function updateMissionVision(data, user) {
  try {
    const { missionStatement, visionStatement } = data;

    // Update user profile with mission/vision
    await query(`
      UPDATE user_profiles 
      SET 
        bio = $1,
        preferences = COALESCE(preferences, '{}'::jsonb) || $2,
        updated_at = NOW()
      WHERE user_id = $3
    `, [
      missionStatement,
      JSON.stringify({
        missionStatement,
        visionStatement
      }),
      user.id
    ]);

    // Update company record
    await query(`
      UPDATE companies 
      SET 
        description = $1,
        settings = COALESCE(settings, '{}'::jsonb) || $2,
        updated_at = NOW()
      WHERE owner_id = $3
    `, [
      missionStatement,
      JSON.stringify({
        visionStatement
      }),
      user.id
    ]);

    return {
      success: true,
      data: {
        message: 'Mission and vision updated successfully'
      }
    };

  } catch (error) {
    console.error('Error updating mission vision:', error);
    throw createError('Failed to update mission and vision', 500);
  }
}

/**
 * Update core values data
 */
async function updateCoreValues(data, user) {
  try {
    const { values, culturePrinciples } = data;

    // Update user profile with values
    await query(`
      UPDATE user_profiles 
      SET 
        preferences = COALESCE(preferences, '{}'::jsonb) || $1,
        updated_at = NOW()
      WHERE user_id = $2
    `, [
      JSON.stringify({
        coreValues: values,
        culturePrinciples
      }),
      user.id
    ]);

    // Update company record
    await query(`
      UPDATE companies 
      SET 
        settings = COALESCE(settings, '{}'::jsonb) || $1,
        updated_at = NOW()
      WHERE owner_id = $2
    `, [
      JSON.stringify({
        coreValues: values,
        culturePrinciples
      }),
      user.id
    ]);

    return {
      success: true,
      data: {
        message: 'Core values updated successfully'
      }
    };

  } catch (error) {
    console.error('Error updating core values:', error);
    throw createError('Failed to update core values', 500);
  }
}

/**
 * Update strategic context data
 */
async function updateStrategicContext(data, user) {
  try {
    const {
      businessGoals,
      challenges,
      successMetrics,
      strategicPriorities
    } = data;

    // Update user profile with strategic context
    await query(`
      UPDATE user_profiles 
      SET 
        preferences = COALESCE(preferences, '{}'::jsonb) || $1,
        updated_at = NOW()
      WHERE user_id = $2
    `, [
      JSON.stringify({
        businessGoals,
        challenges,
        successMetrics,
        strategicPriorities
      }),
      user.id
    ]);

    // Update company record
    await query(`
      UPDATE companies 
      SET 
        settings = COALESCE(settings, '{}'::jsonb) || $1,
        updated_at = NOW()
      WHERE owner_id = $2
    `, [
      JSON.stringify({
        businessGoals,
        challenges,
        successMetrics,
        strategicPriorities
      }),
      user.id
    ]);

    return {
      success: true,
      data: {
        message: 'Strategic context updated successfully'
      }
    };

  } catch (error) {
    console.error('Error updating strategic context:', error);
    throw createError('Failed to update strategic context', 500);
  }
}

/**
 * Get current identity status
 */
async function getIdentityStatus(user) {
  try {
    // Get user profile
    const profileResult = await query(`
      SELECT 
        company_name,
        business_email,
        website,
        bio,
        preferences,
        address
      FROM user_profiles 
      WHERE user_id = $1
    `, [user.id]);

    // Get company record
    const companyResult = await query(`
      SELECT 
        name,
        industry,
        size,
        description,
        settings
      FROM companies 
      WHERE owner_id = $1
    `, [user.id]);

    const profile = profileResult.data[0] || {};
    const company = companyResult.data[0] || {};

    // Calculate completion percentage
    let completionPercentage = 0;
    const requiredFields = [
      'company_name', 'business_email', 'website'
    ];

    const completedFields = requiredFields.filter(field => 
      profile[field] && profile[field].trim() !== ''
    );

    completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);

    return {
      success: true,
      data: {
        profile,
        company,
        completionPercentage,
        isComplete: completionPercentage >= 80
      }
    };

  } catch (error) {
    console.error('Error getting identity status:', error);
    throw createError('Failed to get identity status', 500);
  }
}

/**
 * Validate identity completion
 */
async function validateIdentityCompletion(user) {
  try {
    const statusResult = await getIdentityStatus(user);
    const { completionPercentage, isComplete } = statusResult.data;

    // Update business health snapshot if identity is complete
    if (isComplete) {
      await query(`
        INSERT INTO business_health_snapshots (
          user_id,
          overall_score,
          category_scores,
          completion_percentage
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) DO UPDATE SET
          overall_score = EXCLUDED.overall_score,
          category_scores = EXCLUDED.category_scores,
          completion_percentage = EXCLUDED.completion_percentage,
          updated_at = NOW()
      `, [
        user.id,
        Math.min(completionPercentage, 100),
        JSON.stringify({
          identity: completionPercentage,
          foundation: completionPercentage
        }),
        completionPercentage
      ]);
    }

    return {
      success: true,
      data: {
        isComplete,
        completionPercentage,
        message: isComplete 
          ? 'Business identity setup completed successfully!' 
          : 'Business identity setup is incomplete'
      }
    };

  } catch (error) {
    console.error('Error validating identity completion:', error);
    throw createError('Failed to validate identity completion', 500);
  }
}

/**
 * Store business identity data in vector database for AI reference
 */
async function storeBusinessIdentityInVectorDB({ userId, companyId, data }) {
  try {
    // Create structured content for embedding
    const content = createBusinessIdentityContent(data);
    
    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Store in documents table with proper metadata
    await query(`
      INSERT INTO documents (
        user_id,
        company_id,
        title,
        content,
        tags,
        metadata,
        embedding,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::vector, NOW(), NOW()
      )
      ON CONFLICT (user_id, title) DO UPDATE SET
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding,
        updated_at = NOW()
    `, [
      userId,
      companyId,
      `Business Identity: ${data.type}`,
      content,
      ['business-identity', data.type, 'ai-context'],
      JSON.stringify({
        type: 'business_identity',
        section: data.type,
        userId,
        companyId,
        timestamp: new Date().toISOString()
      }),
      `[${embedding.join(',')}]`
    ]);

    console.log(`Stored business identity data in vector DB: ${data.type}`);
    
  } catch (error) {
    console.error('Error storing business identity in vector DB:', error);
    // Don't throw error - this is supplementary storage
  }
}

/**
 * Create structured content for business identity data
 */
function createBusinessIdentityContent(data) {
  switch (data.type) {
    case 'company_foundation':
      return `Company Foundation Information:
Company Name: ${data.name}
Legal Name: ${data.legalName || data.name}
Legal Structure: ${data.legalStructure}
Founded Date: ${data.foundedDate}
Website: ${data.website}
Email: ${data.email}
Phone: ${data.phone}
Headquarters: ${data.headquarters.address}, ${data.headquarters.city}, ${data.headquarters.state} ${data.headquarters.zipCode}, ${data.headquarters.country}`;

    case 'industry_business_model':
      return `Industry and Business Model:
Industry: ${data.industry}
Sector: ${data.sector}
Business Model: ${data.businessModel}
Company Stage: ${data.companyStage}
Company Size: ${data.companySize}
Revenue Range: ${data.revenueRange}`;

    case 'mission_vision':
      return `Mission and Vision:
Mission Statement: ${data.missionStatement}
Vision Statement: ${data.visionStatement}`;

    case 'core_values':
      return `Core Values and Culture:
Core Values: ${Array.isArray(data.values) ? data.values.join(', ') : data.values}
Culture Principles: ${Array.isArray(data.culturePrinciples) ? data.culturePrinciples.join(', ') : data.culturePrinciples}`;

    case 'strategic_context':
      return `Strategic Context:
Business Goals: ${Array.isArray(data.businessGoals) ? data.businessGoals.join(', ') : data.businessGoals}
Challenges: ${Array.isArray(data.challenges) ? data.challenges.join(', ') : data.challenges}
Success Metrics: ${Array.isArray(data.successMetrics) ? data.successMetrics.join(', ') : data.successMetrics}
Strategic Priorities: ${Array.isArray(data.strategicPriorities) ? data.strategicPriorities.join(', ') : data.strategicPriorities}`;

    default:
      return `Business Identity Data: ${JSON.stringify(data, null, 2)}`;
  }
}

module.exports = business_identity;
