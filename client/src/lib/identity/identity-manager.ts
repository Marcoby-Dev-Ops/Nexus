// Identity Manager
// Central management system for business identity data

import type { BusinessIdentity, IdentitySection, CompletionStatus } from './types'
import { buildApiUrl } from '@/lib/api-url'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('auth_token')
    const apiUrl = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`
    const response = await fetch(buildApiUrl(apiUrl), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export class IdentityManager {
  private identity: BusinessIdentity

  constructor(initialIdentity?: Partial<BusinessIdentity>) {
    this.identity = this.initializeIdentity(initialIdentity)
  }

  private initializeIdentity(initial?: Partial<BusinessIdentity>): BusinessIdentity {
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
        companySize: 'Small (2-10)',
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

    return { ...defaultIdentity, ...initial }
  }

  // Get current identity
  getIdentity(): BusinessIdentity {
    return { ...this.identity }
  }

  // Update a specific section
  updateSection(section: IdentitySection, data: any): void {
    (this.identity as any)[section] = { ...(this.identity as any)[section], ...data }
    this.updateCompleteness()
    this.identity.lastUpdated = new Date().toISOString()
  }

  // Calculate completion percentage for a section
  private calculateSectionCompleteness(section: IdentitySection): number {
    const sectionData = (this.identity as any)[section]
    const requiredFields = this.getRequiredFields(section)
    
    let completedFields = 0
    for (const field of requiredFields) {
      if (this.isFieldCompleted(sectionData, field)) {
        completedFields++
      }
    }
    
    return Math.round((completedFields / requiredFields.length) * 100)
  }

  // Get required fields for each section
  private getRequiredFields(section: IdentitySection): string[] {
    const requiredFields: Record<IdentitySection, string[]> = {
      foundation: ['name', 'industry', 'businessModel', 'website', 'email'],
      missionVisionValues: ['missionStatement', 'visionStatement', 'coreValues'],
      productsServices: ['offerings', 'uniqueValueProposition'],
      targetMarket: ['customerSegments', 'idealCustomerProfile'],
      competitiveLandscape: ['directCompetitors', 'competitivePositioning'],
      businessOperations: ['team', 'keyProcesses'],
      financialContext: ['revenue', 'financialHealth'],
      strategicContext: ['goals', 'strategicPriorities']
    }
    
    return requiredFields[section] || []
  }

  // Check if a field is completed
  private isFieldCompleted(data: any, field: string): boolean {
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

  // Update overall completeness
  private updateCompleteness(): void {
    const sections: IdentitySection[] = [
      'foundation', 'missionVisionValues', 'productsServices', 
      'targetMarket', 'competitiveLandscape', 'businessOperations',
      'financialContext', 'strategicContext'
    ]
    
    let totalCompleteness = 0
    for (const section of sections) {
      const sectionCompleteness = this.calculateSectionCompleteness(section)
      this.identity.completeness.sections[section] = sectionCompleteness
      totalCompleteness += sectionCompleteness
    }
    
    this.identity.completeness.overall = Math.round(totalCompleteness / sections.length)
  }

  // Get completion status for a section
  getSectionStatus(section: IdentitySection): CompletionStatus {
    const completeness = this.identity.completeness.sections[section]
    
    if (completeness === 0) return 'Not Started'
    if (completeness < 50) return 'In Progress'
    if (completeness < 90) return 'Needs Review'
    return 'Complete'
  }

  // Get next recommended action
  getNextAction(): { section: IdentitySection; action: string; priority: 'High' | 'Medium' | 'Low' } {
    const sections: IdentitySection[] = [
      'foundation', 'missionVisionValues', 'productsServices',
      'targetMarket', 'competitiveLandscape', 'businessOperations',
      'financialContext', 'strategicContext'
    ]
    
    // Find the section with lowest completeness
    let lowestCompleteness = 100
    let targetSection: IdentitySection = 'foundation'
    
    for (const section of sections) {
      const completeness = this.identity.completeness.sections[section]
      if (completeness < lowestCompleteness) {
        lowestCompleteness = completeness
        targetSection = section
      }
    }
    
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
    
    const priority = lowestCompleteness < 25 ? 'High' : lowestCompleteness < 50 ? 'Medium' : 'Low'
    
    return {
      section: targetSection,
      action: actions[targetSection],
      priority
    }
  }

  // Export identity data
  exportIdentity(): string {
    return JSON.stringify(this.identity, null, 2)
  }

  // Import identity data
  importIdentity(data: string): boolean {
    try {
      const imported = JSON.parse(data)
      this.identity = { ...this.identity, ...imported }
      this.updateCompleteness()
      return true
    } catch (error) {
      console.error('Failed to import identity data:', error)
      return false
    }
  }

  // Save to database with localStorage fallback
  async saveToDatabase(): Promise<boolean> {
    try {
      // Transform identity data to match database schema
      const dbData = {
        foundation: this.identity.foundation,
        mission_vision_values: this.identity.missionVisionValues,
        products_services: this.identity.productsServices,
        target_market: this.identity.targetMarket,
        competitive_landscape: this.identity.competitiveLandscape,
        business_operations: this.identity.businessOperations,
        financial_context: this.identity.financialContext,
        strategic_context: this.identity.strategicContext,
        last_updated: this.identity.lastUpdated,
        version: this.identity.version,
        completeness: this.identity.completeness
      }

      // Try to save to database using upsert
      const response = await apiRequest('/db/business_identity/upsert', {
        method: 'POST',
        body: JSON.stringify({
          data: dbData,
          onConflict: 'user_id'
        })
      })

      if (response.success) {
        // Also save to localStorage as backup
        this.saveToStorage()
        return true
      } else {
        console.warn('Database save failed, using localStorage only:', response.error)
        this.saveToStorage()
        return false
      }
    } catch (error) {
      console.error('Failed to save to database:', error)
      // Fallback to localStorage
      this.saveToStorage()
      return false
    }
  }

  // Load from database with localStorage fallback
  async loadFromDatabase(): Promise<boolean> {
    try {
      // Try to load from database first
      const response = await apiRequest('/db/business_identity')
      
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const dbData = response.data[0]
        
        // Transform database data back to identity format
        const identityData: BusinessIdentity = {
          foundation: dbData.foundation || {},
          missionVisionValues: dbData.mission_vision_values || {},
          productsServices: dbData.products_services || {},
          targetMarket: dbData.target_market || {},
          competitiveLandscape: dbData.competitive_landscape || {},
          businessOperations: dbData.business_operations || {},
          financialContext: dbData.financial_context || {},
          strategicContext: dbData.strategic_context || {},
          lastUpdated: dbData.last_updated || new Date().toISOString(),
          version: dbData.version || '1.0.0',
          completeness: dbData.completeness || { overall: 0, sections: {} }
        }

        this.identity = identityData
        // Also save to localStorage for offline access
        this.saveToStorage()
        return true
      } else {
        // No data in database, try localStorage
        return this.loadFromStorage()
      }
    } catch (error) {
      console.error('Failed to load from database:', error)
      // Fallback to localStorage
      return this.loadFromStorage()
    }
  }

  // Save to localStorage (backup method)
  saveToStorage(): void {
    localStorage.setItem('nexus-business-identity', this.exportIdentity())
  }

  // Load from localStorage (fallback method)
  loadFromStorage(): boolean {
    const stored = localStorage.getItem('nexus-business-identity')
    if (stored) {
      return this.importIdentity(stored)
    }
    return false
  }
}
