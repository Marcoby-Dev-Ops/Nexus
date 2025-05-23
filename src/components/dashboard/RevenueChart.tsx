import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../Card';
import PropTypes from 'prop-types';

/**
 * @name RevenueChart
 * @description Displays a line chart of revenue over time.
 * @param {object} props
 * @param {Array<{date: string, revenue: number}>} props.data - The revenue data to display.
 * @param {string} [props.className] - Optional className for the card.
 * @returns {JSX.Element}
 */
const RevenueChart: React.FC<{ data: { date: string; revenue: number }[]; className?: string }> = ({ data, className }) => (
  <Card header="Revenue (Last 12 Months)" className={`w-full max-w-none ${className ?? ''}`.trim()}>
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--muted))" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) =>
              typeof value === 'number'
                ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                : value
            }
            contentStyle={{ borderRadius: 8, fontSize: 14, backgroundColor: 'hsl(var(--card))', color: '#111', boxShadow: '0 2px 8px #0001', padding: 12 }}
            wrapperStyle={{ outline: 'none' }}
            cursor={{ fill: '#14b8a6', opacity: 0.1 }}
            isAnimationActive={false}
          />
          <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

RevenueChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      revenue: PropTypes.number.isRequired,
    })
  ).isRequired,
  className: PropTypes.string,
};

export default RevenueChart; 