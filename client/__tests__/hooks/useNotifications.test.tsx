import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationProvider, useNotifications } from '../../src/shared/hooks/NotificationContext';

// Test component that uses notifications
const TestComponent = () => {
  const { 
    notifications, 
    addNotification, 
    removeNotification, 
    clearNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount 
  } = useNotifications();
  
  return (
    <div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <button 
        data-testid="add-success" 
        onClick={() => addNotification({ 
          type: 'success', 
          title: 'Success!', 
          message: 'Operation completed successfully' 
        })}
      >
        Add Success
      </button>
      <button 
        data-testid="add-error" 
        onClick={() => addNotification({ 
          type: 'error', 
          title: 'Error!', 
          message: 'Something went wrong' 
        })}
      >
        Add Error
      </button>
      <button 
        data-testid="add-info" 
        onClick={() => addNotification({ 
          type: 'info', 
          title: 'Info', 
          message: 'Here is some information' 
        })}
      >
        Add Info
      </button>
      <button 
        data-testid="clear-all" 
        onClick={clearNotifications}
      >
        Clear All
      </button>
      <button 
        data-testid="mark-all-read" 
        onClick={markAllAsRead}
      >
        Mark All Read
      </button>
      <div data-testid="notifications-list">
        {notifications.map(notification => (
          <div key={notification.id} data-testid={`notification-${notification.id}`}>
            <span data-testid={`title-${notification.id}`}>{notification.title}</span>
            <span data-testid={`message-${notification.id}`}>{notification.message}</span>
            <span data-testid={`type-${notification.id}`}>{notification.type}</span>
            <span data-testid={`read-${notification.id}`}>{notification.read ? 'read' : 'unread'}</span>
            <button 
              data-testid={`remove-${notification.id}`}
              onClick={() => removeNotification(notification.id)}
            >
              Remove
            </button>
            <button 
              data-testid={`mark-read-${notification.id}`}
              onClick={() => markAsRead(notification.id)}
            >
              Mark Read
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('useNotifications Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });

  it('should add a success notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add a success notification
    screen.getByTestId('add-success').click();

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    // Check notification content
    const notificationId = screen.getByTestId('notifications-list').querySelector('[data-testid^="notification-"]')?.getAttribute('data-testid')?.replace('notification-', '');
    expect(notificationId).toBeDefined();
    
    if (notificationId) {
      expect(screen.getByTestId(`title-${notificationId}`)).toHaveTextContent('Success!');
      expect(screen.getByTestId(`message-${notificationId}`)).toHaveTextContent('Operation completed successfully');
      expect(screen.getByTestId(`type-${notificationId}`)).toHaveTextContent('success');
      expect(screen.getByTestId(`read-${notificationId}`)).toHaveTextContent('unread');
    }
  });

  it('should add an error notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add an error notification
    screen.getByTestId('add-error').click();

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    // Check notification content
    const notificationId = screen.getByTestId('notifications-list').querySelector('[data-testid^="notification-"]')?.getAttribute('data-testid')?.replace('notification-', '');
    expect(notificationId).toBeDefined();
    
    if (notificationId) {
      expect(screen.getByTestId(`title-${notificationId}`)).toHaveTextContent('Error!');
      expect(screen.getByTestId(`message-${notificationId}`)).toHaveTextContent('Something went wrong');
      expect(screen.getByTestId(`type-${notificationId}`)).toHaveTextContent('error');
    }
  });

  it('should add an info notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add an info notification
    screen.getByTestId('add-info').click();

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    // Check notification content
    const notificationId = screen.getByTestId('notifications-list').querySelector('[data-testid^="notification-"]')?.getAttribute('data-testid')?.replace('notification-', '');
    expect(notificationId).toBeDefined();
    
    if (notificationId) {
      expect(screen.getByTestId(`title-${notificationId}`)).toHaveTextContent('Info');
      expect(screen.getByTestId(`message-${notificationId}`)).toHaveTextContent('Here is some information');
      expect(screen.getByTestId(`type-${notificationId}`)).toHaveTextContent('info');
    }
  });

  it('should remove a notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add a notification
    screen.getByTestId('add-success').click();

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    });

    // Remove the notification
    const notificationId = screen.getByTestId('notifications-list').querySelector('[data-testid^="notification-"]')?.getAttribute('data-testid')?.replace('notification-', '');
    if (notificationId) {
      screen.getByTestId(`remove-${notificationId}`).click();
    }

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  it('should mark a notification as read', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add a notification
    screen.getByTestId('add-success').click();

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    // Mark as read
    const notificationId = screen.getByTestId('notifications-list').querySelector('[data-testid^="notification-"]')?.getAttribute('data-testid')?.replace('notification-', '');
    if (notificationId) {
      screen.getByTestId(`mark-read-${notificationId}`).click();
    }

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });

    // Check that the notification is marked as read
    if (notificationId) {
      expect(screen.getByTestId(`read-${notificationId}`)).toHaveTextContent('read');
    }
  });

  it('should mark all notifications as read', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add multiple notifications
    screen.getByTestId('add-success').click();
    screen.getByTestId('add-error').click();
    screen.getByTestId('add-info').click();

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('3');
    });

    // Mark all as read
    screen.getByTestId('mark-all-read').click();

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  it('should clear all notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add multiple notifications
    screen.getByTestId('add-success').click();
    screen.getByTestId('add-error').click();

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
    });

    // Clear all notifications
    screen.getByTestId('clear-all').click();

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  it('should auto-remove notifications after duration', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add a notification
    screen.getByTestId('add-success').click();

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    });

    // Fast-forward time to trigger auto-removal (success notifications auto-remove after 5 seconds)
    act(() => {
      jest.advanceTimersByTime(6000); // 6 seconds to be safe
    });

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  it('should limit notifications to maxNotifications', async () => {
    render(
      <NotificationProvider maxNotifications={2}>
        <TestComponent />
      </NotificationProvider>
    );

    // Add 3 notifications
    screen.getByTestId('add-success').click();
    screen.getByTestId('add-error').click();
    screen.getByTestId('add-info').click();

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
    });
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNotifications must be used within a NotificationProvider');

    console.error = originalError;
  });
}); 