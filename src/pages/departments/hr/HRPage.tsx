import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { hrConfig } from '@/config/departmentConfigs';

const HRPage: React.FC = () => (
  <UnifiedDepartmentPage config={hrConfig} />
);

export default HRPage; 