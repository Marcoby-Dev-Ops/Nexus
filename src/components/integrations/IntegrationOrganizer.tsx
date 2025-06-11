import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import {
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Building,
  Users,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Brain,
  Lightbulb,
  Sparkles,
  BookOpen,
  FileText,
  Link,
  Tag,
  FolderTree
} from 'lucide-react';

interface IntegrationData {
  id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  lastSynced: string;
  status: 'active' | 'inactive' | 'error';
  insights: {
    type: 'note' | 'action' | 'insight';
    content: string;
    importance: 'high' | 'medium' | 'low';
    createdAt: string;
  }[];
  connections: {
    id: string;
    name: string;
    type: string;
    strength: number;
  }[];
}

export const IntegrationOrganizer: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'mindmap' | 'timeline'>('list');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      if (!response.ok) throw new Error('Failed to fetch integrations');
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load integrations',
        variant: 'destructive'
      });
    }
  };

  const addInsight = async (integrationId: string, insight: IntegrationData['insights'][0]) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insight)
      });

      if (!response.ok) throw new Error('Failed to add insight');

      setIntegrations(integrations.map(integration => 
        integration.id === integrationId
          ? { ...integration, insights: [...integration.insights, insight] }
          : integration
      ));

      toast({
        title: 'Success',
        description: 'Insight added successfully',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add insight',
        variant: 'destructive'
      });
    }
  };

  const organizeConnections = (integration: IntegrationData) => {
    // AI-powered connection analysis
    const connections = integration.connections.map(conn => ({
      ...conn,
      strength: calculateConnectionStrength(conn, integration)
    }));

    return connections.sort((a, b) => b.strength - a.strength);
  };

  const calculateConnectionStrength = (connection: IntegrationData['connections'][0], integration: IntegrationData) => {
    // Implement connection strength calculation logic
    // This could be based on:
    // - Frequency of interaction
    // - Data overlap
    // - User-defined importance
    // - AI-analyzed relevance
    return Math.random(); // Placeholder
  };

  const generateInsights = async (integration: IntegrationData) => {
    // AI-powered insight generation
    const insights = await fetch('/api/ai/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ integration })
    }).then(res => res.json());

    return insights;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Integration Organizer</h1>
        <div className="flex space-x-4">
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
          icon={<Search className="w-4 h-4" />}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded"
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
              <div className="space-y-4">
                {integrations.map(integration => (
                  <div
                    key={integration.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {integration.insights.length} insights
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {integration.connections.length} connections
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {integration.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedIntegration?.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex items-start space-x-2">
                      {insight.type === 'note' && <FileText className="w-4 h-4 mt-1" />}
                      {insight.type === 'action' && <AlertCircle className="w-4 h-4 mt-1" />}
                      {insight.type === 'insight' && <Lightbulb className="w-4 h-4 mt-1" />}
                      <div>
                        <p className="text-sm">{insight.content}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(insight.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedIntegration?.connections.map(connection => (
                  <div
                    key={connection.id}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{connection.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {connection.type}
                        </p>
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-primary rounded-full"
                          style={{ width: `${connection.strength * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Integration Details Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{selectedIntegration.name}</CardTitle>
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
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">
                      {selectedIntegration.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Category</h3>
                    <p className="text-muted-foreground">
                      {selectedIntegration.category}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Tags</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedIntegration.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="insights">
                  <div className="space-y-4">
                    {selectedIntegration.insights.map((insight, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-start space-x-2">
                          {insight.type === 'note' && <FileText className="w-4 h-4 mt-1" />}
                          {insight.type === 'action' && <AlertCircle className="w-4 h-4 mt-1" />}
                          {insight.type === 'insight' && <Lightbulb className="w-4 h-4 mt-1" />}
                          <div>
                            <p>{insight.content}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(insight.createdAt).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Importance: {insight.importance}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="connections">
                  <div className="space-y-4">
                    {selectedIntegration.connections.map(connection => (
                      <div
                        key={connection.id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{connection.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {connection.type}
                            </p>
                          </div>
                          <div className="w-32 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-primary rounded-full"
                              style={{ width: `${connection.strength * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="settings">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Sync Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Last synced: {new Date(selectedIntegration.lastSynced).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Status</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedIntegration.status}
                      </p>
                    </div>
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