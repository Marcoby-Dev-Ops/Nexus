import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { supportConfig } from '@/shared/config/departmentConfigs';

const SupportPage: React.FC = () => (
  <UnifiedDepartmentPage config={supportConfig} />
);

export default SupportPage; 