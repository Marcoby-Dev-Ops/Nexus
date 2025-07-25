import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';
import { OAuthTokenService } from '@/services/integrations/oauthTokenService';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  attendees?: string[];
  organizer: string;
  category: 'meeting' | 'task' | 'reminder' | 'personal' | 'work';
  priority: 'high' | 'medium' | 'low';
  source: 'microsoft' | 'google' | 'outlook' | 'yahoo' | 'custom';
  isRecurring: boolean;
  recurrencePattern?: string;
  color?: string;
  isPrivate: boolean;
  hasAttachments: boolean;
  meetingUrl?: string;
}

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

class CalendarService {
  /**
   * Get calendar events from all connected sources
   * Follows data principles: real-time access, no local storage
   */
  async getEvents(filters: CalendarFilters = {}): Promise<CalendarEvent[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get user's connected calendar integrations
      const { data: integrations, error: integrationError } = await supabase
        .from('user_integrations')
        .select('integration_type, status')
        .eq('user_id', user.id)
        .in('integration_type', ['microsoft', 'google', 'outlook']);

      if (integrationError) {
        logger.error('Error fetching user integrations: ', integrationError);
        throw integrationError;
      }

      const events: CalendarEvent[] = [];

      // Fetch events from each connected calendar source
      for (const integration of integrations || []) {
        if (integration.status === 'connected') {
          const sourceEvents = await this.fetchEventsFromSource(
            integration.integration_type as 'microsoft' | 'google' | 'outlook',
            filters
          );
          events.push(...sourceEvents);
        }
      }

      // Apply filters
      return this.applyFilters(events, filters);
    } catch (error) {
      logger.error('Error fetching calendar events: ', error);
      throw error;
    }
  }

  /**
   * Fetch events from a specific calendar source
   * Real-time API access without storing data locally
   */
  private async fetchEventsFromSource(
    source: 'microsoft' | 'google' | 'outlook',
    filters: CalendarFilters
  ): Promise<CalendarEvent[]> {
    try {
      // Use the new TokenManager for client-side token refresh
      logger.info({ source }, 'Getting valid tokens using TokenManager');
      
      const tokens = await OAuthTokenService.getTokens(source);
      
      logger.info({ 
        source,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: tokens.expires_at
      }, 'Successfully retrieved OAuth tokens');

      // Check if user has active integrations for this source
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { data: userIntegrations, error: integrationError } = await supabase
        .from('user_integrations')
        .select('id, status')
        .eq('user_id', session.user.id)
        .eq('integration_type', source)
        .eq('status', 'active')
        .limit(1);

      if (integrationError) {
        logger.error({ error: integrationError }, `Error checking ${source} integration status`);
        return [];
      }

      if (!userIntegrations || userIntegrations.length === 0) {
        logger.warn(`No active ${source} integration found for user`);
        return [];
      }

      // Fetch events from the source API
      switch (source) {
        case 'microsoft':
          return await this.fetchMicrosoftEvents(tokens.access_token, filters);
        case 'google':
          return await this.fetchGoogleEvents(tokens.access_token, filters);
        case 'outlook':
          return await this.fetchOutlookEvents(tokens.access_token, filters);
        default: throw new Error(`Unsupported calendar source: ${source}`);
      }
    } catch (error) {
      logger.error({ error, source }, `Error fetching events from ${source}`);
      
      // If token refresh failed, remove expired tokens and throw re-auth error
      if (error instanceof Error && error.message.includes('expired')) {
        await OAuthTokenService.deleteTokens(source);
        throw new Error(`Your ${source} calendar connection has expired. Please reconnect your account.`);
      }
      
      return [];
    }
  }

  /**
   * Fetch events from Microsoft Graph API
   */
  private async fetchMicrosoftEvents(accessToken: string, filters: CalendarFilters): Promise<CalendarEvent[]> {
    const startDate = filters.startDate || new Date();
    const endDate = filters.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const params = new URLSearchParams({
      $select: 'id,subject,body,start,end,location,attendees,organizer,isAllDay,isCancelled,seriesMasterId,recurrence',
      $filter: `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`,
      $orderby: 'start/dateTime',
      $top: '100'
    });

    const response = await fetch(
      `https: //graph.microsoft.com/v1.0/me/calendarView?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status}`);
    }

    const data = await response.json();
    return data.value.map((event: any) => this.mapMicrosoftEvent(event));
  }

  /**
   * Fetch events from Google Calendar API
   */
  private async fetchGoogleEvents(accessToken: string, filters: CalendarFilters): Promise<CalendarEvent[]> {
    const startDate = filters.startDate || new Date();
    const endDate = filters.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100'
    });

    const response = await fetch(
      `https: //www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items.map((event: any) => this.mapGoogleEvent(event));
  }

  /**
   * Fetch events from Outlook API
   */
  private async fetchOutlookEvents(accessToken: string, filters: CalendarFilters): Promise<CalendarEvent[]> {
    // Outlook uses Microsoft Graph API, so this is similar to Microsoft
    return await this.fetchMicrosoftEvents(accessToken, filters);
  }

  /**
   * Map Microsoft Graph event to our format
   */
  private mapMicrosoftEvent(event: any): CalendarEvent {
    return {
      id: event.id,
      title: event.subject || '(No subject)',
      description: event.body?.content || '',
      startDate: new Date(event.start.dateTime || event.start.date),
      endDate: new Date(event.end.dateTime || event.end.date),
      allDay: event.isAllDay || false,
      location: event.location?.displayName || '',
      attendees: event.attendees?.map((a: any) => a.emailAddress?.address) || [],
      organizer: event.organizer?.emailAddress?.address || '',
      category: this.determineCategory(event),
      priority: this.determinePriority(event),
      source: 'microsoft',
      isRecurring: !!event.seriesMasterId || !!event.recurrence,
      recurrencePattern: event.recurrence?.pattern?.type,
      color: event.color || '#3b82f6',
      isPrivate: event.sensitivity === 'private',
      hasAttachments: event.hasAttachments || false,
      meetingUrl: event.onlineMeeting?.joinUrl || ''
    };
  }

  /**
   * Map Google Calendar event to our format
   */
  private mapGoogleEvent(event: any): CalendarEvent {
    return {
      id: event.id,
      title: event.summary || '(No subject)',
      description: event.description || '',
      startDate: new Date(event.start.dateTime || event.start.date),
      endDate: new Date(event.end.dateTime || event.end.date),
      allDay: !event.start.dateTime,
      location: event.location || '',
      attendees: event.attendees?.map((a: any) => a.email) || [],
      organizer: event.organizer?.email || '',
      category: this.determineCategory(event),
      priority: this.determinePriority(event),
      source: 'google',
      isRecurring: !!event.recurringEventId,
      color: event.colorId ? this.getGoogleColor(event.colorId) : '#10b981',
      isPrivate: event.visibility === 'private',
      hasAttachments: event.attachments?.length > 0,
      meetingUrl: event.hangoutLink || ''
    };
  }

  /**
   * Determine event category based on content
   */
  private determineCategory(event: any): 'meeting' | 'task' | 'reminder' | 'personal' | 'work' {
    const title = (event.subject || event.summary || '').toLowerCase();
    const description = (event.body?.content || event.description || '').toLowerCase();

    if (title.includes('meeting') || title.includes('call') || title.includes('standup')) {
      return 'meeting';
    }
    if (title.includes('task') || title.includes('todo') || title.includes('action')) {
      return 'task';
    }
    if (title.includes('reminder') || title.includes('alert')) {
      return 'reminder';
    }
    if (title.includes('personal') || description.includes('personal')) {
      return 'personal';
    }
    return 'work';
  }

  /**
   * Determine event priority based on content and attendees
   */
  private determinePriority(event: any): 'high' | 'medium' | 'low' {
    const title = (event.subject || event.summary || '').toLowerCase();
    const attendees = event.attendees?.length || 0;

    if (title.includes('urgent') || title.includes('critical') || attendees > 5) {
      return 'high';
    }
    if (title.includes('important') || attendees > 2) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get Google Calendar color
   */
  private getGoogleColor(colorId: string): string {
    const colors: Record<string, string> = {
      '1': '#7986cb', // Lavender
      '2': '#33b679', // Sage
      '3': '#8e63ce', // Grape
      '4': '#e67c73', // Flamingo
      '5': '#f6c26b', // Banana
      '6': '#f79b83', // Tangerine
      '7': '#f69c9c', // Peacock
      '8': '#9ddbad', // Graphite
      '9': '#77dd77', // Blueberry
      '10': '#ffb347', // Basil
      '11': '#ff6961'  // Tomato
    };
    return colors[colorId] || '#3b82f6';
  }

  /**
   * Apply filters to events
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

      // Search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesDescription = event.description?.toLowerCase().includes(searchLower) || false;
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      // Private events
      if (!filters.showPrivate && event.isPrivate) {
        return false;
      }

      // Recurring events
      if (!filters.showRecurring && event.isRecurring) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get calendar statistics
   */
  async getStats(): Promise<CalendarStats> {
    try {
      const events = await this.getEvents();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= today && eventDate < tomorrow;
      });

      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= now;
      });

      return {
        totalEvents: events.length,
        todayEvents: todayEvents.length,
        upcomingEvents: upcomingEvents.length,
        highPriorityEvents: events.filter(e => e.priority === 'high').length,
        meetingsCount: events.filter(e => e.category === 'meeting').length,
        tasksCount: events.filter(e => e.category === 'task').length,
        remindersCount: events.filter(e => e.category === 'reminder').length
      };
    } catch (error) {
      logger.error('Error getting calendar stats: ', error);
      throw error;
    }
  }

  /**
   * Log calendar access for audit purposes
   */
  private logCalendarAccess(action: string, source?: string): void {
    logger.info({
      action,
      source,
      timestamp: new Date().toISOString(),
      principle: 'Calendar access logged for audit compliance'
    }, 'Calendar access logged');
  }
}

export const calendarService = new CalendarService(); 