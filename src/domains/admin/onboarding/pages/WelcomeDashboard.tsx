import React from 'react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';

export type WelcomeDashboardProps = {
  userName: string;
  financialGoal: number; // e.g., 10000
  currentProgress: number; // e.g., 6200
  nextAction: string;
  nextActionWhy?: string;
  onLogWin: () => void;
  onAddGoal: () => void;
  onUpdateProgress: () => void;
  onViewAnalytics: () => void;
  loading?: boolean;
  error?: string;
};

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({
  userName,
  financialGoal,
  currentProgress,
  nextAction,
  nextActionWhy,
  onLogWin,
  onAddGoal,
  onUpdateProgress,
  onViewAnalytics,
  loading,
  error,
}) => {
  const [showWhy, setShowWhy] = React.useState(false);
  const progressPercent = Math.min(100, Math.round((currentProgress / financialGoal) * 100));

  if (loading) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-6" />
          <Skeleton className="h-10 w-full mb-2" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <h2 className="text-lg font-semibold">Welcome</h2>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto mt-8 shadow-lg">
      <CardHeader>
        <h2 className="text-2xl font-bold">👋 Hi, {userName}!</h2>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-lg font-medium mb-1">🎯 Your Goal: ${financialGoal.toLocaleString()}/month</div>
          <div className="flex items-center gap-2 mb-1">
            <Progress value={progressPercent} className="w-full h-3" />
            <span className="text-sm font-semibold w-20 text-right">${currentProgress.toLocaleString()}</span>
          </div>
          <div className="text-xs text-muted-foreground mb-2">{progressPercent}% of goal</div>
        </div>
        <div className="mb-6">
          <div className="text-base font-semibold mb-1">✅ Next Best Action: </div>
          <div className="flex items-center gap-2">
            <span>{nextAction}</span>
            {nextActionWhy && (
              <Button variant="link" size="sm" onClick={() => setShowWhy((v) => !v)}>
                {showWhy ? "Hide why" : "Why?"}
              </Button>
            )}
          </div>
          {showWhy && nextActionWhy && (
            <div className="text-xs text-muted-foreground mt-1">{nextActionWhy}</div>
          )}
        </div>
        <div className="flex gap-2 mb-4">
          <Button onClick={onLogWin} variant="outline">Log a Win</Button>
          <Button onClick={onAddGoal} variant="outline">Add Goal</Button>
          <Button onClick={onUpdateProgress} variant="default">Update Progress</Button>
        </div>
        <Button onClick={onViewAnalytics} variant="ghost" className="w-full mt-2">View Full Analytics</Button>
      </CardContent>
    </Card>
  );
};

export default WelcomeDashboard; 