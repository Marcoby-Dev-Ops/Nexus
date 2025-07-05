import { supabase } from '../core/supabase';
import { 
  businessHealthKPIs, 
  healthCategories, 
  calculateOverallHealthScore,
  calculateCategoryScore,
  type KPI 
} from '../businessHealthKPIs';
import { logger } from '../security/logger';

export interface BusinessHealthData {
  kpiValues: Record<string, number | string | boolean>;
  categoryScores: Record<string, number>;
  overallScore: number;
  lastUpdated: string;
  completionPercentage: number;
  missingKPIs: string[];
}

export interface KPIDataPoint {
  kpi_key: string;
  value: unknown;
  captured_at: string;
  source: string;
}

/**
 * Business Health Service
 * Manages fetching, calculating, and updating business health metrics
 */
export class BusinessHealthService {
  /**
   * Fetch current business health data for the organization
   */
  async fetchBusinessHealthData(orgId: string): Promise<BusinessHealthData> {
    // 1. Attempt to fetch via Supabase RPC `get_business_health_score` (preferred)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_business_health_score');
      if (!rpcErr && rpcData && rpcData.length > 0) {
        const { score, breakdown } = rpcData[0] as { score: number; breakdown: any };

        // breakdown expected shape: { [categoryId]: number }
        const categoryScores: Record<string, number> = breakdown ?? {};

        const result: BusinessHealthData = {
          kpiValues: {},
          categoryScores,
          overallScore: score,
          lastUpdated: new Date().toISOString(),
          completionPercentage: 0,
          missingKPIs: [],
        };
        logger.info({ orgId, score }, 'Fetched business health via RPC');
        return result;
      }
    } catch (rpcCatch) {
      logger.error({ err: rpcCatch, orgId }, 'RPC get_business_health_score failed');
    }

    // 2. Fallback to snapshot-based calculation --------------------------------
    try {
      logger.info({ orgId }, 'Fetching business health data');
      
      // Fetch KPI snapshots from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: snapshots, error } = await supabase
        .from('ai_kpi_snapshots')
        .select('kpi_key, kpi_id, value, captured_at, source')
        .eq('org_id', orgId)
        .gte('captured_at', thirtyDaysAgo.toISOString())
        .order('captured_at', { ascending: false });
      
      if (error) {
        logger.error({ error, orgId }, 'Failed to fetch KPI snapshots');
        throw error;
      }
      
      // Process snapshots into KPI values (latest value per KPI)
      const kpiValues: Record<string, number | string | boolean> = {};
      const processedKPIs = new Set<string>();
      
      for (const snapshot of snapshots || []) {
        const kpiKey = snapshot.kpi_id || snapshot.kpi_key;
        
        if (!processedKPIs.has(kpiKey)) {
          // Extract value from JSONB
          let value = snapshot.value;
          if (typeof value === 'object' && value !== null) {
            // Handle structured values (e.g., { amount: 1000, currency: 'USD' })
            value = (value as any).amount || (value as any).value || value;
          }
          
          kpiValues[kpiKey] = value as number | string | boolean;
          processedKPIs.add(kpiKey);
        }
      }
      
      // Calculate scores
      const { overallScore, categoryScores } = calculateOverallHealthScore(kpiValues);
      
      // Calculate completion percentage
      const totalKPIs = businessHealthKPIs.length;
      const completedKPIs = Object.keys(kpiValues).length;
      const completionPercentage = Math.round((completedKPIs / totalKPIs) * 100);
      
      // Identify missing KPIs
      const missingKPIs = businessHealthKPIs
        .filter(kpi => !(kpi.id in kpiValues))
        .map(kpi => kpi.id);
      
      const result: BusinessHealthData = {
        kpiValues,
        categoryScores,
        overallScore,
        lastUpdated: new Date().toISOString(),
        completionPercentage,
        missingKPIs
      };
      
      logger.info({ 
        orgId, 
        overallScore, 
        completionPercentage,
        missingKPICount: missingKPIs.length 
      }, 'Business health data calculated');
      
      return result;
      
    } catch (error) {
      logger.error({ error, orgId }, 'Error fetching business health data');
      throw error;
    }
  }
  
  /**
   * Update a single KPI value
   */
  async updateKPIValue(
    orgId: string,
    departmentId: string,
    kpiId: string,
    value: number | string | boolean,
    source: string = 'manual'
  ): Promise<void> {
    try {
      logger.info({ orgId, departmentId, kpiId, source }, 'Updating KPI value');
      
      const { error } = await supabase
        .from('ai_kpi_snapshots')
        .insert({
          org_id: orgId,
          department_id: departmentId,
          kpi_id: kpiId,
          kpi_key: kpiId,
          value: typeof value === 'object' ? value : { value },
          source,
          captured_at: new Date().toISOString()
        });
      
      if (error) {
        logger.error({ error, orgId, kpiId }, 'Failed to update KPI value');
        throw error;
      }
      
      logger.info({ orgId, kpiId }, 'KPI value updated successfully');
      
    } catch (error) {
      logger.error({ error, orgId, kpiId }, 'Error updating KPI value');
      throw error;
    }
  }
  
  /**
   * Bulk update multiple KPI values
   */
  async bulkUpdateKPIs(
    orgId: string,
    departmentId: string,
    kpiUpdates: Array<{
      kpiId: string;
      value: number | string | boolean;
      source?: string;
    }>
  ): Promise<void> {
    try {
      logger.info({ orgId, departmentId, updateCount: kpiUpdates.length }, 'Bulk updating KPIs');
      
      const rows = kpiUpdates.map(update => ({
        org_id: orgId,
        department_id: departmentId,
        kpi_id: update.kpiId,
        kpi_key: update.kpiId,
        value: typeof update.value === 'object' ? update.value : { value: update.value },
        source: update.source || 'bulk_update',
        captured_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('ai_kpi_snapshots')
        .insert(rows);
      
      if (error) {
        logger.error({ error, orgId, updateCount: kpiUpdates.length }, 'Failed to bulk update KPIs');
        throw error;
      }
      
      logger.info({ orgId, updateCount: kpiUpdates.length }, 'KPIs bulk updated successfully');
      
    } catch (error) {
      logger.error({ error, orgId }, 'Error bulk updating KPIs');
      throw error;
    }
  }
  
  /**
   * Get KPI history for trend analysis
   */
  async getKPIHistory(
    orgId: string,
    kpiId: string,
    days: number = 90
  ): Promise<Array<{ date: string; value: number | string | boolean }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('ai_kpi_snapshots')
        .select('value, captured_at')
        .eq('org_id', orgId)
        .eq('kpi_id', kpiId)
        .gte('captured_at', startDate.toISOString())
        .order('captured_at', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(row => ({
        date: row.captured_at,
        value: typeof row.value === 'object' && row.value !== null 
          ? (row.value as any).value || (row.value as any).amount || row.value
          : row.value
      }));
      
    } catch (error) {
      logger.error({ error, orgId, kpiId }, 'Error fetching KPI history');
      throw error;
    }
  }
  
  /**
   * Get improvement recommendations based on current scores
   */
  getImprovementRecommendations(healthData: BusinessHealthData): Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
  }> {
    const recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      actionItems: string[];
    }> = [];
    
    // Analyze each category for improvement opportunities
    healthCategories.forEach(category => {
      const score = healthData.categoryScores[category.id] || 0;
      
      if (score < 60) {
        recommendations.push({
          category: category.id,
          priority: 'high',
          title: `Improve ${category.name} Performance`,
          description: `Your ${category.name.toLowerCase()} score of ${score}% needs immediate attention.`,
          actionItems: this.getCategoryActionItems(category.id, healthData.kpiValues)
        });
      } else if (score < 80) {
        recommendations.push({
          category: category.id,
          priority: 'medium',
          title: `Optimize ${category.name} Metrics`,
          description: `Your ${category.name.toLowerCase()} score of ${score}% has room for improvement.`,
          actionItems: this.getCategoryActionItems(category.id, healthData.kpiValues)
        });
      }
    });
    
    // Add data completion recommendations
    if (healthData.completionPercentage < 80) {
      recommendations.push({
        category: 'data',
        priority: 'high',
        title: 'Complete Your Business Health Assessment',
        description: `Only ${healthData.completionPercentage}% of your KPIs have data. Complete the assessment for accurate insights.`,
        actionItems: [
          'Connect missing data sources',
          'Manually input key metrics',
          'Set up automated data collection',
          'Review and update existing KPI values'
        ]
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Get specific action items for a category based on low-performing KPIs
   */
  private getCategoryActionItems(categoryId: string, kpiValues: Record<string, number | string | boolean>): string[] {
    const categoryKPIs = businessHealthKPIs.filter(kpi => kpi.category === categoryId);
    const actionItems: string[] = [];
    
    categoryKPIs.forEach(kpi => {
      if (kpi.actionTask && kpiValues[kpi.id] !== undefined) {
        // Check if KPI is underperforming
        const score = this.calculateKPIScore(kpi, kpiValues[kpi.id]);
        if (score < 60) {
          actionItems.push(kpi.actionTask);
        }
      }
    });
    
    // Add generic action items if no specific ones available
    if (actionItems.length === 0) {
      switch (categoryId) {
        case 'sales':
          actionItems.push(
            'Review and optimize your sales funnel',
            'Improve lead qualification process',
            'Analyze customer acquisition costs'
          );
          break;
        case 'finance':
          actionItems.push(
            'Review monthly financial statements',
            'Optimize cash flow management',
            'Reduce operational expenses'
          );
          break;
        case 'support':
          actionItems.push(
            'Implement customer feedback system',
            'Optimize support ticket workflow',
            'Train support team on best practices'
          );
          break;
        case 'marketing':
          actionItems.push(
            'Analyze marketing campaign performance',
            'Optimize content strategy',
            'Improve lead generation tactics'
          );
          break;
        case 'operations':
          actionItems.push(
            'Identify automation opportunities',
            'Review operational processes',
            'Optimize resource utilization'
          );
          break;
        case 'maturity':
          actionItems.push(
            'Document standard operating procedures',
            'Implement strategic planning process',
            'Review organizational structure'
          );
          break;
      }
    }
    
    return actionItems;
  }
  
  /**
   * Calculate KPI score (duplicated from businessHealthKPIs.ts for internal use)
   */
  private calculateKPIScore(kpi: KPI, value: number | string | boolean): number {
    if (kpi.dataType === 'boolean') {
      return value ? 100 : 0;
    }
    
    if (kpi.dataType === 'selection') {
      const options = kpi.options || [];
      const index = options.indexOf(value as string);
      return index >= 0 ? (index / (options.length - 1)) * 100 : 0;
    }
    
    if (kpi.thresholds) {
      const numValue = typeof value === 'number' ? value : parseFloat(value as string);
      if (isNaN(numValue)) return 0;
      
      const { poor, fair, good, excellent } = kpi.thresholds;
      const isInverse = poor > excellent;
      
      if (isInverse) {
        if (numValue <= excellent) return 100;
        if (numValue <= good) return 80;
        if (numValue <= fair) return 60;
        if (numValue <= poor) return 40;
        return 20;
      } else {
        if (numValue >= excellent) return 100;
        if (numValue >= good) return 80;
        if (numValue >= fair) return 60;
        if (numValue >= poor) return 40;
        return 20;
      }
    }
    
    return 0;
  }
}

// Export singleton instance
export const businessHealthService = new BusinessHealthService();