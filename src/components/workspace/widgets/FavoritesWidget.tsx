import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LayoutGrid, Calendar, FileText, Users, BarChart2, MessageSquare } from 'lucide-react';

// Mock data for favorite apps/items
const favoriteApps = [
  { name: 'Dashboard', icon: <LayoutGrid className="h-5 w-5" /> },
  { name: 'Calendar', icon: <Calendar className="h-5 w-5" /> },
  { name: 'Documents', icon: <FileText className="h-5 w-5" /> },
  { name: 'Contacts', icon: <Users className="h-5 w-5" /> },
  { name: 'Analytics', icon: <BarChart2 className="h-5 w-5" /> },
  { name: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
];

export const FavoritesWidget: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Favorites</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {favoriteApps.map((app) => (
            <div
              key={app.name}
              className="flex flex-col items-center justify-center p-3 rounded-md bg-muted/50 hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                {app.icon}
              </div>
              <p className="font-medium text-xs text-center">{app.name}</p>
            </div>
          ))}
          {favoriteApps.length === 0 && (
            <p className="text-sm text-muted-foreground">No favorites yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 