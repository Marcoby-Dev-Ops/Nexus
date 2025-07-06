import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Bell, AlertCircle, CheckCircle, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/lib/services/notificationsService';
import type { Notification } from '@/lib/services/notificationsService';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

const NOTIFICATION_ICONS = {
  info: <Bell className="h-5 w-5 text-info" />,
  warning: <AlertCircle className="h-5 w-5 text-warning" />,
  alert: <AlertCircle className="h-5 w-5 text-destructive" />,
};

export const NotificationsWidget: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications(10),
  });

  useEffect(() => {
    const channel = notificationsService.subscribeToNotifications((payload: RealtimePostgresChangesPayload<Notification>) => {
      console.log('New notification received!', payload);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      notificationsService.unsubscribeFromNotifications(channel);
    };
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const { user } = useAuth();
  const handleCreateTestNotification = async () => {
    if (user) {
      await notificationsService.createNotification({
        user_id: user.id,
        type: 'info',
        message: 'This is a test notification!',
        metadata: { test: true },
      });
    }
  };

  const hasUnread = useMemo(() => notifications?.some(n => !n.read), [notifications]);

  // Error boundary for widget
  try {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={!hasUnread || markAllAsReadMutation.isPending}
              aria-label="Mark all notifications as read"
              title="Mark all as read"
            >
              <CheckCheck className="h-5 w-5" />
            </Button>
            <Button size="sm" onClick={handleCreateTestNotification}>Test</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading && (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            )}

            {isError && (
              <div className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p>Error loading notifications.</p>
              </div>
            )}
            
            {notifications && notifications.length > 0 && notifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-md ${notification.read ? 'bg-muted/30' : 'bg-muted/80'}`}
              >
                <div className="pt-1">
                  {NOTIFICATION_ICONS[notification.type]}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'font-medium'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    title="Mark as read"
                    aria-label={`Mark notification as read: ${notification.message}`}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}

            {!isLoading && !isError && notifications?.length === 0 && (
              <p className="text-sm text-muted-foreground">No new notifications.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  } catch (err) {
    console.error('Error rendering NotificationsWidget:', err);
    return <div className="text-destructive p-4">Error loading notifications widget.</div>;
  }
}; 