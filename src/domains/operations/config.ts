import type { DepartmentState } from './types';

export const departmentId = 'operations' as const;
export const departmentLabel = 'Operations';

export const defaultState: DepartmentState = {
  score: 72, // composite health
  updatedAt: new Date().toISOString(),
  kpis: [
    {
      id: 'deploy_frequency',
      label: 'Deployment Frequency',
      value: 55,
      delta: -18,
      history: [70, 68, 66, 64, 60, 58, 55],
    },
    {
      id: 'change_failure',
      label: 'Change Failure Rate',
      value: 4,
      delta: -2,
      history: [6, 6, 5.5, 5, 4.8, 4.2, 4],
    },
    {
      id: 'mttr',
      label: 'MTTR (hrs)',
      value: 1.8,
      delta: 35,
      history: [2.8, 2.6, 2.4, 2.2, 2.0, 1.9, 1.8],
    },
  ],
}; 