import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { hrConfig } from '@/shared/config/departmentConfigs';

const HRPage: React.FC = () => (
  <UnifiedDepartmentPage config={hrConfig} />
);

export default HRPage; 