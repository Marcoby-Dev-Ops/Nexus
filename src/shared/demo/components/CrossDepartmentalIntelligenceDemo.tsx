/**
 * Cross-Departmental Intelligence Demo
 * 
 * Demonstrates how the Sales module provides intelligent feedback that considers
 * the entire organizational ecosystem and cross-departmental impact.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, BarChart3, Network, Brain, Target } from 'lucide-react';
interface DemoScenario {
  id: string;
  title: string;
  description: string;
  query: string;
  expectedInsights: string[];
  impactedDepartments: string[];
}

const DEMOSCENARIOS: DemoScenario[] = [
  {
    id: 'pipeline-analysis',
    title: 'Pipeline Health Analysis',
    description: 'Sales asks about pipeline health, system considers operational capacity and marketing alignment',
    query: 'How healthy is our current sales pipeline?',
    expectedInsights: [
      'Strong pipeline ($2.5M) but operations team at 85% capacity',
      'Marketing lead quality improving (+12%) but sales velocity declining (-5%)',
      'High-value deals may face delivery constraints'
    ],
    impactedDepartments: ['sales', 'operations', 'marketing', 'finance']
  },
  {
    id: 'deal-strategy',
    title: 'Deal Closing Strategy',
    description: 'Sales strategy considers customer success capacity and financial impact',
    query: 'What\'s the best strategy for closing the Enterprise Corp deal?',
    expectedInsights: [
      'Customer success team has bandwidth for enterprise onboarding',
      'Deal timing aligns with Q3 cash flow projections',
      'Operations team needs 2-week lead time for capacity planning'
    ],
    impactedDepartments: ['sales', 'customer-success', 'operations', 'finance']
  },
  {
    id: 'team-performance',
    title: 'Team Performance Review',
    description: 'Performance analysis considers cross-departmental collaboration metrics',
    query: 'How is our sales team performing this quarter?',
    expectedInsights: [
      'Sales-marketing alignment at 78% (above industry average)',
      'Customer handoff efficiency improved by 15%',
      'HR recommends additional training for negotiation skills'
    ],
    impactedDepartments: ['sales', 'marketing', 'customer-success', 'hr']
  }
];

export const CrossDepartmentalIntelligenceDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('insights');

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate demo results
    const results = {
      primaryResponse: generatePrimaryResponse(selectedScenario),
      crossDepartmentalInsights: generateCrossDepartmentalInsights(selectedScenario),
      organizationalRecommendations: generateOrganizationalRecommendations(selectedScenario),
      riskWarnings: generateRiskWarnings(selectedScenario),
      opportunityHighlights: generateOpportunityHighlights(selectedScenario),
      impactAnalysis: generateImpactAnalysis(selectedScenario),
      actionPlan: generateActionPlan(selectedScenario)
    };
    
    setAnalysisResults(results);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Cross-Departmental Intelligence Demo
        </h2>
        <p className="text-muted-foreground">
          See how the Sales module provides intelligent feedback considering the entire organizational ecosystem
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="bg-card rounded-lg shadow-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select Demo Scenario
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
            {DEMO_SCENARIOS.map(scenario => (
              <div 
                key={scenario.id}
                className={`cursor-pointer transition-all border rounded-lg ${
                  selectedScenario.id === scenario.id 
                    ? 'ring-2 ring-blue-500 bg-primary/5 border-border' 
                    : 'hover:bg-background border-border'
                }`}
                onClick={() => setSelectedScenario(scenario)}
              >
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{scenario.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {scenario.impactedDepartments.map(dept => (
                      <span key={dept} className="px-2 py-1 bg-gray-200 text-foreground/90 rounded-full text-xs">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Query Input */}
      <div className="bg-card rounded-lg shadow-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Sales Query</h3>
        </div>
        <div className="p-6">
          <div className="bg-background p-4 rounded-lg mb-4">
            <p className="font-medium text-foreground">{selectedScenario.query}</p>
          </div>
          <button 
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full px-4 py-2 bg-primary hover: bg-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-primary-foreground rounded-md transition-colors"
          >
            {isAnalyzing ? 'Analyzing Cross-Departmental Impact...' : 'Run Cross-Departmental Analysis'}
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="bg-card rounded-lg shadow-lg border border-border">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex space-x-1">
                {[
                  { id: 'insights', label: 'Insights' },
                  { id: 'recommendations', label: 'Recommendations' },
                  { id: 'impact', label: 'Impact Analysis' },
                  { id: 'actions', label: 'Action Plan' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover: text-foreground hover:bg-muted'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Network className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Cross-Departmental Insights</h3>
                    </div>
                    {analysisResults.crossDepartmentalInsights.map((insight: any, index: number) => (
                      <div key={index} className="border-l-4 border-l-blue-500 bg-primary/5 p-4 rounded-r-lg">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="h-4 w-4 text-primary mt-0.5" />
                          <div className="space-y-2 flex-1">
                            <p className="font-medium">{insight.insight}</p>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                insight.severity === 'high' 
                                  ? 'bg-destructive/10 text-destructive' 
                                  : 'bg-muted text-foreground/90'
                              }`}>
                                {insight.severity} severity
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Affects: {insight.affectedDepartments.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Organizational Recommendations</h3>
                  </div>
                  {analysisResults.organizationalRecommendations.map((rec: string, index: number) => (
                    <div key={index} className="bg-success/5 border border-green-200 p-4 rounded-lg">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                        <p className="text-foreground">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Impact Analysis Tab */}
              {activeTab === 'impact' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Impact Analysis</h3>
                  </div>
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    {Object.entries(analysisResults.impactAnalysis).map(([dept, impact]: [string, any]) => (
                      <div key={dept} className="bg-card border border-border p-4 rounded-lg">
                        <h4 className="font-semibold capitalize mb-2">{dept.replace('-', ' ')}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Impact Level: </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              impact.level === 'high' ? 'bg-destructive/10 text-destructive' :
                              impact.level === 'medium' ? 'bg-warning/10 text-yellow-700' :
                              'bg-success/10 text-success'
                            }`}>
                              {impact.level}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90">{impact.description}</p>
                          {impact.metrics && (
                            <div className="text-xs text-muted-foreground">
                              Metrics: {impact.metrics}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Plan Tab */}
              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Action Plan</h3>
                  </div>
                  {analysisResults.actionPlan.map((action: any, index: number) => (
                    <div key={index} className="bg-card border border-border p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold">{action.action}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          action.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                          action.priority === 'medium' ? 'bg-warning/10 text-yellow-700' :
                          'bg-success/10 text-success'
                        }`}>
                          {action.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 mb-3">{action.description}</p>
                      <div className="grid grid-cols-1 md: grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="font-medium text-muted-foreground">Owner:</span>
                          <p className="text-foreground">{action.owner}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Timeline:</span>
                          <p className="text-foreground">{action.timeline}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Dependencies:</span>
                          <p className="text-foreground">{action.dependencies.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Demo Benefits */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Cross-Departmental Intelligence Benefits
        </h3>
        
        <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4">
            <h4 className="font-semibold mb-2">🔗 Organizational Awareness</h4>
            <p className="text-sm text-muted-foreground">
              Every sales decision considers the impact on operations, customer success, 
              finance, and other departments for holistic business health.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <h4 className="font-semibold mb-2">⚡ Real-Time Coordination</h4>
            <p className="text-sm text-muted-foreground">
              Sales actions automatically trigger relevant alerts and recommendations 
              across departments, ensuring seamless coordination.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <h4 className="font-semibold mb-2">📊 Data-Driven Decisions</h4>
            <p className="text-sm text-muted-foreground">
              Sales strategies are informed by comprehensive organizational data, 
              leading to more informed and successful outcomes.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <h4 className="font-semibold mb-2">🎯 Unified Goals</h4>
            <p className="text-sm text-muted-foreground">
              All departments work toward common objectives with sales activities 
              aligned to overall business strategy and capacity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for generating demo data
function generatePrimaryResponse(scenario: DemoScenario): string {
  const responses = {
    'pipeline-analysis': 'Your pipeline shows strong potential with $2.5M in opportunities, but requires careful capacity management.',
    'deal-strategy': 'Enterprise Corp deal is strategically aligned with our Q3 objectives and operational capacity.',
    'team-performance': 'Sales team performance is strong with excellent cross-departmental collaboration metrics.'
  };
  return responses[scenario.id as keyof typeof responses] || 'Analysis complete.';
}

function generateCrossDepartmentalInsights(scenario: DemoScenario): any[] {
  return [
    {
      insight: scenario.expectedInsights[0],
      severity: 'medium',
      affectedDepartments: scenario.impactedDepartments.slice(0, 2),
      confidence: 0.85
    },
    {
      insight: scenario.expectedInsights[1] || 'Additional cross-departmental consideration identified.',
      severity: 'low',
      affectedDepartments: scenario.impactedDepartments.slice(1, 3),
      confidence: 0.92
    }
  ];
}

function generateOrganizationalRecommendations(scenario: DemoScenario): string[] {
  const recommendations = {
    'pipeline-analysis': [
      'Coordinate with operations team to plan capacity for Q3 deal closures',
      'Align marketing campaigns with sales velocity targets',
      'Implement deal prioritization based on operational constraints'
    ],
    'deal-strategy': [
      'Schedule enterprise onboarding planning meeting with customer success',
      'Confirm Q3 cash flow projections with finance team',
      'Provide 2-week advance notice to operations for capacity planning'
    ],
    'team-performance': [
      'Maintain current sales-marketing alignment processes',
      'Implement HR-recommended negotiation skills training',
      'Continue optimizing customer handoff procedures'
    ]
  };
  return recommendations[scenario.id as keyof typeof recommendations] || ['General recommendation'];
}

function generateRiskWarnings(scenario: DemoScenario): string[] {
  return [
    'High-value deals may strain operational capacity if not properly planned',
    'Sales velocity decline could impact Q3 revenue projections',
    'Customer satisfaction at risk if delivery teams are overcommitted'
  ];
}

function generateOpportunityHighlights(scenario: DemoScenario): string[] {
  return [
    'Marketing lead quality improvements creating better sales opportunities',
    'Strong cross-departmental collaboration enabling faster deal cycles',
    'Customer success team capacity available for strategic account growth'
  ];
}

function generateImpactAnalysis(scenario: DemoScenario): any {
  return {
    sales: {
      level: 'high',
      description: 'Direct impact on sales targets and team performance metrics',
      metrics: 'Pipeline value, conversion rates, deal velocity'
    },
    operations: {
      level: 'medium',
      description: 'Capacity planning and resource allocation considerations',
      metrics: 'Team utilization, delivery timelines'
    },
    finance: {
      level: 'medium',
      description: 'Revenue projections and cash flow implications',
      metrics: 'Q3 revenue, payment terms, margin analysis'
    },
    'customer-success': {
      level: 'low',
      description: 'Onboarding capacity and customer satisfaction impact',
      metrics: 'Onboarding queue, satisfaction scores'
    }
  };
}

function generateActionPlan(scenario: DemoScenario): any[] {
  return [
    {
      action: 'Coordinate capacity planning meeting',
      description: 'Align sales pipeline with operational delivery capacity',
      priority: 'high',
      owner: 'Sales Manager',
      timeline: '1 week',
      dependencies: ['operations', 'finance']
    },
    {
      action: 'Implement deal prioritization framework',
      description: 'Prioritize deals based on strategic value and operational feasibility',
      priority: 'medium',
      owner: 'Sales Operations',
      timeline: '2 weeks',
      dependencies: ['sales', 'operations']
    },
    {
      action: 'Schedule cross-departmental alignment review',
      description: 'Regular review of cross-departmental metrics and coordination',
      priority: 'low',
      owner: 'Department Heads',
      timeline: 'Monthly',
      dependencies: ['all departments']
    }
  ];
} 