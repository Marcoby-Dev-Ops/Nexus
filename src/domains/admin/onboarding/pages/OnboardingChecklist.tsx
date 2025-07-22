import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { CheckCircle, XCircle, Info, X, Loader2 } from "lucide-react";
import { Progress } from '@/shared/components/ui/Progress';
import Confetti from "react-confetti";
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/Tooltip';
import { useZustandAuth } from '@/shared/hooks/useZustandAuth';

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

// Remove useUserProfile and useUserIntegrations hooks

export const OnboardingChecklist: React.FC = () => {
  const { profile, integrations, loading: authLoading, error: authError } = useZustandAuth();
  const [dismissed, setDismissed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Ensure integrations is always an array
  const safeIntegrations = Array.isArray(integrations) ? integrations : [];

  const steps = onboardingSteps.map((step) => ({
    ...step,
    completed: step.check(profile, safeIntegrations),
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
  if (authLoading) {
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
  if (authError) {
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
                  <Tooltip content={step.help}>
                    <TooltipTrigger asChild>
                      <div className="inline-block">
                        <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer" />
                      </div>
                    </TooltipTrigger>
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