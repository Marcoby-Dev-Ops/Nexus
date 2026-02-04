import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface BrainTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface BrainTicketFeedProps {
  brainTickets: BrainTicket[];
}

export function BrainTicketFeed({ brainTickets }: BrainTicketFeedProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Active Brain Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {brainTickets.length > 0 ? (
            brainTickets
              .filter(ticket => ticket.status !== 'new')
              .slice(0, 3)
              .map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {getStatusIcon(ticket.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">{ticket.priority} priority</p>
                  </div>
                </motion.div>
              ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active brain tickets
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
