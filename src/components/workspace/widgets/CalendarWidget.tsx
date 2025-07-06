import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { googleWorkspaceService } from '@/lib/services/googleWorkspaceService';
import { Loader2, AlertCircle, Video, PlusCircle } from 'lucide-react';
import { useIntegrationProviders } from '@/hooks/useIntegrationProviders';
import { Calendar } from '@/components/ui/Calendar';

// Standardized event type
export type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  joinLink?: string;
  viewLink?: string;
  source: 'google' | 'microsoft';
};


const fetchAllCalendarEvents = async (
    timeMin: Date, 
    timeMax: Date,
    providers: ReturnType<typeof useIntegrationProviders>
): Promise<CalendarEvent[]> => {
    const promises: Promise<CalendarEvent[]>[] = [];

    if (providers.google.isConnected) {
        promises.push(
            googleWorkspaceService.getCalendarEvents(timeMin, timeMax).then((rawEvents: any[]) =>
                rawEvents.map((e) => ({
                    id: e.id,
                    title: e.summary,
                    startTime: e.start.dateTime || e.start.date,
                    endTime: e.end.dateTime || e.end.date,
                    joinLink: e.hangoutLink,
                    viewLink: e.htmlLink,
                    source: 'google'
                }))
            )
        );
    }

    const allEvents = await Promise.all(promises);
    return allEvents.flat().sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}


const EventsList: React.FC<{ selectedDate: Date }> = ({ selectedDate }) => {
  const providers = useIntegrationProviders();
  
  const formatEventTime = (startTime: string, endTime: string) => {
    const start = format(new Date(startTime), 'p');
    if (endTime) {
        const end = format(new Date(endTime), 'p');
        return `${start} - ${end}`;
    }
    return start;
  }

  const { data: events, isLoading, isError } = useQuery<CalendarEvent[], Error>({
    queryKey: ['calendarEvents', selectedDate.toDateString(), providers.google.isConnected],
    queryFn: () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      return fetchAllCalendarEvents(startOfDay, endOfDay, providers);
    },
    enabled: providers.google.isConnected,
  });

  // Mock events for development/demo
  const mockEvents: CalendarEvent[] = [
    {
      id: 'mock-1',
      title: 'Team Standup',
      startTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 9, 0).toISOString(),
      endTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 9, 30).toISOString(),
      joinLink: 'https://meet.google.com/mock-link',
      source: 'google'
    },
    {
      id: 'mock-2',
      title: 'Project Review',
      startTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 14, 0).toISOString(),
      endTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 15, 0).toISOString(),
      viewLink: 'https://calendar.google.com/mock-event',
      source: 'google'
    },
    {
      id: 'mock-3',
      title: 'Client Call',
      startTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 16, 30).toISOString(),
      endTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 17, 30).toISOString(),
      joinLink: 'https://zoom.us/mock-meeting',
      source: 'google'
    }
  ];

  if (providers.isLoading) {
      return (
        <div className="flex items-center gap-2">
            <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Checking connections...</span>
        </div>
      );
  }

  if (!providers.google.isConnected) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
            <CalendarIcon className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Connect a Calendar</h3>
            <p className="text-sm text-muted-foreground">See your meetings and events from Google.</p>
            <div className="flex gap-4">
                <Button onClick={providers.google.connect}>
                    Connect Google
                </Button>
            </div>
        </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Loading events...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Error loading events. Please try again.</span>
      </div>
    );
  }

  // Use real events if available, otherwise show mock events
  const displayEvents = events && events.length > 0 ? events : mockEvents;

  return (
    <div className="space-y-4">
      {displayEvents.map((event) => (
        <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className={`h-full w-1.5 rounded-full ${event.source === 'google' ? 'bg-primary' : 'bg-secondary'}`} />
          <div className="flex-1 cursor-pointer" onClick={() => event.viewLink && window.open(event.viewLink, '_blank')}>
            <p className="font-semibold text-sm">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatEventTime(event.startTime, event.endTime)}
            </p>
          </div>
          {event.joinLink && (
              <Button variant="ghost" size="sm" onClick={() => window.open(event.joinLink, '_blank')}>
                <Video className="h-4 w-4 mr-2" />
                Join
              </Button>
          )}
        </div>
      ))}
      {displayEvents.length === 0 && (
        <div className="text-center text-muted-foreground py-6">
          <CalendarIcon className="w-10 h-10 mx-auto mb-2" />
          <p className="text-sm font-semibold">No events today</p>
          <p className="text-xs">Enjoy your day or add a new event.</p>
        </div>
      )}
    </div>
  );
};

export const CalendarWidget: React.FC = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const providers = useIntegrationProviders();

  const handleAddEvent = () => {
      // Default to Google if both are connected, or use the one that is.
      const primaryProvider = providers.google.isConnected ? 'google' : 'microsoft';

      if (primaryProvider === 'google') {
          window.open('https://calendar.google.com/calendar/render?action=TEMPLATE', '_blank');
      } else {
          window.open('https://outlook.live.com/calendar/0/action/compose', '_blank');
      }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Your unified schedule across all connected accounts.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddEvent} disabled={!providers.google.isConnected}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Event
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <Calendar
            selected={date || new Date()}
            onSelect={setDate}
          />
        </div>
        <div className="flex-1 space-y-4 md:pl-6">
          <h3 className="text-lg font-semibold">
            Events for {date ? format(date, 'MMMM d') : 'today'}
          </h3>
          {date && <EventsList selectedDate={date} />}
        </div>
      </CardContent>
    </Card>
  );
}; 