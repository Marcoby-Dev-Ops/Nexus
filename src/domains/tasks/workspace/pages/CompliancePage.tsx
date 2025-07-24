import React from 'react';
import ComplianceDashboard from '@/domains/tasks/workspace/components/ComplianceDashboard';

const CompliancePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ComplianceDashboard />
    </div>
  );
};

export default CompliancePage; 