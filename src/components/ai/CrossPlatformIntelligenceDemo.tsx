/**
 * CrossPlatformIntelligenceDemo.tsx
 * 
 * Interactive demonstration of how cross-platform analytics data enhances
 * AI decision-making, LLM calls, and app routing throughout Nexus.
 */

import React, { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, Activity, Database, Network } from 'lucide-react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button,
  Badge,
  Progress
} from '@/components/ui';

interface PlatformData {
  name: string;
  status: 'connected' | 'syncing' | 'error';
  lastUpdate: string;
  keyMetrics: Record<string, string | number>;
  icon: string;
}

interface AIInsight {
  type: 'correlation' | 'prediction' | 'recommendation';
  confidence: number;
  description: string;
  platforms: string[];
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

interface RoutingDecision {
  query: string;
  recommendedAgent: string;
  confidence: number;
  reasoning: string;
  contextUsed: string[];
}

export const CrossPlatformIntelligenceDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<'overview' | 'routing' | 'llm' | 'insights'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);

  // Mock cross-platform data
  const platformData: PlatformData[] = [
    {
      name: 'HubSpot CRM',
      status: 'connected',
      lastUpdate: '2 minutes ago',
      keyMetrics: { pipeline: '$245,000', deals: 47, conversion: '28%', trend: 'up' },
      icon: '🎯'
    },
    {
      name: 'Cloudflare',
      status: 'connected',
      lastUpdate: '1 minute ago',
      keyMetrics: { uptime: '99.97%', response: '180ms', threats: 1247 },
      icon: '🛡️'
    },
    {
      name: 'Google Workspace',
      status: 'connected',
      lastUpdate: '3 minutes ago',
      keyMetrics: { emails: '156/day', meetings: '12h/week', docs: 89 },
      icon: '📧'
    },
    {
      name: 'Marcoby Cloud',
      status: 'connected',
      lastUpdate: '5 minutes ago',
      keyMetrics: { utilization: '72%', uptime: '99.95%', cost: '$1,250/mo' },
      icon: '☁️'
    }
  ];

  // Mock AI insights
  const aiInsights: AIInsight[] = [
    {
      type: 'correlation',
      confidence: 87,
      description: 'High email volume correlates with 23% increase in deal velocity',
      platforms: ['Google Workspace', 'HubSpot CRM'],
      impact: 'high',
      actionable: true
    },
    {
      type: 'prediction',
      confidence: 92,
      description: 'Current trends suggest 34% Q1 lead increase',
      platforms: ['HubSpot CRM', 'Cloudflare', 'Google Workspace'],
      impact: 'high',
      actionable: true
    },
    {
      type: 'recommendation',
      confidence: 79,
      description: 'Infrastructure scaling needed by month-end (current 72% utilization)',
      platforms: ['Marcoby Cloud', 'HubSpot CRM'],
      impact: 'medium',
      actionable: true
    }
  ];

  // Mock routing decisions
  const routingExamples: RoutingDecision[] = [
    {
      query: "How's our sales performance?",
      recommendedAgent: "Sales Specialist",
      confidence: 95,
      reasoning: "High deal velocity period detected - sales team performing exceptionally",
      contextUsed: ['HubSpot pipeline data', 'Email engagement patterns', 'Website performance']
    },
    {
      query: "Our website seems slow",
      recommendedAgent: "Technical Operations",
      confidence: 89,
      reasoning: "Cloudflare shows 180ms response time (actually good) - likely perception issue",
      contextUsed: ['Cloudflare performance metrics', 'Infrastructure utilization', 'User traffic patterns']
    },
    {
      query: "Plan for Q1 growth",
      recommendedAgent: "Executive Assistant",
      confidence: 93,
      reasoning: "Strategic planning needed - 34% lead increase predicted, infrastructure scaling required",
      contextUsed: ['Cross-platform trends', 'Predictive analytics', 'Resource capacity analysis']
    }
  ];

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setCurrentInsight(aiInsights[Math.floor(Math.random() * aiInsights.length)]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'syncing': return 'text-warning';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-warning/10 text-yellow-800';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-secondary" />
          <h1 className="text-3xl font-bold">Cross-Platform AI Intelligence</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          See how combining data from multiple platforms creates a contextual intelligence multiplier 
          that transforms AI decision-making, LLM calls, and app routing.
        </p>
      </div>

      {/* Demo Navigation */}
      <div className="flex justify-center gap-2">
        {[
          { id: 'overview', label: 'Platform Overview', icon: Database },
          { id: 'insights', label: 'AI Insights', icon: Brain },
          { id: 'routing', label: 'Smart Routing', icon: Network },
          { id: 'llm', label: 'Enhanced LLM', icon: Zap }
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={selectedDemo === id ? 'default' : 'outline'}
            onClick={() => setSelectedDemo(id as 'overview' | 'routing' | 'llm' | 'insights')}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Platform Overview */}
      {selectedDemo === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformData.map((platform, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <CardTitle className="text-sm">{platform.name}</CardTitle>
                      <CardDescription className="text-xs">
                        <span className={getStatusColor(platform.status)}>
                          ● {platform.status}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(platform.keyMetrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground mt-2">
                  Updated {platform.lastUpdate}
                </div>
              </CardContent>
              {platform.status === 'connected' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* AI Insights */}
      {selectedDemo === 'insights' && (
        <div className="space-y-6">
          <div className="text-center">
            <Button 
              onClick={simulateAnalysis} 
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {isAnalyzing ? 'Analyzing Cross-Platform Patterns...' : 'Discover New Insights'}
            </Button>
          </div>

          {isAnalyzing && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 animate-spin text-secondary" />
                    <span className="font-medium">AI Correlation Engine Active</span>
                  </div>
                  <Progress value={75} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    Analyzing patterns across HubSpot, Cloudflare, Google Workspace, and Marcoby Cloud...
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentInsight && (
            <Card className="border-purple-200 bg-secondary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-secondary" />
                    AI-Discovered Insight
                  </CardTitle>
                  <Badge className={getImpactColor(currentInsight.impact)}>
                    {currentInsight.impact} impact
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium">{currentInsight.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <Progress value={currentInsight.confidence} className="flex-1 max-w-32" />
                  <span className="text-sm font-medium">{currentInsight.confidence}%</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Data sources:</span>
                  {currentInsight.platforms.map((platform, idx) => (
                    <Badge key={idx} variant="outline">{platform}</Badge>
                  ))}
                </div>
                {currentInsight.actionable && (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Actionable recommendation available</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {aiInsights.map((insight, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.type === 'correlation' ? 'default' : 
                                      insight.type === 'prediction' ? 'secondary' : 'outline'}>
                          {insight.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{insight.confidence}% confidence</span>
                      </div>
                      <p className="font-medium">{insight.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {insight.platforms.map((platform, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{platform}</Badge>
                        ))}
                      </div>
                    </div>
                    <Badge className={getImpactColor(insight.impact)}>
                      {insight.impact}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Smart Routing */}
      {selectedDemo === 'routing' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Intelligent Agent Routing
              </CardTitle>
              <CardDescription>
                See how cross-platform context improves AI agent selection and routing decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {routingExamples.map((example, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">User Query:</span>
                      <span className="font-medium">"{example.query}"</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Routed to:</span>
                        <Badge>{example.recommendedAgent}</Badge>
                        <span className="text-sm text-muted-foreground">({example.confidence}% confidence)</span>
                      </div>
                    </div>
                    
                    <div className="bg-background rounded p-4 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">AI Reasoning:</span> {example.reasoning}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Context Used:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {example.contextUsed.map((context, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{context}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced LLM */}
      {selectedDemo === 'llm' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-warning" />
                Enhanced LLM Calls
              </CardTitle>
              <CardDescription>
                Compare responses with and without cross-platform context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="space-y-4">
                  <h4 className="font-medium text-destructive">❌ Without Cross-Platform Context</h4>
                  <div className="bg-destructive/5 border border-red-200 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">User: "How's our sales performance?"</div>
                    <div className="text-sm text-foreground/90">
                      "I'd be happy to help you check your sales performance. Could you provide more details about what specific metrics you'd like to see?"
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Generic response requiring clarification • No business context • Reactive assistance
                  </div>
                </div>

                {/* After */}
                <div className="space-y-4">
                  <h4 className="font-medium text-success">✅ With Cross-Platform Intelligence</h4>
                  <div className="bg-success/5 border border-green-200 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">User: "How's our sales performance?"</div>
                    <div className="text-sm text-foreground/90 space-y-2">
                      <div>"Your sales performance is strong! Based on real-time data:"</div>
                      <div>📊 Current Pipeline: $245,000 (47 active deals)</div>
                      <div>📈 Conversion Rate: 28% (up 5% from last month)</div>
                      <div>🚀 Deal Velocity: 23% faster due to high email engagement</div>
                      <div className="mt-2 text-primary">
                        "🧠 AI Insight: Your Google Workspace shows 156 emails/day, which correlates with improved deal velocity!"
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Immediately actionable • Complete business context • Proactive insights with correlations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context Enhancement Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">LLM Context Enhancement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-primary/5 border border-border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Enhanced System Prompt Includes:</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Real-time data from all connected platforms</li>
                    <li>• AI-discovered correlations and patterns</li>
                    <li>• Predictive insights and recommendations</li>
                    <li>• Business state context and resource utilization</li>
                    <li>• Historical patterns and trend analysis</li>
                  </ul>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-4 bg-background rounded">
                    <div className="font-medium text-2xl text-secondary">90%</div>
                    <div>Response Relevance</div>
                  </div>
                  <div className="text-center p-4 bg-background rounded">
                    <div className="font-medium text-2xl text-secondary">85%</div>
                    <div>Include Predictions</div>
                  </div>
                  <div className="text-center p-4 bg-background rounded">
                    <div className="font-medium text-2xl text-secondary">8+</div>
                    <div>Data Sources</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6 text-center space-y-4">
          <h3 className="text-xl font-bold">The Intelligence Multiplier Effect</h3>
          <p className="text-foreground/90 max-w-2xl mx-auto">
            Cross-platform analytics doesn't just add data—it multiplies intelligence. 
            With 8+ integrated platforms, Nexus creates AI that truly understands your business holistically.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Badge variant="outline">1 Platform: Basic metrics</Badge>
            <Badge variant="outline">2-3 Platforms: Simple correlations</Badge>
            <Badge variant="outline">4-6 Platforms: Pattern recognition</Badge>
            <Badge className="bg-secondary">8+ Platforms: Unified intelligence</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 