// Conversation Context Manager
// Handles storage and retrieval of AI conversation insights

import type { ConversationInsights } from '@/lib/identity/types'

export class ConversationContextManager {
  private insights: Map<string, ConversationInsights> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  // Store insights for a specific section
  storeInsights(section: string, insights: ConversationInsights): void {
    this.insights.set(section, insights)
    this.saveToStorage()
  }

  // Get insights for a specific section
  getInsights(section: string): ConversationInsights | undefined {
    return this.insights.get(section)
  }

  // Add a new answer to existing insights
  addAnswer(section: string, question: string, answer: string, importance: 'High' | 'Medium' | 'Low' = 'Medium'): void {
    const existingInsights = this.getInsights(section) || this.createEmptyInsights()
    
    // Add the new answer
    existingInsights.keyAnswers.push({
      question,
      answer,
      timestamp: new Date().toISOString(),
      importance
    })

    // Update last updated timestamp
    existingInsights.lastUpdated = new Date().toISOString()

    // Store updated insights
    this.storeInsights(section, existingInsights)
  }

  // Update themes based on conversation
  updateThemes(section: string, newThemes: string[]): void {
    const existingInsights = this.getInsights(section) || this.createEmptyInsights()
    
    // Merge themes, removing duplicates
    const uniqueThemes = [...new Set([...existingInsights.themes, ...newThemes])]
    existingInsights.themes = uniqueThemes
    existingInsights.lastUpdated = new Date().toISOString()

    this.storeInsights(section, existingInsights)
  }

  // Update preferences based on conversation
  updatePreferences(section: string, preferences: Partial<ConversationInsights['preferences']>): void {
    const existingInsights = this.getInsights(section) || this.createEmptyInsights()
    
    existingInsights.preferences = {
      ...existingInsights.preferences,
      ...preferences
    }
    existingInsights.lastUpdated = new Date().toISOString()

    this.storeInsights(section, existingInsights)
  }

  // Generate context summary for AI
  getContextSummary(section: string): string {
    const insights = this.getInsights(section)
    if (!insights) return ''

    const summary = []
    
    // Add key answers
    if (insights.keyAnswers.length > 0) {
      summary.push('Key insights from previous conversations:')
      insights.keyAnswers.forEach(qa => {
        summary.push(`- ${qa.question}: ${qa.answer}`)
      })
    }

    // Add themes
    if (insights.themes.length > 0) {
      summary.push(`\nIdentified themes: ${insights.themes.join(', ')}`)
    }

    // Add preferences
    if (insights.preferences.tone || insights.preferences.style) {
      summary.push(`\nCommunication preferences: ${insights.preferences.tone || ''} ${insights.preferences.style || ''}`.trim())
    }

    return summary.join('\n')
  }

  // Get relevant questions based on existing context
  getRelevantQuestions(section: string): string[] {
    const insights = this.getInsights(section)
    if (!insights) return []

    const answeredQuestions = insights.keyAnswers.map(qa => qa.question.toLowerCase())
    
    // Return questions that haven't been answered yet
    const allQuestions = this.getAllQuestionsForSection(section)
    return allQuestions.filter(q => 
      !answeredQuestions.some(aq => aq.includes(q.toLowerCase().split(' ')[0]))
    )
  }

  // Get all possible questions for a section
  private getAllQuestionsForSection(section: string): string[] {
    const questionSets = {
      mission: [
        'What does your company do?',
        'What problem are you solving?',
        'Who are your main customers?',
        'What makes you unique?',
        'What impact do you want to make?',
        'How do you measure success?'
      ],
      vision: [
        'Where do you see your company in 5-10 years?',
        'What change do you want to create?',
        'What would success look like?',
        'What legacy do you want to leave?',
        'How will the industry be different?',
        'What would you want to be remembered for?'
      ],
      purpose: [
        'Why does your company exist?',
        'What drives you every day?',
        'What would you do even if you weren\'t paid?',
        'What cause are you passionate about?',
        'What impact do you hope to have?',
        'What problem keeps you up at night?'
      ],
      values: [
        'What principles guide your decisions?',
        'How do you want your team to behave?',
        'What would you never compromise on?',
        'What behaviors do you reward?',
        'How do you treat your customers?',
        'What values are most important to you?'
      ],
      culture: [
        'How does your team prefer to work?',
        'What kind of environment helps you thrive?',
        'How do you make decisions?',
        'What communication style works best?',
        'How do you handle conflicts?',
        'What makes your team unique?'
      ],
      brand: [
        'How do you want to be perceived?',
        'What tone do you use with customers?',
        'What personality traits describe your brand?',
        'How do you want people to feel about your company?',
        'What makes your brand different?',
        'How do you communicate your values?'
      ]
    }

    return questionSets[section] || []
  }

  // Create empty insights structure
  private createEmptyInsights(): ConversationInsights {
    return {
      keyAnswers: [],
      themes: [],
      preferences: {},
      lastUpdated: new Date().toISOString()
    }
  }

  // Save insights to localStorage
  private saveToStorage(): void {
    const data = Object.fromEntries(this.insights)
    localStorage.setItem('nexus-conversation-context', JSON.stringify(data))
  }

  // Load insights from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('nexus-conversation-context')
      if (stored) {
        const data = JSON.parse(stored)
        this.insights = new Map(Object.entries(data))
      }
    } catch (error) {
      console.warn('Failed to load conversation context from storage:', error)
    }
  }

  // Clear all insights (for testing or reset)
  clearAllInsights(): void {
    this.insights.clear()
    localStorage.removeItem('nexus-conversation-context')
  }

  // Export insights for backup
  exportInsights(): string {
    return JSON.stringify(Object.fromEntries(this.insights), null, 2)
  }

  // Import insights from backup
  importInsights(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      this.insights = new Map(Object.entries(parsed))
      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Failed to import conversation context:', error)
      return false
    }
  }
}
