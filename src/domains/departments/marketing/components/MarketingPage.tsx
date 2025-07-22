import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { marketingConfig } from '@/shared/config/departmentConfigs';

const MarketingPage: React.FC = () => (
  <UnifiedDepartmentPage config={marketingConfig} />
);

export default MarketingPage; 