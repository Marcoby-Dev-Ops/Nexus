import React from 'react';
import { useNotifications } from '@/shared/hooks/NotificationContext';
import { X } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { notifications, removeNotification, unreadCount, markAllAsRead } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-3">
        <header className="flex items-center justify-between rounded-lg bg-background/90 px-4 py-2 shadow-md backdrop-blur">
          <span className="text-sm font-medium">
            Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="pointer-events-auto text-xs font-medium text-primary hover:underline"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </button>
          )}
        </header>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="pointer-events-auto relative overflow-hidden rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur transition focus-within:ring-2 focus-within:ring-primary"
          >
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="px-4 py-3 pr-10">
              <p className="text-sm font-semibold">{notification.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
