/**
 * Performance Optimization Utilities
 * Centralized management of intervals, timeouts, and performance-critical operations
 */

import { logger } from './logger';
import { getEnvVar } from '@/lib/env-utils';

interface PerformanceConfig {
  // Interval management
  enableLiveData: boolean;
  liveDataInterval: number;
  enableHeartbeat: boolean;
  heartbeatInterval: number;
  enableCacheCleanup: boolean;
  cacheCleanupInterval: number;
  
  // Memory management
  maxCacheSize: number;
  enableMemoryMonitoring: boolean;
  
  // API optimization
  enableRequestDeduplication: boolean;
  requestCacheTimeout: number;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private config: PerformanceConfig;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = getEnvVar('NODE_ENV') === 'development';
    this.config = {
      // Development: More conservative settings
      enableLiveData: !this.isDevelopment,
      liveDataInterval: this.isDevelopment ? 120000 : 30000, // 2min dev, 30s prod
      enableHeartbeat: !this.isDevelopment,
      heartbeatInterval: this.isDevelopment ? 60000 : 30000, // 1min dev, 30s prod
      enableCacheCleanup: true,
      cacheCleanupInterval: this.isDevelopment ? 600000 : 300000, // 10min dev, 5min prod
      
      // Memory management
      maxCacheSize: 100,
      enableMemoryMonitoring: this.isDevelopment,
      
      // API optimization
      enableRequestDeduplication: true,
      requestCacheTimeout: 30000,
    };
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Set up an interval with proper cleanup
   */
  setInterval(id: string, callback: () => void, delay: number): void {
    // Clear existing interval if it exists
    this.clearInterval(id);
    
    const interval = window.setInterval(() => {
      try {
        callback();
      } catch (error) {
        logger.error(`Error in interval ${id}:`, error);
      }
    }, delay);
    
    this.intervals.set(id, interval);
    // Debug logging removed for MVP
  }

  /**
   * Clear an interval
   */
  clearInterval(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      window.clearInterval(interval);
      this.intervals.delete(id);
      // Debug logging removed for MVP
    }
  }

  /**
   * Set up a timeout with proper cleanup
   */
  setTimeout(id: string, callback: () => void, delay: number): void {
    // Clear existing timeout if it exists
    this.clearTimeout(id);
    
    const timeout = window.setTimeout(() => {
      try {
        callback();
        this.timeouts.delete(id);
      } catch (error) {
        logger.error(`Error in timeout ${id}:`, error);
      }
    }, delay);
    
    this.timeouts.set(id, timeout);
    // Debug logging removed for MVP
  }

  /**
   * Clear a timeout
   */
  clearTimeout(id: string): void {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      this.timeouts.delete(id);
      // Debug logging removed for MVP
    }
  }

  /**
   * Clear all intervals and timeouts
   */
  clearAll(): void {
    this.intervals.forEach((interval, id) => {
      window.clearInterval(interval);
      // Debug logging removed for MVP
    });
    this.intervals.clear();

    this.timeouts.forEach((timeout, id) => {
      window.clearTimeout(timeout);
      // Debug logging removed for MVP
    });
    this.timeouts.clear();
  }

  /**
   * Get performance statistics
   */
  getStats(): { intervals: number; timeouts: number; config: PerformanceConfig } {
    return {
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      config: this.config,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Performance config updated:', this.config);
  }

  /**
   * Enable/disable live data updates
   */
  setLiveDataEnabled(enabled: boolean): void {
    this.config.enableLiveData = enabled;
    if (!enabled) {
      // Clear all live data intervals
      this.intervals.forEach((interval, id) => {
        if (id.includes('live-data') || id.includes('refresh')) {
          this.clearInterval(id);
        }
      });
    }
    logger.info(`Live data ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Memory monitoring (development only)
   */
  startMemoryMonitoring(): void {
    if (!this.isDevelopment || !this.config.enableMemoryMonitoring) return;

    this.setInterval('memory-monitor', () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        
        if (usedMB > limitMB * 0.8) {
          logger.warn(`High memory usage: ${usedMB}MB / ${limitMB}MB`);
        }
        
        // Debug logging removed for MVP
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Cleanup on page unload
   */
  setupCleanup(): void {
    window.addEventListener('beforeunload', () => {
      this.clearAll();
    });

    // Also cleanup on visibility change to save resources
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, reduce intervals
        this.intervals.forEach((interval, id) => {
          if (id.includes('live-data') || id.includes('refresh')) {
            this.clearInterval(id);
          }
        });
      } else {
        // Page is visible again, restore intervals
        // Debug logging removed for MVP
      }
    });
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Export configuration for components
export const getPerformanceConfig = () => performanceOptimizer.getStats().config;

// Export utility functions
export const setManagedInterval = (id: string, callback: () => void, delay: number) => 
  performanceOptimizer.setInterval(id, callback, delay);

export const clearManagedInterval = (id: string) => 
  performanceOptimizer.clearInterval(id);

export const setManagedTimeout = (id: string, callback: () => void, delay: number) => 
  performanceOptimizer.setTimeout(id, callback, delay);

export const clearManagedTimeout = (id: string) => 
  performanceOptimizer.clearTimeout(id);

// Initialize cleanup on module load
if (typeof window !== 'undefined') {
  performanceOptimizer.setupCleanup();
  performanceOptimizer.startMemoryMonitoring();
}
