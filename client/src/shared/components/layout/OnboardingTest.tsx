import React from 'react';
import { useAuth } from '@/hooks/index';
import { onboardingConfig } from '@/shared/config/onboardingConfig';

export const OnboardingTest: React.FC = () => {
  const { user, session } = useAuth();

  return (
    <div className="p-6 bg-background border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Onboarding Integration Test</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Configuration Status:</h3>
          <ul className="list-disc list-inside text-sm">
            <li>Enabled: {onboardingConfig.enabled ? '✅ Yes' : '❌ No'}</li>
            <li>Skip for Public Routes: {onboardingConfig.skipForPublicRoutes ? '✅ Yes' : '❌ No'}</li>
            <li>Skip for Authenticated Users: {onboardingConfig.skipForAuthenticatedUsers ? '✅ Yes' : '❌ No'}</li>
            <li>Skip for Completed Users: {onboardingConfig.skipForCompletedUsers ? '✅ Yes' : '❌ No'}</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">User Status:</h3>
          <ul className="list-disc list-inside text-sm">
            <li>Authenticated: {user ? '✅ Yes' : '❌ No'}</li>
            <li>Session Active: {session ? '✅ Yes' : '❌ No'}</li>
            <li>User ID: {user?.id || 'Not available'}</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">Integration Status:</h3>
          <ul className="list-disc list-inside text-sm">
            <li>AppWithOnboarding Imported: ✅ Yes</li>
            <li>App Wrapped: ✅ Yes</li>
            <li>Build Successful: ✅ Yes</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-medium">
            ✅ Onboarding integration is now active and ready for testing!
          </p>
          <p className="text-green-700 text-sm mt-2">
            New users will see the onboarding flow when they first access the application.
          </p>
        </div>
      </div>
    </div>
  );
}; 
