import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../Card';
import PropTypes from 'prop-types';

/**
 * @name PipelineChart
 * @description Displays a bar chart of sales pipeline stages.
 * @param {object} props
 * @param {Array<{stage: string, deals: number}>} props.data - The pipeline data to display.
 * @param {string} [props.className] - Optional className for the card.
 * @returns {JSX.Element}
 */
const PipelineChart: React.FC<{ data: { stage: string; deals: number }[]; className?: string }> = ({ data, className }) => (
  <Card header="Pipeline (Deals by Stage)" className={`w-full max-w-none ${className ?? ''}`.trim()}>
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--muted))" strokeDasharray="3 3" />
          <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            formatter={(value) =>
              typeof value === 'number'
                ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                : value
            }
            contentStyle={{ borderRadius: 8, fontSize: 14, backgroundColor: 'hsl(var(--card))', color: '#111', boxShadow: '0 2px 8px #0001', padding: 12 }}
            wrapperStyle={{ outline: 'none' }}
            cursor={{ fill: '#6366f1', opacity: 0.1 }}
            isAnimationActive={false}
          />
          <Bar dataKey="deals" fill="var(--chart-2)" barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

PipelineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      stage: PropTypes.string.isRequired,
      deals: PropTypes.number.isRequired,
    })
  ).isRequired,
  className: PropTypes.string,
};

export default PipelineChart; 