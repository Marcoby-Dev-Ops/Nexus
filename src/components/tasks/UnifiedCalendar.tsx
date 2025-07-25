import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Calendar } from '@/shared/components/ui/Calendar';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { calendarService } from '@/services/tasks/calendarService';
import { useAuth } from '@/hooks/index';

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

export interface CalendarView {
  type: 'day' | 'week' | 'month' | 'year';
  date: Date;
  events: CalendarEvent[];
}

export interface CalendarFilters {
  sources: string[];
  categories: string[];
  priorities: string[];
  searchTerm: string;
  showPrivate: boolean;
  showRecurring: boolean;
}

const UnifiedCalendar: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [filters, setFilters] = useState<CalendarFilters>({
    sources: [],
    categories: [],
    priorities: [],
    searchTerm: '',
    showPrivate: true,
    showRecurring: true
  });

  // Check if user has any calendar integrations connected
  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['calendar-integrations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_integrations')
        .select(`
          id, 
          status, 
          integration_type,
          integrations: integration_id (
            id, 
            name, 
            slug, 
            description
          )
        `)
        .eq('user_id', user.id)
        .in('integration_type', ['microsoft', 'google', 'outlook', 'microsoft365'])
        .eq('status', 'active');

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching calendar integrations: ', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch calendar events from connected sources
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['calendar-events', selectedDate, filters, user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        // Use the calendar service to fetch real events
        const startDate = new Date(selectedDate);
        startDate.setMonth(startDate.getMonth() - 1); // Get events from 1 month ago
        
        const endDate = new Date(selectedDate);
        endDate.setMonth(endDate.getMonth() + 1); // Get events up to 1 month ahead

        const calendarEvents = await calendarService.getEvents({
          startDate,
          endDate,
          ...filters
        });

        return calendarEvents;
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching calendar events: ', error);
        return [];
      }
    },
    enabled: !!user && (integrations?.length || 0) > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get events for the selected date
  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Get today's events
  const todayEvents = getEventsForDate(new Date());

  // Get upcoming events (next 7 days)
  const upcomingEvents = events?.filter(event => {
    const eventDate = new Date(event.startDate);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return eventDate >= today && eventDate <= nextWeek;
  }) || [];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewChange = (view: 'day' | 'week' | 'month' | 'year') => {
    setViewType(view);
  };

  const handleFilterChange = (filterType: keyof CalendarFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'task': return <Clock className="w-4 h-4" />;
      case 'reminder': return <Clock className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const renderEventCard = (event: CalendarEvent) => (
    <Card key={event.id} className="mb-3 hover: shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: event.color || '#6b7280' }}
              />
              <h4 className="font-medium text-sm">{event.title}</h4>
              {event.isPrivate && <EyeOff className="w-3 h-3 text-muted-foreground" />}
              {event.hasAttachments && <Badge variant="secondary" className="text-xs">📎</Badge>}
            </div>
            
            {event.description && (
              <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {event.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
              )}
              
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{event.attendees.length} attendees</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {event.source}
              </Badge>
              <Badge className={`text-xs ${getPriorityColor(event.priority)}`}>
                {event.priority}
              </Badge>
              {event.isRecurring && (
                <Badge variant="secondary" className="text-xs">
                  Recurring
                </Badge>
              )}
            </div>
          </div>
          
          {event.meetingUrl && (
            <Button size="sm" variant="outline" asChild>
              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                Join
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Show connection status
  const hasConnectedIntegrations = integrations && integrations.length > 0;
  const isLoading = integrationsLoading || eventsLoading;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {!hasConnectedIntegrations && !integrationsLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No calendar integrations connected. Connect your Microsoft 365, Google Workspace, or Outlook account to see your calendar events.
          </AlertDescription>
        </Alert>
      )}

      {hasConnectedIntegrations && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Connected to {integrations.length} calendar source{integrations.length > 1 ? 's' : ''}: {integrations.map(i => i.integrations?.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {eventsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading calendar events: {eventsError.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg: grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Calendar</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewChange('day')}
                    className={viewType === 'day' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    Day
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewChange('week')}
                    className={viewType === 'week' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewChange('month')}
                    className={viewType === 'month' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    Month
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Events Sidebar */}
        <div className="space-y-6">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Events</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map(renderEventCard)}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No events scheduled for today</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map(renderEventCard)}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No upcoming events</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Events</span>
                  <span className="font-medium">{events?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today's Events</span>
                  <span className="font-medium">{todayEvents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming (7 days)</span>
                  <span className="font-medium">{upcomingEvents.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCalendar; 