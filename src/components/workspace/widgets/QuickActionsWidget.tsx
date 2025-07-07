import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertCircle, FileText, Mail, Calendar, Users } from 'lucide-react';
import { quickActionsService } from '@/lib/services/quickActionsService';
import type { QuickAction } from '@/lib/services/quickActionsService';
import { Alert, AlertDescription } from '@/components/ui/Alert';

// Mock data for quick actions
const quickActions = [
  { name: 'New Document', icon: <FileText className="h-5 w-5" />, action: () => {} },
  { name: 'Send Message', icon: <Mail className="h-5 w-5" />, action: () => {} },
  { name: 'Schedule Meeting', icon: <Calendar className="h-5 w-5" />, action: () => {} },
  { name: 'Add Contact', icon: <Users className="h-5 w-5" />, action: () => {} },
];

export const QuickActionsWidget: React.FC = () => {
  const { data: actions, isLoading, isError, error } = useQuery<QuickAction[], Error>({
    queryKey: ['quickActions', 'workspace'],
    queryFn: () => quickActionsService.getActions('workspace'),
  });

  const renderContent = () => {
    if (isLoading) {
      return <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />;
    }

    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      );
    }

    if (!actions || actions.length === 0) {
      return <p className="text-sm text-muted-foreground text-center">No quick actions available.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <Button
            key={action.name}
            variant="outline"
            className="flex items-center gap-2 justify-start"
            onClick={action.action}
          >
            <span className="inline-flex items-center gap-2">
              {action.icon}
              {action.name}
            </span>
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 