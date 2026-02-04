import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Switch } from '@/shared/components/ui/Switch';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { 
  Brain, 
  Settings, 
  Activity, 
  Users, 
  MessageSquare, 
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  BarChart3,
  Shield,
  Lightbulb,
  Clock
} from 'lucide-react';

interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: 'executive' | 'departmental' | 'specialist';
  status: 'active' | 'inactive' | 'training' | 'error';
  personality: string;
  capabilities: string[];
  knowledgeBase: string[];
  performance: {
    conversations: number;
    avgResponseTime: number;
    satisfaction: number;
    accuracy: number;
  };
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    enableMemory: boolean;
    enableLearning: boolean;
  };
  createdAt: string;
  lastActive: string;
}

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  capabilities: string[];
  personality: string;
}

export default function AIAgentPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockAgents: AIAgent[] = [
        {
          id: 'executive-assistant',
          name: 'Executive Assistant',
          description: 'Strategic advisor for C-suite decisions and business transformation',
          type: 'executive',
          status: 'active',
          personality: 'Professional, strategic, and results-oriented. Focuses on high-level business decisions and cross-departmental coordination.',
          capabilities: ['Strategic Planning', 'Business Intelligence', 'Performance Analysis', 'Cross-department Coordination'],
          knowledgeBase: ['Business Strategy', 'Financial Analysis', 'Market Research', 'Leadership Principles'],
          performance: {
            conversations: 156,
            avgResponseTime: 2.1,
            satisfaction: 4.3,
            accuracy: 94.2
          },
          settings: {
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 4000,
            enableMemory: true,
            enableLearning: true
          },
          createdAt: '2024-01-01T00:00:00Z',
          lastActive: '2024-01-15T10:30:00Z'
        },
        {
          id: 'sales-specialist',
          name: 'Sales Specialist',
          description: 'Expert in sales strategy, lead generation, and customer relationship management',
          type: 'specialist',
          status: 'active',
          personality: 'Enthusiastic, customer-focused, and results-driven. Specializes in sales techniques and customer engagement.',
          capabilities: ['Lead Generation', 'Sales Strategy', 'Customer Relationship Management', 'Pipeline Analysis'],
          knowledgeBase: ['Sales Techniques', 'CRM Systems', 'Customer Psychology', 'Market Analysis'],
          performance: {
            conversations: 89,
            avgResponseTime: 1.8,
            satisfaction: 4.1,
            accuracy: 91.5
          },
          settings: {
            model: 'gpt-3.5-turbo',
            temperature: 0.8,
            maxTokens: 3000,
            enableMemory: true,
            enableLearning: true
          },
          createdAt: '2024-01-05T00:00:00Z',
          lastActive: '2024-01-14T15:45:00Z'
        },
        {
          id: 'marketing-expert',
          name: 'Marketing Expert',
          description: 'Specialist in marketing strategy, campaigns, and brand development',
          type: 'specialist',
          status: 'active',
          personality: 'Creative, data-driven, and brand-conscious. Focuses on marketing strategy and campaign optimization.',
          capabilities: ['Campaign Strategy', 'Brand Development', 'Content Creation', 'Analytics'],
          knowledgeBase: ['Marketing Principles', 'Digital Marketing', 'Brand Strategy', 'Consumer Behavior'],
          performance: {
            conversations: 67,
            avgResponseTime: 2.3,
            satisfaction: 4.2,
            accuracy: 92.8
          },
          settings: {
            model: 'gpt-4',
            temperature: 0.9,
            maxTokens: 3500,
            enableMemory: true,
            enableLearning: true
          },
          createdAt: '2024-01-10T00:00:00Z',
          lastActive: '2024-01-13T09:20:00Z'
        }
      ];

      const mockTemplates: AgentTemplate[] = [
        {
          id: 'executive-template',
          name: 'Executive Assistant',
          description: 'Strategic advisor for business decisions',
          type: 'executive',
          category: 'Leadership',
          capabilities: ['Strategic Planning', 'Business Intelligence', 'Performance Analysis'],
          personality: 'Professional and strategic'
        },
        {
          id: 'sales-template',
          name: 'Sales Specialist',
          description: 'Expert in sales and customer relationships',
          type: 'specialist',
          category: 'Sales',
          capabilities: ['Lead Generation', 'Sales Strategy', 'CRM Management'],
          personality: 'Enthusiastic and customer-focused'
        },
        {
          id: 'marketing-template',
          name: 'Marketing Expert',
          description: 'Specialist in marketing and brand development',
          type: 'specialist',
          category: 'Marketing',
          capabilities: ['Campaign Strategy', 'Brand Development', 'Content Creation'],
          personality: 'Creative and data-driven'
        }
      ];

      setAgents(mockAgents);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (template: AgentTemplate) => {
    setCreating(true);
    try {
      const newAgent: AIAgent = {
        id: `${template.id}-${Date.now()}`,
        name: `${template.name} (Copy)`,
        description: template.description,
        type: template.type as 'executive' | 'departmental' | 'specialist',
        status: 'active',
        personality: template.personality,
        capabilities: template.capabilities,
        knowledgeBase: [],
        performance: {
          conversations: 0,
          avgResponseTime: 0,
          satisfaction: 0,
          accuracy: 0
        },
        settings: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 4000,
          enableMemory: true,
          enableLearning: true
        },
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };

      setAgents(prev => [...prev, newAgent]);
      setCreating(false);
    } catch (error) {
      console.error('Error creating agent:', error);
      setCreating(false);
    }
  };

  const handleUpdateAgent = async (agentId: string, updates: Partial<AIAgent>) => {
    try {
      setAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, ...updates } : agent
      ));
      // TODO: API call to update agent
    } catch (error) {
      console.error('Error updating agent:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
      // TODO: API call to delete agent
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <Pause className="h-4 w-4" />;
      case 'training': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'executive': return 'bg-purple-100 text-purple-800';
      case 'departmental': return 'bg-blue-100 text-blue-800';
      case 'specialist': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-yellow-800">Authentication Required</h2>
          </div>
          <p className="text-yellow-700">
            Please log in to access AI agent management features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Agent Management</h1>
          <p className="text-gray-600 mt-2">
            Create, configure, and manage your AI agents
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {agents.filter(a => a.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {agents.reduce((sum, a) => sum + a.performance.conversations, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {agents.length > 0 
                    ? (agents.reduce((sum, a) => sum + a.performance.satisfaction, 0) / agents.length).toFixed(1)
                    : '0'
                  }/5
                </div>
                <p className="text-xs text-muted-foreground">
                  User satisfaction
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My AI Agents</CardTitle>
              <CardDescription>
                Manage your personalized AI agents and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Badge className={getStatusColor(agent.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(agent.status)}
                            {agent.status}
                          </div>
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{agent.name}</h3>
                          <Badge className={getTypeColor(agent.type)}>
                            {agent.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{agent.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Conversations: {agent.performance.conversations}</span>
                          <span>Response: {agent.performance.avgResponseTime}s</span>
                          <span>Satisfaction: {agent.performance.satisfaction}/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAgent(agent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Templates</CardTitle>
              <CardDescription>
                Create new agents from pre-built templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(template.type)}>
                          {template.type}
                        </Badge>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Capabilities</Label>
                        <div className="flex flex-wrap gap-1">
                          {template.capabilities.slice(0, 3).map((capability) => (
                            <Badge key={capability} variant="secondary" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                          {template.capabilities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.capabilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleCreateAgent(template)}
                        disabled={creating}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {creating ? 'Creating...' : 'Create Agent'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>
                Monitor and analyze agent performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <Badge className={getTypeColor(agent.type)}>
                        {agent.type}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {agent.performance.conversations}
                        </div>
                        <div className="text-sm text-gray-600">Conversations</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {agent.performance.avgResponseTime}s
                        </div>
                        <div className="text-sm text-gray-600">Avg Response</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {agent.performance.satisfaction}/5
                        </div>
                        <div className="text-sm text-gray-600">Satisfaction</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {agent.performance.accuracy}%
                        </div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {selectedAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Configuration: {selectedAgent.name}</CardTitle>
                <CardDescription>
                  Configure personality, capabilities, and settings for this agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agentName">Agent Name</Label>
                    <Input
                      id="agentName"
                      value={selectedAgent.name}
                      onChange={(e) => handleUpdateAgent(selectedAgent.id, {
                        name: e.target.value
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agentType">Agent Type</Label>
                                         <Select
                       value={selectedAgent.type}
                       onValueChange={(value) => 
                         handleUpdateAgent(selectedAgent.id, { type: value as 'executive' | 'departmental' | 'specialist' })
                       }
                     >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="departmental">Departmental</SelectItem>
                        <SelectItem value="specialist">Specialist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={selectedAgent.description}
                    onChange={(e) => handleUpdateAgent(selectedAgent.id, {
                      description: e.target.value
                    })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personality">Personality</Label>
                  <Textarea
                    id="personality"
                    value={selectedAgent.personality}
                    onChange={(e) => handleUpdateAgent(selectedAgent.id, {
                      personality: e.target.value
                    })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">AI Model</Label>
                    <Select
                      value={selectedAgent.settings.model}
                      onValueChange={(value) => handleUpdateAgent(selectedAgent.id, {
                        settings: { ...selectedAgent.settings, model: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3">Claude-3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={selectedAgent.settings.temperature}
                      onChange={(e) => handleUpdateAgent(selectedAgent.id, {
                        settings: { ...selectedAgent.settings, temperature: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="memory">Enable Memory</Label>
                      <p className="text-sm text-gray-500">
                        Remember conversation context
                      </p>
                    </div>
                    <Switch
                      id="memory"
                      checked={selectedAgent.settings.enableMemory}
                      onCheckedChange={(checked) => handleUpdateAgent(selectedAgent.id, {
                        settings: { ...selectedAgent.settings, enableMemory: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="learning">Enable Learning</Label>
                      <p className="text-sm text-gray-500">
                        Adapt based on user interactions
                      </p>
                    </div>
                    <Switch
                      id="learning"
                      checked={selectedAgent.settings.enableLearning}
                      onCheckedChange={(checked) => handleUpdateAgent(selectedAgent.id, {
                        settings: { ...selectedAgent.settings, enableLearning: checked }
                      })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAgent(null)}
                  >
                    Cancel
                  </Button>
                  <Button>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedAgent && (
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Agent Selected</h3>
                <p className="text-gray-600">
                  Select an agent from the overview to configure its settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 
