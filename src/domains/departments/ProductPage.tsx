import React from 'react';
import { UnifiedDepartmentPage } from '@/shared/components/patterns/UnifiedPages';
import { productConfig } from '@/shared/config/departmentConfigs';

const ProductPage: React.FC = () => (
  <UnifiedDepartmentPage config={productConfig} />
);

export default ProductPage; 