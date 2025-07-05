import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { operationsConfig } from '@/config/departmentConfigs';

const OperationsPage: React.FC = () => {
  return (
    <UnifiedDepartmentPage config={operationsConfig} />
  );
};

export default OperationsPage; 