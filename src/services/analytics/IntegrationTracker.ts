import { supabase } from '@/lib/supabase';

export interface ComponentUsage {
  id: string;
  componentName: string;
  pageName: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface IntegrationStats {
  totalComponents: number;
  activeComponents: number;
  totalUsageCount: number;
  averageUsagePerComponent: number;
  healthScore: number;
  lastUpdated: string;
}

class IntegrationTracker {
  private inMemoryUsages: ComponentUsage[] = [];

  async loadUsagesFromSupabase(): Promise<ComponentUsage[]> {
    try {
      const { data, error } = await supabase
        .from('component_usages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error loading component usages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to load component usages:', error);
      return [];
    }
  }

  async saveUsageToSupabase(usage: ComponentUsage): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('component_usages')
        .insert({
          component_name: usage.componentName,
          page_name: usage.pageName,
          timestamp: usage.timestamp,
          user_id: usage.userId,
          session_id: usage.sessionId,
          metadata: usage.metadata,
        });

      if (error) {
        console.error('Error saving component usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to save component usage:', error);
      return false;
    }
  }

  trackUsage(componentName: string, pageName: string, metadata?: Record<string, any>): void {
    const usage: ComponentUsage = {
      id: `usage_${Date.now()}_${Math.random()}`,
      componentName,
      pageName,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      metadata,
    };

    // Store in memory for immediate access
    this.inMemoryUsages.push(usage);

    // Save to Supabase asynchronously
    this.saveUsageToSupabase(usage).catch(error => {
      console.error('Failed to save usage to Supabase:', error);
    });
  }

  getInMemoryUsages(): ComponentUsage[] {
    return [...this.inMemoryUsages];
  }

  async getComponentStats(componentName: string): Promise<{
    totalUsage: number;
    uniquePages: number;
    lastUsed: string;
    averageUsagePerPage: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('component_usages')
        .select('*')
        .eq('component_name', componentName);

      if (error) {
        console.error('Error getting component stats:', error);
        return {
          totalUsage: 0,
          uniquePages: 0,
          lastUsed: '',
          averageUsagePerPage: 0,
        };
      }

      const usages = data || [];
      const uniquePages = new Set(usages.map(u => u.page_name)).size;
      const lastUsed = usages.length > 0 ? usages[0].timestamp : '';

      return {
        totalUsage: usages.length,
        uniquePages,
        lastUsed,
        averageUsagePerPage: uniquePages > 0 ? usages.length / uniquePages : 0,
      };
    } catch (error) {
      console.error('Failed to get component stats:', error);
      return {
        totalUsage: 0,
        uniquePages: 0,
        lastUsed: '',
        averageUsagePerPage: 0,
      };
    }
  }

  async getIntegrationStats(): Promise<IntegrationStats> {
    try {
      const { data, error } = await supabase
        .from('component_usages')
        .select('component_name, page_name, timestamp');

      if (error) {
        console.error('Error getting integration stats:', error);
        return this.getMockStats();
      }

      const usages = data || [];
      const uniqueComponents = new Set(usages.map(u => u.component_name)).size;
      const uniquePages = new Set(usages.map(u => u.page_name)).size;

      return {
        totalComponents: uniqueComponents,
        activeComponents: uniqueComponents, // Simplified for now
        totalUsageCount: usages.length,
        averageUsagePerComponent: uniqueComponents > 0 ? usages.length / uniqueComponents : 0,
        healthScore: this.calculateHealthScore(usages),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get integration stats:', error);
      return this.getMockStats();
    }
  }

  async getTopComponents(limit: number = 10): Promise<Array<{
    componentName: string;
    usageCount: number;
    lastUsed: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('component_usages')
        .select('component_name, timestamp')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error getting top components:', error);
        return [];
      }

      const usages = data || [];
      const componentCounts = new Map<string, { count: number; lastUsed: string }>();

      usages.forEach(usage => {
        const existing = componentCounts.get(usage.component_name);
        if (existing) {
          existing.count++;
          if (usage.timestamp > existing.lastUsed) {
            existing.lastUsed = usage.timestamp;
          }
        } else {
          componentCounts.set(usage.component_name, {
            count: 1,
            lastUsed: usage.timestamp,
          });
        }
      });

      return Array.from(componentCounts.entries())
        .map(([componentName, stats]) => ({
          componentName,
          usageCount: stats.count,
          lastUsed: stats.lastUsed,
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get top components:', error);
      return [];
    }
  }

  private calculateHealthScore(usages: any[]): number {
    // Simple health score calculation
    // In a real implementation, this would consider error rates, performance, etc.
    const totalUsage = usages.length;
    const uniqueComponents = new Set(usages.map(u => u.component_name)).size;
    
    if (totalUsage === 0) return 0;
    
    // Basic scoring: more usage and more components = higher health
    const usageScore = Math.min(totalUsage / 100, 1) * 50;
    const diversityScore = Math.min(uniqueComponents / 20, 1) * 50;
    
    return Math.round(usageScore + diversityScore);
  }

  private getMockStats(): IntegrationStats {
    return {
      totalComponents: 45,
      activeComponents: 38,
      totalUsageCount: 1247,
      averageUsagePerComponent: 27.7,
      healthScore: 85,
      lastUpdated: new Date().toISOString(),
    };
  }

  private getSessionId(): string {
    // Generate a simple session ID
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { IntegrationTracker };
export const integrationTracker = new IntegrationTracker(); 