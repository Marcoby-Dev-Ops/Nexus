import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Calendar } from '@/shared/components/ui/Calendar';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/Dialog';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Switch } from '@/shared/components/ui/Switch';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Video,
  Phone,
  Star,
  AlertTriangle,
  Info,
  Sparkles,
  Target,
  Lightbulb,
  Map,
  Play
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { CalendarService } from '@/services/business';
import { thoughtsService } from '@/lib/services/thoughtsService';
import { useAuth } from '@/hooks/index';
import { useToast } from '@/shared/components/ui/use-toast';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isTomorrow, isYesterday } from 'date-fns';
import { getUserTimezone, formatInUserTimezone, isTodayInUserTimezone, isTomorrowInUserTimezone, isYesterdayInUserTimezone } from '@/shared/utils/timezone';

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

interface CreateEventData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  attendees?: string[];
  category: 'meeting' | 'task' | 'reminder' | 'personal' | 'work';
  priority: 'high' | 'medium' | 'low';
  isPrivate: boolean;
}

interface CreateThoughtData {
  content: string;
  firePhase: 'focus' | 'insight' | 'roadmap' | 'execute';
  category: string;
  priority: 'low' | 'medium' | 'high';
  sourceEventId?: string;
  sourceEventTitle?: string;
  sourceEventDate?: string;
}

// Fire Cycle phase configuration
const FIRE_PHASES = [
  { id: 'focus', label: 'Focus', description: 'Clarifying the core idea or goal', icon: Target },
  { id: 'insight', label: 'Insight', description: 'Gaining deeper understanding and context', icon: Lightbulb },
  { id: 'roadmap', label: 'Roadmap', description: 'Planning the path forward', icon: Map },
  { id: 'execute', label: 'Execute', description: 'Taking action and implementing', icon: Play }
];

const UnifiedCalendar: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const calendarService = new CalendarService();
  
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
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  
  // Fire Cycle thought creation state
  const [isCreateThoughtOpen, setIsCreateThoughtOpen] = useState(false);
  const [selectedEventForThought, setSelectedEventForThought] = useState<CalendarEvent | null>(null);
  const [isCreatingThought, setIsCreatingThought] = useState(false);

  // Check if user has any calendar integrations connected
  const { data: integrations, isLoading: integrationsLoading, error: integrationsError } = useQuery({
    queryKey: ['calendar-integrations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch integrations individually to avoid .in() issues with REST API
      const integrationNames = ['Microsoft 365', 'Google Workspace', 'Outlook', 'Gmail'];
      const integrationPromises = integrationNames.map(name => 
        supabase
          .from('user_integrations')
          .select('id, status, integration_name')
          .eq('user_id', user.id)
          .eq('integration_name', name)
          .eq('status', 'connected')
      );

      const results = await Promise.all(integrationPromises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to fetch integrations: ${errors[0].error?.message}`);
      }

      const data = results.flatMap(result => result.data || []);

      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch calendar events from connected sources
  const { data: events, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['calendar-events', selectedDate, filters, user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        // Use the calendar service to fetch real events
        const startDate = new Date(selectedDate);
        startDate.setMonth(startDate.getMonth() - 1); // Get events from 1 month ago
        
        const endDate = new Date(selectedDate);
        endDate.setMonth(endDate.getMonth() + 1); // Get events up to 1 month ahead

        const result = await calendarService.getEvents({
          startDate,
          endDate,
          ...filters
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch events');
        }

        return result.data || [];
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    },
    enabled: !!user && (integrations?.length || 0) > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      const result = await calendarService.createEvent({
        ...eventData,
        source: 'custom' as const,
        isRecurring: false,
        hasAttachments: false,
        organizer: user?.email || 'Unknown',
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create event');
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setIsCreateEventOpen(false);
      toast({
        title: 'Event created',
        description: 'Your event has been successfully created.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create event',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Create thought mutation
  const createThoughtMutation = useMutation({
    mutationFn: async (thoughtData: CreateThoughtData) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const result = await thoughtsService.createThought({
        user_id: user.id,
        content: thoughtData.content,
        category: thoughtData.category,
        status: 'concept',
        personal_or_professional: 'professional',
        mainsubcategories: [thoughtData.firePhase],
        initiative: false,
        impact: 'medium',
        parent_idea_id: null,
        workflow_stage: 'create_idea',
        department: null,
        priority: thoughtData.priority,
        estimated_effort: null,
        ai_clarification_data: {
          sourceEventId: thoughtData.sourceEventId,
          sourceEventTitle: thoughtData.sourceEventTitle,
          sourceEventDate: thoughtData.sourceEventDate,
          firePhase: thoughtData.firePhase,
          createdFromCalendar: true
        },
        aiinsights: {},
        interaction_method: 'calendar_integration',
        company_id: user.company_id || null,
        tags: [thoughtData.firePhase, 'calendar-generated'],
        attachments: [],
        visibility: 'private',
        collaboration_status: 'individual',
        review_status: 'pending',
        approval_status: 'pending',
        implementation_notes: null,
        success_metrics: null,
        risk_assessment: null,
        cost_estimate: null,
        timeline_estimate: null,
        stakeholder_analysis: null,
        resource_requirements: null,
        dependencies: [],
        related_thoughts: [],
        version: 1,
        createdat: new Date(),
        updatedat: new Date(),
        creationdate: new Date(),
        lastupdated: new Date(),
        createdby: user.id,
        updatedby: user.id
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create thought');
      }

      return result.data;
    },
    onSuccess: () => {
      setIsCreateThoughtOpen(false);
      setSelectedEventForThought(null);
      toast({
        title: 'Thought created successfully',
        description: 'Your thought has been created in the Fire Cycle system.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create thought',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Get events for the selected date
  const getEventsForDate = useCallback((date: Date) => {
    if (!events) return [];
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return isSameDay(eventDate, date);
    });
  }, [events]);

  // Get today's events
  const todayEvents = useMemo(() => getEventsForDate(new Date()), [getEventsForDate]);

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    if (!events) return [];
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= today && eventDate <= nextWeek;
    });
  }, [events]);

  // Get events for current week view
  const weekEvents = useMemo(() => {
    if (viewType !== 'week' || !events) return [];
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  }, [events, viewType, selectedDate]);

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

  const handleCreateEvent = (eventData: CreateEventData) => {
    createEventMutation.mutate(eventData);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  // Fire Cycle thought creation handlers
  const handleCreateThoughtFromEvent = (event: CalendarEvent) => {
    setSelectedEventForThought(event);
    setIsCreateThoughtOpen(true);
  };

  const handleCreateThought = async (thoughtData: CreateThoughtData) => {
    setIsCreatingThought(true);
    try {
      await createThoughtMutation.mutateAsync(thoughtData);
    } finally {
      setIsCreatingThought(false);
    }
  };

  const handleRefresh = () => {
    refetchEvents();
    toast({
      title: 'Calendar refreshed',
      description: 'Your calendar has been updated.',
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'next' 
      ? addDays(selectedDate, viewType === 'week' ? 7 : 1)
      : subDays(selectedDate, viewType === 'week' ? 7 : 1);
    setSelectedDate(newDate);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'task': return <Clock className="w-4 h-4" />;
      case 'reminder': return <AlertTriangle className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getMeetingIcon = (event: CalendarEvent) => {
    if (event.meetingUrl) {
      return <Video className="w-4 h-4 text-blue-600" />;
    }
    if (event.location?.toLowerCase().includes('call') || event.location?.toLowerCase().includes('phone')) {
      return <Phone className="w-4 h-4 text-green-600" />;
    }
    return null;
  };

  const renderEventCard = (event: CalendarEvent, compact = false) => (
    <Card 
      key={event.id} 
      className={`mb-3 hover:shadow-md transition-shadow cursor-pointer ${
        compact ? 'p-2' : ''
      }`}
      onClick={() => handleEventClick(event)}
    >
      <CardContent className={compact ? 'p-2' : 'p-4'}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: event.color || '#6b7280' }}
              />
              <h4 className={`font-medium ${compact ? 'text-sm' : 'text-base'} truncate`}>
                {event.title}
              </h4>
              {event.isPrivate && <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
              {event.hasAttachments && <Badge variant="secondary" className="text-xs">📎</Badge>}
              {getMeetingIcon(event)}
            </div>
            
            {!compact && event.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {event.allDay ? 'All day' : (
                    `${formatInUserTimezone(new Date(event.startDate), 'HH:mm', userTimezone)} - ${formatInUserTimezone(new Date(event.endDate), 'HH:mm', userTimezone)}`
                  )}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</span>
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
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Create Thought Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateThoughtFromEvent(event);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
              title="Create Fire Cycle thought from this event"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            
            {event.meetingUrl && (
              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline">
                  Join
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDate(day);
          return (
            <div key={day.toISOString()} className="min-h-[120px] p-2 border rounded-lg">
              <div className={`text-sm font-medium mb-2 ${
                isTodayInUserTimezone(day, userTimezone) ? 'text-blue-600 font-bold' : 
                isTomorrowInUserTimezone(day, userTimezone) ? 'text-green-600' : 
                isYesterdayInUserTimezone(day, userTimezone) ? 'text-gray-500' : 'text-gray-700'
              }`}>
                {format(day, 'EEE')}
                <div className="text-xs text-gray-500">{format(day, 'MMM d')}</div>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200 truncate"
                    onClick={() => handleEventClick(event)}
                    title={event.title}
                  >
                    {formatInUserTimezone(new Date(event.startDate), 'HH:mm', userTimezone)} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Show connection status
  const hasConnectedIntegrations = integrations && integrations.length > 0;
  const isLoading = integrationsLoading || eventsLoading;
  const hasError = integrationsError || eventsError;

  return (
    <div className="space-y-6">
      {/* Header with navigation and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-2xl font-bold">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <CreateEventForm onSubmit={handleCreateEvent} isLoading={createEventMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

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

      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading calendar: {hasError instanceof Error ? hasError.message : 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              {viewType === 'week' ? (
                renderWeekView()
              ) : (
                <Calendar
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="w-full"
                />
              )}
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
                  {todayEvents.map(event => renderEventCard(event, true))}
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
                  {upcomingEvents.slice(0, 5).map(event => renderEventCard(event, true))}
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
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">High Priority</span>
                  <span className="font-medium">
                    {events?.filter(e => e.priority === 'high').length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date & Time</Label>
                  <p className="text-sm">
                    {selectedEvent.allDay ? 'All day' : (
                      `${formatInUserTimezone(new Date(selectedEvent.startDate), 'PPP p', userTimezone)} - ${formatInUserTimezone(new Date(selectedEvent.endDate), 'p', userTimezone)}`
                    )}
                  </p>
                </div>
                
                {selectedEvent.location && (
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm">{selectedEvent.location}</p>
                  </div>
                )}
                
                <div>
                  <Label>Organizer</Label>
                  <p className="text-sm">{selectedEvent.organizer}</p>
                </div>
                
                <div>
                  <Label>Priority</Label>
                  <Badge className={getPriorityColor(selectedEvent.priority)}>
                    {selectedEvent.priority}
                  </Badge>
                </div>
              </div>
              
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <Label>Attendees</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedEvent.attendees.map((attendee, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {attendee}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                {selectedEvent.meetingUrl && (
                  <Button asChild className="flex-1">
                    <a href={selectedEvent.meetingUrl} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-2" />
                      Join Meeting
                    </a>
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEventDetailsOpen(false);
                    handleCreateThoughtFromEvent(selectedEvent);
                  }}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Thought
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Thought Dialog */}
      <Dialog open={isCreateThoughtOpen} onOpenChange={setIsCreateThoughtOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Fire Cycle Thought from Event</DialogTitle>
          </DialogHeader>
          {selectedEventForThought && (
            <CreateThoughtForm
              event={selectedEventForThought}
              onSubmit={handleCreateThought}
              onCancel={() => {
                setIsCreateThoughtOpen(false);
                setSelectedEventForThought(null);
              }}
              isLoading={isCreatingThought}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create Event Form Component
interface CreateEventFormProps {
  onSubmit: (data: CreateEventData) => void;
  isLoading: boolean;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    allDay: false,
    location: '',
    attendees: [],
    category: 'meeting',
    priority: 'medium',
    isPrivate: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={format(formData.startDate, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={format(formData.endDate, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="work">Work</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Meeting room, address, or virtual meeting link"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="allDay"
          checked={formData.allDay}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allDay: checked }))}
        />
        <Label htmlFor="allDay">All day event</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isPrivate"
          checked={formData.isPrivate}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
        />
        <Label htmlFor="isPrivate">Private event</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.title}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Create Event
        </Button>
      </div>
    </form>
  );
};

// Create Thought Form Component
interface CreateThoughtFormProps {
  event: CalendarEvent;
  onSubmit: (data: CreateThoughtData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CreateThoughtForm: React.FC<CreateThoughtFormProps> = ({ event, onSubmit, onCancel, isLoading }) => {
  const [content, setContent] = useState('');
  const [firePhase, setFirePhase] = useState<'focus' | 'insight' | 'roadmap' | 'execute'>('focus');
  const [category, setCategory] = useState('idea');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Initialize content with event details
  React.useEffect(() => {
    const eventContent = [
      event.title && `Event: ${event.title}`,
      event.description && `Description: ${event.description}`,
      event.location && `Location: ${event.location}`,
              `Date: ${formatInUserTimezone(new Date(event.startDate), 'PPP p', userTimezone)}`,
      event.attendees && event.attendees.length > 0 && `Attendees: ${event.attendees.join(', ')}`
    ].filter(Boolean).join('\n\n');
    
    setContent(eventContent);
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit({
        content: content.trim(),
        firePhase,
        category,
        priority,
        sourceEventId: event.id,
        sourceEventTitle: event.title,
        sourceEventDate: formatInUserTimezone(new Date(event.startDate), 'PPP p', userTimezone)
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fire-phase">FIRE Phase *</Label>
          <Select value={firePhase} onValueChange={(value) => setFirePhase(value as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIRE_PHASES.map((phase) => {
                const IconComponent = phase.icon;
                return (
                  <SelectItem key={phase.id} value={phase.id}>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{phase.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {FIRE_PHASES.find(p => p.id === firePhase)?.description}
          </p>
        </div>
        
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="reminder">Reminder</SelectItem>
            <SelectItem value="update">Update</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="content">Thought Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your thought, idea, or action item..."
          className="mt-1 min-h-[120px]"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          This content will be used to create a structured thought in the Fire Cycle system.
        </p>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !content.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Create Thought
        </Button>
      </div>
    </form>
  );
};

export default UnifiedCalendar; 
