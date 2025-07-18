import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { operationsConfig } from '@/shared/config/departmentConfigs';

const OperationsPage: React.FC = () => {
  return (
    <UnifiedDepartmentPage config={operationsConfig} />
  );
};

export default OperationsPage; 