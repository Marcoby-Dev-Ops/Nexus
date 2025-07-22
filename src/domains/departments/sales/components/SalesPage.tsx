import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { salesConfig } from '@/shared/config/departmentConfigs';

const SalesPage: React.FC = () => (
  <UnifiedDepartmentPage config={salesConfig} />
);

export default SalesPage; 