/**
 * UnifiedComponents.tsx
 * Consolidated, reusable components to eliminate redundancy across the codebase
 * 
 * Pillar: 1 (Efficient Automation) - Reduces maintenance overhead
 * Pillar: 5 (Speed & Performance) - Consistent bundle optimization
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/utils/styles';
import { TrendingUp, TrendingDown, Minus, Sparkles, Brain, Zap, Lightbulb, BookOpen } from 'lucide-react';

// ===== UNIFIED METRIC COMPONENTS =====

/**
 * Unified KPI/Stats Card - Replaces both KpiCard and StatsCard
 */
export interface UnifiedMetricCardProps {
  title: string;
  value: string;
  delta?: string;
  badge?: 'AI' | 'Auto' | 'Insight' | 'Learning';
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const UnifiedMetricCard: React.FC<UnifiedMetricCardProps> = ({
  title,
  value,
  delta,
  badge,
  description,
  trend,
  className
}) => {
  // Determine trend from delta if not explicitly provided
  const determinedTrend = trend || (delta?.startsWith('+') ? 'up' : delta?.startsWith('-') ? 'down' : 'neutral');
  
  const getBadgeConfig = (badgeType?: string) => {
    switch (badgeType) {
      case 'AI':
        return {
          icon: Brain,
          className: 'bg-primary-subtle text-primary border-primary-subtle',
          label: 'AI Powered'
        };
      case 'Auto':
        return {
          icon: Zap,
          className: 'bg-success-subtle text-success border-success-subtle',
          label: 'Automated'
        };
      case 'Insight':
        return {
          icon: Lightbulb,
          className: 'bg-secondary-subtle text-secondary border-secondary-subtle',
          label: 'Business Insight'
        };
      case 'Learning':
        return {
          icon: BookOpen,
          className: 'bg-warning-subtle text-warning border-warning-subtle',
          label: 'Learning System'
        };
      default:
        return null;
    }
  };

  const getTrendIcon = () => {
    switch (determinedTrend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (determinedTrend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const badgeConfig = getBadgeConfig(badge);

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200 hover: shadow-md',
      badge && 'border-l-4',
      badge === 'AI' && 'border-l-primary bg-gradient-to-br from-primary-subtle/50 to-background',
      badge === 'Auto' && 'border-l-success bg-gradient-to-br from-success-subtle/50 to-background',
      badge === 'Insight' && 'border-l-secondary bg-gradient-to-br from-secondary-subtle/50 to-background',
      badge === 'Learning' && 'border-l-warning bg-gradient-to-br from-warning-subtle/50 to-background',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {badgeConfig && (
            <Badge 
              variant="outline" 
              className={cn('text-xs px-2 py-1', badgeConfig.className)}
              title={badgeConfig.label}
            >
              <badgeConfig.icon className="w-3 h-3 mr-1" />
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {delta && (
              <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                {getTrendIcon()}
                <span>{delta}</span>
              </div>
            )}
          </div>
          {badge && (
            <div className="opacity-20">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ===== UNIFIED DASHBOARD COMPONENTS =====

/**
 * Unified Dashboard Header - Consistent across all dashboards
 */
interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badges?: Array<{ label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  actions,
  badges
}) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {badges?.map((badge, index) => (
          <Badge key={index} variant={badge.variant || 'default'}>
            {badge.label}
          </Badge>
        ))}
      </div>
      {subtitle && (
        <p className="text-lg text-muted-foreground">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

/**
 * Unified Metrics Grid - Consistent KPI layout
 */
interface MetricsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  children,
  columns = 4,
  className
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
};

/**
 * Unified Content Section - Standardized content blocks
 */
interface ContentSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  icon: Icon,
  children,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-primary" />}
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
};

// ===== UNIFIED DASHBOARD LAYOUT =====

/**
 * Unified Dashboard Layout - Complete dashboard structure
 */
interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  badge,
  children,
  className
}) => {
  return (
    <div className={cn('text-foreground', className)}>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Enhanced Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">
              {title}
            </h1>
            {badge && (
              <Badge 
                variant="outline" 
                className="bg-gradient-to-r from-blue-100 to-purple-100 text-primary border-border px-4 py-1"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {/* Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// ===== UNIFIED DATA DISPLAY =====

/**
 * Unified Table Card - Consistent table presentation
 */
interface TableCardProps {
  title: string;
  description?: string;
  headers: string[];
  data: Array<Record<string, any>>;
  loading?: boolean;
  className?: string;
}

export const TableCard: React.FC<TableCardProps> = ({
  title,
  description,
  headers,
  data,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="outline" className="text-xs">
            {data.length} items
          </Badge>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {headers.map((header, index) => (
                  <th key={index} className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover: bg-muted transition-colors">
                  {headers.map((header, colIndex) => (
                    <td key={colIndex} className="py-3 px-4 text-sm text-foreground">
                      {row[header.toLowerCase().replace(/\s+/g, '_')] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// ===== EXPORTS =====

export {
  type DashboardHeaderProps,
  type MetricsGridProps,
  type ContentSectionProps,
  type DashboardLayoutProps,
  type TableCardProps
};

export default {
  UnifiedMetricCard,
  DashboardLayout,
  ContentSection,
  MetricsGrid,
  TableCard
}; 