import React from 'react';
import {
  DollarSign,
  BarChart,
  LifeBuoy,
  Gauge,
  Megaphone,
  Settings as Cog,
} from 'lucide-react';

export type DepartmentId =
  | 'sales'
  | 'finance'
  | 'support'
  | 'maturity'
  | 'marketing'
  | 'operations';

export interface DepartmentMeta {
  id: DepartmentId;
  label: string;
  description: string;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  analyticsRoute: string;
  healthRoute: string;
}

const ICON_MAP: Record<DepartmentId, React.ReactElement<React.SVGProps<SVGSVGElement>>> = {
  sales: <DollarSign className="w-5 h-5" />,
  finance: <BarChart className="w-5 h-5" />,
  support: <LifeBuoy className="w-5 h-5" />,
  maturity: <Gauge className="w-5 h-5" />,
  marketing: <Megaphone className="w-5 h-5" />,
  operations: <Cog className="w-5 h-5" />,
};

const RAW_DEPARTMENTS: Array<{
  id: DepartmentId;
  label: string;
  description: string;
}> = [
  {
    id: 'sales',
    label: 'Sales',
    description:
      'Measures your sales performance, lead generation, and conversion effectiveness',
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Evaluates your financial health, cash flow, and profitability',
  },
  {
    id: 'support',
    label: 'Support',
    description:
      'Tracks customer support efficiency, resolution times, and satisfaction',
  },
  {
    id: 'maturity',
    label: 'Maturity',
    description:
      'Assesses organizational structure, documentation, and process standardization',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Measures marketing effectiveness, reach, and conversion',
  },
  {
    id: 'operations',
    label: 'Operations',
    description:
      'Evaluates operational efficiency, automation, and resource utilization',
  },
];

export const DEPARTMENTS: DepartmentMeta[] = RAW_DEPARTMENTS.map((meta) => ({
  ...meta,
  icon: ICON_MAP[meta.id],
  analyticsRoute: `/departments/${meta.id}/analytics`,
  healthRoute: `/analytics/business-health?category=${meta.id}`,
})); 