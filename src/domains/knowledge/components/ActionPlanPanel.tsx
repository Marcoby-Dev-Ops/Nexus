import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';

const mockTasks = [
  { id: 1, label: 'Increase lead generation by 30%', status: 'In Progress' },
  { id: 2, label: 'Automate onboarding workflow', status: 'Not Started' },
  { id: 3, label: 'Launch new marketing campaign', status: 'Completed' },
];

export const ActionPlanPanel: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Action Plan</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="mb-4 space-y-2">
        {mockTasks.map(task => (
          <li key={task.id} className="flex items-center justify-between">
            <span>{task.label}</span>
            <span className={`text-xs px-2 py-1 rounded ${task.status === 'Completed' ? 'bg-success/10 text-success' : task.status === 'In Progress' ? 'bg-warning/10 text-warning-foreground' : 'bg-muted text-muted-foreground'}`}>{task.status}</span>
          </li>
        ))}
      </ul>
      <Button>Add Task</Button>
    </CardContent>
  </Card>
); 