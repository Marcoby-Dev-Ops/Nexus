import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { chartColors } from '@/shared/utils/chartColors';

interface SimpleLineChartProps {
  data: Array<{ name: string; [key: string]: string | number }>;
  keys: string[];
  colors?: string[];
}

export function SimpleLineChart({ data, keys, colors }: SimpleLineChartProps) {
  const defaultColors = [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.success];
  const lineColors = colors || defaultColors;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {keys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={lineColors[index % lineColors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
