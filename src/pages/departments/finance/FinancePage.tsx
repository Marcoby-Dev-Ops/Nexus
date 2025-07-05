import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { financeConfig } from '@/config/departmentConfigs';

const FinancePage: React.FC = () => {
  return (
    <UnifiedDepartmentPage config={financeConfig} />
  );
};

export default FinancePage; 