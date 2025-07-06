import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { supportConfig } from '@/config/departmentConfigs';

const SupportPage: React.FC = () => (
  <UnifiedDepartmentPage config={supportConfig} />
);

export default SupportPage; 