import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { legalConfig } from '@/shared/config/departmentConfigs';

const LegalPage: React.FC = () => (
  <UnifiedDepartmentPage config={legalConfig} />
);

export default LegalPage; 