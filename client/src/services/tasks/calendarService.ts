import { selectData as select, selectOne, insertOne, updateOne, deleteOne } from '@/lib/database';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { OAuthTokenService } from '@/core/auth/OAuthTokenService';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { nowIsoUtc, addDaysUtcIso, fromMaybeDateOrIsoToDate } from '@/shared/utils/time';
import { retryFetch } from '@/shared/utils/retry';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

// Calendar Event Schema
export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  allDay: z.boolean(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  organizer: z.string(),
  category: z.enum(['meeting', 'task', 'reminder', 'personal', 'work']),
  priority: z.enum(['high', 'medium', 'low']),
  source: z.enum(['microsoft', 'google', 'outlook', 'yahoo', 'custom']),
  isRecurring: z.boolean(),
  recurrencePattern: z.string().optional(),
  color: z.string().optional(),
  isPrivate: z.boolean(),
  hasAttachments: z.boolean(),
  meetingUrl: z.string().optional(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export interface CalendarFilters {
  sources?: string[];
  categories?: string[];
  priorities?: string[];
  searchTerm?: string;
  showPrivate?: boolean;
  showRecurring?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface CalendarStats {
  totalEvents: number;
  todayEvents: number;
  upcomingEvents: number;
  highPriorityEvents: number;
  meetingsCount: number;
  tasksCount: number;
  remindersCount: number;
}

/**
 * Calendar Service
 * Provides calendar event management functionality
 * 
 * Extends BaseService for consistent error handling and logging
 */
export class CalendarService extends BaseService {
  private oauthTokenService = new OAuthTokenService();

  /**
   * Get calendar events from all connected sources
   * Follows data principles: real-time access, no local storage
   */
  async getEvents(filters: CalendarFilters = {}): Promise<ServiceResponse<CalendarEvent[]>> {
    return this.executeDbOperation(async () => {
      const userResult = await authentikAuthService.getSession();
      const user = userResult.data?.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's connected calendar integrations - fetch individually to avoid .in() issues
      const integrationNames = ['microsoft', 'microsoft365', 'google', 'outlook'];
      const integrationPromises = integrationNames.map(name => 
        select('user_integrations', 'integration_slug, status', { 
          user_id: user.id,
          integration_slug: name
        })
      );

      const integrationResults = await Promise.all(integrationPromises);
      const integrationErrors = integrationResults.filter(result => result.error);
      
      if (integrationErrors.length > 0) {
        logger.error('Error fetching user integrations: ', integrationErrors[0].error);
        throw integrationErrors[0].error;
      }

      const integrations = integrationResults.flatMap(result => result.data || []);

      const events: CalendarEvent[] = [];

      // Fetch events from each connected calendar source
      for (const integration of integrations || []) {
        if (integration.status === 'connected') {
          const sourceEvents = await this.fetchEventsFromSource(
            integration.integration_slug as 'microsoft' | 'microsoft365' | 'google' | 'outlook',
            filters
          );
          events.push(...sourceEvents);
        }
      }

      // Apply filters
      const filteredEvents = this.applyFilters(events, filters);
      const validatedEvents = filteredEvents.map(event => CalendarEventSchema.parse(event));
      
      return { data: validatedEvents, error: null };
    }, 'get calendar events');
  }

  /**
   * Fetch events from a specific calendar source
   * Real-time API access without storing data locally
   */
  private async fetchEventsFromSource(
    source: 'microsoft' | 'google' | 'outlook',
    filters: CalendarFilters
  ): Promise<CalendarEvent[]> {
    return this.executeDbOperation(async () => {
      const userResult = await authentikAuthService.getSession();
      const user = userResult.data?.user;
      if (!user) throw new Error('User not authenticated');

      // Get access token for the specific source
      const accessToken = await this.oauthTokenService.getAccessToken(user.id, source);
      if (!accessToken) {
        logger.warn(`No access token found for ${source} calendar`);
        return [];
      }

      let events: CalendarEvent[] = [];

      switch (source) {
        case 'microsoft':
          events = await this.fetchMicrosoftEvents(accessToken, filters);
          break;
        case 'google':
          events = await this.fetchGoogleEvents(accessToken, filters);
          break;
        case 'outlook':
          events = await this.fetchOutlookEvents(accessToken, filters);
          break;
        default:
          logger.warn(`Unsupported calendar source: ${source}`);
          return [];
      }

      this.logCalendarAccess('fetch_events', source);
      return events;
    }, `fetch events from ${source}`);
  }

  /**
   * Fetch events from Microsoft Graph API
   */
  private async fetchMicrosoftEvents(accessToken: string, filters: CalendarFilters): Promise<CalendarEvent[]> {
    return this.executeDbOperation(async () => {
      const startIso = nowIsoUtc();
      const endIso = addDaysUtcIso(30);

      const response = await retryFetch(
        `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startIso}&endDateTime=${endIso}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value.map((event: any) => this.mapMicrosoftEvent(event));
    }, 'fetch Microsoft events');
  }

  /**
   * Fetch events from Google Calendar API
   */
  private async fetchGoogleEvents(accessToken: string, filters: CalendarFilters): Promise<CalendarEvent[]> {
    return this.executeDbOperation(async () => {
      const startIso = nowIsoUtc();
      const endIso = addDaysUtcIso(30);

      const response = await retryFetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startIso}&timeMax=${endIso}&singleEvents=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items.map((event: any) => this.mapGoogleEvent(event));
    }, 'fetch Google events');
  }

  /**
   * Fetch events from Outlook API
   */
  private async fetchOutlookEvents(accessToken: string, filters: CalendarFilters): Promise<CalendarEvent[]> {
    return this.executeDbOperation(async () => {
      // Outlook API implementation similar to Microsoft Graph
      // For now, return empty array as placeholder
      return [];
    }, 'fetch Outlook events');
  }

  /**
   * Map Microsoft Graph event to CalendarEvent
   */
  private mapMicrosoftEvent(event: any): CalendarEvent {
    return {
      id: event.id,
      title: event.subject || 'Untitled Event',
      description: event.body?.content || '',
      startDate: fromMaybeDateOrIsoToDate(event.start.dateTime),
      endDate: fromMaybeDateOrIsoToDate(event.end.dateTime),
      allDay: event.isAllDay || false,
      location: event.location?.displayName || '',
      attendees: event.attendees?.map((a: any) => a.emailAddress.address) || [],
      organizer: event.organizer?.emailAddress?.address || '',
      category: this.determineCategory(event),
      priority: this.determinePriority(event),
      source: 'microsoft',
      isRecurring: !!event.recurrence,
      recurrencePattern: event.recurrence?.pattern?.type,
      color: event.color || '#0078d4',
      isPrivate: event.sensitivity === 'private',
      hasAttachments: event.hasAttachments || false,
      meetingUrl: event.onlineMeeting?.joinUrl || ''
    };
  }

  /**
   * Map Google Calendar event to CalendarEvent
   */
  private mapGoogleEvent(event: any): CalendarEvent {
    return {
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      startDate: fromMaybeDateOrIsoToDate(event.start.dateTime || event.start.date),
      endDate: fromMaybeDateOrIsoToDate(event.end.dateTime || event.end.date),
      allDay: !!event.start.date,
      location: event.location || '',
      attendees: event.attendees?.map((a: any) => a.email) || [],
      organizer: event.organizer?.email || '',
      category: this.determineCategory(event),
      priority: this.determinePriority(event),
      source: 'google',
      isRecurring: !!event.recurrence,
      recurrencePattern: event.recurrence?.[0],
      color: this.getGoogleColor(event.colorId),
      isPrivate: event.visibility === 'private',
      hasAttachments: !!event.attachments?.length,
      meetingUrl: event.hangoutLink || ''
    };
  }

  /**
   * Determine event category based on event data
   */
  private determineCategory(event: any): 'meeting' | 'task' | 'reminder' | 'personal' | 'work' {
    const title = event.subject || event.summary || '';
    const description = event.body?.content || event.description || '';
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('meeting') || text.includes('call') || text.includes('zoom') || text.includes('teams')) {
      return 'meeting';
    }
    if (text.includes('task') || text.includes('todo') || text.includes('action')) {
      return 'task';
    }
    if (text.includes('reminder') || text.includes('alert')) {
      return 'reminder';
    }
    if (text.includes('personal') || text.includes('family')) {
      return 'personal';
    }
    return 'work';
  }

  /**
   * Determine event priority based on event data
   */
  private determinePriority(event: any): 'high' | 'medium' | 'low' {
    const title = event.subject || event.summary || '';
    const text = title.toLowerCase();

    if (text.includes('urgent') || text.includes('asap') || text.includes('critical')) {
      return 'high';
    }
    if (text.includes('important') || text.includes('priority')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get Google Calendar color from colorId
   */
  private getGoogleColor(colorId: string): string {
    const colors: Record<string, string> = {
      '1': '#7986cb', // Lavender
      '2': '#33b679', // Sage
      '3': '#8e63ce', // Grape
      '4': '#e67c73', // Flamingo
      '5': '#f6c026', // Banana
      '6': '#f5511d', // Tangerine
      '7': '#039be5', // Peacock
      '8': '#616161', // Graphite
      '9': '#3f51b5', // Blueberry
      '10': '#0b8043', // Basil
      '11': '#d60000'  // Tomato
    };
    return colors[colorId] || '#039be5';
  }

  /**
   * Apply filters to calendar events
   */
  private applyFilters(events: CalendarEvent[], filters: CalendarFilters): CalendarEvent[] {
    return events.filter(event => {
      // Source filter
      if (filters.sources && filters.sources.length > 0 && !filters.sources.includes(event.source)) {
        return false;
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }

      // Priority filter
      if (filters.priorities && filters.priorities.length > 0 && !filters.priorities.includes(event.priority)) {
        return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchText = filters.searchTerm.toLowerCase();
        const eventText = `${event.title} ${event.description}`.toLowerCase();
        if (!eventText.includes(searchText)) {
          return false;
        }
      }

      // Private events filter
      if (!filters.showPrivate && event.isPrivate) {
        return false;
      }

      // Recurring events filter
      if (!filters.showRecurring && event.isRecurring) {
        return false;
      }

      // Date range filter
      if (filters.startDate && event.startDate < filters.startDate) {
        return false;
      }
      if (filters.endDate && event.endDate > filters.endDate) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get calendar statistics
   */
  async getStats(): Promise<ServiceResponse<CalendarStats>> {
    return this.executeDbOperation(async () => {
      const { data: events, error } = await this.getEvents();
      
      if (error) throw error;

      const now = DateTime.utc();
      const today = now.startOf('day');
      const tomorrow = today.plus({ days: 1 });

      const stats: CalendarStats = {
        totalEvents: events?.length || 0,
        todayEvents: events?.filter(e => DateTime.fromJSDate(e.startDate, { zone: 'utc' }) >= today && DateTime.fromJSDate(e.startDate, { zone: 'utc' }) < tomorrow).length || 0,
        upcomingEvents: events?.filter(e => DateTime.fromJSDate(e.startDate, { zone: 'utc' }) > now).length || 0,
        highPriorityEvents: events?.filter(e => e.priority === 'high').length || 0,
        meetingsCount: events?.filter(e => e.category === 'meeting').length || 0,
        tasksCount: events?.filter(e => e.category === 'task').length || 0,
        remindersCount: events?.filter(e => e.category === 'reminder').length || 0
      };

      return { data: stats, error: null };
    }, 'get calendar stats');
  }

  /**
   * Log calendar access for audit purposes
   */
  private logCalendarAccess(action: string, source?: string): void {
    this.logger.info(`Calendar access: ${action}${source ? ` from ${source}` : ''}`);
  }
} 
