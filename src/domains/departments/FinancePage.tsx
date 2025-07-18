import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { financeConfig } from '@/shared/config/departmentConfigs';

const FinancePage: React.FC = () => (
  <UnifiedDepartmentPage config={financeConfig} />
);

export default FinancePage; 