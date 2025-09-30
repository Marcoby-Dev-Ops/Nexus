// Identity Domain Types
// Core business identity structure for comprehensive business context

export interface ConversationInsights {
  // Key insights extracted from conversations
  keyAnswers: Array<{
    question: string
    answer: string
    timestamp: string
    importance: 'High' | 'Medium' | 'Low'
  }>
  
  // Themes and patterns identified
  themes: string[]
  
  // Preferences and style indicators
  preferences: {
    tone?: string
    style?: string
    focus?: string[]
    priorities?: string[]
  }
  
  // Conversation history summary
  conversationSummary?: string
  
  // Last updated timestamp
  lastUpdated: string
}

export interface CompanyFoundation {
  // Basic Company Information
  name: string
  legalName?: string
  legalStructure: 'LLC' | 'Corporation' | 'Partnership' | 'Sole Proprietorship' | 'Other'
  foundedDate: string
  headquarters: {
    address: string
    city: string
    state: string
    country: string
    zipCode: string
  }
  
  // Business Classification
  industry: string
  sector: string
  businessModel: 'B2B' | 'B2C' | 'B2B2C' | 'Marketplace' | 'SaaS' | 'E-commerce' | 'Consulting' | 'Other'
  companyStage: 'Idea' | 'Startup' | 'Growth' | 'Mature' | 'Enterprise'
  companySize: 'Solo' | 'Small (2-10)' | 'Medium (11-50)' | 'Large (51-200)' | 'Enterprise (200+)'
  
  // Contact Information
  website: string
  email: string
  phone: string
  socialMedia: {
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
    youtube?: string
  }
}

export interface MissionVisionValues {
  // Core Purpose
  missionStatement: string
  visionStatement: string
  purpose: string // Why the company exists
  
  // Values & Culture
  coreValues: Array<{
    name: string
    description: string
    importance: 'High' | 'Medium' | 'Low'
  }>
  
  // AI Conversation Context
  conversationContext?: {
    missionInsights?: ConversationInsights
    visionInsights?: ConversationInsights
    purposeInsights?: ConversationInsights
    valuesInsights?: ConversationInsights
    cultureInsights?: ConversationInsights
    brandInsights?: ConversationInsights
  }
  
  companyCulture: {
    workStyle: string[]
    communicationStyle: string[]
    decisionMaking: string
    innovationApproach: string
  }
  
  // Brand Personality
  brandPersonality: Array<{
    trait: string
    description: string
  }>
  
  brandVoice: {
    tone: string
    style: string
    examples: string[]
  }
}

export interface ProductsServices {
  // Core Offerings
  offerings: Array<{
    name: string
    type: 'Product' | 'Service' | 'Solution'
    description: string
    category: string
    keyFeatures: string[]
    benefits: string[]
    pricing: {
      model: 'One-time' | 'Subscription' | 'Usage-based' | 'Freemium' | 'Custom'
      range?: string
      details?: string
    }
    status: 'Active' | 'Development' | 'Planned' | 'Deprecated'
  }>
  
  // Value Proposition
  uniqueValueProposition: string
  competitiveAdvantages: string[]
  differentiators: string[]
  
  // Product Strategy
  productRoadmap: Array<{
    feature: string
    timeline: string
    priority: 'High' | 'Medium' | 'Low'
    status: 'Planned' | 'In Development' | 'Released'
  }>
}

export interface TargetMarket {
  // Market Definition
  totalAddressableMarket: {
    size: string
    description: string
  }
  
  serviceableAddressableMarket: {
    size: string
    description: string
  }
  
  serviceableObtainableMarket: {
    size: string
    percentage: number
    description: string
  }
  
  // Customer Segments
  customerSegments: Array<{
    name: string
    description: string
    size: string
    priority: 'High' | 'Medium' | 'Low'
  }>
  
  // Ideal Customer Profile
  idealCustomerProfile: {
    demographics: {
      industry: string[]
      companySize: string[]
      location: string[]
      revenue: string[]
    }
    psychographics: {
      painPoints: string[]
      goals: string[]
      challenges: string[]
      motivations: string[]
    }
    behavior: {
      buyingProcess: string
      decisionFactors: string[]
      preferredChannels: string[]
    }
  }
  
  // Customer Personas
  personas: Array<{
    name: string
    title: string
    role: string
    demographics: {
      age?: string
      gender?: string
      location: string
      income?: string
    }
    goals: string[]
    painPoints: string[]
    behavior: string[]
    preferredChannels: string[]
    quotes: string[]
  }>
}

export interface CompetitiveLandscape {
  // Direct Competitors
  directCompetitors: Array<{
    name: string
    website: string
    description: string
    strengths: string[]
    weaknesses: string[]
    marketShare?: string
    pricing?: string
    positioning: string
  }>
  
  // Indirect Competitors
  indirectCompetitors: Array<{
    name: string
    type: string
    description: string
    whyAlternative: string
  }>
  
  // Competitive Analysis
  competitivePositioning: {
    position: string
    differentiation: string[]
    advantages: string[]
    threats: string[]
  }
  
  // Market Analysis
  marketTrends: string[]
  opportunities: string[]
  threats: string[]
}

export interface BusinessOperations {
  // Team Structure
  team: {
    size: number
    structure: Array<{
      department: string
      headCount: number
      keyRoles: string[]
    }>
    keyPeople: Array<{
      name: string
      role: string
      department: string
      responsibilities: string[]
    }>
  }
  
  // Key Processes
  keyProcesses: Array<{
    name: string
    description: string
    owner: string
    status: 'Optimized' | 'Good' | 'Needs Improvement' | 'Critical'
    tools: string[]
  }>
  
  // Technology Stack
  technologyStack: {
    frontend: string[]
    backend: string[]
    database: string[]
    infrastructure: string[]
    tools: string[]
    integrations: string[]
  }
  
  // Operational Metrics
  operationalMetrics: Array<{
    metric: string
    value: string
    target?: string
    trend: 'Up' | 'Down' | 'Stable'
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'
  }>
}

export interface FinancialContext {
  // Revenue Information
  revenue: {
    model: string
    currentAnnual: string
    monthlyRecurring?: string
    growth: {
      rate: number
      period: string
    }
  }
  
  // Financial Health
  financialHealth: {
    profitability: 'Profitable' | 'Break-even' | 'Loss-making'
    cashFlow: 'Positive' | 'Neutral' | 'Negative'
    burnRate?: string
    runway?: string
  }
  
  // Funding
  funding: {
    stage: 'Bootstrapped' | 'Seed' | 'Series A' | 'Series B' | 'Series C+' | 'Public'
    totalRaised?: string
    lastRound?: {
      amount: string
      date: string
      investors: string[]
    }
  }
  
  // Financial Goals
  financialGoals: Array<{
    goal: string
    target: string
    timeline: string
    current?: string
  }>
}

export interface StrategicContext {
  // Goals & Objectives
  goals: {
    shortTerm: Array<{
      goal: string
      target: string
      timeline: string
      status: 'On Track' | 'At Risk' | 'Completed' | 'Behind'
    }>
    longTerm: Array<{
      goal: string
      target: string
      timeline: string
      status: 'On Track' | 'At Risk' | 'Completed' | 'Behind'
    }>
  }
  
  // Strategic Priorities
  strategicPriorities: Array<{
    priority: string
    description: string
    importance: 'Critical' | 'High' | 'Medium' | 'Low'
    timeline: string
    owner: string
  }>
  
  // Key Challenges
  challenges: Array<{
    challenge: string
    impact: 'High' | 'Medium' | 'Low'
    urgency: 'High' | 'Medium' | 'Low'
    owner?: string
    status: 'Identified' | 'In Progress' | 'Resolved'
  }>
  
  // Success Metrics
  successMetrics: Array<{
    metric: string
    current: string
    target: string
    frequency: string
    owner: string
  }>
}

// Main Identity Interface
export interface BusinessIdentity {
  foundation: CompanyFoundation
  missionVisionValues: MissionVisionValues
  productsServices: ProductsServices
  targetMarket: TargetMarket
  competitiveLandscape: CompetitiveLandscape
  businessOperations: BusinessOperations
  financialContext: FinancialContext
  strategicContext: StrategicContext
  
  // Metadata
  lastUpdated: string
  version: string
  completeness: {
    overall: number
    sections: {
      foundation: number
      missionVisionValues: number
      productsServices: number
      targetMarket: number
      competitiveLandscape: number
      businessOperations: number
      financialContext: number
      strategicContext: number
    }
  }
}

// Helper types for forms and UI
export type IdentitySection = keyof Omit<BusinessIdentity, 'lastUpdated' | 'version' | 'completeness'>
export type CompletionStatus = 'Not Started' | 'In Progress' | 'Complete' | 'Needs Review'
