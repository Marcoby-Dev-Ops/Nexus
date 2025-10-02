import type { BusinessIdentity, IdentitySection, CompletionStatus } from './types'

// Required fields for each section
const REQUIRED_FIELDS: Record<IdentitySection, string[]> = {
  foundation: ['name', 'industry', 'businessModel', 'website', 'email', 'legalName', 'legalStructure', 'companyStage', 'companySize', 'phone'],
  missionVisionValues: ['missionStatement', 'visionStatement', 'coreValues'],
  productsServices: ['offerings', 'uniqueValueProposition'],
  targetMarket: ['customerSegments', 'idealCustomerProfile'],
  competitiveLandscape: ['directCompetitors', 'competitivePositioning'],
  businessOperations: ['team', 'keyProcesses'],
  financialContext: ['revenue', 'financialHealth'],
  strategicContext: ['goals', 'strategicPriorities']
}

// Check if a field is completed
function isFieldCompleted(data: any, field: string): boolean {
  const value = data[field]
  
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    // For objects, check if they have meaningful content
    return Object.values(value).some(v => 
      v !== null && v !== undefined && 
      (typeof v === 'string' ? v.trim().length > 0 : true)
    )
  }
  
  return true
}

// Calculate completion percentage for a section
export function calculateSectionCompleteness(identity: BusinessIdentity, section: IdentitySection): number {
  const sectionData = (identity as any)[section]
  const requiredFields = REQUIRED_FIELDS[section] || []
  
  let completedFields = 0
  for (const field of requiredFields) {
    if (isFieldCompleted(sectionData, field)) {
      completedFields++
    }
  }
  
  return Math.round((completedFields / requiredFields.length) * 100)
}

// Update completeness for all sections
export function calculateCompleteness(identity: BusinessIdentity): BusinessIdentity {
  const sections: IdentitySection[] = [
    'foundation', 'missionVisionValues', 'productsServices', 
    'targetMarket', 'competitiveLandscape', 'businessOperations',
    'financialContext', 'strategicContext'
  ]
  
  let totalCompleteness = 0
  const updatedCompleteness = { ...identity.completeness }
  
  for (const section of sections) {
    const sectionCompleteness = calculateSectionCompleteness(identity, section)
    updatedCompleteness.sections[section] = sectionCompleteness
    totalCompleteness += sectionCompleteness
  }
  
  updatedCompleteness.overall = Math.round(totalCompleteness / sections.length)
  
  return {
    ...identity,
    completeness: updatedCompleteness
  }
}

// Get completion status for a section
export function getSectionStatus(completeness: number): CompletionStatus {
  if (completeness === 0) return 'Not Started'
  if (completeness < 50) return 'In Progress'
  if (completeness < 90) return 'Needs Review'
  return 'Complete'
}

// Get next recommended action
export function getNextAction(identity: BusinessIdentity): { 
  section: IdentitySection
  action: string
  priority: 'High' | 'Medium' | 'Low' 
} {
  const sections: IdentitySection[] = [
    'foundation', 'missionVisionValues', 'productsServices',
    'targetMarket', 'competitiveLandscape', 'businessOperations',
    'financialContext', 'strategicContext'
  ]
  
  const actions: Record<IdentitySection, string> = {
    foundation: 'Complete basic company information',
    missionVisionValues: 'Define mission, vision, and core values',
    productsServices: 'Document products and services',
    targetMarket: 'Define target market and customer personas',
    competitiveLandscape: 'Analyze competitive landscape',
    businessOperations: 'Document business operations',
    financialContext: 'Add financial information',
    strategicContext: 'Define strategic goals and priorities'
  }
  
  // Find the section with lowest completeness
  let lowestCompleteness = 100
  let targetSection: IdentitySection = 'foundation'
  
  for (const section of sections) {
    const completeness = identity.completeness.sections[section]
    if (completeness < lowestCompleteness) {
      lowestCompleteness = completeness
      targetSection = section
    }
  }
  
  const priority = lowestCompleteness < 25 ? 'High' : lowestCompleteness < 50 ? 'Medium' : 'Low'
  
  return {
    section: targetSection,
    action: actions[targetSection],
    priority
  }
}

// Transform identity to database format (identity table)
export function identityToDbData(identity: BusinessIdentity) {
  return {
    // Direct columns for Foundation fields
    name: identity.foundation.name,
    legal_name: identity.foundation.legalName,
    legal_structure: identity.foundation.legalStructure,
    founded_date: identity.foundation.foundedDate || null,
    industry: identity.foundation.industry,
    sector: identity.foundation.sector,
    business_model: identity.foundation.businessModel,
    company_stage: identity.foundation.companyStage,
    company_size: identity.foundation.companySize,
    website: identity.foundation.website,
    description: identity.foundation.description || '',
    
    // Structured data columns
    address: identity.foundation.headquarters,
    contact_info: {
      email: identity.foundation.email,
      phone: identity.foundation.phone,
      socialMedia: identity.foundation.socialMedia
    },
    
    // Mission & Vision direct columns (for fast queries)
    mission_statement: identity.missionVisionValues.missionStatement,
    vision_statement: identity.missionVisionValues.visionStatement,
    core_values: identity.missionVisionValues.coreValues,
    
    // Complex sections stored in JSONB columns
    mission_vision_values: identity.missionVisionValues,
    products_services: identity.productsServices,
    target_market: identity.targetMarket,
    competitive_landscape: identity.competitiveLandscape,
    business_operations: identity.businessOperations,
    financial_context: identity.financialContext,
    strategic_context: identity.strategicContext,
    
    // Metadata
    completeness: identity.completeness,
    version: identity.version,
    updated_at: new Date().toISOString()
  }
}

// Transform database identity data to BusinessIdentity format
export function dbDataToIdentity(identityData: any): BusinessIdentity {
  return {
    // Foundation from direct columns
    foundation: {
      name: identityData.name || '',
      legalName: identityData.legal_name || identityData.name || '',
      legalStructure: (identityData.legal_structure || 'LLC') as any,
      foundedDate: identityData.founded_date || '',
      headquarters: identityData.address || {
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      },
      industry: identityData.industry || '',
      sector: identityData.sector || '',
      businessModel: (identityData.business_model || 'B2B') as any,
      companyStage: (identityData.company_stage || 'Startup') as any,
      companySize: identityData.company_size || 'Small (1-5)',
      website: identityData.website || '',
      email: identityData.contact_info?.email || '',
      phone: identityData.contact_info?.phone || '',
      description: identityData.description || '',
      socialMedia: identityData.contact_info?.socialMedia || {}
    },
    // Mission & Vision from direct columns and JSONB
    missionVisionValues: identityData.mission_vision_values || {
      missionStatement: identityData.mission_statement || '',
      visionStatement: identityData.vision_statement || '',
      purpose: '',
      coreValues: identityData.core_values || [],
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
    // Complex sections from JSONB columns
    productsServices: identityData.products_services || {
      offerings: [],
      uniqueValueProposition: '',
      competitiveAdvantages: [],
      differentiators: [],
      productRoadmap: []
    },
    targetMarket: identityData.target_market || {
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
    competitiveLandscape: identityData.competitive_landscape || {
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
    businessOperations: identityData.business_operations || {
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
    financialContext: identityData.financial_context || {
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
    strategicContext: identityData.strategic_context || {
      goals: {
        shortTerm: [],
        longTerm: []
      },
      strategicPriorities: [],
      challenges: [],
      successMetrics: []
    },
    lastUpdated: identityData.updated_at || new Date().toISOString(),
    version: identityData.version || '1.0.0',
    completeness: identityData.completeness || { overall: 0, sections: {} as any }
  }
}

