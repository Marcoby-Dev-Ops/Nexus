import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/shared/contexts/UserContext';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function RequireProfile({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUserProfile();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile?.company_id) {
    return <Navigate to="/onboarding/company-profile" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function RequireQuantumAccess({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfile();
  const location = useLocation();

  // Check if user has quantum business model access
  // This could be based on subscription tier, feature flags, etc.
  const hasQuantumAccess = profile?.features?.includes('quantum-business-model') || true; // Default to true for now

  if (!hasQuantumAccess) {
    return <Navigate to="/upgrade" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
