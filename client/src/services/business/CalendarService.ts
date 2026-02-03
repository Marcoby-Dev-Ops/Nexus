import { BaseService } from '@/core/services/BaseService';
import { getApiBaseUrl } from '@/core/apiBase';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/database';
import { z } from 'zod';
import { getUserTimezone, toUserTimezone } from '@/shared/utils/timezone';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

// Zod schemas for validation
export const CalendarEventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  organizer: z.string(),
  category: z.enum(['meeting', 'task', 'reminder', 'personal', 'work']),
  priority: z.enum(['high', 'medium', 'low']),
  source: z.enum(['microsoft', 'google', 'outlook', 'yahoo', 'custom']),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  color: z.string().optional(),
  isPrivate: z.boolean().default(false),
  hasAttachments: z.boolean().default(false),
  meetingUrl: z.string().optional(),
});

export const CalendarFiltersSchema = z.object({
  sources: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  priorities: z.array(z.string()).optional(),
  searchTerm: z.string().optional(),
  showPrivate: z.boolean().optional(),
  showRecurring: z.boolean().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

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

/**
 * Calendar Service
 * Handles calendar events, multi-provider integration, and event management
 * Extends BaseService for consistent error handling and logging
 */
export class CalendarService extends BaseService implements CrudServiceInterface<CalendarEvent> {
  constructor() {
    super('calendar');
  }

  /**
   * Get a calendar event by ID (implements CrudServiceInterface)
   */
  async get(id: string): Promise<ServiceResponse<CalendarEvent>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get event from database
      const { data: event, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return this.createErrorResponse('Failed to get calendar event', error.message);
      }

      if (!event) {
        return this.createErrorResponse('Calendar event not found');
      }

      const calendarEvent: CalendarEvent = {
        ...event,
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
      };

      return this.createSuccessResponse(calendarEvent);
    } catch (error) {
      return this.handleError('Failed to get calendar event', error);
    }
  }

  /**
   * Create a new calendar event (implements CrudServiceInterface)
   */
  async create(data: Partial<CalendarEvent>): Promise<ServiceResponse<CalendarEvent>> {
    try {
      return await this.createEvent(data as Omit<CalendarEvent, 'id'>);
    } catch (error) {
      return this.handleError('Failed to create calendar event', error);
    }
  }

  /**
   * Update a calendar event (implements CrudServiceInterface)
   */
  async update(id: string, data: Partial<CalendarEvent>): Promise<ServiceResponse<CalendarEvent>> {
    try {
      return await this.updateEvent(id, data);
    } catch (error) {
      return this.handleError('Failed to update calendar event', error);
    }
  }

  /**
   * Delete a calendar event (implements CrudServiceInterface)
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      return await this.deleteEvent(id);
    } catch (error) {
      return this.handleError('Failed to delete calendar event', error);
    }
  }

  /**
   * List calendar events (implements CrudServiceInterface)
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<CalendarEvent[]>> {
    try {
      const calendarFilters: CalendarFilters = filters as CalendarFilters || {};
      return await this.getEvents(calendarFilters);
    } catch (error) {
      return this.handleError('Failed to list calendar events', error);
    }
  }

  /**
   * Get calendar events from all connected sources
   */
  async getEvents(filters: CalendarFilters = {}): Promise<ServiceResponse<CalendarEvent[]>> {
    try {
      // Validate filters
      const validatedFilters = CalendarFiltersSchema.parse(filters);
      
      // Get current user
      const userResult = await authentikAuthService.getSession();
      const user = userResult.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

              // Get user's connected calendar integrations - fetch individually to avoid .in() issues
        const integrationNames = ['Microsoft 365', 'Google Workspace', 'Outlook', 'Gmail'];
        const integrationPromises = integrationNames.map(name => 
          supabase
            .from('user_integrations')
            .select('integration_name, status')
            .eq('user_id', user.id)
            .eq('integration_name', name)
        );

        const integrationResults = await Promise.all(integrationPromises);
        const integrationErrors = integrationResults.filter(result => result.error);
        
        if (integrationErrors.length > 0) {
          return this.createErrorResponse('Failed to fetch user integrations', integrationErrors[0].error?.message || 'Unknown error');
        }

        const integrations = integrationResults.flatMap(result => result.data || []);

      const events: CalendarEvent[] = [];

      // Fetch events from each connected calendar source
      for (const integration of integrations || []) {
        if (integration.status === 'connected') {
          // Map integration names to source types
          let source: 'microsoft' | 'google' | 'outlook';
          switch (integration.integration_name) {
            case 'Microsoft 365':
              source = 'microsoft';
              break;
            case 'Google Workspace':
            case 'Gmail':
              source = 'google';
              break;
            case 'Outlook':
              source = 'outlook';
              break;
            default:
              this.logger.warn(`Unknown calendar integration: ${integration.integration_name}`);
              continue;
          }
          
          const sourceEvents = await this.fetchEventsFromSource(source, validatedFilters);
          events.push(...sourceEvents);
        }
      }

      // Apply filters
      const filteredEvents = this.applyFilters(events, validatedFilters);

      this.logSuccess('Calendar events fetched successfully', { 
        totalEvents: filteredEvents.length,
        sources: integrations?.map(i => i.integration_name)
      });

      return this.createSuccessResponse(filteredEvents);
    } catch (error) {
      return this.handleError('Failed to fetch calendar events', error);
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(data: Omit<CalendarEvent, 'id'>): Promise<ServiceResponse<CalendarEvent>> {
    try {
      // Validate event data
      const validatedData = CalendarEventSchema.parse(data);
      
      // Get current user
      const authResult = await authentikAuthService.getSession();
      const user = authResult.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Create event in database
      const { data: event, error } = await supabase
        .from('calendar_events')
        .insert({
          ...validatedData,
          user_id: user.id,
          start_date: validatedData.startDate.toISOString(),
          end_date: validatedData.endDate.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.createErrorResponse('Failed to create calendar event', error.message);
      }

      const calendarEvent: CalendarEvent = {
        ...event,
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
      };

      this.logSuccess('Calendar event created successfully', { eventId: event.id });
      return this.createSuccessResponse(calendarEvent);
    } catch (error) {
      return this.handleError('Failed to create calendar event', error);
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(id: string, data: Partial<CalendarEvent>): Promise<ServiceResponse<CalendarEvent>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const userData = await authentikAuthService.getSession();
      const user = userData.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Update event in database
      const updateData: any = { ...data };
      if (data.startDate) updateData.start_date = data.startDate.toISOString();
      if (data.endDate) updateData.end_date = data.endDate.toISOString();

      const { data: event, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return this.createErrorResponse('Failed to update calendar event', error.message);
      }

      const calendarEvent: CalendarEvent = {
        ...event,
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
      };

      this.logSuccess('Calendar event updated successfully', { eventId: id });
      return this.createSuccessResponse(calendarEvent);
    } catch (error) {
      return this.handleError('Failed to update calendar event', error);
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const userSession = await authentikAuthService.getSession();
      const user = userSession.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Delete event from database
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return this.createErrorResponse('Failed to delete calendar event', error.message);
      }

      this.logSuccess('Calendar event deleted successfully', { eventId: id });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to delete calendar event', error);
    }
  }

  /**
   * Get calendar statistics
   */
  async getStats(): Promise<ServiceResponse<CalendarStats>> {
    try {
      // Get current user
      const userInfo = await authentikAuthService.getSession();
      const user = userInfo.data?.user;
      if (!user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get all user events
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        return this.createErrorResponse('Failed to fetch calendar stats', error.message);
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const stats: CalendarStats = {
        totalEvents: events?.length || 0,
        todayEvents: events?.filter(e => {
          const eventDate = new Date(e.start_date);
          return eventDate >= today && eventDate < tomorrow;
        }).length || 0,
        upcomingEvents: events?.filter(e => new Date(e.start_date) > now).length || 0,
        highPriorityEvents: events?.filter(e => e.priority === 'high').length || 0,
        meetingsCount: events?.filter(e => e.category === 'meeting').length || 0,
        tasksCount: events?.filter(e => e.category === 'task').length || 0,
        remindersCount: events?.filter(e => e.category === 'reminder').length || 0,
      };

      this.logSuccess('Calendar stats fetched successfully', stats);
      return this.createSuccessResponse(stats);
    } catch (error) {
      return this.handleError('Failed to fetch calendar stats', error);
    }
  }

  /**
   * Fetch events from a specific calendar source
   */
  private async fetchEventsFromSource(
    source: 'microsoft' | 'google' | 'outlook',
    filters: CalendarFilters
  ): Promise<CalendarEvent[]> {
    try {
      // Get current user
      const userSession = await authentikAuthService.getSession();
      const user = userSession.data?.user;
      if (!user) {
        this.logError('User not authenticated for calendar source fetch');
        return [];
      }

      if (source === 'microsoft' || source === 'microsoft365') {
        return await this.getMicrosoftCalendarEvents(user.id, filters);
      }

      // TODO: Implement other calendar sources (Google, Outlook)
      this.logInfo(`Calendar source ${source} not yet implemented`);
      return [];
    } catch (error) {
      this.logError(`Failed to fetch events from ${source}`, error);
      return [];
    }
  }

  /**
   * Fetch calendar events from Microsoft 365 via Edge Function
   */
  private async getMicrosoftCalendarEvents(
    userId: string, 
    filters: CalendarFilters
  ): Promise<CalendarEvent[]> {
    try {
      // Get user's timezone
      const userTimezone = await getUserTimezone();
      
      const params = new URLSearchParams({
        userId: userId,
        top: '100',
      });

      // Add date filters if provided, converting to user's timezone
      if (filters.startDate) {
        const userStartDate = toUserTimezone(filters.startDate, userTimezone);
        params.append('startDate', userStartDate.toISO());
      }
      if (filters.endDate) {
        const userEndDate = toUserTimezone(filters.endDate, userTimezone);
        params.append('endDate', userEndDate.toISO());
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/microsoft/calendar/list?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        this.logError(`Microsoft calendar API failed: ${response.status} ${errorText}`);
        return [];
      }

      const result = await response.json();
      
      if (!result.success) {
        this.logError(`Microsoft calendar API error: ${result.error}`);
        return [];
      }

      // Transform the response to match our CalendarEvent interface
      // Convert dates to user's timezone for display
      const events: CalendarEvent[] = (result.data.items || []).map((item: any) => {
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          startDate: startDate,
          endDate: endDate,
          allDay: item.allDay,
          location: item.location,
          attendees: item.attendees,
          organizer: item.organizer,
          category: item.category,
          priority: item.priority,
          source: item.source,
          isRecurring: item.isRecurring,
          recurrencePattern: item.recurrencePattern,
          color: item.color,
          isPrivate: item.isPrivate,
          hasAttachments: item.hasAttachments,
          meetingUrl: item.meetingUrl,
        };
      });

      this.logSuccess(`Fetched ${events.length} Microsoft calendar events`);
      return events;
    } catch (error) {
      this.logError('Failed to fetch Microsoft calendar events', error);
      return [];
    }
  }

  /**
   * Apply filters to calendar events
   */
  private applyFilters(events: CalendarEvent[], filters: CalendarFilters): CalendarEvent[] {
    let filteredEvents = [...events];

    // Filter by sources
    if (filters.sources && filters.sources.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filters.sources!.includes(event.source)
      );
    }

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filters.categories!.includes(event.category)
      );
    }

    // Filter by priorities
    if (filters.priorities && filters.priorities.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filters.priorities!.includes(event.priority)
      );
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by date range
    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(event => 
        event.startDate >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(event => 
        event.endDate <= filters.endDate!
      );
    }

    // Filter by privacy
    if (filters.showPrivate === false) {
      filteredEvents = filteredEvents.filter(event => !event.isPrivate);
    }

    // Filter by recurring
    if (filters.showRecurring === false) {
      filteredEvents = filteredEvents.filter(event => !event.isRecurring);
    }

    return filteredEvents;
  }
}

// Export singleton instance
export const calendarService = new CalendarService(); 
