import React from 'react';
import { useAuth } from '@/hooks/index';

const AIModelPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AI Model Management</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          Welcome to the AI Model Management page. Here you can configure
          and manage your AI models and their settings.
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
              Please log in to access AI model management features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIModelPage; 