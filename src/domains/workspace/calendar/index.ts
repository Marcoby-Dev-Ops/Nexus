/**
 * Workspace Calendar Subdomain
 * Handles scheduling, events, and time management
 */

// Calendar Components
export * from './components';

// Calendar Hooks
export * from './hooks';

// Calendar Services
export * from './services';

// Calendar Pages
export * from './pages';

// Calendar Types
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  attendees: string[];
  organizer: string;
  category: 'meeting' | 'task' | 'reminder' | 'personal' | 'work';
  priority: 'high' | 'medium' | 'low';
}

export interface CalendarView {
  type: 'day' | 'week' | 'month' | 'year';
  date: string;
  events: CalendarEvent[];
}

export interface CalendarConfig {
  enableNotifications: boolean;
  enableReminders: boolean;
  enableRecurring: boolean;
  enableSharing: boolean;
} 