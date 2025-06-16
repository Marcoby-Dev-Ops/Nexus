import React from 'react';
import { Badge } from './Badge';

interface Props {
  title: string;
  scorePct: number;
  headline: string;
  updatedAt: string; // ISO string
}

export const InsightHeader: React.FC<Props> = ({ title, scorePct, headline, updatedAt }) => (
  <div className="space-y-1 mb-4">
    <div className="flex items-baseline gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Badge>{scorePct.toFixed(1)}%</Badge>
    </div>
    <p className="text-sm text-muted-foreground">{headline}</p>
    <p className="text-xs text-muted-foreground">Last refreshed: {new Date(updatedAt).toLocaleString()}</p>
  </div>
);

export default InsightHeader; 