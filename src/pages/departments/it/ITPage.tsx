import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { itConfig } from '@/config/departmentConfigs';

const ITPage: React.FC = () => (
  <UnifiedDepartmentPage config={itConfig} />
);

export default ITPage; 