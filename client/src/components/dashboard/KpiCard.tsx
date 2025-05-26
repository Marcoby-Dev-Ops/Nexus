/**
 * @name KpiCard
 * @description KPI summary card for displaying a metric.
 * @param {KpiCardProps} props
 * @returns {JSX.Element}
 */
import PropTypes from 'prop-types';
type KpiCardProps = { title: string; value: string | number; delta?: string };

export function KpiCard({ title, value, delta }: KpiCardProps) {
  return (
    <div className="rounded-xl border p-4 shadow-sm">
      <p className="text-muted-foreground mb-1 text-xs uppercase">{title}</p>
      <p className="text-3xl font-semibold">{value}</p>
      {delta && <p className="text-xs text-green-600">{delta}</p>}
    </div>
  );
}

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  delta: PropTypes.string,
}; 