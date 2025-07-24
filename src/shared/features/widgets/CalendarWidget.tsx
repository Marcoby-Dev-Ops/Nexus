import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Calendar, AlertCircle, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/core/auth/AuthProvider';

interface CalendarWidgetProps {
  className?: string;
}

/**
 * CalendarWidget
 * Displays calendar events for the workspace dashboard.
 */
const CalendarWidget: React.FC<CalendarWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();

  // Check if user has any calendar integrations connected
  const { isLoading } = useQuery({
    queryKey: ['calendar-integrations-widget', user?.id],
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

  const hasConnectedIntegrations = integrations && integrations.length > 0;

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : !hasConnectedIntegrations ? (
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No calendar integrations connected
              </AlertDescription>
            </Alert>
            <Button size="sm" variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Connect Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Connected to {integrations.length} calendar source{integrations.length > 1 ? 's' : ''}
            </div>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                View your calendar events in the full calendar view
              </p>
            </div>
            <Button size="sm" variant="outline" className="w-full">
              View Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarWidget; 