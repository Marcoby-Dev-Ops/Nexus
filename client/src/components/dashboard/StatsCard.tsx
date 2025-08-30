import React from 'react';
import PropTypes from 'prop-types';
import Skeleton from '../lib/Skeleton';

/**
 * @interface StatsCardProps
 * @description Props for the StatsCard component.
 * @property {string} title - The KPI title.
 * @property {string | number} value - The main KPI value.
 * @property {number} [delta] - The change from previous period (positive/negative for color).
 * @property {string} [deltaLabel] - Label for the delta (e.g., 'vs last month').
 * @property {React.ReactNode} [icon] - Optional icon to display.
 * @property {number} [progress] - For Task Completion, a value 0-100.
 * @property {React.ReactNode} [sparkline] - Optional sparkline element.
 * @property {boolean} [loading] - Show skeleton loader if true.
 * @property {string} [className] - Additional class names.
 */
export interface StatsCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  progress?: number;
  sparkline?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

/**
 * @name StatsCard
 * @description KPI tile for dashboard summary.
 * @param {StatsCardProps} props
 * @returns {JSX.Element}
 */
const StatsCard: React.FC<StatsCardProps> = React.memo(
  ({
    title,
    value,
    delta,
    deltaLabel,
    icon,
    progress,
    sparkline,
    loading = false,
    className = '',
  }) => {
    // Delta color logic
    let deltaColor = '';
    if (typeof delta === 'number') {
      deltaColor = delta > 0 ? 'text-success' : delta < 0 ? 'text-destructive' : 'text-muted-foreground';
    }

    return (
      <div className={`bg-card rounded-xl p-6 border border-border flex flex-col gap-2 shadow-sm min-w-0 ${className}`}>
        <div className="flex items-center gap-4 mb-2">
          {icon && <span className="w-8 h-8 flex items-center justify-center bg-muted/40 rounded-full">{icon}</span>}
          <span className="font-semibold text-lg truncate flex-1 min-w-0">{title}</span>
        </div>
        <div className="flex items-end gap-2 min-h-[2.5rem]">
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <span className="text-2xl font-bold tabular-nums truncate">{value}</span>
          )}
          {sparkline && <span className="ml-auto">{sparkline}</span>}
        </div>
        {/* Delta */}
        {typeof delta === 'number' && !loading && (
          <div
            className={`flex items-center text-xs font-semibold ${deltaColor} truncate min-w-0`}
            aria-live="polite"
          >
            {delta > 0 && <><span className="mr-0.5">▲</span><span className="sr-only">increase</span></>}
            {delta < 0 && <><span className="mr-0.5">▼</span><span className="sr-only">decrease</span></>}
            {Math.abs(delta)}%
            {deltaLabel && <span className="ml-1 text-muted-foreground font-normal truncate">{deltaLabel}</span>}
          </div>
        )}
        {/* Progress bar */}
        {typeof progress === 'number' && !loading && (
          <div className="w-full mt-2">
            <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
              <div
                className="h-2 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{progress}% complete</div>
          </div>
        )}
      </div>
    );
  }
);

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  delta: PropTypes.number,
  deltaLabel: PropTypes.string,
  icon: PropTypes.node,
  progress: PropTypes.number,
  sparkline: PropTypes.node,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * To show a mini sparkline in a KPI card, pass a ReactNode to the sparkline prop.
 * Example:
 * <StatsCard ... sparkline={<MySparklineComponent data={...} />} />
 */

export default StatsCard; 
