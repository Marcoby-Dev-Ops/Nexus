import React, { useState, useEffect } from 'react';
import { performanceOptimizer } from '@/shared/utils/performanceOptimizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Activity, Cpu, Clock, Zap, X } from 'lucide-react';

interface PerformanceStats {
  intervals: number;
  timeouts: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  config: any;
}

export const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    const updateStats = () => {
      const currentStats = performanceOptimizer.getStats();
      
      // Get memory usage if available
      let memoryUsage;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        };
      }

      setStats({ ...currentStats, memoryUsage });
      setLastUpdate(new Date());
    };

    // Update immediately
    updateStats();

    // Update every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Activity className="w-4 h-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getMemoryColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage > 80) return 'text-red-600';
    if (percentage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getMemoryStatus = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage > 80) return 'Critical';
    if (percentage > 60) return 'Warning';
    return 'Good';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-background/95 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Active Intervals */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Active Intervals</span>
            </div>
            <Badge variant={stats.intervals > 5 ? 'destructive' : 'secondary'}>
              {stats.intervals}
            </Badge>
          </div>

          {/* Active Timeouts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">Active Timeouts</span>
            </div>
            <Badge variant={stats.timeouts > 3 ? 'destructive' : 'secondary'}>
              {stats.timeouts}
            </Badge>
          </div>

          {/* Memory Usage */}
          {stats.memoryUsage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Memory Usage</span>
                </div>
                <Badge variant={getMemoryStatus(stats.memoryUsage.used, stats.memoryUsage.limit) === 'Critical' ? 'destructive' : 'secondary'}>
                  {getMemoryStatus(stats.memoryUsage.used, stats.memoryUsage.limit)}
                </Badge>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Used:</span>
                  <span className={getMemoryColor(stats.memoryUsage.used, stats.memoryUsage.limit)}>
                    {stats.memoryUsage.used}MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{stats.memoryUsage.total}MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Limit:</span>
                  <span>{stats.memoryUsage.limit}MB</span>
                </div>
              </div>
            </div>
          )}

          {/* Last Update */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => performanceOptimizer.clearAll()}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={() => performanceOptimizer.setLiveDataEnabled(!stats.config.enableLiveData)}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              {stats.config.enableLiveData ? 'Disable' : 'Enable'} Live Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
