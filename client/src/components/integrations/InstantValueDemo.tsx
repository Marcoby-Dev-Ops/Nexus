import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Lightbulb,
  ArrowRight,
  Clock,
  DollarSign,
  Users,
  Target,
  Activity,
  Play,
  Star,
  Eye,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { nextBestActionService } from '@/services/NextBestActionService';
import { selectData } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

export interface Integration {
  id: string;
  name: string;
  category: 'crm' | 'finance' | 'communication' | 'marketing' | 'operations';
  icon: string;
  connectedAt: string;
  dataQuality: number; // 0-100
}

export interface DemoData {
  insights: Array<{
    id: string;
    type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number; // 0-100
    metrics?: Record<string, any>;
    estimatedValue?: number;
    timeToValue?: string;
  }>;
  actions: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedTime: string;
    impact: string;
    automationPotential: 'high' | 'medium' | 'low';
  }>;
  metrics: Record<string, {
    value: number | string;
    change: number;
    trend: 'up' | 'down' | 'stable';
    unit: string;
    description: string;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    priority: number;
    implementation: string;
  }>;
}

interface InstantValueDemoProps {
  integration: Integration;
  demoData: DemoData;
  onValueConfirmed: () => void;
  onActionExecuted?: (actionId: string) => void;
  onInsightExplored?: (insightId: string) => void;
}

const InstantValueDemo: React.FC<InstantValueDemoProps> = ({
  integration,
  demoData,
  onValueConfirmed,
  onActionExecuted,
  onInsightExplored
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());
  const [realData, setRealData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load real data from integrations
  useEffect(() => {
    const loadRealData = async () => {
      if (!user?.id || !profile?.company_id) return;

      try {
        setLoading(true);
        
        // Get real integration data
        const integrationData = await selectData('user_integrations', '*', { 
          user_id: user.id,
          integration_name: integration.name 
        });

        // Get business metrics
        const metricsData = await selectData('business_metrics', '*', { 
          company_id: profile.company_id 
        });

        // Get recent activities
        const activitiesData = await selectData('user_activities', '*', { 
          user_id: user.id 
        });

        setRealData({
          integration: integrationData.data?.[0] || null,
          metrics: metricsData.data || [],
          activities: activitiesData.data || []
        });
      } catch (error) {
        logger.error('Error loading real data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, [user?.id, profile?.company_id, integration.name]);

  // Simulate analysis progress
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            setIsAnalyzing(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'risk':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'trend':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'recommendation':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleExecuteAction = async (actionId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Execute the action using NextBestActionService
      const result = await nextBestActionService.executeAction(actionId, user.id);
      
      if (result.success) {
        setExecutedActions(prev => new Set([...prev, actionId]));
        onActionExecuted?.(actionId);
      }
    } catch (error) {
      logger.error('Error executing action:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisPhase = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <Activity className="w-12 h-12 mx-auto text-primary animate-pulse" />
        <h3 className="text-xl font-semibold">Analyzing Your {integration.name} Data</h3>
        <p className="text-muted-foreground">
          Discovering insights and opportunities in your business data
        </p>
      </div>
      
      <div className="space-y-2">
        <Progress value={analysisProgress} className="w-full" />
        <p className="text-sm text-muted-foreground">
          {analysisProgress < 30 && "Connecting to your data sources..."}
          {analysisProgress >= 30 && analysisProgress < 60 && "Processing business metrics..."}
          {analysisProgress >= 60 && analysisProgress < 90 && "Generating insights..."}
          {analysisProgress >= 90 && "Finalizing recommendations..."}
        </p>
      </div>
    </motion.div>
  );

  const renderInsightsPhase = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">🎯 Key Insights Found</h3>
        <p className="text-muted-foreground">
          AI-powered analysis of your {integration.name} integration
        </p>
      </div>

      <div className="grid gap-4">
        {demoData.insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
              selectedInsight === insight.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedInsight(insight.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs">
                    <Badge variant="outline" className={getImpactColor(insight.impact)}>
                      {insight.impact} impact
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{insight.confidence}% confidence</span>
                    </div>
                    {insight.estimatedValue && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3 text-green-500" />
                        <span>${insight.estimatedValue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onInsightExplored?.(insight.id);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderActionsPhase = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">⚡ Next Best Actions</h3>
        <p className="text-muted-foreground">
          AI-recommended actions to improve your business performance
        </p>
      </div>

      <div className="grid gap-4">
        {demoData.actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={getPriorityColor(action.priority)}>
                    {action.priority}
                  </Badge>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{action.estimatedTime}</span>
                  </div>
                </div>
                <h4 className="font-medium mb-1">{action.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {action.description}
                </p>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <Target className="w-3 h-3 text-blue-500" />
                    <span>{action.impact}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>{action.automationPotential} automation</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleExecuteAction(action.id)}
                disabled={loading || executedActions.has(action.id)}
                className="ml-4"
              >
                {executedActions.has(action.id) ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderMetricsPhase = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">📊 Your Business Metrics</h3>
        <p className="text-muted-foreground">
          Key performance indicators from your {integration.name} integration
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(demoData.metrics).map(([key, metric], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <Activity className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                
                <div className="text-2xl font-bold mb-1">
                  {typeof metric.value === 'number' 
                    ? metric.value.toLocaleString() 
                    : metric.value
                  }
                  {metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
                </div>
                
                <div className={`text-sm ${
                  metric.change > 0 ? 'text-green-600' : 
                  metric.change < 0 ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderCompletionPhase = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
        <h3 className="text-2xl font-bold">Value Confirmed!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          You've seen the power of Nexus. Ready to transform your business operations?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">3</div>
          <div className="text-sm text-muted-foreground">Insights Found</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">5</div>
          <div className="text-sm text-muted-foreground">Actions Available</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">$15K</div>
          <div className="text-sm text-muted-foreground">Potential Value</div>
        </div>
      </div>

      <Button onClick={onValueConfirmed} className="w-full">
        Continue to Dashboard
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {integration.icon}
            </div>
            <div>
              <div className="text-lg font-semibold">{integration.name} Integration</div>
              <div className="text-sm text-muted-foreground">
                Connected {new Date(integration.connectedAt).toLocaleDateString()}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {isAnalyzing && renderAnalysisPhase()}
            {!isAnalyzing && currentStep === 0 && renderInsightsPhase()}
            {!isAnalyzing && currentStep === 1 && renderActionsPhase()}
            {!isAnalyzing && currentStep === 2 && renderMetricsPhase()}
            {!isAnalyzing && currentStep === 3 && renderCompletionPhase()}
          </AnimatePresence>
          
          {!isAnalyzing && currentStep < 3 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of 4
              </div>
              <Button 
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center"
                disabled={loading}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstantValueDemo;
