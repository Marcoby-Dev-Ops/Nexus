import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { maturityConfig } from '@/shared/config/departmentConfigs';

const MaturityPage: React.FC = () => (
  <UnifiedDepartmentPage config={maturityConfig} />
);

export default MaturityPage; 