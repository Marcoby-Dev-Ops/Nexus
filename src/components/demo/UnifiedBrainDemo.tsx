import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, Target, Lightbulb, CheckCircle } from 'lucide-react';
import { nexusUnifiedBrain } from '../../lib/core/nexusUnifiedBrain';

export const UnifiedBrainDemo: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState(nexusUnifiedBrain.getSystemStatus());
  const [recentAnalyses, setRecentAnalyses] = useState(nexusUnifiedBrain.getRecentAnalyses());
  const [businessIntelligence, setBusinessIntelligence] = useState(nexusUnifiedBrain.getBusinessIntelligence());
  const [demoActions, setDemoActions] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(nexusUnifiedBrain.getSystemStatus());
      setRecentAnalyses(nexusUnifiedBrain.getRecentAnalyses());
      setBusinessIntelligence(nexusUnifiedBrain.getBusinessIntelligence());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const simulateUserAction = async (action: string, context: Record<string, any>) => {
    const analysis = await nexusUnifiedBrain.captureUserAction('demo_user', action, context);
    setDemoActions(prev => [...prev, action]);
    
    // Update state immediately
    setSystemStatus(nexusUnifiedBrain.getSystemStatus());
    setRecentAnalyses(nexusUnifiedBrain.getRecentAnalyses());
    setBusinessIntelligence(nexusUnifiedBrain.getBusinessIntelligence());
  };

  const demoScenarios = [
    {
      title: 'First-Time Entrepreneur',
      description: 'No business experience, needs expert guidance',
      action: 'Looking at first sales opportunity',
      context: { deal_value: 5000, customer_type: 'small_business', confidence: 0.3 }
    },
    {
      title: 'Struggling with Costs',
      description: 'Business owner trying to optimize expenses',
      action: 'Reviewing monthly expenses',
      context: { monthly_costs: 12000, revenue: 15000, margin: 0.2 }
    },
    {
      title: 'Scaling Challenges',
      description: 'Growing business needs operational excellence',
      action: 'Planning team expansion',
      context: { current_team: 5, planned_hires: 3, productivity_concerns: true }
    },
    {
      title: 'Market Expansion',
      description: 'Ready to enter new markets',
      action: 'Researching new market segments',
      context: { target_market: 'enterprise', competition_level: 'high', budget: 50000 }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Nexus Unified Business Brain</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          The complete business operating system that gives anyone the collective intelligence 
          of seasoned business experts across all domains.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Every action analyzed</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>All data considered</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Expert advice provided</span>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-card rounded-lg shadow-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Brain System Status
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{systemStatus.actionsProcessed}</div>
              <div className="text-sm text-muted-foreground">Actions Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{systemStatus.analysesGenerated}</div>
              <div className="text-sm text-muted-foreground">Expert Analyses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{systemStatus.expertiseDomainsActive}</div>
              <div className="text-sm text-muted-foreground">Expert Domains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {systemStatus.businessIntelligenceGenerated ? '✓' : '○'}
              </div>
              <div className="text-sm text-muted-foreground">Intelligence Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {systemStatus.analyzing ? '🧠' : '⏸️'}
              </div>
              <div className="text-sm text-muted-foreground">Brain Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Scenarios */}
      <div className="bg-card rounded-lg shadow-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Democratizing Business Expertise
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoScenarios.map((scenario, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-semibold">{scenario.title}</h3>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                </div>
                <button
                  onClick={() => simulateUserAction(scenario.action, scenario.context)}
                  className="w-full px-4 py-2 border border-border rounded-md hover:bg-background transition-colors"
                >
                  Simulate: {scenario.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      {demoActions.length > 0 && (
        <div className="bg-card rounded-lg shadow-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              Actions Processed by Brain
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {demoActions.slice(-5).map((action, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-background rounded">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm">{action}</span>
                  <span className="ml-auto px-2 py-1 bg-gray-200 text-foreground/90 rounded-full text-xs">Analyzed</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Expert Analyses */}
      {recentAnalyses.length > 0 && (
        <div className="bg-card rounded-lg shadow-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Expert Business Analyses
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentAnalyses.slice(-3).map((analysis, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{analysis.actionAnalyzed}</h3>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">{analysis.businessContext}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Expert Insights:</h4>
                    {analysis.expertInsights.slice(0, 2).map((insight, i) => (
                      <div key={i} className="bg-primary/5 p-2 rounded text-sm">
                        <strong>{insight.domain}:</strong> {insight.insight}
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recommendations:</h4>
                    {analysis.recommendations.slice(0, 2).map((rec, i) => (
                      <div key={i} className="bg-success/5 p-2 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            rec.riskLevel === 'high' ? 'bg-destructive' : 
                            rec.riskLevel === 'medium' ? 'bg-warning' : 'bg-success'
                          }`}></span>
                          <span className="font-medium">{rec.action}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{rec.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Business Intelligence */}
      {businessIntelligence && (
        <div className="bg-card rounded-lg shadow-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Business Intelligence
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Current Business Profile</h3>
                  <span className="px-2 py-1 bg-secondary/10 text-purple-700 rounded-full text-xs">
                    Active
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Experience Level:</h4>
                  <div className="bg-secondary/5 p-2 rounded text-sm">
                    {businessIntelligence.userProfile.experienceLevel}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Business Goals:</h4>
                  {businessIntelligence.userProfile.businessGoals.map((goal, i) => (
                    <div key={i} className="bg-orange-50 p-2 rounded text-sm">
                      • {goal}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brain Capabilities */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          What Makes This Brain Special
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4">
            <h4 className="font-semibold mb-2">🎯 Universal Action Analysis</h4>
            <p className="text-sm text-muted-foreground">
              Every single action you take is captured and analyzed through the lens of 
              seasoned business expertise across all domains.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <h4 className="font-semibold mb-2">🧠 20+ Years of Business Knowledge</h4>
            <p className="text-sm text-muted-foreground">
              Contains the collective wisdom of experienced entrepreneurs, giving you 
              expert-level guidance on every decision.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <h4 className="font-semibold mb-2">⚡ Real-Time Intelligence</h4>
            <p className="text-sm text-muted-foreground">
              Processes your business data in real-time, providing immediate insights 
              and recommendations as situations develop.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <h4 className="font-semibold mb-2">🎯 Democratized Expertise</h4>
            <p className="text-sm text-muted-foreground">
              Levels the playing field by giving anyone access to the same quality of 
              business intelligence as seasoned professionals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 