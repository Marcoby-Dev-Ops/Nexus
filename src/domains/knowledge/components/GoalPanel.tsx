import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';

export const GoalPanel: React.FC = () => {
  // Placeholder state and handlers
  const [goal, setGoal] = React.useState<string>('Grow business revenue');
  const [target, setTarget] = React.useState<number>(5000000);
  const [progress, setProgress] = React.useState<number>(62);

  return (
    <Card>
      <CardHeader>
        <CardTitle>What is your primary goal?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-lg font-semibold">{goal}</div>
        <div className="mb-2">Target: <span className="font-bold">${target.toLocaleString()}</span></div>
        <div className="mb-2">Progress: <span className="font-bold">{progress}%</span></div>
        <Button variant="outline" className="mt-2">Update Goal</Button>
      </CardContent>
    </Card>
  );
} 