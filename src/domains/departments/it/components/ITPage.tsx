import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { itConfig } from '@/shared/config/departmentConfigs';

const ITPage: React.FC = () => (
  <UnifiedDepartmentPage config={itConfig} />
);

export default ITPage; 