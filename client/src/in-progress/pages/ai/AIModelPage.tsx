import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Switch } from '@/shared/components/ui/Switch';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { 
  Brain, 
  Settings, 
  Activity, 
  Zap, 
  Clock, 
  Target,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Plus,
  BarChart3
} from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  version: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  performance: {
    accuracy: number;
    responseTime: number;
    costPerToken: number;
    tokensPerSecond: number;
  };
  capabilities: string[];
  maxTokens: number;
  temperature: number;
  isDefault: boolean;
  lastUsed: string;
  usageCount: number;
}

interface ModelProvider {
  id: string;
  name: string;
  models: AIModel[];
  status: 'connected' | 'disconnected' | 'error';
}

export default function AIModelPage() {
  const { user } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockModels: AIModel[] = [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'OpenAI',
          version: '4.0',
          status: 'active',
          performance: {
            accuracy: 96.2,
            responseTime: 2.3,
            costPerToken: 0.03,
            tokensPerSecond: 150
          },
          capabilities: ['Text Generation', 'Code Analysis', 'Creative Writing', 'Problem Solving'],
          maxTokens: 8192,
          temperature: 0.7,
          isDefault: true,
          lastUsed: '2024-01-15T10:30:00Z',
          usageCount: 1250
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: 'OpenAI',
          version: '3.5',
          status: 'active',
          performance: {
            accuracy: 89.5,
            responseTime: 1.2,
            costPerToken: 0.002,
            tokensPerSecond: 200
          },
          capabilities: ['Text Generation', 'Conversation', 'Basic Analysis'],
          maxTokens: 4096,
          temperature: 0.7,
          isDefault: false,
          lastUsed: '2024-01-14T15:45:00Z',
          usageCount: 890
        },
        {
          id: 'claude-3',
          name: 'Claude-3',
          provider: 'Anthropic',
          version: '3.0',
          status: 'active',
          performance: {
            accuracy: 94.8,
            responseTime: 2.8,
            costPerToken: 0.025,
            tokensPerSecond: 120
          },
          capabilities: ['Text Generation', 'Analysis', 'Safety', 'Reasoning'],
          maxTokens: 100000,
          temperature: 0.7,
          isDefault: false,
          lastUsed: '2024-01-13T09:20:00Z',
          usageCount: 567
        }
      ];

      const mockProviders: ModelProvider[] = [
        {
          id: 'openai',
          name: 'OpenAI',
          models: mockModels.filter(m => m.provider === 'OpenAI'),
          status: 'connected'
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          models: mockModels.filter(m => m.provider === 'Anthropic'),
          status: 'connected'
        }
      ];

      setModels(mockModels);
      setProviders(mockProviders);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (modelId: string) => {
    try {
      setModels(prev => prev.map(model => ({
        ...model,
        isDefault: model.id === modelId
      })));
      // TODO: API call to update default model
    } catch (error) {
      console.error('Error setting default model:', error);
    }
  };

  const handleTestModel = async (model: AIModel) => {
    setTesting(true);
    try {
      // TODO: Implement model testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Testing model: ${model.name}`);
    } catch (error) {
      console.error('Error testing model:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleUpdateModel = async (modelId: string, updates: Partial<AIModel>) => {
    try {
      setModels(prev => prev.map(model => 
        model.id === modelId ? { ...model, ...updates } : model
      ));
      // TODO: API call to update model
    } catch (error) {
      console.error('Error updating model:', error);
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

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-yellow-800">Authentication Required</h2>
          </div>
          <p className="text-yellow-700">
            Please log in to access AI model management features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Model Management</h1>
          <p className="text-gray-600 mt-2">
            Configure and manage your AI models and their performance
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Models</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{models.length}</div>
                <p className="text-xs text-muted-foreground">
                  {models.filter(m => m.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {models.length > 0 
                    ? (models.reduce((sum, m) => sum + m.performance.responseTime, 0) / models.length).toFixed(1)
                    : '0'
                  }s
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all models
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {models.reduce((sum, m) => sum + m.usageCount, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requests this month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
              <CardDescription>
                Manage your AI models and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Badge className={getStatusColor(model.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(model.status)}
                            {model.status}
                          </div>
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{model.name}</h3>
                          {model.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {model.provider} • v{model.version}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Accuracy: {model.performance.accuracy}%</span>
                          <span>Response: {model.performance.responseTime}s</span>
                          <span>Usage: {model.usageCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestModel(model)}
                        disabled={testing}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {testing ? 'Testing...' : 'Test'}
                      </Button>
                      
                      {!model.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(model.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedModel(model)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Providers</CardTitle>
              <CardDescription>
                Manage connections to AI model providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold">{provider.name}</h3>
                        <p className="text-sm text-gray-600">
                          {provider.models.length} models available
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(provider.status)}>
                        {provider.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Monitor model performance and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {models.map((model) => (
                  <div key={model.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{model.name}</h3>
                      <Badge variant="outline">{model.provider}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {model.performance.accuracy}%
                        </div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {model.performance.responseTime}s
                        </div>
                        <div className="text-sm text-gray-600">Avg Response</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          ${model.performance.costPerToken}
                        </div>
                        <div className="text-sm text-gray-600">Cost/Token</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {model.usageCount}
                        </div>
                        <div className="text-sm text-gray-600">Usage</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {selectedModel && (
            <Card>
              <CardHeader>
                <CardTitle>Model Configuration: {selectedModel.name}</CardTitle>
                <CardDescription>
                  Configure parameters and settings for this model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={selectedModel.maxTokens}
                      onChange={(e) => handleUpdateModel(selectedModel.id, {
                        maxTokens: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={selectedModel.temperature}
                      onChange={(e) => handleUpdateModel(selectedModel.id, {
                        temperature: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Capabilities</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedModel(null)}
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

          {!selectedModel && (
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Model Selected</h3>
                <p className="text-gray-600">
                  Select a model from the overview to configure its settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 
