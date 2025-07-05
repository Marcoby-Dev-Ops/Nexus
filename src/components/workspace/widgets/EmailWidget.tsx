import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { unifiedInboxService } from '@/lib/services/unifiedInboxService';
import type { InboxItem } from '@/lib/services/unifiedInboxService';
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';

export const EmailWidget: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery<{ items: InboxItem[] }, Error>({
    queryKey: ['inboxItems'],
    queryFn: () => unifiedInboxService.getInboxItems({ is_read: false }, 5), // Fetch 5 unread items
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load inbox: {error.message}
          </AlertDescription>
        </Alert>
      );
    }

    if (!data || data.items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <Mail className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">All caught up!</h3>
          <p className="text-sm text-muted-foreground">Your inbox is empty.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
            <div className={`mt-1 h-2 w-2 rounded-full ${item.is_read ? 'bg-muted' : 'bg-primary'}`} />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold truncate">{item.sender}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.item_timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.preview}</p>
            </div>
            <Badge variant={item.ai_urgency === 'urgent' ? 'destructive' : 'secondary'}>{item.ai_urgency}</Badge>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 