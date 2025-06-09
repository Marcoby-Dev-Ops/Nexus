import React from 'react';
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * @name ModernKpiCard
 * @description Modern KPI card component with contemporary design elements
 * @returns {JSX.Element} The rendered modern KPI card.
 */

interface ModernKpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  iconColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ModernKpiCard: React.FC<ModernKpiCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  iconColor = 'text-blue-600',
  gradientFrom = 'from-blue-50',
  gradientTo = 'to-cyan-50/50',
  description,
  actionLabel,
  onAction
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200';
      case 'down': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={`group relative overflow-hidden border-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} dark:from-slate-900/60 dark:to-slate-800/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-1`}>
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px]" />
      
      {/* Glass morphism border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent dark:from-slate-700/20 rounded-lg" />
      
      <CardContent className="relative p-6 space-y-4">
        {/* Header with icon and action */}
        <div className="flex items-start justify-between">
          {Icon && (
            <div className={`p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm ${iconColor} shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          
          {change && (
            <Badge className={`px-3 py-1 text-xs font-semibold border ${getTrendColor()} backdrop-blur-sm`}>
              <span className="flex items-center space-x-1">
                {getTrendIcon()}
                <span>{change}</span>
              </span>
            </Badge>
          )}
        </div>

        {/* Main content */}
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
              {value}
            </p>
          </div>
          
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Action button */}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 backdrop-blur-sm border border-blue-200/30 hover:border-blue-300"
          >
            {actionLabel}
          </button>
        )}

        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-700" />
      </CardContent>
    </Card>
  );
};

export default ModernKpiCard; 