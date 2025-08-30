import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IntegrationService } from '../services/IntegrationService';
import type { Integration, IntegrationEvent } from '../types/integration';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { ArrowLeft, Settings, Activity, FileText, Trash2, Play, Pause } from 'lucide-react';

export const IntegrationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service] = useState(() => new IntegrationService());

  useEffect(() => {
    if (id) {
      loadIntegration();
    }
  }, [id]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      setError(null);
      const [integrationData, eventsData, logsData] = await Promise.all([
        service.getIntegration(id!),
        service.getIntegrationEvents(id!),
        service.getIntegrationLogs(id!),
      ]);
      setIntegration(integrationData);
      setEvents(eventsData);
      setLogs(logsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integration');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!integration) return;
    try {
      const result = await service.testIntegration(integration.id);
      alert(`Test result: ${result.success ? 'Success' : 'Failed'} - ${result.message}`);
    } catch (error) {
      // Error logging removed for production
    }
  };

  const handleToggleStatus = async () => {
    if (!integration) return;
    try {
      let updatedIntegration;
      if (integration.status === 'active') {
        updatedIntegration = await service.deactivateIntegration(integration.id);
      } else {
        updatedIntegration = await service.activateIntegration(integration.id);
      }
      setIntegration(updatedIntegration);
    } catch (error) {
      // Error logging removed for production
    }
  };

  const handleDelete = async () => {
    if (!integration) return;
    if (window.confirm(`Are you sure you want to delete "${integration.name}"?`)) {
      try {
        await service.deleteIntegration(integration.id);
        navigate('/integrations');
      } catch (error) {
        // Error logging removed for production
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading integration...</div>
        </div>
      </div>
    );
  }

  if (error || !integration) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error || 'Integration not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/integrations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{integration.name}</h1>
            <p className="text-gray-600">{integration.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTest}>
            <Play className="w-4 h-4 mr-2" />
            Test
          </Button>
          <Button
            variant={integration.status === 'active' ? 'outline' : 'default'}
            onClick={handleToggleStatus}
          >
            {integration.status === 'active' ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
          {integration.status}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Provider:</span>
                  <span>{integration.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Type:</span>
                  <span>{integration.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Category:</span>
                  <span>{integration.metadata.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Version:</span>
                  <span>{integration.metadata.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{new Date(integration.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span>{new Date(integration.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {integration.metadata.tags.length > 0 && (
                    <div>
                      <span className="font-medium">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {integration.metadata.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {integration.metadata.documentation && (
                    <div>
                      <span className="font-medium">Documentation:</span>
                      <a
                        href={integration.metadata.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-2"
                      >
                        View Docs
                      </a>
                    </div>
                  )}
                  {integration.metadata.supportUrl && (
                    <div>
                      <span className="font-medium">Support:</span>
                      <a
                        href={integration.metadata.supportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-2"
                      >
                        Get Support
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(integration.config, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-gray-500">No events found</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="border-b pb-2 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{event.type}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={event.status === 'success' ? 'default' : 'destructive'}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs found</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="border-b pb-2 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{log.level}</div>
                          <div className="text-sm text-gray-600">{log.message}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
