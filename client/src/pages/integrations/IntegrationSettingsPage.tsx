import React from 'react';
import { useAuth } from '@/hooks/index';

const IntegrationSettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Integration Settings</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          Welcome to the Integration Settings page. Here you can configure
          and customize your integration preferences.
        </p>
        {user ? (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-green-800">
              Logged in as: {user.email}
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-800">
              Please log in to access integration settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationSettingsPage; 
