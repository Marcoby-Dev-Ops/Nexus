import React from 'react';
import { useUser } from '@/hooks/useUser.ts';
import { useAuth } from '@/hooks/useAuth.ts';

export function UserProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useUser(user?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Error loading profile</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">No profile found</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center space-x-4">
        {profile.avatar_url && (
          <img 
            src={profile.avatar_url} 
            alt="Profile" 
            className="w-16 h-16 rounded-full"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
        </div>
      </div>
      
      {profile.company && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium text-gray-900">Company</h3>
          <p className="text-gray-600">{profile.company.name}</p>
          <p className="text-sm text-gray-500">
            {profile.company.industry} • {profile.company.size}
          </p>
        </div>
      )}
    </div>
  );
} 