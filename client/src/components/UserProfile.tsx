import React from 'react';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';

export function UserProfile() {
  const { profile, loading: isLoading, error } = useUserProfile();

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
    <div className="p-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url} alt={profile.name} />
          <AvatarFallback className="text-lg">{profile.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {profile.name}
          </h2>
          <p className="text-muted-foreground">{profile.email}</p>
          <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-muted/30 rounded-md">
        <h3 className="font-medium text-foreground">Company</h3>
        <p className="text-muted-foreground">{profile.company.name}</p>
        <p className="text-sm text-muted-foreground">
            {profile.company.industry} • {profile.company.size}
          </p>
        </div>
      </div>
    );
} 
