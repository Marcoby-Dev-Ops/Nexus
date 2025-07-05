import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Mail, Calendar, Users, PlusCircle } from 'lucide-react';

// Mock data for quick actions
const quickActions = [
  { name: 'New Document', icon: <FileText className="h-5 w-5" />, action: () => {} },
  { name: 'Send Message', icon: <Mail className="h-5 w-5" />, action: () => {} },
  { name: 'Schedule Meeting', icon: <Calendar className="h-5 w-5" />, action: () => {} },
  { name: 'Add Contact', icon: <Users className="h-5 w-5" />, action: () => {} },
];

export const QuickActionsWidget: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => (
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
          {quickActions.length === 0 && (
            <p className="text-sm text-muted-foreground">No quick actions available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 