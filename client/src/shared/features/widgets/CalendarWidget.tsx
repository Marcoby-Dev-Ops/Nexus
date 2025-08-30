import React, { useState, useEffect } from 'react';
import { Calendar, CalendarContent, CalendarHeader, CalendarTitle } from '@/shared/components/ui/Calendar';
import { Badge } from '@/shared/components/ui/Badge';
import { selectData } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'deadline' | 'reminder' | 'task';
  description?: string;
}

interface CalendarWidgetProps {
  className?: string;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ className = '' }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch calendar events from the database
      const { data, error } = await selectData('calendar_events', '*');
      
      if (error) {
        logger.error({ error }, 'Failed to fetch calendar events');
        return;
      }

      // Transform the data to match our interface
      const transformedEvents: CalendarEvent[] = (data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        type: event.type || 'reminder',
        description: event.description
      }));

      setEvents(transformedEvents);
    } catch (error) {
      logger.error({ error }, 'Error fetching calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500';
      case 'deadline':
        return 'bg-red-500';
      case 'reminder':
        return 'bg-yellow-500';
      case 'task':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <CalendarHeader>
        <CalendarTitle>Calendar</CalendarTitle>
      </CalendarHeader>
      <CalendarContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
        />
        
        {selectedDate && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">
              Events for {selectedDate.toLocaleDateString()}
            </h4>
            <div className="space-y-2">
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-sm text-muted-foreground">No events scheduled</p>
              ) : (
                getEventsForDate(selectedDate).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{event.title}</div>
                      {event.description && (
                        <div className="text-xs text-muted-foreground">{event.description}</div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CalendarContent>
    </div>
  );
}; 
