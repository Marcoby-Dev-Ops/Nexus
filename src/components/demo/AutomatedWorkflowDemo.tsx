import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Zap, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  BarChart3,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
  Target,
  Users,
  Brain,
  Lightbulb,
  Award,
  Activity
} from 'lucide-react';

interface WorkflowOptimizationDemoProps {}

export const AutomatedWorkflowDemo: React.FC<WorkflowOptimizationDemoProps> = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [optimizationQueue, setOptimizationQueue] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [recentOptimizations, setRecentOptimizations] = useState<any[]>([]);

  useEffect(() => {
    // Initialize demo data
    initializeDemoData();
    
    // Simulate real-time optimization
    const interval = setInterval(() => {
      if (isOptimizing) {
        simulateOptimization();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOptimizing]);

  const initializeDemoData = () => {
    setWorkflows([
      {
        id: 'sales_lead_qualification',
        name: 'Sales Lead Qualification',
        category: 'sales',
        efficiency: 74,
        totalTime: 140,
        costPerExecution: 175,
        qualityScore: 82,
        bottlenecks: 2,
        automationPotential: 'high',
        recentOptimizations: 3
      },
      {
        id: 'customer_onboarding',
        name: 'Customer Onboarding',
        category: 'customer_success',
        efficiency: 80,
        totalTime: 210,
        costPerExecution: 270,
        qualityScore: 88,
        bottlenecks: 1,
        automationPotential: 'medium',
        recentOptimizations: 2
      },
      {
        id: 'invoice_processing',
        name: 'Invoice Processing',
        category: 'finance',
        efficiency: 83,
        totalTime: 45,
        costPerExecution: 60,
        qualityScore: 92,
        bottlenecks: 0,
        automationPotential: 'high',
        recentOptimizations: 4
      },
      {
        id: 'marketing_campaign',
        name: 'Marketing Campaign Launch',
        category: 'marketing',
        efficiency: 68,
        totalTime: 320,
        costPerExecution: 450,
        qualityScore: 75,
        bottlenecks: 3,
        automationPotential: 'medium',
        recentOptimizations: 1
      }
    ]);

    setOptimizationQueue([
      {
        id: 'opt_1',
        workflowId: 'sales_lead_qualification',
        priority: 'critical',
        title: 'Automate Lead Scoring',
        description: 'Implement ML-based lead scoring to reduce manual effort by 60%',
        expectedBenefits: {
          timeReduction: 60,
          costSavings: 40,
          qualityImprovement: 25
        },
        confidence: 92,
        implementationTime: 14
      },
      {
        id: 'opt_2',
        workflowId: 'marketing_campaign',
        priority: 'high',
        title: 'Parallel Campaign Setup',
        description: 'Execute campaign components in parallel to reduce launch time',
        expectedBenefits: {
          timeReduction: 35,
          costSavings: 20,
          qualityImprovement: 15
        },
        confidence: 85,
        implementationTime: 7
      },
      {
        id: 'opt_3',
        workflowId: 'customer_onboarding',
        priority: 'medium',
        title: 'Automated Welcome Sequence',
        description: 'Automate welcome emails and account setup notifications',
        expectedBenefits: {
          timeReduction: 45,
          costSavings: 30,
          qualityImprovement: 20
        },
        confidence: 88,
        implementationTime: 10
      }
    ]);

    setMetrics({
      totalWorkflows: 4,
      averageEfficiency: 76,
      totalTimeOptimized: 245,
      totalCostSaved: 1850,
      automationRate: 65,
      qualityScore: 84,
      activeOptimizations: 3,
      completedOptimizations: 10,
      roi: 340
    });

    setRecentOptimizations([
      {
        id: 'recent_1',
        workflowName: 'Invoice Processing',
        type: 'automation',
        impact: 'Reduced processing time by 40%',
        timestamp: '2 hours ago',
        roi: 250
      },
      {
        id: 'recent_2',
        workflowName: 'Sales Lead Qualification',
        type: 'process_improvement',
        impact: 'Improved efficiency by 15%',
        timestamp: '5 hours ago',
        roi: 180
      },
      {
        id: 'recent_3',
        workflowName: 'Customer Onboarding',
        type: 'quality_enhancement',
        impact: 'Increased quality score by 12%',
        timestamp: '1 day ago',
        roi: 320
      }
    ]);
  };

  const simulateOptimization = () => {
    // Simulate implementing an optimization
    if (optimizationQueue.length > 0) {
      const nextOptimization = optimizationQueue[0];
      
      // Add to recent optimizations
      setRecentOptimizations(prev => [{
        id: `recent_${Date.now()}`,
        workflowName: workflows.find(w => w.id === nextOptimization.workflowId)?.name || 'Unknown',
        type: 'automation',
        impact: `${nextOptimization.title} implemented`,
        timestamp: 'Just now',
        roi: Math.round(Math.random() * 200 + 150)
      }, ...prev.slice(0, 4)]);

      // Remove from queue
      setOptimizationQueue(prev => prev.slice(1));

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        completedOptimizations: prev.completedOptimizations + 1,
        totalTimeOptimized: prev.totalTimeOptimized + nextOptimization.expectedBenefits.timeReduction,
        totalCostSaved: prev.totalCostSaved + (nextOptimization.expectedBenefits.costSavings * 10),
        averageEfficiency: Math.min(95, prev.averageEfficiency + 2)
      }));

      // Update workflow
      setWorkflows(prev => prev.map(w => 
        w.id === nextOptimization.workflowId 
          ? { 
              ...w, 
              efficiency: Math.min(95, w.efficiency + 5),
              recentOptimizations: w.recentOptimizations + 1,
              bottlenecks: Math.max(0, w.bottlenecks - 1)
            }
          : w
      ));
    }
  };

  const toggleOptimization = () => {
    setIsOptimizing(!isOptimizing);
  };

  const implementOptimization = (optimizationId: string) => {
    const optimization = optimizationQueue.find(opt => opt.id === optimizationId);
    if (optimization) {
      // Simulate implementation
      setTimeout(() => {
        simulateOptimization();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center space-x-4">
            <Workflow className="w-10 h-10 text-secondary" />
            <span>Automated Workflow Optimization</span>
            <Zap className="w-10 h-10 text-primary" />
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            AI-powered workflow optimization that continuously analyzes and improves your business processes 
            across all departments, automatically implementing optimizations for maximum efficiency.
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-card rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Optimization Control Center</h2>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                isOptimizing ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isOptimizing ? 'Optimizing Active' : 'Optimization Paused'}
                </span>
              </div>
              <button
                onClick={toggleOptimization}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  isOptimizing 
                    ? 'bg-destructive hover:bg-destructive text-primary-foreground' 
                    : 'bg-success hover:bg-green-600 text-primary-foreground'
                }`}
              >
                {isOptimizing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isOptimizing ? 'Pause' : 'Start'} Optimization</span>
              </button>
            </div>
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Workflow className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Total Workflows</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{metrics.totalWorkflows}</div>
            </div>

            <div className="bg-success/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-sm font-medium text-success">Avg Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{metrics.averageEfficiency}%</div>
            </div>

            <div className="bg-secondary/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium text-purple-800">Time Saved</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{metrics.totalTimeOptimized}h</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium text-orange-800">Cost Saved</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">${metrics.totalCostSaved}</div>
            </div>

            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-indigo-800">Automation</span>
              </div>
              <div className="text-2xl font-bold text-indigo-900">{metrics.automationRate}%</div>
            </div>

            <div className="bg-pink-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5 text-pink-600" />
                <span className="text-sm font-medium text-pink-800">ROI</span>
              </div>
              <div className="text-2xl font-bold text-pink-900">{metrics.roi}%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workflow Status */}
          <div className="bg-card rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span>Workflow Performance</span>
            </h3>
            
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedWorkflow === workflow.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-border'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">{workflow.name}</h4>
                    <div className="flex items-center space-x-2">
                      {workflow.bottlenecks > 0 && (
                        <div className="flex items-center space-x-1 text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs">{workflow.bottlenecks}</span>
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.automationPotential === 'high' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-yellow-700'
                      }`}>
                        {workflow.automationPotential} automation
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Efficiency</div>
                      <div className="font-semibold text-foreground">{workflow.efficiency}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Time</div>
                      <div className="font-semibold text-foreground">{workflow.totalTime}m</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Quality</div>
                      <div className="font-semibold text-foreground">{workflow.qualityScore}%</div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Efficiency</span>
                      <span>{workflow.efficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${workflow.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Queue */}
          <div className="bg-card rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center space-x-2">
              <Target className="w-6 h-6 text-secondary" />
              <span>Optimization Queue</span>
              <span className="bg-secondary/10 text-purple-700 px-2 py-1 rounded-full text-sm">
                {optimizationQueue.length}
              </span>
            </h3>
            
            <div className="space-y-4">
              {optimizationQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
                  <p className="text-lg font-medium">All optimizations complete!</p>
                  <p className="text-sm">Your workflows are running at peak efficiency.</p>
                </div>
              ) : (
                optimizationQueue.map((optimization) => (
                  <div
                    key={optimization.id}
                    className="p-4 rounded-lg border border-border hover:border-border transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          optimization.priority === 'critical' ? 'bg-destructive' :
                          optimization.priority === 'high' ? 'bg-warning' :
                          'bg-warning'
                        }`}></div>
                        <span className={`text-xs font-medium uppercase ${
                          optimization.priority === 'critical' ? 'text-destructive' :
                          optimization.priority === 'high' ? 'text-warning' :
                          'text-yellow-700'
                        }`}>
                          {optimization.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {optimization.confidence}% confidence
                        </span>
                        <button
                          onClick={() => implementOptimization(optimization.id)}
                          className="bg-primary hover:bg-primary text-primary-foreground px-4 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Implement
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-foreground mb-2">{optimization.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{optimization.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="text-center">
                        <div className="text-success font-semibold">
                          -{optimization.expectedBenefits.timeReduction}%
                        </div>
                        <div className="text-muted-foreground">Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-primary font-semibold">
                          -{optimization.expectedBenefits.costSavings}%
                        </div>
                        <div className="text-muted-foreground">Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-secondary font-semibold">
                          +{optimization.expectedBenefits.qualityImprovement}%
                        </div>
                        <div className="text-muted-foreground">Quality</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Implementation: {optimization.implementationTime} days</span>
                      <span>Workflow: {workflows.find(w => w.id === optimization.workflowId)?.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Optimizations */}
        <div className="bg-card rounded-2xl shadow-xl p-6 mt-8">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 text-success" />
            <span>Recent Optimizations</span>
          </h3>
          
          <div className="space-y-4">
            {recentOptimizations.map((optimization) => (
              <div key={optimization.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{optimization.workflowName}</h4>
                    <p className="text-sm text-muted-foreground">{optimization.impact}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-success">
                    {optimization.roi}% ROI
                  </div>
                  <div className="text-xs text-muted-foreground">{optimization.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mt-8">
          <div className="flex items-center space-x-4 mb-4">
            <Brain className="w-8 h-8 text-primary" />
            <h3 className="text-xl font-bold text-foreground">AI Workflow Intelligence</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="w-5 h-5 text-warning" />
                <h4 className="font-semibold text-foreground">Smart Insights</h4>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Sales workflows show 23% improvement potential through automation</li>
                <li>• Customer onboarding can be parallelized for 35% time reduction</li>
                <li>• Finance processes have highest automation success rate (94%)</li>
                <li>• Cross-departmental optimizations yield 2.3x better ROI</li>
              </ul>
            </div>
            
            <div className="bg-card rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Team Impact</h4>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 4.2 hours saved per employee per week</li>
                <li>• 89% user satisfaction with automated processes</li>
                <li>• 67% reduction in manual errors</li>
                <li>• 156% increase in process consistency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 