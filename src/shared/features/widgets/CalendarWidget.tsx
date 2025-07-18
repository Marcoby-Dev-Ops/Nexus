import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Calendar, Clock, MapPin } from 'lucide-react';

export interface CalendarWidgetProps {
  className?: string;
}

/**
 * CalendarWidget
 * Displays calendar events for the workspace dashboard.
 */
const CalendarWidget: React.FC<CalendarWidgetProps> = ({ className = '' }) => {
  // Mock calendar events - in real implementation, this would come from calendar API
  const events = [
    {
      id: 1,
      title: 'Team Standup',
      time: '9:00 AM',
      duration: '15 min',
      location: 'Zoom',
      type: 'meeting'
    },
    {
      id: 2,
      title: 'Project Review',
      time: '2:00 PM',
      duration: '1 hour',
      location: 'Conference Room A',
      type: 'meeting'
    },
    {
      id: 3,
      title: 'Client Call',
      time: '4:30 PM',
      duration: '30 min',
      location: 'Phone',
      type: 'call'
    }
  ];

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-foreground mb-1">
                  {event.title}
                </h4>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{event.time} • {event.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                event.type === 'meeting' ? 'bg-primary' : 'bg-secondary'
              }`} />
            </div>
          </div>
        ))}
        
        <div className="text-center pt-2">
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            View full calendar
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export { CalendarWidget };
export default CalendarWidget; 