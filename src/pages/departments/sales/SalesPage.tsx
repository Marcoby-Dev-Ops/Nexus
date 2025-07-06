import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { salesConfig } from '@/config/departmentConfigs';

const SalesPage: React.FC = () => (
  <UnifiedDepartmentPage config={salesConfig} />
);

export default SalesPage; 