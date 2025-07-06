import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { legalConfig } from '@/config/departmentConfigs';

const LegalPage: React.FC = () => (
  <UnifiedDepartmentPage config={legalConfig} />
);

export default LegalPage; 