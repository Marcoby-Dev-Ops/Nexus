import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FireCycleLogicEngine, type UserContext, type FireAnalysis } from './fireCycleLogic';
import type { FireCyclePhase } from '@/types/business/fire-cycle';

interface EnhancedFireCycleStore {
  // Current state
  phase: FireCyclePhase;
  analysis: FireAnalysis | null;
  userContext: UserContext | null;
  
  // Actions
  setPhase: (phase: FireCyclePhase) => void;
  updateUserContext: (context: Partial<UserContext>) => void;
  analyzeAndRecommend: () => Promise<FireAnalysis>;
  reset: () => void;
  
  // Computed values
  isAnalysisReady: boolean;
  currentInsights: any[];
  currentRecommendations: any[];
  currentActions: any[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export const useEnhancedFireCycleStore = create<EnhancedFireCycleStore>()(
  persist(
    (set, get) => ({
      phase: 'focus',
      analysis: null,
      userContext: null,
      
      setPhase: (phase) => set({ phase }),
      
      updateUserContext: (contextUpdate) => {
        const currentContext = get().userContext;
        const updatedContext = currentContext 
          ? { ...currentContext, ...contextUpdate }
          : contextUpdate as UserContext;
        
        set({ userContext: updatedContext });
      },
      
      analyzeAndRecommend: async () => {
        const { userContext } = get();
        
        if (!userContext) {
          // Return default analysis if no user context
          const defaultAnalysis: FireAnalysis = {
            phase: 'focus',
            insights: [{
              id: 'default-insight',
              type: 'opportunity',
              title: 'Complete Your Profile',
              description: 'Add more information to get personalized recommendations',
              evidence: ['Limited user data available'],
              impact: 'medium',
              confidence: 0.3
            }],
            recommendations: [{
              id: 'default-recommendation',
              type: 'action',
              title: 'Complete Profile Setup',
              description: 'Add your goals, projects, and challenges for better recommendations',
              rationale: 'More data enables better analysis',
              expectedOutcome: 'Personalized FIRE cycle recommendations',
              effort: 'low',
              priority: 'medium'
            }],
            actions: [{
              id: 'default-action',
              title: 'Update Your Profile',
              description: 'Add your current projects, goals, and challenges',
              type: 'immediate',
              effort: 'low',
              impact: 'medium',
              estimatedDuration: 15
            }],
            priority: 'medium',
            confidence: 0.3,
            reasoning: 'Limited user data available for analysis'
          };
          
          set({ analysis: defaultAnalysis });
          return defaultAnalysis;
        }
        
        // Perform intelligent analysis
        const logicEngine = new FireCycleLogicEngine(userContext);
        const analysis = logicEngine.analyzeCurrentPhase();
        
        set({ 
          analysis,
          phase: analysis.phase // Update phase based on analysis
        });
        
        return analysis;
      },
      
      reset: () => set({ 
        phase: 'focus', 
        analysis: null, 
        userContext: null 
      }),
      
      // Computed values
      get isAnalysisReady() {
        return get().userContext !== null;
      },
      
      get currentInsights() {
        return get().analysis?.insights || [];
      },
      
      get currentRecommendations() {
        return get().analysis?.recommendations || [];
      },
      
      get currentActions() {
        return get().analysis?.actions || [];
      },
      
      get priority() {
        return get().analysis?.priority || 'low';
      },
      
      get confidence() {
        return get().analysis?.confidence || 0;
      }
    }),
    {
      name: 'enhanced-fire-cycle',
      partialize: (state) => ({
        phase: state.phase,
        userContext: state.userContext
      })
    }
  )
);

// Hook for easy access to enhanced FIRE cycle functionality
export const useEnhancedFireCycle = () => {
  const store = useEnhancedFireCycleStore();
  
  return {
    ...store,
    
    // Convenience methods
    getCurrentPhase: () => store.phase,
    getCurrentInsights: () => store.currentInsights,
    getCurrentRecommendations: () => store.currentRecommendations,
    getCurrentActions: () => store.currentActions,
    
    // Smart phase management
    smartSetPhase: async (phase: FireCyclePhase) => {
      store.setPhase(phase);
      // Re-analyze after phase change
      await store.analyzeAndRecommend();
    },
    
    // Context management
    updateGoals: (goals: string[]) => {
      store.updateUserContext({ goals });
    },
    
    updateProjects: (projects: any[]) => {
      store.updateUserContext({ currentProjects: projects });
    },
    
    updateMetrics: (metrics: any[]) => {
      store.updateUserContext({ metrics });
    },
    
    updateChallenges: (challenges: string[]) => {
      store.updateUserContext({ challenges });
    },
    
    // Analysis triggers
    triggerAnalysis: async () => {
      return await store.analyzeAndRecommend();
    },
    
    // Smart recommendations
    getSmartRecommendations: () => {
      const { currentRecommendations, confidence, priority } = store;
      
      return {
        recommendations: currentRecommendations,
        confidence,
        priority,
        shouldAct: priority === 'high' || priority === 'critical',
        urgency: priority === 'critical' ? 'immediate' : 'normal'
      };
    },
    
              // Action management
     getPrioritizedActions: () => {
       const { currentActions } = store;
       
       return currentActions.sort((a, b) => {
         // Sort by priority, then by impact, then by effort
         const priorityOrder: Record<string, number> = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
         const impactOrder: Record<string, number> = { 'high': 3, 'medium': 2, 'low': 1 };
         const effortOrder: Record<string, number> = { 'low': 3, 'medium': 2, 'high': 1 };
         
         const aScore = priorityOrder[a.priority || 'low'] * impactOrder[a.impact || 'low'] * effortOrder[a.effort || 'medium'];
         const bScore = priorityOrder[b.priority || 'low'] * impactOrder[b.impact || 'low'] * effortOrder[b.effort || 'medium'];
         
         return bScore - aScore;
       });
     }
  };
}; 