import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, BarChart2, Calendar, Users } from 'lucide-react';

// Mock data for recent items
const recentItems = [
  { id: '1', type: 'document', name: 'Q2 Sales Report', time: '2 hours ago' },
  { id: '2', type: 'dashboard', name: 'Operations Overview', time: '1 day ago' },
  { id: '3', type: 'meeting', name: 'Team Sync', time: '2 days ago' },
  { id: '4', type: 'contact', name: 'Jane Doe', time: '3 days ago' },
];

const typeIcon = {
  document: <FileText className="h-5 w-5 text-primary" />,
  dashboard: <BarChart2 className="h-5 w-5 text-secondary" />,
  meeting: <Calendar className="h-5 w-5 text-success" />,
  contact: <Users className="h-5 w-5 text-info" />,
};

export const RecentsWidget: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
            >
              {typeIcon[item.type as keyof typeof typeIcon]}
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</div>
            </div>
          ))}
          {recentItems.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent items.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 