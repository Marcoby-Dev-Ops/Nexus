import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { customerSuccessConfig } from '@/shared/config/departmentConfigs';

const CustomerSuccessPage: React.FC = () => (
  <UnifiedDepartmentPage config={customerSuccessConfig} />
);

export default CustomerSuccessPage; 