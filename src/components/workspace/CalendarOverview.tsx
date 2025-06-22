import React, { useEffect, useState } from 'react';
import { CalendarDays, Video, ExternalLink } from 'lucide-react';
import { microsoftTeamsService } from '@/lib/services/microsoftTeamsService';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  isOnlineMeeting?: boolean;
  onlineMeetingUrl?: string;
  location?: { displayName?: string };
  organizer?: { emailAddress?: { name?: string } };
}

export const CalendarOverview: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!microsoftTeamsService.isConnected()) {
        setLoading(false);
        return;
      }
      try {
        const data = await microsoftTeamsService.getUpcomingEvents();
        setEvents(data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!microsoftTeamsService.isConnected()) {
    const providers = [
      { id: 'm365', label: 'Microsoft 365', connect: () => window.location.href = microsoftTeamsService.initiateAuth(), available: true },
      { id: 'gmail', label: 'Gmail / Google Workspace', available: false },
      { id: 'yahoo', label: 'Yahoo Mail', available: false },
      { id: 'imap', label: 'Generic IMAP / POP3', available: false },
      { id: 'public', label: 'Public iCal URL', available: false },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Connect a Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Link your calendar account to display upcoming events. Microsoft 365 is available today; other providers are coming soon.
          </p>

          <div className="space-y-2">
            {providers.map((p) => (
              <Button
                key={p.id}
                variant={p.available ? 'default' : 'outline'}
                disabled={!p.available}
                onClick={p.available ? p.connect : undefined}
                className="w-full justify-start"
              >
                {p.label}
                {!p.available && <span className="ml-auto text-xs text-muted-foreground">Soon</span>}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Upcoming Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming events found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Upcoming Meetings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {events.map((evt) => {
            const startDate = new Date(evt.start.dateTime);
            const endDate = new Date(evt.end.dateTime);
            return (
              <li key={evt.id} className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium leading-none line-clamp-1 max-w-[220px]">
                    {evt.subject || 'Untitled'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {startDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} –{' '}
                    {endDate.toLocaleTimeString([], { timeStyle: 'short' })}
                  </p>
                  {evt.location?.displayName && (
                    <p className="text-xs text-muted-foreground">{evt.location.displayName}</p>
                  )}
                </div>
                {evt.isOnlineMeeting && evt.onlineMeetingUrl && (
                  <a href={evt.onlineMeetingUrl} target="_blank" rel="noreferrer">
                    <Button size="icon" variant="ghost" className="shrink-0">
                      <Video className="w-4 h-4" />
                      <span className="sr-only">Join meeting</span>
                    </Button>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}; 