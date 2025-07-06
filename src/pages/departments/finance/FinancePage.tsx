import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { financeConfig } from '@/config/departmentConfigs';

const FinancePage: React.FC = () => (
  <UnifiedDepartmentPage config={financeConfig} />
);

export default FinancePage; 