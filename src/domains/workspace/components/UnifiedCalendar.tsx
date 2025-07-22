import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Calendar } from '@/shared/components/ui/Calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase';

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

  // Mock calendar events - in real implementation, this would come from calendar APIs
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Team Standup',
      description: 'Daily team sync meeting',
      startDate: new Date(2024, 0, 15, 9, 0),
      endDate: new Date(2024, 0, 15, 9, 15),
      allDay: false,
      location: 'Zoom',
      attendees: ['john@company.com', 'jane@company.com'],
      organizer: 'john@company.com',
      category: 'meeting',
      priority: 'high',
      source: 'microsoft',
      isRecurring: true,
      recurrencePattern: 'FREQ=DAILY',
      color: '#3b82f6',
      isPrivate: false,
      hasAttachments: false,
      meetingUrl: 'https://zoom.us/j/123456789'
    },
    {
      id: '2',
      title: 'Project Review',
      description: 'Quarterly project review with stakeholders',
      startDate: new Date(2024, 0, 15, 14, 0),
      endDate: new Date(2024, 0, 15, 15, 0),
      allDay: false,
      location: 'Conference Room A',
      attendees: ['stakeholder@company.com', 'manager@company.com'],
      organizer: 'manager@company.com',
      category: 'meeting',
      priority: 'medium',
      source: 'google',
      isRecurring: false,
      color: '#10b981',
      isPrivate: false,
      hasAttachments: true
    },
    {
      id: '3',
      title: 'Client Call',
      description: 'Follow-up call with new client',
      startDate: new Date(2024, 0, 15, 16, 30),
      endDate: new Date(2024, 0, 15, 17, 0),
      allDay: false,
      location: 'Phone',
      attendees: ['client@external.com'],
      organizer: 'sales@company.com',
      category: 'work',
      priority: 'high',
      source: 'outlook',
      isRecurring: false,
      color: '#f59e0b',
      isPrivate: true,
      hasAttachments: false
    }
  ];

  // Fetch calendar events from connected sources
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['calendar-events', selectedDate, filters],
    queryFn: async () => {
      // In real implementation, this would fetch from Microsoft Graph, Google Calendar, etc.
      // For now, return mock data
      return mockEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        return eventDate >= startOfDay && eventDate <= endOfDay;
      });
    },
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
    <Card key={event.id} className="mb-3 hover:shadow-md transition-shadow">
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
              <Badge variant="outline" className={`text-xs ${getPriorityColor(event.priority)}`}>
                {event.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {event.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {event.source}
              </Badge>
              {event.isRecurring && (
                <Badge variant="outline" className="text-xs">
                  🔄 Recurring
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-primary" />
            Unified Calendar
          </h1>
          <p className="text-muted-foreground mt-2">
            All your events from connected calendars in one place
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events..."
                className="px-3 py-1 text-sm border rounded-md"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPrivate"
                checked={filters.showPrivate}
                onChange={(e) => handleFilterChange('showPrivate', e.target.checked)}
              />
              <label htmlFor="showPrivate" className="text-sm">Show Private</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showRecurring"
                checked={filters.showRecurring}
                onChange={(e) => handleFilterChange('showRecurring', e.target.checked)}
              />
              <label htmlFor="showRecurring" className="text-sm">Show Recurring</label>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
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
                  <span className="text-sm text-muted-foreground">Today's Events:</span>
                  <span className="font-medium">{todayEvents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">This Week:</span>
                  <span className="font-medium">{upcomingEvents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">High Priority:</span>
                  <span className="font-medium">
                    {events?.filter(e => e.priority === 'high').length || 0}
                  </span>
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