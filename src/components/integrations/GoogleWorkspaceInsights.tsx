import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { GoogleWorkspaceService, type GoogleWorkspaceIntegrationData } from '@/services/integrations/google-workspace';

export function GoogleWorkspaceInsights() {
  const { user } = useAuth();
  const [data, setData] = useState<GoogleWorkspaceIntegrationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const googleWorkspaceService = new GoogleWorkspaceService();

  useEffect(() => {
    if (user?.id) {
      loadGoogleWorkspaceData();
    }
  }, [user?.id]);

  const loadGoogleWorkspaceData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await googleWorkspaceService.getGoogleWorkspaceData(user.id);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load Google Workspace data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading Google Workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    setSyncProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await googleWorkspaceService.syncGoogleWorkspaceDataWithIntelligence(user.id);
      
      clearInterval(progressInterval);
      setSyncProgress(100);

      if (result.success && result.data) {
        // Reload data after successful sync
        await loadGoogleWorkspaceData();
      } else {
        setError(result.error || 'Failed to sync Google Workspace data');
      }
    } catch (err) {
      setError('An unexpected error occurred during sync');
      console.error('Error syncing Google Workspace data:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setSyncProgress(0), 1000);
    }
  };

  const getConnectionStatus = async () => {
    if (!user?.id) return;

    try {
      const result = await googleWorkspaceService.getConnectionStatus(user.id);
      if (result.success && result.data) {
        return result.data;
      }
    } catch (err) {
      console.error('Error getting connection status:', err);
    }
    return { connected: false, status: 'unknown' };
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Workspace Insights</CardTitle>
          <CardDescription>Loading your Google Workspace data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={syncProgress} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Workspace Insights</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadGoogleWorkspaceData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Google Workspace Insights</CardTitle>
            <CardDescription>
              Your Google Workspace integration data and analytics
              {data?.lastSync && (
                <span className="block text-sm text-muted-foreground mt-1">
                  Last synced: {new Date(data.lastSync).toLocaleString()}
                </span>
              )}
            </CardDescription>
          </div>
          <Button 
            onClick={syncData} 
            disabled={loading}
            className="ml-4"
          >
            {loading ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
        {loading && syncProgress > 0 && (
          <Progress value={syncProgress} className="w-full mt-4" />
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data?.users.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data?.groups.length || 0}</div>
                <div className="text-sm text-muted-foreground">Groups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data?.driveFiles.length || 0}</div>
                <div className="text-sm text-muted-foreground">Drive Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data?.calendarEvents.length || 0}</div>
                <div className="text-sm text-muted-foreground">Calendar Events</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              {data?.driveFiles.slice(0, 5).map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="secondary">{file.mimeType}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="space-y-4">
              {data?.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.name.fullName}</div>
                    <div className="text-sm text-muted-foreground">{user.primaryEmail}</div>
                    {user.organizations.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {user.organizations[0].title} • {user.organizations[0].department}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {user.isAdmin && <Badge variant="default">Admin</Badge>}
                    {user.suspended && <Badge variant="destructive">Suspended</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <div className="space-y-4">
              {data?.groups.map((group) => (
                <div key={group.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{group.name}</div>
                    <Badge variant="secondary">{group.directMembersCount} members</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{group.email}</div>
                  {group.description && (
                    <div className="text-sm text-muted-foreground">{group.description}</div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div className="space-y-4">
              {data?.driveFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Size: {file.size} bytes • Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                    </div>
                    {file.owners.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Owner: {file.owners[0].displayName}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{file.mimeType}</Badge>
                    {file.webViewLink && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
