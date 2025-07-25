/**
 * Nexus Operating System Demo
 * 
 * Demonstrates the business brain that customers purchase - the orchestration
 * system that runs their entire business autonomously through SEE → ACT → THINK.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { Brain, Eye, Zap, TrendingUp, Activity, Sparkles, Target, AlertTriangle } from 'lucide-react';
interface SystemStatus {
  thinking: boolean;
  seeing: boolean;
  acting: boolean;
  autonomous: boolean;
  wowMoments: number;
  businessHealth: number;
}

interface WowMoment {
  id: string;
  type: string;
  description: string;
  impact: number;
  departments: string[];
  timestamp: Date;
  evidence: Array<{
    metric: string;
    improvement: number;
  }>;
}

interface LiveThought {
  id: string;
  type: 'prediction' | 'insight' | 'opportunity' | 'risk';
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  departments: string[];
}

interface LiveVision {
  id: string;
  scope: string;
  patterns: string[];
  anomalies: string[];
  trends: string[];
}

interface LiveAction {
  id: string;
  type: 'automated' | 'recommended';
  department: string;
  action: string;
  status: 'pending' | 'executing' | 'completed';
  impact: string;
}

export const NexusOperatingSystemDemo: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    thinking: false,
    seeing: false,
    acting: false,
    autonomous: false,
    wowMoments: 0,
    businessHealth: 0
  });

  const [liveThoughts, setLiveThoughts] = useState<LiveThought[]>([]);
  const [liveVision, setLiveVision] = useState<LiveVision | null>(null);
  const [liveActions, setLiveActions] = useState<LiveAction[]>([]);
  const [wowMoments, setWowMoments] = useState<WowMoment[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Start the Nexus Operating System
  const startNexusOS = () => {
    setIsRunning(true);
    setSystemStatus({
      thinking: true,
      seeing: true,
      acting: true,
      autonomous: true,
      wowMoments: 0,
      businessHealth: 0.87
    });

    // Simulate thinking process
    const thinkingInterval = setInterval(() => {
      const newThought: LiveThought = {
        id: `thought_${Date.now()}`,
        type: ['prediction', 'insight', 'opportunity', 'risk'][Math.floor(Math.random() * 4)] as any,
        description: [
          'Sales velocity increasing 15% - predict revenue breakthrough next week',
          'Marketing ROI pattern suggests doubling ad spend in high-performing channels',
          'Customer satisfaction scores correlate with product feature adoption',
          'Operations efficiency could increase 25% through cross-departmental automation',
          'Risk detected: Customer churn pattern emerging in enterprise segment'
        ][Math.floor(Math.random() * 5)],
        confidence: 0.75 + Math.random() * 0.25,
        impact: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)] as any,
        departments: [
          ['sales', 'marketing'],
          ['marketing', 'finance'],
          ['product', 'customer-success'],
          ['operations', 'hr'],
          ['sales', 'customer-success']
        ][Math.floor(Math.random() * 5)]
      };

      setLiveThoughts(prev => [newThought, ...prev.slice(0, 4)]);
    }, 3000);

    // Simulate vision process
    const visionInterval = setInterval(() => {
      setLiveVision({
        id: `vision_${Date.now()}`,
        scope: 'Organization-wide',
        patterns: [
          'Sales-Marketing alignment increasing (+12%)',
          'Cross-departmental collaboration trending up',
          'Customer acquisition cost decreasing (-8%)'
        ],
        anomalies: [
          'Marketing conversion rate 18% above normal',
          'Operations efficiency spike in last 2 hours'
        ],
        trends: [
          'Revenue trajectory: Accelerating',
          'Team productivity: Increasing',
          'Customer satisfaction: Stable-high'
        ]
      });
    }, 5000);

    // Simulate action process
    const actionInterval = setInterval(() => {
      const newAction: LiveAction = {
        id: `action_${Date.now()}`,
        type: Math.random() > 0.5 ? 'automated' : 'recommended',
        department: ['sales', 'marketing', 'operations', 'finance'][Math.floor(Math.random() * 4)],
        action: [
          'Increase inventory levels by 15% for predicted demand surge',
          'Trigger proactive customer outreach to high-value prospects',
          'Reallocate marketing budget to high-performing channels',
          'Schedule cross-departmental coordination meeting',
          'Implement predictive maintenance for critical systems'
        ][Math.floor(Math.random() * 5)],
        status: 'executing',
        impact: [
          'Prevent stockouts, increase revenue by $125K',
          'Increase conversion rate by 22%',
          'Improve ROI by 35%',
          'Boost efficiency by 18%',
          'Reduce downtime by 40%'
        ][Math.floor(Math.random() * 5)]
      };

      setLiveActions(prev => [newAction, ...prev.slice(0, 3)]);

      // Complete action after 3 seconds
      setTimeout(() => {
        setLiveActions(prev => prev.map(action => 
          action.id === newAction.id ? { ...action, status: 'completed' } : action
        ));
      }, 3000);
    }, 7000);

    // Generate wow moments
    const wowInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every interval
        const newWowMoment: WowMoment = {
          id: `wow_${Date.now()}`,
          type: ['Revenue Breakthrough', 'Efficiency Gain', 'Customer Delight', 'Risk Prevention'][Math.floor(Math.random() * 4)],
          description: [
            'Coordinated sales-marketing push generated 42% revenue spike',
            'Cross-departmental automation reduced operational costs by 28%',
            'Proactive customer outreach prevented 15 high-value churn cases',
            'Predictive analytics identified and prevented supply chain disruption'
          ][Math.floor(Math.random() * 4)],
          impact: 0.8 + Math.random() * 0.2,
          departments: [
            ['sales', 'marketing'],
            ['operations', 'finance'],
            ['sales', 'customer-success'],
            ['operations', 'finance', 'sales']
          ][Math.floor(Math.random() * 4)],
          timestamp: new Date(),
          evidence: [
            { metric: 'Revenue', improvement: 0.35 + Math.random() * 0.15 },
            { metric: 'Efficiency', improvement: 0.20 + Math.random() * 0.10 }
          ]
        };

        setWowMoments(prev => [newWowMoment, ...prev.slice(0, 4)]);
        setSystemStatus(prev => ({ ...prev, wowMoments: prev.wowMoments + 1 }));
      }
    }, 10000);

    // Cleanup intervals when component unmounts or stops
    return () => {
      clearInterval(thinkingInterval);
      clearInterval(visionInterval);
      clearInterval(actionInterval);
      clearInterval(wowInterval);
    };
  };

  const stopNexusOS = () => {
    setIsRunning(false);
    setSystemStatus({
      thinking: false,
      seeing: false,
      acting: false,
      autonomous: false,
      wowMoments: systemStatus.wowMoments,
      businessHealth: systemStatus.businessHealth
    });
  };

  useEffect(() => {
    if (isRunning) {
      const cleanup = startNexusOS();
      return cleanup;
    }
  }, [isRunning]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-4 text-foreground">
          <Brain className="h-8 w-8 text-primary" />
          Nexus Business Operating System
        </h1>
        <p className="text-lg text-muted-foreground">
          The autonomous business brain that customers purchase to run their entire organization
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => setIsRunning(true)} 
            disabled={isRunning}
          >
            <Brain className="h-4 w-4 mr-2" />
            Start Nexus OS
          </Button>
          <Button 
            onClick={stopNexusOS} 
            disabled={!isRunning}
            variant="outline"
          >
            Stop System
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md: grid-cols-5 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${systemStatus.thinking ? 'text-primary' : 'text-muted-foreground'}`}>
                {systemStatus.thinking ? '🧠' : '💤'}
              </div>
              <div className="text-sm text-muted-foreground">THINKING</div>
              <Badge variant={systemStatus.thinking ? 'default' : 'secondary'}>
                {systemStatus.thinking ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${systemStatus.seeing ? 'text-primary' : 'text-muted-foreground'}`}>
                {systemStatus.seeing ? '👁️' : '😴'}
              </div>
              <div className="text-sm text-muted-foreground">SEEING</div>
              <Badge variant={systemStatus.seeing ? 'default' : 'secondary'}>
                {systemStatus.seeing ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${systemStatus.acting ? 'text-primary' : 'text-muted-foreground'}`}>
                {systemStatus.acting ? '⚡' : '🔌'}
              </div>
              <div className="text-sm text-muted-foreground">ACTING</div>
              <Badge variant={systemStatus.acting ? 'default' : 'secondary'}>
                {systemStatus.acting ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${systemStatus.autonomous ? 'text-primary' : 'text-muted-foreground'}`}>
                {systemStatus.autonomous ? '🤖' : '👤'}
              </div>
              <div className="text-sm text-muted-foreground">AUTONOMOUS</div>
              <Badge variant={systemStatus.autonomous ? 'default' : 'secondary'}>
                {systemStatus.autonomous ? 'Enabled' : 'Manual'}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {systemStatus.wowMoments}
              </div>
              <div className="text-sm text-muted-foreground">WOW MOMENTS</div>
              <Badge variant="outline">
                Generated
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trinity System Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* THINK */}
        <Card className="border-green-200 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <Brain className="h-5 w-5" />
              THINK - Predictive Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveThoughts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Start Nexus OS to see live thoughts
              </div>
            ) : (
              liveThoughts.map(thought => (
                <div key={thought.id} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-start gap-2">
                    <Badge variant={
                      thought.type === 'risk' ? 'destructive' :
                      thought.type === 'opportunity' ? 'default' : 'secondary'
                    } className="text-xs">
                      {thought.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {(thought.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm mt-2">{thought.description}</p>
                  <div className="flex gap-1 mt-2">
                    {thought.departments.map(dept => (
                      <Badge key={dept} variant="outline" className="text-xs">
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* SEE */}
        <Card className="border-border bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Eye className="h-5 w-5" />
              SEE - Real-Time Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!liveVision ? (
              <div className="text-center py-8 text-muted-foreground">
                Start Nexus OS to see live vision
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Patterns Detected</h4>
                  <div className="space-y-1">
                    {liveVision.patterns.map((pattern, index) => (
                      <div key={index} className="text-xs p-2 bg-card rounded border">
                        {pattern}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">Anomalies</h4>
                  <div className="space-y-1">
                    {liveVision.anomalies.map((anomaly, index) => (
                      <div key={index} className="text-xs p-2 bg-warning/5 rounded border border-yellow-200">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {anomaly}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Trends</h4>
                  <div className="space-y-1">
                    {liveVision.trends.map((trend, index) => (
                      <div key={index} className="text-xs p-2 bg-success/5 rounded border border-green-200">
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        {trend}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ACT */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Zap className="h-5 w-5" />
              ACT - Autonomous Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveActions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Start Nexus OS to see live actions
              </div>
            ) : (
              liveActions.map(action => (
                <div key={action.id} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-start gap-2 mb-2">
                    <Badge variant={action.type === 'automated' ? 'default' : 'secondary'} className="text-xs">
                      {action.type}
                    </Badge>
                    <Badge variant={
                      action.status === 'completed' ? 'default' :
                      action.status === 'executing' ? 'secondary' : 'outline'
                    } className="text-xs">
                      {action.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{action.department}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.action}</p>
                  <p className="text-xs text-success mt-1">💰 {action.impact}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wow Moments */}
      <Card className="border-yellow-200 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Sparkles className="h-5 w-5" />
            Wow Moments Generated
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wowMoments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Start Nexus OS to generate wow moments
            </div>
          ) : (
            <div className="space-y-4">
              {wowMoments.map(moment => (
                <Alert key={moment.id} className="border-yellow-300 bg-warning/5">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {moment.type}
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          {(moment.impact * 100).toFixed(0)}% Impact
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {moment.departments.join(', ')}
                        </span>
                      </div>
                      <p className="font-medium">{moment.description}</p>
                      <div className="flex gap-4 text-xs">
                        {moment.evidence.map(evidence => (
                          <span key={evidence.metric} className="text-success">
                            {evidence.metric}: +{(evidence.improvement * 100).toFixed(1)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Impact */}
      <Card className="border-purple-200 bg-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Target className="h-5 w-5" />
            Business Impact Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
            <div className="text-center p-4 bg-card rounded-lg">
              <div className="text-2xl font-bold text-success">+{systemStatus.wowMoments * 35}%</div>
              <div className="text-sm text-muted-foreground">Revenue Growth</div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg">
              <div className="text-2xl font-bold text-primary">+{systemStatus.wowMoments * 28}%</div>
              <div className="text-sm text-muted-foreground">Efficiency Gain</div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg">
              <div className="text-2xl font-bold text-secondary">{(systemStatus.businessHealth * 100).toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Business Health</div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg">
              <div className="text-2xl font-bold text-warning">{systemStatus.wowMoments * 12}</div>
              <div className="text-sm text-muted-foreground">Automated Actions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NexusOperatingSystemDemo; 