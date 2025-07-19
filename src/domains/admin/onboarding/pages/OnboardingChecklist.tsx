import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { CheckCircle, XCircle, Info, X, Loader2 } from "lucide-react";
import { Progress } from '@/shared/components/ui/Progress';
import Confetti from "react-confetti";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/Tooltip';
import { supabase, authUtils } from '@/core/supabase';

const onboardingSteps = [
  {
    key: "profile",
    label: "Complete your profile",
    help: "Add your name and email so we can personalize your experience.",
    check: (profile: any) => !!profile?.full_name && !!profile?.email,
    action: "Go to Profile",
    actionLink: "/settings/profile",
  },
  {
    key: "integration",
    label: "Connect your first data source",
    help: "Connect a data source to unlock personalized insights and automation.",
    check: (_: any, integrations: any[]) => Array.isArray(integrations) && integrations.length > 0,
    action: "Connect Integration",
    actionLink: "/integrations",
  },
  {
    key: "explore",
    label: "Explore your dashboard",
    help: "See your data in action and discover what Nexus can do!",
    check: () => true,
    action: "Go to Dashboard",
    actionLink: "/dashboard",
  },
];

function getFirstName(profile: unknown): string {
  if (profile && typeof profile === "object") {
    const p = profile as Record<string, unknown>;
    if (typeof p.full_name === "string" && p.full_name.length > 0) {
      return p.full_name.split(" ")[0];
    }
    if (typeof p.name === "string" && p.name.length > 0) {
      return p.name.split(" ")[0];
    }
  }
  return "there";
}

// Custom hooks for Supabase data fetching
function useUserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const user = await authUtils.getCurrentUser();
        
        if (!user) {
          setError('No authenticated user');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError);
          // Don't treat this as a fatal error - just log it and continue
          // Set a basic profile with user info
          setProfile({
            id: user.id,
            user_id: user.id,
            email: user.email,
            full_name: user.email?.split('@')[0] || 'User',
            created_at: user.created_at
          });
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error in useUserProfile:', err);
        // Don't treat this as a fatal error - just log it and continue
        // Set a basic profile with user info
        const user = await authUtils.getCurrentUser();
        if (user) {
          setProfile({
            id: user.id,
            user_id: user.id,
            email: user.email,
            full_name: user.email?.split('@')[0] || 'User',
            created_at: user.created_at
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  return { data: profile, loading, error };
}

function useUserIntegrations() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntegrations() {
      try {
        setLoading(true);
        const user = await authUtils.getCurrentUser();
        
        if (!user) {
          setError('No authenticated user');
          return;
        }

        // Check for user integrations in the proper table
        const { data, error: fetchError } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', user.id);

        if (fetchError) {
          console.error('Error fetching integrations:', fetchError);
          // Don't treat this as a fatal error - just log it and continue
          setIntegrations([]);
        } else {
          setIntegrations(data || []);
        }
      } catch (err) {
        console.error('Error in useUserIntegrations:', err);
        // Don't treat this as a fatal error - just log it and continue
        setIntegrations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchIntegrations();
  }, []);

  return { data: integrations, loading, error };
}

export const OnboardingChecklist: React.FC = () => {
  const { data: profile, loading: profileLoading, error: profileError } = useUserProfile();
  const { data: integrationsRaw, loading: integrationsLoading, error: integrationsError } = useUserIntegrations();
  const [dismissed, setDismissed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Ensure integrations is always an array
  const integrations = Array.isArray(integrationsRaw) ? integrationsRaw : [];

  const steps = onboardingSteps.map((step) => ({
    ...step,
    completed: step.check(profile, integrations),
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progress = (completedCount / totalSteps) * 100;
  const allDone = steps.every((s) => s.completed);

  // Personalized greeting
  const firstName = getFirstName(profile);

  // Show confetti and message when all done
  React.useEffect(() => {
    if (allDone) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  if (dismissed) return null;

  // Show loading state
  if (profileLoading || integrationsLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading your onboarding progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (profileError || integrationsError) {
    // Only show error if we don't have any profile data at all
    if (!profile) {
      return (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-red-600">
              <XCircle className="h-6 w-6 mr-2" />
              <span>Unable to load onboarding data. Please refresh the page.</span>
            </div>
          </CardContent>
        </Card>
      );
    }
    // If we have profile data, continue with the onboarding flow
  }

  if (allDone) {
    return (
      <div className="mb-6 relative">
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={200} recycle={false} />}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Welcome, {firstName}!</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setDismissed(true)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="h-8 w-8 text-success mb-2" />
              <div className="text-lg font-semibold">You're all set!</div>
              <div className="text-muted-foreground text-sm text-center">You've completed all onboarding steps. Enjoy using Nexus!</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="mb-6 relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Welcome, {firstName}!</CardTitle>
          <div className="text-muted-foreground text-sm mt-1">Let's get you set up. {completedCount} of {totalSteps} steps complete.</div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="mb-4" />
        <ul className="space-y-3">
          {steps.map((step) => (
            <li key={step.key} className="flex items-center justify-between">
              <span className="flex items-center">
                {step.completed ? (
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground mr-2" />
                )}
                {step.label}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{step.help}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              {!step.completed && (
                <Button size="sm" variant="outline">
                  <a href={step.actionLink} className="no-underline text-inherit">{step.action}</a>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}; 