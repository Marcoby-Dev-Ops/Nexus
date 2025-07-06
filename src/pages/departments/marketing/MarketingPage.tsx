import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { marketingConfig } from '@/config/departmentConfigs';

const MarketingPage: React.FC = () => (
  <UnifiedDepartmentPage config={marketingConfig} />
);

export default MarketingPage; 