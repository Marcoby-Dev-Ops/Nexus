import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Brain, Eye, Zap, TrendingUp, Target, Clock, CheckCircle } from 'lucide-react';

export const TrinityBrainDemo: React.FC = () => {
  const [activePhase, setActivePhase] = useState<'think' | 'see' | 'act' | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        // Simulate Trinity Brain cycle
        if (activePhase === null) {
          setActivePhase('think');
        } else if (activePhase === 'think') {
          setActivePhase('see');
        } else if (activePhase === 'see') {
          setActivePhase('act');
        } else {
          setActivePhase('think');
          setCycleCount(prev => prev + 1);
          
          // Add insight
          const newInsight = generateInsight();
          setInsights(prev => [...prev.slice(-4), newInsight]);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isRunning, activePhase]);

  const generateInsight = (): string => {
    const insights = [
      "🧠 THINK: Identified 3 high-value prospects requiring immediate attention",
      "👁️ SEE: Detected 15% increase in customer engagement this week",
      "⚡ ACT: Automatically scheduled follow-up meetings with warm leads",
      "🧠 THINK: Analyzed market trends - competitors raising prices by 12%",
      "👁️ SEE: Customer satisfaction scores improved by 8% after product update",
      "⚡ ACT: Triggered personalized marketing campaign for segment A",
      "🧠 THINK: Predicted 23% revenue growth opportunity in Q4",
      "👁️ SEE: Operational efficiency increased 18% through automation",
      "⚡ ACT: Optimized resource allocation across 5 departments"
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  };

  const startTrinityBrain = () => {
    setIsRunning(true);
    setActivePhase('think');
  };

  const stopTrinityBrain = () => {
    setIsRunning(false);
    setActivePhase(null);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setActivePhase(null);
    setCycleCount(0);
    setInsights([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Trinity Brain System</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          The core intelligence framework that powers Nexus: <strong>THINK → SEE → ACT</strong>
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button 
            onClick={startTrinityBrain} 
            disabled={isRunning}
            className="bg-primary hover:bg-primary/90"
          >
            Start Trinity Brain
          </Button>
          <Button 
            onClick={stopTrinityBrain} 
            disabled={!isRunning}
            variant="outline"
          >
            Stop Brain
          </Button>
          <Button 
            onClick={resetDemo} 
            variant="outline"
          >
            Reset Demo
          </Button>
        </div>
      </div>

      {/* Trinity Brain Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Trinity Brain Cycle
            {isRunning && (
              <Badge variant="secondary" className="ml-2">
                Cycle {cycleCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8 py-8">
            {/* THINK Phase */}
            <div className={`flex flex-col items-center space-y-4 p-6 rounded-lg transition-all duration-500 ${
              activePhase === 'think' 
                ? 'bg-primary/10 border-2 border-primary scale-110' 
                : 'bg-background border border-border'
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                activePhase === 'think' 
                  ? 'bg-primary text-primary-foreground animate-pulse' 
                  : 'bg-gray-300 text-muted-foreground'
              }`}>
                <Brain className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">THINK</h3>
                <p className="text-sm text-muted-foreground">Analyze & Predict</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {activePhase === 'think' ? 'Processing...' : 'Waiting'}
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-2xl text-muted-foreground">→</div>

            {/* SEE Phase */}
            <div className={`flex flex-col items-center space-y-4 p-6 rounded-lg transition-all duration-500 ${
              activePhase === 'see' 
                ? 'bg-success/10 border-2 border-success scale-110' 
                : 'bg-background border border-border'
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                activePhase === 'see' 
                  ? 'bg-green-600 text-primary-foreground animate-pulse' 
                  : 'bg-gray-300 text-muted-foreground'
              }`}>
                <Eye className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">SEE</h3>
                <p className="text-sm text-muted-foreground">Monitor & Observe</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {activePhase === 'see' ? 'Scanning...' : 'Waiting'}
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-2xl text-muted-foreground">→</div>

            {/* ACT Phase */}
            <div className={`flex flex-col items-center space-y-4 p-6 rounded-lg transition-all duration-500 ${
              activePhase === 'act' 
                ? 'bg-secondary/10 border-2 border-secondary scale-110' 
                : 'bg-background border border-border'
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                activePhase === 'act' 
                  ? 'bg-secondary text-primary-foreground animate-pulse' 
                  : 'bg-gray-300 text-muted-foreground'
              }`}>
                <Zap className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">ACT</h3>
                <p className="text-sm text-muted-foreground">Execute & Optimize</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {activePhase === 'act' ? 'Executing...' : 'Waiting'}
                </div>
              </div>
            </div>
          </div>

          {/* Cycle Statistics */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{cycleCount}</div>
              <div className="text-sm text-muted-foreground">Completed Cycles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {isRunning ? '🟢' : '🔴'}
              </div>
              <div className="text-sm text-muted-foreground">Brain Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{insights.length}</div>
              <div className="text-sm text-muted-foreground">Insights Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trinity Brain Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Real-Time Trinity Brain Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{insight}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trinity Brain Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              THINK Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm font-medium">Capabilities:</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Predictive Analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Pattern Recognition
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Strategic Planning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Risk Assessment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Opportunity Detection
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-success" />
              SEE Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm font-medium">Capabilities:</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Real-time Monitoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Data Visualization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Anomaly Detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Performance Tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Trend Analysis
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-secondary" />
              ACT Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm font-medium">Capabilities:</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Automated Execution
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Workflow Optimization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Resource Allocation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Process Automation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Continuous Improvement
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wow Moments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Trinity Brain Wow Moments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Autonomous Revenue Optimization</h3>
              <p className="text-sm text-foreground/90">
                The Trinity Brain automatically identifies high-value prospects, monitors their behavior, 
                and executes personalized outreach sequences - increasing conversion rates by 40%.
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Predictive Customer Success</h3>
              <p className="text-sm text-foreground/90">
                By analyzing customer usage patterns, the brain predicts churn risk 90 days in advance 
                and automatically triggers retention campaigns.
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Intelligent Resource Allocation</h3>
              <p className="text-sm text-foreground/90">
                The brain continuously optimizes team workloads, identifying bottlenecks and 
                automatically redistributing tasks for maximum efficiency.
              </p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Market Opportunity Detection</h3>
              <p className="text-sm text-foreground/90">
                By monitoring competitor activities and market trends, the brain identifies 
                emerging opportunities and automatically adjusts strategy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 