import React from 'react';
import type { OWAEmailItem } from '@/domains/services/owaInboxService';
import { owaInboxService } from '@/domains/services/owaInboxService';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/Card';
import { Separator } from '@/shared/components/ui/Separator';
import { useNotifications } from '@/shared/core/hooks/NotificationContext';
import {
  Archive,
  ArrowLeft,
  EyeOff,
  Star,
  Trash2,
} from 'lucide-react';

interface EmailDetailViewProps {
  item: OWAEmailItem | undefined;
  onClose: () => void;
  onAction: (action: 'archive' | 'delete' | 'toggle_read' | 'toggle_important', itemId: string) => void;
}

const EmailDetailView: React.FC<EmailDetailViewProps> = ({ item, onClose, onAction }) => {
  const { addNotification } = useNotifications();

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select an item to view</p>
      </div>
    );
  }

  const handleAction = async (action: 'archive' | 'delete' | 'toggle_read' | 'toggle_important') => {
    try {
      let message = '';
      switch (action) {
        case 'archive':
          // TODO: Implement archive for owaInboxService if available
          message = 'Archive not implemented.';
          break;
        case 'toggle_read':
          await owaInboxService.markAsRead(item.id, !item.is_read, item.provider);
          message = item.is_read ? 'Marked as unread.' : 'Marked as read.';
          break;
        case 'toggle_important':
          // TODO: Implement toggle important for owaInboxService if available
          message = 'Toggle important not implemented.';
          break;
        case 'delete':
          addNotification({ type: 'info', message: 'Delete functionality is not yet implemented.' });
          return; // Early return
      }
      addNotification({ type: 'success', message });
      onAction(action, item.id);
    } catch (error) {
      addNotification({ type: 'error', message: `Action failed: ${action}` });
      console.error(`Failed to ${action} item ${item.id}`, error);
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between gap-4">
            <div className='flex items-center gap-2'>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-lg font-semibold truncate">{item.subject}</h2>
            </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAction('toggle_read')}>
              <EyeOff className="w-4 h-4 mr-2" />
              Mark as Unread
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAction('archive')}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
             <Button variant="outline" size="sm" onClick={() => handleAction('toggle_important')}>
              <Star className={`w-4 h-4 mr-2 ${item.is_important ? 'text-warning fill-current' : ''}`} />
              Important
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleAction('delete')}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                    {item.sender_name?.charAt(0) || 'U'}
                </div>
                <div>
                    <p className="font-semibold">{item.sender_name}</p>
                    <p className="text-sm text-muted-foreground">{item.sender_email}</p>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                    {new Date(item.item_timestamp || item.created_at || Date.now()).toLocaleString()}
                </div>
            </div>
            <Separator />
        </div>
        <div 
          className="p-4 sm:p-6 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: item.html_content || item.content || '<p>No content available.</p>' }}
        />
      </CardContent>
    </Card>
  );
};

export default EmailDetailView; 