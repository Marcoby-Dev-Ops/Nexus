/**
 * NexusAIController.tsx
 * Main control interface for all advanced AI capabilities
 * Demonstrates the transformation of Nexus into a Business Operating System
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  Eye, 
  Mic, 
  FileText, 
  BarChart3, 
  Settings, 
  Workflow,
  Bot,
  Lightbulb,
  TrendingUp,
  Code,
  Play,
  Pause,
  Upload,
  MicIcon,
  Camera,
  Cpu,
  Network,
  Shield,
  Rocket,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Target
} from 'lucide-react';
import { 
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Badge,
} from '@/shared/components/ui';
import { nexusAIOrchestrator } from '@/domains/ai/lib/nexusAIOrchestrator';

interface AICapabilityStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  progress: number;
  lastRun?: Date;
  results?: any;
  metrics?: {
    timesSaved: number;
    efficiencyGain: number;
    businessImpact: number;
  };
}

interface BusinessMetrics {
  totalTimeSaved: number;
  processesOptimized: number;
  featuresGenerated: number;
  integrationsHealed: number;
  predictionsAccuracy: number;
  automationLevel: number;
}

interface AIInsight {
  type: 'optimization' | 'prediction' | 'anomaly' | 'opportunity';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  actionable: boolean;
  estimatedValue: number;
}

export const NexusAIController: React.FC = () => {
  const [orchestratorStatus, setOrchestratorStatus] = useState<'stopped' | 'running'>('stopped');
  const [capabilities, setCapabilities] = useState<Map<string, AICapabilityStatus>>(new Map());
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    totalTimeSaved: 0,
    processesOptimized: 0,
    featuresGenerated: 0,
    integrationsHealed: 0,
    predictionsAccuracy: 0,
    automationLevel: 0
  });
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize capabilities status
  useEffect(() => {
    const initialCapabilities = new Map<string, AICapabilityStatus>([
      ['system-evolution', { 
        id: 'system-evolution', 
        name: 'Self-Evolving System', 
        status: 'idle' as const, 
        progress: 0,
        metrics: { timesSaved: 0, efficiencyGain: 0, businessImpact: 0 }
      }],
      ['process-mining', { 
        id: 'process-mining', 
        name: 'Process Intelligence', 
        status: 'idle' as const, 
        progress: 0,
        metrics: { timesSaved: 0, efficiencyGain: 0, businessImpact: 0 }
      }],
      ['multi-modal', { 
        id: 'multi-modal', 
        name: 'Multi-Modal AI', 
        status: 'idle' as const, 
        progress: 0,
        metrics: { timesSaved: 0, efficiencyGain: 0, businessImpact: 0 }
      }],
      ['predictive', { 
        id: 'predictive', 
        name: 'Predictive Analytics', 
        status: 'idle' as const, 
        progress: 0,
        metrics: { timesSaved: 0, efficiencyGain: 0, businessImpact: 0 }
      }],
      ['code-generation', { 
        id: 'code-generation', 
        name: 'Code Generation', 
        status: 'idle' as const, 
        progress: 0,
        metrics: { timesSaved: 0, efficiencyGain: 0, businessImpact: 0 }
      }],
      ['smart-integration', { 
        id: 'smart-integration', 
        name: 'Smart Integration', 
        status: 'idle' as const, 
        progress: 0,
        metrics: { timesSaved: 0, efficiencyGain: 0, businessImpact: 0 }
      }]
    ]);
    setCapabilities(initialCapabilities);
  }, []);

  const toggleOrchestrator = async () => {
    if (orchestratorStatus === 'running') {
      nexusAIOrchestrator.stopOrchestration();
      setOrchestratorStatus('stopped');
    } else {
      try {
        await nexusAIOrchestrator.startOrchestration();
        setOrchestratorStatus('running');
        
        // Run comprehensive analysis
        runComprehensiveAnalysis();
      } catch (error) {
        console.error('Failed to start orchestrator:', error);
      }
    }
  };

  const runComprehensiveAnalysis = async () => {
    updateCapabilityStatus('system-evolution', 'running', 10);
    
    try {
      const results = await nexusAIOrchestrator.runComprehensiveAnalysis();
      
      // Update capabilities with results
      updateCapabilityStatus('system-evolution', 'success', 100, results);
      
      // Update business metrics
      setBusinessMetrics(prev => ({
        ...prev,
        totalTimeSaved: prev.totalTimeSaved + 3600, // 1 hour saved
        processesOptimized: prev.processesOptimized + results.optimizations.length,
        automationLevel: Math.min(prev.automationLevel + 15, 100)
      }));

      // Generate insights
      const newInsights: AIInsight[] = [
        {
          type: 'optimization',
          title: 'System Self-Optimization Active',
          description: `Identified ${results.optimizations.length} optimization opportunities. Auto-implemented ${results.implementations.length} safe improvements.`,
          impact: 'high',
          confidence: 0.95,
          actionable: true,
          estimatedValue: 15000
        },
        {
          type: 'prediction',
          title: 'Business Process Improvements',
          description: `Discovered ${results.insights.length} process inefficiencies. Potential 40% efficiency gain identified.`,
          impact: 'critical',
          confidence: 0.88,
          actionable: true,
          estimatedValue: 25000
        }
      ];
      
      setInsights(prev => [...newInsights, ...prev].slice(0, 10));
      
    } catch (error) {
      updateCapabilityStatus('system-evolution', 'error', 0);
      console.error('Comprehensive analysis failed:', error);
    }
  };

  const runProcessOptimization = async () => {
    updateCapabilityStatus('process-mining', 'running', 0);
    
    try {
      const results = await nexusAIOrchestrator.optimizeBusinessProcesses();
      updateCapabilityStatus('process-mining', 'success', 100, results);
      
      setBusinessMetrics(prev => ({
        ...prev,
        totalTimeSaved: prev.totalTimeSaved + results.time_savings,
        processesOptimized: prev.processesOptimized + results.discovered_processes.length,
        automationLevel: Math.min(prev.automationLevel + results.efficiency_gains, 100)
      }));

      const insight: AIInsight = {
        type: 'optimization',
        title: 'Business Processes Optimized',
        description: `Optimized ${results.discovered_processes.length} processes, saving ${results.time_savings} seconds total. ${results.efficiency_gains.toFixed(1)}% efficiency improvement.`,
        impact: 'high',
        confidence: 0.92,
        actionable: false,
        estimatedValue: results.time_savings * 0.5 // $0.50 per second saved
      };
      
      setInsights(prev => [insight, ...prev].slice(0, 10));
      
    } catch (error) {
      updateCapabilityStatus('process-mining', 'error', 0);
    }
  };

  const generateBusinessIntelligence = async () => {
    updateCapabilityStatus('predictive', 'running', 0);
    
    try {
      const results = await nexusAIOrchestrator.generateBusinessIntelligence();
      updateCapabilityStatus('predictive', 'success', 100, results);
      
      setBusinessMetrics(prev => ({
        ...prev,
        predictionsAccuracy: 89.5
      }));

      const insight: AIInsight = {
        type: 'prediction',
        title: 'Business Intelligence Generated',
        description: `Generated ${results.recommendations.length} strategic recommendations. Detected ${results.anomalies.length} business anomalies requiring attention.`,
        impact: 'critical',
        confidence: 0.89,
        actionable: true,
        estimatedValue: 50000
      };
      
      setInsights(prev => [insight, ...prev].slice(0, 10));
      
    } catch (error) {
      updateCapabilityStatus('predictive', 'error', 0);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    updateCapabilityStatus('multi-modal', 'running', 0);

    try {
      const results = await nexusAIOrchestrator.processMultiModalInput({
        type: 'document',
        data: file
      });

      updateCapabilityStatus('multi-modal', 'success', 100, results);
      
      const insight: AIInsight = {
        type: 'optimization',
        title: 'Document Processed with AI',
        description: `Extracted data from ${file.name}. Generated ${results.actions.length} actionable items and ${results.workflows.length} automated workflows.`,
        impact: 'medium',
        confidence: results.intelligence.confidence,
        actionable: true,
        estimatedValue: results.actions.reduce((sum, action) => sum + action.estimated_time_saving, 0) * 0.5
      };
      
      setInsights(prev => [insight, ...prev].slice(0, 10));
      
    } catch (error) {
      updateCapabilityStatus('multi-modal', 'error', 0);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    updateCapabilityStatus('multi-modal', 'running', 0);

    try {
      const results = await nexusAIOrchestrator.processMultiModalInput({
        type: 'voice',
        data: audioBlob
      });

      updateCapabilityStatus('multi-modal', 'success', 100, results);
      
      const insight: AIInsight = {
        type: 'optimization',
        title: 'Voice Command Processed',
        description: `Interpreted: "${results.intelligence.transcription}". Generated ${results.workflows.length} workflows and ${results.actions.length} action items.`,
        impact: 'medium',
        confidence: results.intelligence.confidence,
        actionable: true,
        estimatedValue: 300 // 5 minutes saved
      };
      
      setInsights(prev => [insight, ...prev].slice(0, 10));
      
    } catch (error) {
      updateCapabilityStatus('multi-modal', 'error', 0);
    }
  };

  const generateFeature = async () => {
    const description = "Create an automated expense approval workflow that routes expenses under $500 to auto-approve and higher amounts to manager approval";
    
    updateCapabilityStatus('code-generation', 'running', 0);

    try {
      const results = await nexusAIOrchestrator.generateFeatureFromDescription(description);
      updateCapabilityStatus('code-generation', 'success', 100, results);
      
      setBusinessMetrics(prev => ({
        ...prev,
        featuresGenerated: prev.featuresGenerated + 1,
        totalTimeSaved: prev.totalTimeSaved + results.estimated_time_saving
      }));

      const insight: AIInsight = {
        type: 'optimization',
        title: 'Feature Generated Automatically',
        description: `Created complete expense approval system with ${results.feature.components.length} components and ${results.feature.api_endpoints.length} API endpoints. Estimated ${results.estimated_time_saving} seconds saved per use.`,
        impact: 'high',
        confidence: 0.94,
        actionable: true,
        estimatedValue: results.estimated_time_saving * 10 // $10 per saved minute
      };
      
      setInsights(prev => [insight, ...prev].slice(0, 10));
      
    } catch (error) {
      updateCapabilityStatus('code-generation', 'error', 0);
    }
  };

  const optimizeIntegrations = async () => {
    updateCapabilityStatus('smart-integration', 'running', 0);

    try {
      const results = await nexusAIOrchestrator.optimizeIntegrations();
      updateCapabilityStatus('smart-integration', 'success', 100, results);
      
      setBusinessMetrics(prev => ({
        ...prev,
        integrationsHealed: prev.integrationsHealed + results.healed_connections.length
      }));

      const insight: AIInsight = {
        type: 'optimization',
        title: 'Integrations Optimized',
        description: `Configured ${results.configured_integrations.length} new integrations and healed ${results.healed_connections.length} broken connections. ${results.efficiency_improvement}% efficiency improvement.`,
        impact: 'medium',
        confidence: 0.91,
        actionable: false,
        estimatedValue: results.efficiency_improvement * 100
      };
      
      setInsights(prev => [insight, ...prev].slice(0, 10));
      
    } catch (error) {
      updateCapabilityStatus('smart-integration', 'error', 0);
    }
  };

  const updateCapabilityStatus = (
    id: string, 
    status: AICapabilityStatus['status'], 
    progress: number, 
    results?: any
  ) => {
    setCapabilities(prev => {
      const updated = new Map(prev);
      const capability = updated.get(id);
      if (capability) {
        updated.set(id, {
          ...capability,
          status,
          progress,
          lastRun: new Date(),
          results
        });
      }
      return updated;
    });
  };

  const getStatusIcon = (status: AICapabilityStatus['status']) => {
    switch (status) {
      case 'running': return <Settings className="h-4 w-4 animate-spin text-primary" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-4 mb-4">
          <Bot className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Nexus AI Business Operating System
          </h1>
        </div>
        
        <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
          Transform your business with advanced AI capabilities that are rarely utilized but offer 
          <span className="font-bold text-primary"> extraordinary business value</span>
        </p>
        
        {/* Master Control */}
        <div className="flex justify-center items-center space-x-4 mt-6">
          <Button 
            onClick={toggleOrchestrator}
            size="lg"
            variant={orchestratorStatus === 'running' ? 'destructive' : 'default'}
            className="flex items-center space-x-2"
          >
            {orchestratorStatus === 'running' ? (
              <>
                <Pause className="h-5 w-5" />
                <span>Stop AI Orchestrator</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Start AI Orchestrator</span>
              </>
            )}
          </Button>
          
          <Badge 
            variant={orchestratorStatus === 'running' ? 'default' : 'secondary'}
            className="text-lg px-4 py-4"
          >
            {orchestratorStatus === 'running' ? 'ACTIVE' : 'STOPPED'}
          </Badge>
        </div>
      </div>

      {/* Business Metrics Dashboard */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-6 w-6 mr-2" />
            Business Impact Metrics
          </CardTitle>
          <CardDescription>
            Real-time measurement of AI transformation value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">
                {Math.floor(businessMetrics.totalTimeSaved / 60)}m
              </div>
              <div className="text-sm text-primary">Time Saved</div>
            </div>
            
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <Workflow className="h-8 w-8 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold text-success">
                {businessMetrics.processesOptimized}
              </div>
              <div className="text-sm text-success">Processes Optimized</div>
            </div>
            
            <div className="text-center p-4 bg-secondary/10 rounded-lg">
              <Code className="h-8 w-8 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold text-secondary">
                {businessMetrics.featuresGenerated}
              </div>
              <div className="text-sm text-secondary">Features Generated</div>
            </div>
            
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <Network className="h-8 w-8 mx-auto mb-2 text-warning" />
              <div className="text-2xl font-bold text-warning">
                {businessMetrics.integrationsHealed}
              </div>
              <div className="text-sm text-warning">Integrations Healed</div>
            </div>
            
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <div className="text-2xl font-bold text-destructive">
                {businessMetrics.predictionsAccuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-destructive">Prediction Accuracy</div>
            </div>
            
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">
                {businessMetrics.automationLevel.toFixed(0)}%
              </div>
              <div className="text-sm text-primary">Automation Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Capabilities Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from(capabilities.values()).map((capability) => (
          <Card 
            key={capability.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedCapability === capability.id ? 'border-primary shadow-lg' : 'border-border'
            }`}
            onClick={() => setSelectedCapability(capability.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(capability.status)}
                  <CardTitle className="text-lg">{capability.name}</CardTitle>
                </div>
                <Badge variant={capability.status === 'success' ? 'default' : 'secondary'}>
                  {capability.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                {capability.status === 'running' && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${capability.progress}%` }}
                    ></div>
                  </div>
                )}

                {/* Metrics */}
                {capability.metrics && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-bold">{capability.metrics.timesSaved}</div>
                      <div className="text-xs text-muted-foreground">Times Saved</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold">{capability.metrics.efficiencyGain}%</div>
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold">${capability.metrics.businessImpact}</div>
                      <div className="text-xs text-muted-foreground">Impact</div>
                    </div>
                  </div>
                )}

                {/* Last Run */}
                {capability.lastRun && (
                  <div className="text-xs text-muted-foreground">
                    Last run: {capability.lastRun.toLocaleTimeString()}
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={capability.status === 'running'}
                  onClick={(e) => {
                    e.stopPropagation();
                    switch (capability.id) {
                      case 'system-evolution':
                        runComprehensiveAnalysis();
                        break;
                      case 'process-mining':
                        runProcessOptimization();
                        break;
                      case 'predictive':
                        generateBusinessIntelligence();
                        break;
                      case 'code-generation':
                        generateFeature();
                        break;
                      case 'smart-integration':
                        optimizeIntegrations();
                        break;
                    }
                  }}
                >
                  {capability.status === 'running' ? 'Running...' : 'Execute'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Multi-Modal Input Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-6 w-6 mr-2" />
            Multi-Modal AI Interface
          </CardTitle>
          <CardDescription>
            Process documents, voice commands, and images with advanced AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Document Upload */}
            <div className="text-center space-y-2">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
              {uploadedFile && (
                <div className="text-xs text-muted-foreground">
                  {uploadedFile.name}
                </div>
              )}
            </div>

            {/* Voice Input */}
            <div className="text-center space-y-2">
              <Button 
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                variant={isRecording ? "destructive" : "outline"}
                className="w-full"
              >
                <MicIcon className="h-4 w-4 mr-2" />
                {isRecording ? 'Stop Recording' : 'Voice Command'}
              </Button>
              {isRecording && (
                <div className="text-xs text-destructive animate-pulse">
                  Recording...
                </div>
              )}
            </div>

            {/* Feature Generation */}
            <div className="text-center space-y-2">
              <Button 
                onClick={generateFeature}
                variant="outline"
                className="w-full"
              >
                <Code className="h-4 w-4 mr-2" />
                Generate Feature
              </Button>
              <div className="text-xs text-muted-foreground">
                Auto-create complete features
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-6 w-6 mr-2" />
            AI Insights & Recommendations
          </CardTitle>
          <CardDescription>
            Real-time business intelligence and optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {insights.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Start the AI Orchestrator to begin receiving insights
              </div>
            ) : (
              insights.map((insight, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getImpactColor(insight.impact)}`}></div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant="secondary">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {insight.actionable && (
                        <Badge variant="default">Actionable</Badge>
                      )}
                      <div className="text-sm font-bold text-success">
                        ${insight.estimatedValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      Take Action
                    </Button>
                    <div className="flex items-center space-x-2 ml-auto">
                      {insight.actionable && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold">
                            <Badge variant="default">Actionable</Badge>
                          </span>
                        </div>
                      )}
                      {!insight.actionable && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold">
                            <Badge variant="secondary">Not Actionable</Badge>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Transform Your Business Today</h2>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              These AI capabilities represent the future of business operations. Start with one capability 
              and watch as your business transforms into an intelligent, self-optimizing system.
            </p>
            <div className="flex justify-center space-x-4 mt-6">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-card text-primary hover:bg-muted"
                onClick={toggleOrchestrator}
              >
                <Rocket className="h-5 w-5 mr-2" />
                {orchestratorStatus === 'running' ? 'AI System Active' : 'Start Transformation'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 