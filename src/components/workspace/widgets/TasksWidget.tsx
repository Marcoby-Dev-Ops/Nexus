import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { tasksService } from '@/lib/services/tasksService';
import type { Task } from '@/lib/services/tasksService';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const priorityColors: { [key: string]: string } = {
  High: 'bg-red-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-green-500',
  None: 'bg-gray-400',
};

export const TasksWidget: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, isError, error } = useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getTasks(),
  });

  const { mutate: toggleCompletion } = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      tasksService.toggleTaskCompletion(taskId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleCheckedChange = (taskId: string, checked: boolean) => {
    toggleCompletion({ taskId, completed: checked });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> Failed to load tasks: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks?.map((task) => (
            <div key={task.id} className="flex items-center gap-3">
              <Checkbox
                id={task.id}
                checked={task.completed}
                onCheckedChange={(checked) => handleCheckedChange(task.id, !!checked)}
              />
              <label
                htmlFor={task.id}
                className={`flex-1 text-sm font-medium ${
                  task.completed ? 'text-muted-foreground line-through' : ''
                }`}
              >
                {task.title}
              </label>
              <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
              <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>
                {task.priority}
              </Badge>
            </div>
          ))}
          {tasks?.length === 0 && (
            <p className="text-sm text-muted-foreground">You have no tasks.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 