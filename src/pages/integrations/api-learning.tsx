import React from 'react';
import { ApiDocIntegrationSetup } from '../../components/integrations';

export default function ApiLearningPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">API Learning System</h1>
      <ApiDocIntegrationSetup 
        onIntegrationCreated={(integration) => {
          console.log('Integration created:', integration);
        }}
      />
    </div>
  );
} 