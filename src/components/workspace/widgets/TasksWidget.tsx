import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckSquare, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/lib/services/tasksService';
import { thoughtsService } from '@/lib/services/thoughtsService';
import type { Task } from '@/lib/services/tasksService';
import { Skeleton } from '@/components/ui/Skeleton';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface TasksWidgetProps {
  onTaskComplete: () => void;
}

const priorityColors: { [key: string]: string } = {
  High: 'bg-destructive',
  Medium: 'bg-warning',
  Low: 'bg-primary',
  None: 'bg-gray-500',
};

export const TasksWidget: React.FC<TasksWidgetProps> = ({ onTaskComplete }) => {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState('');

  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getTasks(),
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      tasksService.toggleTaskCompletion(taskId, completed),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (updatedTask.completed) {
        onTaskComplete();
      }
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (taskTitle: string) => thoughtsService.createThought({
      content: taskTitle,
      category: 'task',
      main_sub_categories: ['medium_priority'],
      status: 'not_started'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTask('');
    },
  });

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTaskMutation.mutate(newTask);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            <span>Tasks</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddTask}
            disabled={!newTask.trim() || addTaskMutation.isPending}
          >
            {addTaskMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-3">
          <Input
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
            }}
            disabled={addTaskMutation.isPending}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}

          {isError && (
            <div className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>Error loading tasks.</p>
            </div>
          )}

          {tasks && tasks.map((task: Task) => (
            <div key={task.id} className="flex items-center gap-4">
              <Checkbox
                id={task.id}
                checked={task.completed}
                onCheckedChange={(checked) => toggleCompletionMutation.mutate({ taskId: task.id, completed: !!checked })}
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

          {!isLoading && !isError && tasks?.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks to complete.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 