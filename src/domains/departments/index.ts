/**
 * Departments Domain - Main Index
 * Consolidates all department-specific functionality including sales, finance, operations, and HR
 */

// Department Components
export { default as DepartmentPage } from './components/DepartmentPage';

// Department Types
export interface DepartmentConfig {
  id: string;
  name: string;
  description: string;
  type: 'sales' | 'finance' | 'operations' | 'hr' | 'marketing';
  managerId: string;
  memberCount: number;
  budget: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentMetric {
  id: string;
  departmentId: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  period: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}
