import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { customerSuccessConfig } from '@/config/departmentConfigs';

const CustomerSuccessPage: React.FC = () => (
  <UnifiedDepartmentPage config={customerSuccessConfig} />
);

export default CustomerSuccessPage; 