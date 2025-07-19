import React, { useEffect } from 'react';
import { useEnhancedFireCycle } from './enhancedFireCycleStore';
import { IntelligentFireCycle } from './IntelligentFireCycle';
import { FireCycleContextual } from './FireCycleContextual';

interface FireCycleIntegrationProps {
  context: 'dashboard' | 'analytics' | 'projects' | 'workspace';
  showIntelligent?: boolean;
  showContextual?: boolean;
  className?: string;
}

export const FireCycleIntegration: React.FC<FireCycleIntegrationProps> = ({
  context,
  showIntelligent = true,
  showContextual = true,
  className = ''
}) => {
  const {
    updateGoals,
    updateProjects,
    updateMetrics,
    updateChallenges,
    triggerAnalysis
  } = useEnhancedFireCycle();

  // Simulate data integration - in real app, this would come from your data sources
  useEffect(() => {
    const simulateDataIntegration = async () => {
      // Example: Update user context with real data
      // This would typically come from your API calls, database, etc.
      
      // Update goals (example)
      updateGoals([
        'Increase revenue by 20%',
        'Improve customer satisfaction',
        'Launch new product line'
      ]);

      // Update projects (example)
      updateProjects([
        {
          id: '1',
          name: 'Q4 Revenue Campaign',
          status: 'active',
          priority: 'high',
          progress: 65,
          team: ['Marketing', 'Sales'],
          metrics: []
        },
        {
          id: '2',
          name: 'Customer Feedback System',
          status: 'planning',
          priority: 'medium',
          progress: 25,
          team: ['Product', 'Engineering'],
          metrics: []
        }
      ]);

      // Update metrics (example)
      updateMetrics([
        {
          id: '1',
          name: 'Monthly Revenue',
          value: 125000,
          target: 150000,
          unit: 'USD',
          category: 'revenue',
          trend: 'up',
          changePercent: 8.5,
          lastUpdated: new Date()
        },
        {
          id: '2',
          name: 'Customer Satisfaction',
          value: 4.2,
          target: 4.5,
          unit: 'score',
          category: 'health',
          trend: 'stable',
          changePercent: 0,
          lastUpdated: new Date()
        }
      ]);

      // Update challenges (example)
      updateChallenges([
        'Limited marketing budget',
        'Team bandwidth constraints',
        'Competitive market pressure'
      ]);

      // Trigger analysis after data update
      await triggerAnalysis();
    };

    simulateDataIntegration();
  }, [updateGoals, updateProjects, updateMetrics, updateChallenges, triggerAnalysis]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Intelligent FIRE Cycle */}
      {showIntelligent && (
        <IntelligentFireCycle 
          variant="compact" 
          autoAnalyze={true}
        />
      )}

      {/* Contextual FIRE Cycle */}
      {showContextual && (
        <FireCycleContextual 
          context={context as any}
        />
      )}

      {/* Integration Status */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-2">FIRE Cycle Integration</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Context: {context} | Intelligent Analysis: {showIntelligent ? 'Enabled' : 'Disabled'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Data Sources:</span>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>• User Goals & Challenges</li>
              <li>• Project Progress</li>
              <li>• Performance Metrics</li>
              <li>• Activity Patterns</li>
            </ul>
          </div>
          
          <div>
            <span className="font-medium">Analysis Output:</span>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>• Phase Recommendations</li>
              <li>• Priority Actions</li>
              <li>• Risk Insights</li>
              <li>• Opportunity Detection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for easy FIRE cycle integration
export const useFireCycleIntegration = (_context: string) => {
  const {
    phase,
    analysis,
    currentInsights,
    currentRecommendations,
    currentActions,
    priority,
    confidence,
    triggerAnalysis,
    updateGoals,
    updateProjects,
    updateMetrics,
    updateChallenges
  } = useEnhancedFireCycle();

  return {
    // Current state
    phase,
    analysis,
    insights: currentInsights,
    recommendations: currentRecommendations,
    actions: currentActions,
    priority,
    confidence,
    
    // Actions
    triggerAnalysis,
    updateGoals,
    updateProjects,
    updateMetrics,
    updateChallenges,
    
    // Context-specific helpers
    getContextualRecommendations: () => {
      return currentRecommendations.filter(rec => 
        rec.type === 'action' || rec.type === 'strategy'
      );
    },
    
    getHighPriorityActions: () => {
      return currentActions.filter(action => 
        action.priority === 'high' || action.priority === 'critical'
      );
    },
    
    getImmediateActions: () => {
      return currentActions.filter(action => 
        action.type === 'immediate'
      );
    },
    
    // Analysis helpers
    isAnalysisReady: analysis !== null,
    hasHighPriorityItems: priority === 'high' || priority === 'critical',
    hasConfidentAnalysis: confidence >= 0.7,
    
    // Context-specific analysis
    getContextAnalysis: () => {
      if (!analysis) return null;
      
      return {
        phase,
        reasoning: analysis.reasoning,
        topInsight: currentInsights[0],
        topRecommendation: currentRecommendations[0],
        topAction: currentActions[0],
        priority,
        confidence
      };
    }
  };
}; 