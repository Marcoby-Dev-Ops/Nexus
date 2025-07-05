import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar } from '@/components/ui/Calendar';
import { Badge } from '@/components/ui/Badge';
import { googleWorkspaceService } from '@/lib/services/googleWorkspaceService';
import { Loader2, AlertCircle } from 'lucide-react';

const googleService = googleWorkspaceService;

const EventsList: React.FC<{ selectedDate: Date }> = ({ selectedDate }) => {
  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ['calendarEvents', selectedDate.toDateString()],
    queryFn: () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      return googleService.getCalendarEvents(startOfDay, endOfDay);
    },
    enabled: googleService.isAuthenticated(),
  });

  if (!googleService.isAuthenticated()) {
    return <p className="text-sm text-muted-foreground">Connect your Google account to see events.</p>;
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
      <div className="flex items-center gap-2 text-red-500">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Error loading events.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events?.map((event: any) => (
        <div key={event.id} className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <div className="flex-1">
            <p className="font-medium text-sm">{event.summary}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(event.start.dateTime || event.start.date), 'p')}
            </p>
          </div>
          <Badge variant="secondary">Join</Badge>
        </div>
      ))}
      {events?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No events scheduled for this day.
        </p>
      )}
    </div>
  );
};

export const CalendarWidget: React.FC = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            Events for {date ? format(date, 'MMMM d') : 'today'}
          </h3>
          {date && <EventsList selectedDate={date} />}
        </div>
      </CardContent>
    </Card>
  );
}; 