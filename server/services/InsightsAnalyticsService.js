const { query } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

/**
 * Insights Analytics Service
 * 
 * Handles storage and analysis of insights data for trend analysis
 * and providing users with information about similar organizations
 */
class InsightsAnalyticsService {
  constructor() {
    this.tableName = 'insights_analytics';
  }

  /**
   * Store insights analytics data for trend analysis
   */
  async storeInsightsAnalytics(context, insights, analysisMetadata) {
    try {
      const {
        user,
        selectedTools,
        selectedIntegrations,
        maturityLevel,
        sophisticationLevel,
        confidenceScore,
        dataCompletenessScore
      } = context;

      // Extract building blocks covered from insights
      const buildingBlocksCovered = this.extractBuildingBlocksFromInsights(insights);
      
      // Prepare analytics data
      const analyticsData = {
        user_id: user.id,
        company_id: user.companyId,
        organization_id: user.organizationId,
        industry: user.industry,
        company_size: user.companySize,
        maturity_level: maturityLevel,
        sophistication_level: sophisticationLevel,
        insight_count: insights.length,
        insights_data: insights,
        building_blocks_covered: buildingBlocksCovered,
        priority_areas: user.keyPriorities || [],
        tool_categories_count: Object.keys(selectedTools || {}).length,
        integration_count: selectedIntegrations?.length || 0,
        selected_tools: selectedTools || {},
        selected_integrations: selectedIntegrations || [],
        confidence_score: confidenceScore,
        data_completeness_score: dataCompletenessScore
      };

      const result = await query(
        `INSERT INTO ${this.tableName} (
          user_id, company_id, organization_id, industry, company_size,
          maturity_level, sophistication_level, insight_count, insights_data,
          building_blocks_covered, priority_areas, tool_categories_count,
          integration_count, selected_tools, selected_integrations,
          confidence_score, data_completeness_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id`,
        [
          analyticsData.user_id,
          analyticsData.company_id,
          analyticsData.organization_id,
          analyticsData.industry,
          analyticsData.company_size,
          analyticsData.maturity_level,
          analyticsData.sophistication_level,
          analyticsData.insight_count,
          JSON.stringify(analyticsData.insights_data),
          analyticsData.building_blocks_covered,
          analyticsData.priority_areas,
          analyticsData.tool_categories_count,
          analyticsData.integration_count,
          JSON.stringify(analyticsData.selected_tools),
          analyticsData.selected_integrations,
          analyticsData.confidence_score,
          analyticsData.data_completeness_score
        ]
      );

      if (result.error) {
        throw new Error(`Failed to store insights analytics: ${result.error}`);
      }

      logger.info('Insights analytics stored successfully', {
        analyticsId: result.data[0]?.id,
        userId: user.id,
        industry: user.industry,
        insightCount: insights.length
      });

      return result.data[0]?.id;
    } catch (error) {
      logger.error('Error storing insights analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get similar organizations based on user context
   */
  async getSimilarOrganizations(userContext, limit = 5) {
    try {
      const {
        industry,
        companySize,
        maturityLevel,
        sophisticationLevel,
        keyPriorities,
        selectedTools
      } = userContext;

      // Build similarity query based on available context
      const similarityQuery = `
        SELECT 
          ia.*,
          -- Calculate similarity score
          CASE 
            WHEN ia.industry = $1 THEN 3 ELSE 0 END +
          CASE 
            WHEN ia.company_size = $2 THEN 2 ELSE 0 END +
          CASE 
            WHEN ia.maturity_level = $3 THEN 2 ELSE 0 END +
          CASE 
            WHEN ia.sophistication_level = $4 THEN 1 ELSE 0 END +
          -- Priority overlap score
          (SELECT COUNT(*) FROM unnest($5::text[]) p1 
           WHERE p1 = ANY(ia.priority_areas)) * 2 +
          -- Tool overlap score
          (SELECT COUNT(*) FROM unnest($6::text[]) t1 
           WHERE t1 = ANY(ia.selected_integrations)) * 1
        AS similarity_score
        FROM ${this.tableName} ia
        WHERE ia.is_anonymized = true
        AND ia.insight_count > 0
        ORDER BY similarity_score DESC, ia.created_at DESC
        LIMIT $7
      `;

      const result = await query(similarityQuery, [
        industry,
        companySize,
        maturityLevel,
        sophisticationLevel,
        keyPriorities || [],
        Object.values(selectedTools || {}).flat() || [],
        limit
      ]);

      if (result.error) {
        throw new Error(`Failed to get similar organizations: ${result.error}`);
      }

      // Process and format the results
      const similarOrgs = result.data.map(row => ({
        id: row.id,
        industry: row.industry,
        companySize: row.company_size,
        maturityLevel: row.maturity_level,
        sophisticationLevel: row.sophistication_level,
        insightCount: row.insight_count,
        buildingBlocksCovered: row.building_blocks_covered,
        priorityAreas: row.priority_areas,
        toolCategoriesCount: row.tool_categories_count,
        integrationCount: row.integration_count,
        selectedIntegrations: row.selected_integrations,
        confidenceScore: row.confidence_score,
        similarityScore: row.similarity_score,
        createdAt: row.created_at
      }));

      logger.info('Retrieved similar organizations', {
        count: similarOrgs.length,
        userIndustry: industry,
        userCompanySize: companySize
      });

      return similarOrgs;
    } catch (error) {
      logger.error('Error getting similar organizations', { error: error.message });
      throw error;
    }
  }

  /**
   * Get industry trends and insights
   */
  async getIndustryTrends(industry, timeRange = '90 days') {
    try {
      const result = await query(`
        SELECT 
          ia.industry,
          ia.company_size,
          ia.maturity_level,
          ia.sophistication_level,
          COUNT(*) as organization_count,
          AVG(ia.insight_count) as avg_insights_per_org,
          AVG(ia.tool_categories_count) as avg_tool_categories,
          AVG(ia.integration_count) as avg_integrations,
          AVG(ia.confidence_score) as avg_confidence,
          -- Most common building blocks
          (SELECT array_agg(block ORDER BY count DESC LIMIT 3)
           FROM (
             SELECT unnest(ia.building_blocks_covered) as block, COUNT(*) as count
             FROM ${this.tableName} ia2
             WHERE ia2.industry = ia.industry
             GROUP BY block
           ) block_counts
          ) as top_building_blocks,
          -- Most common priorities
          (SELECT array_agg(priority ORDER BY count DESC LIMIT 3)
           FROM (
             SELECT unnest(ia.priority_areas) as priority, COUNT(*) as count
             FROM ${this.tableName} ia2
             WHERE ia2.industry = ia.industry
             GROUP BY priority
           ) priority_counts
          ) as top_priorities
        FROM ${this.tableName} ia
        WHERE ia.is_anonymized = true
        AND ia.created_at >= NOW() - INTERVAL $1
        AND ia.industry = $2
        GROUP BY ia.industry, ia.company_size, ia.maturity_level, ia.sophistication_level
        ORDER BY organization_count DESC
      `, [timeRange, industry]);

      if (result.error) {
        throw new Error(`Failed to get industry trends: ${result.error}`);
      }

      return result.data;
    } catch (error) {
      logger.error('Error getting industry trends', { error: error.message });
      throw error;
    }
  }

  /**
   * Get maturity level insights and recommendations
   */
  async getMaturityLevelInsights(maturityLevel, industry = null) {
    try {
      let query = `
        SELECT 
          ia.maturity_level,
          ia.sophistication_level,
          COUNT(*) as organization_count,
          AVG(ia.insight_count) as avg_insights,
          AVG(ia.tool_categories_count) as avg_tool_categories,
          AVG(ia.integration_count) as avg_integrations,
          AVG(ia.confidence_score) as avg_confidence,
          -- Common challenges and opportunities
          (SELECT array_agg(insight->>'title' ORDER BY count DESC LIMIT 5)
           FROM (
             SELECT jsonb_array_elements(ia.insights_data)->>'title' as title, COUNT(*) as count
             FROM ${this.tableName} ia2
             WHERE ia2.maturity_level = ia.maturity_level
             GROUP BY title
           ) insight_counts
          ) as common_insights,
          -- Tool adoption patterns
          (SELECT jsonb_object_agg(tool, count)
           FROM (
             SELECT unnest(ia.selected_integrations) as tool, COUNT(*) as count
             FROM ${this.tableName} ia2
             WHERE ia2.maturity_level = ia.maturity_level
             GROUP BY tool
             ORDER BY count DESC
             LIMIT 10
           ) tool_counts
          ) as tool_adoption
        FROM ${this.tableName} ia
        WHERE ia.is_anonymized = true
        AND ia.maturity_level = $1
      `;

      const params = [maturityLevel];
      
      if (industry) {
        query += ` AND ia.industry = $2`;
        params.push(industry);
      }

      query += `
        GROUP BY ia.maturity_level, ia.sophistication_level
        ORDER BY organization_count DESC
      `;

      const result = await query(query, params);

      if (result.error) {
        throw new Error(`Failed to get maturity level insights: ${result.error}`);
      }

      return result.data;
    } catch (error) {
      logger.error('Error getting maturity level insights', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract building blocks from insights data
   */
  extractBuildingBlocksFromInsights(insights) {
    const buildingBlocks = new Set();
    
    insights.forEach(insight => {
      if (insight.category) {
        buildingBlocks.add(insight.category.toLowerCase());
      }
    });

    return Array.from(buildingBlocks);
  }

  /**
   * Generate insights summary for similar organizations
   */
  generateSimilarOrganizationsSummary(similarOrgs) {
    if (!similarOrgs || similarOrgs.length === 0) {
      return {
        message: "We're still building our database of organizations like yours. Check back soon for insights from similar companies!",
        organizations: []
      };
    }

    const totalOrgs = similarOrgs.length;
    const avgInsights = Math.round(similarOrgs.reduce((sum, org) => sum + org.insightCount, 0) / totalOrgs);
    const avgTools = Math.round(similarOrgs.reduce((sum, org) => sum + org.toolCategoriesCount, 0) / totalOrgs);
    const avgIntegrations = Math.round(similarOrgs.reduce((sum, org) => sum + org.integrationCount, 0) / totalOrgs);

    // Get most common building blocks
    const buildingBlockCounts = {};
    similarOrgs.forEach(org => {
      org.buildingBlocksCovered.forEach(block => {
        buildingBlockCounts[block] = (buildingBlockCounts[block] || 0) + 1;
      });
    });

    const topBuildingBlocks = Object.entries(buildingBlockCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([block]) => block);

    return {
      message: `Based on ${totalOrgs} similar organizations in your industry and maturity level:`,
      summary: {
        totalOrganizations: totalOrgs,
        averageInsights: avgInsights,
        averageToolCategories: avgTools,
        averageIntegrations: avgIntegrations,
        topBuildingBlocks: topBuildingBlocks
      },
      organizations: similarOrgs.slice(0, 3).map(org => ({
        industry: org.industry,
        companySize: org.companySize,
        maturityLevel: org.maturityLevel,
        insightCount: org.insightCount,
        buildingBlocksCovered: org.buildingBlocksCovered,
        priorityAreas: org.priorityAreas,
        toolCategoriesCount: org.toolCategoriesCount,
        integrationCount: org.integrationCount,
        selectedIntegrations: org.selectedIntegrations.slice(0, 5), // Show top 5
        similarityScore: org.similarityScore
      }))
    };
  }
}

module.exports = { InsightsAnalyticsService };
