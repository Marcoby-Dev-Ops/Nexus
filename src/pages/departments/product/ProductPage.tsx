import React from 'react';
import { UnifiedDepartmentPage } from '@/components/patterns/UnifiedPages';
import { productConfig } from '@/config/departmentConfigs';

const ProductPage: React.FC = () => (
  <UnifiedDepartmentPage config={productConfig} />
);

export default ProductPage; 