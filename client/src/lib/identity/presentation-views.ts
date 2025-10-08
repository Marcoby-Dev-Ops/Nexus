/**
 * Presentation Views for Business Identity
 * 
 * These functions demonstrate how the same core data can be presented
 * through different lenses/focuses without duplication.
 */

import type { BusinessIdentity } from './types'

// Base data structure (single source of truth)
export interface CompanyCoreData {
  foundation: BusinessIdentity['foundation']
  missionVisionValues: BusinessIdentity['missionVisionValues']
  productsServices: BusinessIdentity['productsServices']
  targetMarket: BusinessIdentity['targetMarket']
  competitiveLandscape: BusinessIdentity['competitiveLandscape']
  businessOperations: BusinessIdentity['businessOperations']
  financialContext: BusinessIdentity['financialContext']
  strategicContext: BusinessIdentity['strategicContext']
}

/**
 * Foundation Focus - Company basics and contact info
 */
export function getFoundationView(data: CompanyCoreData) {
  return {
    company: {
      name: data.foundation.name,
      legalName: data.foundation.legalName,
      legalStructure: data.foundation.legalStructure,
      foundedDate: data.foundation.foundedDate,
      industry: data.foundation.industry,
      sector: data.foundation.sector,
      businessModel: data.foundation.businessModel,
      companyStage: data.foundation.companyStage,
      companySize: data.foundation.companySize,
      description: data.foundation.description
    },
    contact: {
      website: data.foundation.website,
      email: data.foundation.email,
      phone: data.foundation.phone,
      socialMedia: data.foundation.socialMedia
    },
    location: {
      headquarters: data.foundation.headquarters
    }
  }
}

/**
 * Mission Focus - Purpose, values, and culture
 */
export function getMissionView(data: CompanyCoreData) {
  return {
    purpose: {
      missionStatement: data.missionVisionValues.missionStatement,
      visionStatement: data.missionVisionValues.visionStatement,
      purpose: data.missionVisionValues.purpose
    },
    values: {
      coreValues: data.missionVisionValues.coreValues,
      companyCulture: data.missionVisionValues.companyCulture,
      brandPersonality: data.missionVisionValues.brandPersonality,
      brandVoice: data.missionVisionValues.brandVoice
    },
    insights: data.missionVisionValues.conversationContext
  }
}

/**
 * Market Focus - Target customers and competitive positioning
 */
export function getMarketView(data: CompanyCoreData) {
  return {
    customers: {
      segments: data.targetMarket.customerSegments,
      idealCustomerProfile: data.targetMarket.idealCustomerProfile,
      customerPersonas: data.targetMarket.customerPersonas
    },
    competitive: {
      directCompetitors: data.competitiveLandscape.directCompetitors,
      indirectCompetitors: data.competitiveLandscape.indirectCompetitors,
      positioning: data.competitiveLandscape.competitivePositioning,
      marketTrends: data.competitiveLandscape.marketTrends
    },
    opportunities: {
      opportunities: data.competitiveLandscape.opportunities,
      threats: data.competitiveLandscape.threats
    }
  }
}

/**
 * Operations Focus - Team, processes, and business model
 */
export function getOperationsView(data: CompanyCoreData) {
  return {
    team: {
      structure: data.businessOperations.team,
      keyPeople: data.businessOperations.team.keyPeople,
      culture: data.businessOperations.team.culture
    },
    processes: {
      keyProcesses: data.businessOperations.keyProcesses,
      workflows: data.businessOperations.workflows,
      systems: data.businessOperations.systems
    },
    businessModel: {
      model: data.foundation.businessModel,
      revenue: data.financialContext.revenue,
      pricing: data.productsServices.pricing
    }
  }
}

/**
 * Strategic Focus - Goals, priorities, and metrics
 */
export function getStrategicView(data: CompanyCoreData) {
  return {
    goals: {
      shortTerm: data.strategicContext.goals.shortTerm,
      longTerm: data.strategicContext.goals.longTerm
    },
    priorities: {
      strategicPriorities: data.strategicContext.strategicPriorities,
      challenges: data.strategicContext.challenges
    },
    metrics: {
      successMetrics: data.strategicContext.successMetrics,
      kpis: data.financialContext.kpis
    }
  }
}

/**
 * Products Focus - Offerings and value proposition
 */
export function getProductsView(data: CompanyCoreData) {
  return {
    offerings: {
      products: data.productsServices.offerings,
      services: data.productsServices.services,
      pricing: data.productsServices.pricing
    },
    positioning: {
      uniqueValueProposition: data.productsServices.uniqueValueProposition,
      competitiveAdvantages: data.competitiveLandscape.competitivePositioning.advantages
    },
    marketFit: {
      targetSegments: data.targetMarket.customerSegments,
      customerPainPoints: data.targetMarket.idealCustomerProfile.painPoints
    }
  }
}

/**
 * Executive Summary - High-level overview combining key insights
 */
export function getExecutiveSummary(data: CompanyCoreData) {
  return {
    company: {
      name: data.foundation.name,
      industry: data.foundation.industry,
      stage: data.foundation.companyStage,
      size: data.foundation.companySize
    },
    mission: data.missionVisionValues.missionStatement,
    vision: data.missionVisionValues.visionStatement,
    valueProposition: data.productsServices.uniqueValueProposition,
    targetMarket: data.targetMarket.customerSegments.map(s => s.name).join(', '),
    keyGoals: data.strategicContext.goals.shortTerm.slice(0, 3).map(g => g.goal),
    topChallenges: data.strategicContext.challenges
      .filter(c => c.impact === 'High')
      .slice(0, 3)
      .map(c => c.challenge)
  }
}

/**
 * Dashboard View - Key metrics and status
 */
export function getDashboardView(data: CompanyCoreData) {
  const foundation = getFoundationView(data)
  const mission = getMissionView(data)
  const strategic = getStrategicView(data)
  
  return {
    companyInfo: {
      name: foundation.company.name,
      industry: foundation.company.industry,
      stage: foundation.company.companyStage,
      website: foundation.contact.website
    },
    mission: mission.purpose.missionStatement,
    topGoals: strategic.goals.shortTerm.slice(0, 2),
    criticalChallenges: strategic.priorities.challenges.filter(c => c.impact === 'High').slice(0, 2),
    completionStatus: {
      foundation: calculateCompletion(data.foundation),
      mission: calculateCompletion(data.missionVisionValues),
      products: calculateCompletion(data.productsServices),
      market: calculateCompletion(data.targetMarket),
      operations: calculateCompletion(data.businessOperations),
      strategy: calculateCompletion(data.strategicContext)
    }
  }
}

// Helper function to calculate completion percentage
function calculateCompletion(section: any): number {
  if (!section) return 0
  
  const keys = Object.keys(section)
  const filledKeys = keys.filter(key => {
    const value = section[key]
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  })
  
  return Math.round((filledKeys.length / keys.length) * 100)
}
