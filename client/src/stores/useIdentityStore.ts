import { create } from 'zustand'
import type { BusinessIdentity, IdentitySection } from '@/lib/identity/types'

/**
 * Business Identity Store
 * Reactive state management for company identity/branding data
 */
interface IdentityState {
  identity: BusinessIdentity | null
  isLoading: boolean
  lastSaved: string | null
  
  // Actions
  setIdentity: (identity: BusinessIdentity) => void
  updateSection: (section: IdentitySection, data: any) => void
  setLoading: (loading: boolean) => void
  setLastSaved: (timestamp: string) => void
  reset: () => void
}

const defaultIdentity: BusinessIdentity = {
  foundation: {
    name: '',
    legalStructure: 'LLC',
    foundedDate: '',
    headquarters: {
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    industry: '',
    sector: '',
    businessModel: 'B2B',
    companyStage: 'Startup',
    companySize: 'Small (1-5)',
    website: '',
    email: '',
    phone: '',
    socialMedia: {}
  },
  missionVisionValues: {
    missionStatement: '',
    visionStatement: '',
    purpose: '',
    coreValues: [],
    companyCulture: {
      workStyle: [],
      communicationStyle: [],
      decisionMaking: '',
      innovationApproach: ''
    },
    brandPersonality: [],
    brandVoice: {
      tone: '',
      style: '',
      examples: []
    }
  },
  productsServices: {
    offerings: [],
    uniqueValueProposition: '',
    competitiveAdvantages: [],
    differentiators: [],
    productRoadmap: []
  },
  targetMarket: {
    totalAddressableMarket: { size: '', description: '' },
    serviceableAddressableMarket: { size: '', description: '' },
    serviceableObtainableMarket: { size: '', percentage: 0, description: '' },
    customerSegments: [],
    idealCustomerProfile: {
      demographics: { industry: [], companySize: [], location: [], revenue: [] },
      psychographics: { painPoints: [], goals: [], challenges: [], motivations: [] },
      behavior: { buyingProcess: '', decisionFactors: [], preferredChannels: [] }
    },
    personas: []
  },
  competitiveLandscape: {
    directCompetitors: [],
    indirectCompetitors: [],
    competitivePositioning: {
      position: '',
      differentiation: [],
      advantages: [],
      threats: []
    },
    marketTrends: [],
    opportunities: [],
    threats: []
  },
  businessOperations: {
    team: {
      size: 0,
      structure: [],
      keyPeople: []
    },
    keyProcesses: [],
    technologyStack: {
      frontend: [],
      backend: [],
      database: [],
      infrastructure: [],
      tools: [],
      integrations: []
    },
    operationalMetrics: []
  },
  financialContext: {
    revenue: {
      model: '',
      currentAnnual: '',
      growth: { rate: 0, period: '' }
    },
    financialHealth: {
      profitability: 'Break-even',
      cashFlow: 'Neutral'
    },
    funding: {
      stage: 'Bootstrapped'
    },
    financialGoals: []
  },
  strategicContext: {
    goals: {
      shortTerm: [],
      longTerm: []
    },
    strategicPriorities: [],
    challenges: [],
    successMetrics: []
  },
  lastUpdated: new Date().toISOString(),
  version: '1.0.0',
  completeness: {
    overall: 0,
    sections: {
      foundation: 0,
      missionVisionValues: 0,
      productsServices: 0,
      targetMarket: 0,
      competitiveLandscape: 0,
      businessOperations: 0,
      financialContext: 0,
      strategicContext: 0
    }
  }
}

export const useIdentityStore = create<IdentityState>((set) => ({
  identity: defaultIdentity,
  isLoading: false,
  lastSaved: null,

  setIdentity: (identity) => set({ identity }),
  
  updateSection: (section, data) => set((state) => {
    if (!state.identity) return state
    
    return {
      identity: {
        ...state.identity,
        [section]: { ...state.identity[section], ...data },
        lastUpdated: new Date().toISOString()
      }
    }
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setLastSaved: (lastSaved) => set({ lastSaved }),
  
  reset: () => set({ identity: defaultIdentity, isLoading: false, lastSaved: null })
}))

