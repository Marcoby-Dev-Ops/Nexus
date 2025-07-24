import React, { useState, useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { taskService } from '@/domains/tasks/services/taskService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Badge } from '@/shared/components/ui/Badge';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  User,
  Tag,
  MoreHorizontal
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

interface TaskFilter {
  status?: string[];
  priority?: string[];
}

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const { user, session } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!session || !user) {
        setLoading(false);
        setError('Authentication required');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const filter: TaskFilter = {};
        if (statusFilter !== 'all') filter.status = [statusFilter];
        if (priorityFilter !== 'all') filter.priority = [priorityFilter];
        
        const fetchedTasks = await taskService.getTasks(user.id, filter);
        setTasks(fetchedTasks);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [session, user, statusFilter, priorityFilter]);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'todo': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'todo': return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tasks</h1>
        <p className="text-muted-foreground">Manage your tasks and track progress</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col sm: flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="todo">To Do ({filteredTasks.filter(t => t.status === 'todo').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({filteredTasks.filter(t => t.status === 'in_progress').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filteredTasks.filter(t => t.status === 'completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No tasks found. Create your first task to get started.</p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="hover: shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                            {task.priority}
                          </Badge>
                          <Badge className={`${getStatusColor(task.status)} text-white text-xs`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className={isOverdue(task.due_date) ? 'text-red-500' : ''}>
                                {formatDate(task.due_date)}
                                {isOverdue(task.due_date) && ' (Overdue)'}
                              </span>
                            </div>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex gap-1">
                              {task.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {task.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{task.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="todo" className="mt-6">
          <div className="grid gap-4">
            {filteredTasks.filter(t => t.status === 'todo').map((task) => (
              <Card key={task.id} className="hover: shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className={isOverdue(task.due_date) ? 'text-red-500' : ''}>
                              {formatDate(task.due_date)}
                              {isOverdue(task.due_date) && ' (Overdue)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in_progress" className="mt-6">
          <div className="grid gap-4">
            {filteredTasks.filter(t => t.status === 'in_progress').map((task) => (
              <Card key={task.id} className="hover: shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className={isOverdue(task.due_date) ? 'text-red-500' : ''}>
                              {formatDate(task.due_date)}
                              {isOverdue(task.due_date) && ' (Overdue)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid gap-4">
            {filteredTasks.filter(t => t.status === 'completed').map((task) => (
              <Card key={task.id} className="hover: shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h3 className="font-medium line-through">{task.title}</h3>
                        <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-through">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Completed on {formatDate(task.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksPage; 