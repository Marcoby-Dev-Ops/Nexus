import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { maturityConfig } from '@/config/departmentConfigs';

const MaturityPage: React.FC = () => (
  <UnifiedDepartmentPage config={maturityConfig} />
);

export default MaturityPage; 