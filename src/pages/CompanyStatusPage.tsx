import React from 'react';
import { CompanyStatusDashboard } from '@/components/dashboard/CompanyStatusDashboard';

/**
 * Company Status Page
 * Provides a comprehensive, coherent view of the company's status as Nexus understands it
 * 
 * Pillar: 3 (Comprehensive Intelligence)
 */
const CompanyStatusPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <CompanyStatusDashboard />
    </div>
  );
};

export default CompanyStatusPage; 