import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import type { DepartmentConfig } from '../types';

interface DepartmentPageProps {
  config: DepartmentConfig;
}

/**
 * DepartmentPage
 * -------------
 * Shared page component for all departments.
 * Uses the UnifiedDepartmentPage pattern for consistent layout.
 */
const DepartmentPage: React.FC<DepartmentPageProps> = ({ config }) => {
  return (
    <UnifiedDepartmentPage config={config} />
  );
};

export default DepartmentPage; 
