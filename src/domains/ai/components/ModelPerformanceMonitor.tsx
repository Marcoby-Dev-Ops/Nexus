import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Zap,
  Target,
  BarChart3,
  Cpu,
  Gauge
} from 'lucide-react';

interface ModelMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdated: Date;
}

interface ModelPerformance {
  modelId: string;
  modelName: string;
  metrics: ModelMetric[];
  overallScore: number;
  status: 'online' | 'degraded' | 'offline';
  lastInference: Date;
  totalInferences: number;
  averageResponseTime: number;
}

const mockModels: ModelPerformance[] = [
  {
    modelId: 'gpt-4',
    modelName: 'GPT-4 Turbo',
    overallScore: 94,
    status: 'online',
    lastInference: new Date(),
    totalInferences: 15420,
    averageResponseTime: 2.3,
    metrics: [
      {
        name: 'Accuracy',
        value: 96.2,
        target: 95,
        unit: '%',
        trend: 'up',
        status: 'excellent',
        lastUpdated: new Date()
      },
      {
        name: 'Response Time',
        value: 2.3,
        target: 3.0,
        unit: 's',
        trend: 'down',
        status: 'excellent',
        lastUpdated: new Date()
      },
      {
        name: 'Token Usage',
        value: 1250,
        target: 1500,
        unit: 'tokens',
        trend: 'down',
        status: 'good',
        lastUpdated: new Date()
      },
      {
        name: 'Error Rate',
        value: 0.8,
        target: 1.0,
        unit: '%',
        trend: 'down',
        status: 'excellent',
        lastUpdated: new Date()
      }
    ]
  },
  {
    modelId: 'claude-3',
    modelName: 'Claude 3 Sonnet',
    overallScore: 89,
    status: 'online',
    lastInference: new Date(Date.now() - 300000),
    totalInferences: 8920,
    averageResponseTime: 3.1,
    metrics: [
      {
        name: 'Accuracy',
        value: 92.1,
        target: 90,
        unit: '%',
        trend: 'up',
        status: 'good',
        lastUpdated: new Date()
      },
      {
        name: 'Response Time',
        value: 3.1,
        target: 3.5,
        unit: 's',
        trend: 'stable',
        status: 'good',
        lastUpdated: new Date()
      },
      {
        name: 'Token Usage',
        value: 980,
        target: 1200,
        unit: 'tokens',
        trend: 'down',
        status: 'excellent',
        lastUpdated: new Date()
      },
      {
        name: 'Error Rate',
        value: 1.2,
        target: 1.5,
        unit: '%',
        trend: 'down',
        status: 'good',
        lastUpdated: new Date()
      }
    ]
  },
  {
    modelId: 'custom-rag',
    modelName: 'Custom RAG Model',
    overallScore: 76,
    status: 'degraded',
    lastInference: new Date(Date.now() - 600000),
    totalInferences: 3420,
    averageResponseTime: 4.8,
    metrics: [
      {
        name: 'Accuracy',
        value: 78.5,
        target: 85,
        unit: '%',
        trend: 'down',
        status: 'warning',
        lastUpdated: new Date()
      },
      {
        name: 'Response Time',
        value: 4.8,
        target: 4.0,
        unit: 's',
        trend: 'up',
        status: 'warning',
        lastUpdated: new Date()
      },
      {
        name: 'Token Usage',
        value: 2100,
        target: 1800,
        unit: 'tokens',
        trend: 'up',
        status: 'warning',
        lastUpdated: new Date()
      },
      {
        name: 'Error Rate',
        value: 2.1,
        target: 2.0,
        unit: '%',
        trend: 'up',
        status: 'warning',
        lastUpdated: new Date()
      }
    ]
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
    case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent': return <CheckCircle className="w-4 h-4" />;
    case 'good': return <CheckCircle className="w-4 h-4" />;
    case 'warning': return <AlertTriangle className="w-4 h-4" />;
    case 'critical': return <AlertTriangle className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
    case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
    case 'stable': return <Activity className="w-4 h-4 text-gray-600" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const getModelStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'text-green-600 bg-green-50 border-green-200';
    case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'offline': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const ModelPerformanceMonitor: React.FC = () => {
  const [models, setModels] = useState<ModelPerformance[]>(mockModels);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setModels(prevModels => 
        prevModels.map(model => ({
          ...model,
          lastInference: new Date(),
          totalInferences: model.totalInferences + Math.floor(Math.random() * 10),
          metrics: model.metrics.map(metric => ({
            ...metric,
            value: metric.value + (Math.random() - 0.5) * 2,
            lastUpdated: new Date()
          }))
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const selectedModelData = models.find(m => m.modelId === selectedModel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Model Performance Monitor</h2>
            <p className="text-muted-foreground">Real-time AI model performance tracking</p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Live Monitoring
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Model Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div
                    key={model.modelId}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedModel === model.modelId ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedModel(model.modelId)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold">{model.modelName}</h3>
                        </div>
                        <Badge className={getModelStatusColor(model.status)}>
                          {model.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {model.overallScore}%
                        </div>
                        <div className="text-sm text-muted-foreground">Overall Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Inferences</div>
                        <div className="font-semibold">{model.totalInferences.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Response</div>
                        <div className="font-semibold">{model.averageResponseTime}s</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Last Activity</div>
                        <div className="font-semibold">
                          {Math.floor((Date.now() - model.lastInference.getTime()) / 60000)}m ago
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        {selectedModelData && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {selectedModelData.modelName} Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedModelData.metrics.map((metric) => (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <span className="font-medium">{metric.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(metric.trend)}
                          <span className="font-semibold">
                            {metric.value.toFixed(1)}{metric.unit}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: {metric.target}{metric.unit}</span>
                          <span>{Math.round((metric.value / metric.target) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(metric.value / metric.target) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Performance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Performance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {models.filter(m => m.status === 'degraded').map((model) => (
              <div key={model.modelId} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <div className="font-medium text-yellow-800">
                    {model.modelName} performance degraded
                  </div>
                  <div className="text-sm text-yellow-600">
                    Overall score dropped to {model.overallScore}%
                  </div>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                  Investigate
                </Badge>
              </div>
            ))}
            
            {models.filter(m => m.status === 'online').length === models.length && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-green-800">
                    All models performing optimally
                  </div>
                  <div className="text-sm text-green-600">
                    No performance issues detected
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 