/**
 * @name KpiCard
 * @description KPI summary card for displaying a metric, with optional sparkline and color-coded delta.
 * @param {KpiCardProps} props
 * @returns {JSX.Element}
 */
import PropTypes from 'prop-types';
import React from 'react';

type KpiCardProps = {
  title: string;
  value: string | number;
  delta?: string;
  sparklineData?: number[];
};

export function KpiCard({ title, value, delta, sparklineData }: KpiCardProps) {
  // Determine delta color
  let deltaColor = 'text-muted-foreground';
  if (delta) {
    if (delta.startsWith('+')) deltaColor = 'text-success';
    else if (delta.startsWith('-')) deltaColor = 'text-destructive';
  }
  return (
    <div className="rounded-xl border p-4 shadow-sm flex flex-col gap-1">
      <p className="text-muted-foreground mb-1 text-xs uppercase">{title}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-semibold">{value}</p>
        {sparklineData && (
          <svg data-testid="kpi-sparkline" width="64" height="18" viewBox="0 0 64 18" fill="none" className="text-primary/70">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={sparklineData
                .map((d, i, arr) => {
                  const max = Math.max(...arr);
                  const min = Math.min(...arr);
                  return `${(i / (arr.length - 1)) * 60},${16 - ((d - min) / (max - min || 1)) * 12}`;
                })
                .join(' ')}
            />
          </svg>
        )}
      </div>
      {delta && <p className={`text-xs font-medium ${deltaColor}`}>{delta}</p>}
    </div>
  );
}

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  delta: PropTypes.string,
  sparklineData: PropTypes.arrayOf(PropTypes.number),
}; 