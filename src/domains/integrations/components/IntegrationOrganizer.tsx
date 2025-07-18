import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useToast } from '@/shared/components/ui/Toast';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { useIntegrations } from '@/domains/hooks/useIntegrations';
import { supabase } from '../../lib/core/supabase';
import type { Database } from '@/shared/types/database.types';
import {
  Clock,
  XCircle,
  Brain,
  FileText,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

// Integration from useIntegrations hook
interface Integration {
  id: string;
  type: string;
  credentials: Record<string, unknown>;
  settings: Record<string, unknown>;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional display properties
  name?: string;
  category?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'error' | 'setup';
  last_sync?: string | null;
}

// Define the IntegrationInsight type
interface IntegrationInsight {
  id: string;
  content: string;
  type: string;
  importance: 'low' | 'medium' | 'high';
  created_at: string;
}

// Define the IntegrationConnection type
interface IntegrationConnection {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  strength?: number;
  metadata?: Record<string, unknown>;
}

// Define the IntegrationData type
interface IntegrationData {
  id: string;
  name: string;
  type: string;
  connections: IntegrationConnection[];
  insights: IntegrationInsight[];
  metadata?: Record<string, unknown>;
}

// type DatabaseIntegration = Database['public']['Tables']['integrations']['Row'];

export const IntegrationOrganizer: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { 
    integrations, 
    isLoading, 
    error, 
    addIntegration, 
    removeIntegration, 
    updateIntegration, 
    refreshIntegrations 
  } = useIntegrations();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'mindmap' | 'timeline'>('list');

  useEffect(() => {
    refreshIntegrations();
  }, [refreshIntegrations]);

  // const handleConnect = async (integrationId: string) => {
  //   if (!user?.id) {
  //     toast.error('You must be logged in to connect integrations');
  //     return;
  //   }

  //   try {
  //     const { data: integration, error } = await supabase
  //       .from('integrations')
  //       .select('*')
  //       .eq('id', integrationId)
  //       .single();

  //     if (error) throw error;

  //     const newIntegration = {
  //       integration_id: integration.id,
  //       type: integration.auth_type || 'oauth',
  //       name: integration.name,
  //       category: integration.category,
  //       description: integration.description || '',
  //       status: 'setup',
  //       credentials: {},
  //       settings: (integration.default_config as Record<string, unknown>) || {},
  //       userId: user.id
  //     };

  //     await addIntegration(newIntegration);
  //     toast.success('Integration connected successfully');
  //   } catch (error) {
  //     console.error('Error connecting integration:', error);
  //     toast.error('Failed to connect integration');
  //   }
  // };

  const handleDisconnect = async (integrationId: string) => {
    try {
      await removeIntegration(integrationId);
      toast.success('Integration disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      toast.error('Failed to disconnect integration');
    }
  };

  const handleUpdateSettings = async (integrationId: string, settings: Record<string, unknown>) => {
    try {
      const integration = integrations.find((i: Integration) => i.id === integrationId);
      if (!integration) throw new Error('Integration not found');

      const updatedIntegration = {
        ...integration,
        settings: { ...integration.settings, ...settings }
      };

      await updateIntegration(integrationId, updatedIntegration);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  // This function would normally update the integrations in state
  // const addInsight = async (integrationId: string, insight: IntegrationInsight) => {
  //   try {
  //     const response = await fetch(`/api/integrations/${integrationId}/insights`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(insight)
  //     });

  //     if (!response.ok) throw new Error('Failed to add insight');

  //     // In a real implementation, you would update the local state
  //     // with the new insight after it's successfully added
  //     refreshIntegrations();

  //     showToast({
  //       title: 'Success',
  //       description: 'Insight added successfully',
  //       type: 'success'
  //     });
  //   } catch (error) {
  //     showToast({
  //       title: 'Error',
  //       description: 'Failed to add insight',
  //       type: 'error'
  //     });
  //   }
  // };

  // const organizeConnections = (integration: IntegrationData) => {
  //   // AI-powered connection analysis
  //   const connections = integration.connections.map(conn => ({
  //     ...conn,
  //     strength: calculateConnectionStrength(conn, integration)
  //   }));

  //   return connections.sort((a: IntegrationConnection, b: IntegrationConnection) => 
  //     (b.strength || 0) - (a.strength || 0)
  //   );
  // };

  // const calculateConnectionStrength = (
  //   connection: IntegrationConnection, 
  //   integration: IntegrationData
  // ): number => {
  //   // Implement connection strength calculation logic
  //   // This could be based on:
  //   // - Frequency of interaction
  //   // - Data overlap
  //   // - User-defined importance
  //   // - AI-analyzed relevance
  //   return Math.random(); // Placeholder
  // };

  // const generateInsights = async (integration: IntegrationData): Promise<IntegrationInsight[]> => {
  //   // AI-powered insight generation
  //   const insights = await fetch('/api/ai/generate-insights', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ integration })
  //   }).then(res => res.json());

  //   return insights;
  // };

  // Helper function to get the display name or type for an integration
  const getIntegrationDisplayName = (integration: Integration): string => {
    return integration.name || integration.type || 'Unknown Integration';
  };

  // Helper function to format the date for display
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };



  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Integration Organizer</h1>
        <div className="flex space-x-4">
          <Button onClick={() => window.location.href = '/integrations/marketplace'}>
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
          <Button variant="outline" onClick={() => setViewMode('list')}>
            <FileText className="w-4 h-4 mr-2" />
            List
          </Button>
          <Button variant="outline" onClick={() => setViewMode('mindmap')}>
            <Brain className="w-4 h-4 mr-2" />
            Mind Map
          </Button>
          <Button variant="outline" onClick={() => setViewMode('timeline')}>
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search integrations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="all">All Categories</option>
          <option value="crm">CRM</option>
          <option value="marketing">Marketing</option>
          <option value="sales">Sales</option>
          <option value="productivity">Productivity</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integration List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center text-destructive p-4">
                  {error.message}
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map(integration => (
                    <div
                      key={integration.id}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedIntegration(integration)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{getIntegrationDisplayName(integration)}</h3>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {formatDate(integration.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect(integration.id);
                            }}
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedIntegration && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedIntegration.status || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Last Synced</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedIntegration.last_sync ? new Date(selectedIntegration.last_sync).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpdateSettings(selectedIntegration.id, {})}
                  >
                    Update Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Integration Details Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal">
          <Card className="w-full max-w-4xl">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{getIntegrationDisplayName(selectedIntegration)}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIntegration(null)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">
                      {selectedIntegration.description || 'No description available'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Category</h3>
                    <p className="text-muted-foreground">
                      {selectedIntegration.category || 'Uncategorized'}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="settings">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Sync Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Last synced: {selectedIntegration.last_sync ? new Date(selectedIntegration.last_sync).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Status</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedIntegration.status || 'Unknown'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUpdateSettings(selectedIntegration.id, {})}
                    >
                      Update Settings
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  );
}; 