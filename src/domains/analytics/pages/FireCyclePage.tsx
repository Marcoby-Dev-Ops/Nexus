import React from 'react';
import { FireCycleDashboard } from '../components/FireCycleDashboard';
import { FireCycleProvider } from '@/core/fire-cycle/FireCycleProvider';

const FireCyclePage: React.FC = () => {
  return (
    <FireCycleProvider>
      <div className="container mx-auto px-4 py-8">
        <FireCycleDashboard />
      </div>
    </FireCycleProvider>
  );
};

export default FireCyclePage; 