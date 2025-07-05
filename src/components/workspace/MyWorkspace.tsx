import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Settings, 
  FileText, 
  Users, 
  BarChart2, 
  Calendar, 
  Briefcase, 
  Mail, 
  MessageSquare, 
  Search,
  Loader2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

/**
 * MyWorkspace - User's personal workspace 
 * 
 * Shows favorites, recent items, and quick access to features
 */
export const MyWorkspace: React.FC = () => {
  const navigate = useNavigate();

  // Mock recent items data
  const recentItems = [
    { type: 'document', name: 'Q2 Sales Report', path: '/documents/sales-q2', time: '2 hours ago' },
    { type: 'dashboard', name: 'Operations Overview', path: '/operations', time: '1 day ago' },
    { type: 'meeting', name: 'Team Sync', path: '/calendar/events/123', time: '2 days ago' },
  ];

  // Mock favorite apps
  const favoriteApps = [
    { name: 'Dashboard', icon: <LayoutGrid className="h-5 w-5" />, path: '/dashboard' },
    { name: 'Calendar', icon: <Calendar className="h-5 w-5" />, path: '/calendar' },
    { name: 'Documents', icon: <FileText className="h-5 w-5" />, path: '/documents' },
    { name: 'Contacts', icon: <Users className="h-5 w-5" />, path: '/contacts' },
    { name: 'Analytics', icon: <BarChart2 className="h-5 w-5" />, path: '/analytics' },
    { name: 'Messages', icon: <MessageSquare className="h-5 w-5" />, path: '/messages' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Workspace</h1>
          <p className="text-muted-foreground">Your personalized workspace</p>
        </div>
        <Button onClick={() => navigate('/settings')}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across your workspace..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Favorites */}
      <div>
        <h2 className="text-lg font-medium mb-3">Favorites</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {favoriteApps.map((app) => (
            <Card 
              key={app.name} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(app.path)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                  {app.icon}
                </div>
                <p className="font-medium">{app.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Items */}
      <div>
        <h2 className="text-lg font-medium mb-3">Recent Items</h2>
        <Card>
          <CardContent className="p-4 divide-y divide-border">
            {recentItems.map((item) => (
              <div
                key={item.name}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 px-2 rounded-md -mx-2"
                onClick={() => navigate(item.path)}
              >
                <div className="flex items-center">
                  {item.type === 'document' && <FileText className="h-5 w-5 mr-3 text-primary" />}
                  {item.type === 'dashboard' && <BarChart2 className="h-5 w-5 mr-3 text-secondary" />}
                  {item.type === 'meeting' && <Calendar className="h-5 w-5 mr-3 text-success" />}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{item.time}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'New Document', icon: <FileText className="h-5 w-5" />, action: () => navigate('/documents/new') },
            { name: 'Send Message', icon: <Mail className="h-5 w-5" />, action: () => navigate('/messages/new') },
            { name: 'Schedule Meeting', icon: <Calendar className="h-5 w-5" />, action: () => navigate('/calendar/new') },
            { name: 'Add Contact', icon: <Users className="h-5 w-5" />, action: () => navigate('/contacts/new') },
          ].map((action) => (
            <Card
              key={action.name}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={action.action}
            >
              <CardContent className="p-4 flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                  {action.icon}
                </div>
                <p className="font-medium">{action.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Productivity Suite Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Calendar Widget */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Loading your events...</span>
            </div>
            <p className="text-sm text-muted-foreground">Your meetings, events, and deadlines from Google, Outlook, and more will appear here. Join, add, or view events in real time.</p>
          </CardContent>
        </Card>
        {/* Email Widget */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Email / Inbox</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Loading your inbox...</span>
            </div>
            <p className="text-sm text-muted-foreground">Recent emails and messages from Gmail, Outlook, and more. Quick actions: reply, mark as read, open in inbox.</p>
          </CardContent>
        </Card>
        {/* Files Widget */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Loading your files...</span>
            </div>
            <p className="text-sm text-muted-foreground">Browse, search, and open files from Google Drive, OneDrive, and your device. Unified search and quick actions.</p>
          </CardContent>
        </Card>
        {/* Tasks Widget */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tasks & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Loading your tasks...</span>
            </div>
            <p className="text-sm text-muted-foreground">Manage your tasks and notes, synced with Google Tasks, Microsoft To Do, and local notes. AI-powered prioritization coming soon.</p>
          </CardContent>
        </Card>
        {/* AI Productivity Panel */}
        <Card className="col-span-1 xl:col-span-2">
          <CardHeader>
            <CardTitle>AI Productivity Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Preparing your productivity insights...</span>
            </div>
            <p className="text-sm text-muted-foreground">AI will summarize your day, suggest next actions, and provide proactive alerts here. Stay tuned for actionable insights!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 