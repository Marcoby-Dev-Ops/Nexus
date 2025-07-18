import { useEffect } from 'react';
import { supabase } from "@/core/supabase";

// Types
export interface ComponentUsage {
  componentName: string;
  location: string;
  timestamp: string;
  usageCount?: number;
  performanceMetrics?: Record<string, any>;
}

// In-memory store
const usageStore: Record<string, ComponentUsage> = {};

// Service methods
export const IntegrationTracker = {
  trackUsage: async (usage: ComponentUsage) => {
    const key = `${usage.componentName}|${usage.location}`;
    if (usageStore[key]) {
      usageStore[key].usageCount = (usageStore[key].usageCount || 1) + 1;
      usageStore[key].timestamp = new Date().toISOString();
    } else {
      usageStore[key] = { ...usage, usageCount: 1, timestamp: new Date().toISOString() };
    }
    // Optionally, sync immediately (or batch later)
    await IntegrationTracker.syncUsageToSupabase(usageStore[key]);
  },
  syncUsageToSupabase: async (usage: ComponentUsage) => {
    // Upsert usage record
    await supabase.from('component_usages').upsert([
      {
        component_name: usage.componentName,
        location: usage.location,
        timestamp: usage.timestamp,
        usage_count: usage.usageCount,
        performance_metrics: usage.performanceMetrics || null,
      },
    ]);
  },
  loadUsagesFromSupabase: async (): Promise<ComponentUsage[]> => {
    const { data, error } = await supabase.from('component_usages').select('*');
    if (error) throw error;
    return (data || []).map((row: any) => ({
      componentName: row.component_name,
      location: row.location,
      timestamp: row.timestamp,
      usageCount: row.usage_count,
      performanceMetrics: row.performance_metrics,
    }));
  },
  getInMemoryUsages: (): ComponentUsage[] => Object.values(usageStore),
};

// React hook for components to report usage
export function useIntegrationTracker(componentName: string, location: string, performanceMetrics?: Record<string, any>) {
  useEffect(() => {
    IntegrationTracker.trackUsage({
      componentName,
      location,
      timestamp: new Date().toISOString(),
      performanceMetrics,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName, location]);
} 