import React from 'react';
import { type LucideIcon, MoreHorizontal, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

/**
 * @name ModernChartCard
 * @description Modern chart card component with contemporary design elements
 * @returns {JSX.Element} The rendered modern chart card.
 */

interface ModernChartCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
}

const ModernChartCard: React.FC<ModernChartCardProps> = ({
  title,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  children,
  actionLabel,
  onAction,
  trend,
  gradientFrom = 'from-blue-50/30',
  gradientTo = 'to-cyan-50/10',
  className = ''
}) => {
  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600 bg-green-50/80 border-green-200/50';
      case 'down': return 'text-red-600 bg-red-50/80 border-red-200/50';
      default: return 'text-gray-600 bg-gray-50/80 border-gray-200/50';
    }
  };

  return (
    <Card className={`group relative overflow-hidden border-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} dark:from-slate-900/40 dark:to-slate-800/20 backdrop-blur-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 ${className}`}>
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-[1px]" />
      
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
      
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {Icon && (
              <div className={`p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm ${iconColor} shadow-lg shadow-blue-500/5 group-hover:scale-105 transition-transform duration-300`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {trend && (
              <Badge className={`px-3 py-1 text-xs font-semibold border backdrop-blur-sm ${getTrendColor(trend.direction)}`}>
                <span className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{trend.value}</span>
                </span>
              </Badge>
            )}
            
            {actionLabel && onAction && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAction}
                className="text-xs bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
              >
                {actionLabel}
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative pt-0">
        {/* Chart container with enhanced styling */}
        <div className="relative p-4 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 shadow-inner">
          {children}
          
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl pointer-events-none" />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
      </CardContent>
      
      {/* Animated border effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
    </Card>
  );
};

export default ModernChartCard; 