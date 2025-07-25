/**
 * Contextual Data Completion Service
 * Provides AI-powered data completion and enhancement functionality
 */

export interface CompletionContext {
  userId: string;
  dataType: 'contact' | 'company' | 'deal' | 'task' | 'note';
  existingData: Record<string, any>;
  partialData: Record<string, any>;
}

export interface CompletionResult {
  completed: boolean;
  suggestedData: Record<string, any>;
  confidence: number;
  reasoning: string;
}

export interface DataEnhancement {
  field: string;
  originalValue: string;
  enhancedValue: string;
  confidence: number;
  source: string;
}

export class ContextualDataCompletionService {
  /**
   * Complete missing data fields based on context
   */
  async completeData(context: CompletionContext): Promise<CompletionResult> {
    try {
      // Analyze existing data patterns
      const patterns = await this.analyzePatterns(context);
      
      // Generate suggestions based on patterns
      const suggestions = await this.generateSuggestions(context, patterns);
      
      // Validate suggestions against business rules
      const validatedSuggestions = await this.validateSuggestions(suggestions, context);
      
      return {
        completed: Object.keys(validatedSuggestions).length > 0,
        suggestedData: validatedSuggestions,
        confidence: this.calculateConfidence(validatedSuggestions, patterns),
        reasoning: this.generateReasoning(validatedSuggestions, patterns)
      };
    } catch (error) {
      console.error('Error completing data:', error);
      return {
        completed: false,
        suggestedData: {},
        confidence: 0,
        reasoning: 'Unable to complete data due to an error'
      };
    }
  }

  /**
   * Enhance existing data with additional context
   */
  async enhanceData(data: Record<string, any>, context: CompletionContext): Promise<DataEnhancement[]> {
    const enhancements: DataEnhancement[] = [];
    
    try {
      // Analyze each field for potential enhancements
      for (const [field, value] of Object.entries(data)) {
        if (typeof value === 'string' && value.trim()) {
          const enhancement = await this.enhanceField(field, value, context);
          if (enhancement) {
            enhancements.push(enhancement);
          }
        }
      }
    } catch (error) {
      console.error('Error enhancing data:', error);
    }
    
    return enhancements;
  }

  /**
   * Analyze patterns in existing data
   */
  private async analyzePatterns(context: CompletionContext): Promise<Record<string, any>> {
    // This would typically involve analyzing historical data
    // For now, return basic patterns based on data type
    const patterns: Record<string, any> = {};
    
    switch (context.dataType) {
      case 'contact':
        patterns.emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        patterns.phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
        break;
      case 'company':
        patterns.domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        break;
      case 'deal':
        patterns.currencyPattern = /^\$?\d+(\.\d{2})?$/;
        break;
    }
    
    return patterns;
  }

  /**
   * Generate suggestions based on context and patterns
   */
  private async generateSuggestions(context: CompletionContext, patterns: Record<string, any>): Promise<Record<string, any>> {
    const suggestions: Record<string, any> = {};
    
    // Generate suggestions based on data type and existing patterns
    switch (context.dataType) {
      case 'contact':
        if (!context.partialData.email && context.partialData.name) {
          suggestions.email = this.generateEmailFromName(context.partialData.name);
        }
        if (!context.partialData.phone && context.partialData.company) {
          suggestions.phone = this.generatePhoneFromCompany(context.partialData.company);
        }
        break;
      case 'company':
        if (!context.partialData.website && context.partialData.name) {
          suggestions.website = this.generateWebsiteFromName(context.partialData.name);
        }
        if (!context.partialData.industry && context.partialData.description) {
          suggestions.industry = this.extractIndustryFromDescription(context.partialData.description);
        }
        break;
      case 'deal':
        if (!context.partialData.value && context.partialData.stage) {
          suggestions.value = this.estimateDealValue(context.partialData.stage);
        }
        if (!context.partialData.closeDate && context.partialData.stage) {
          suggestions.closeDate = this.estimateCloseDate(context.partialData.stage);
        }
        break;
    }
    
    return suggestions;
  }

  /**
   * Validate suggestions against business rules
   */
  private async validateSuggestions(suggestions: Record<string, any>, context: CompletionContext): Promise<Record<string, any>> {
    const validated: Record<string, any> = {};
    
    for (const [field, value] of Object.entries(suggestions)) {
      if (this.isValidSuggestion(field, value, context)) {
        validated[field] = value;
      }
    }
    
    return validated;
  }

  /**
   * Calculate confidence score for suggestions
   */
  private calculateConfidence(suggestions: Record<string, any>, patterns: Record<string, any>): number {
    if (Object.keys(suggestions).length === 0) {
      return 0;
    }
    
    // Simple confidence calculation based on number of suggestions and pattern matches
    const baseConfidence = 0.6;
    const patternBonus = Object.keys(patterns).length * 0.1;
    const suggestionBonus = Object.keys(suggestions).length * 0.05;
    
    return Math.min(0.95, baseConfidence + patternBonus + suggestionBonus);
  }

  /**
   * Generate reasoning for suggestions
   */
  private generateReasoning(suggestions: Record<string, any>, patterns: Record<string, any>): string {
    if (Object.keys(suggestions).length === 0) {
      return 'No suggestions generated based on available context.';
    }
    
    const reasons = Object.entries(suggestions).map(([field, value]) => 
      `Generated ${field} based on existing data patterns.`
    );
    
    return reasons.join(' ');
  }

  /**
   * Enhance a specific field
   */
  private async enhanceField(field: string, value: string, context: CompletionContext): Promise<DataEnhancement | null> {
    try {
      let enhancedValue = value;
      let confidence = 0.8;
      let source = 'pattern_analysis';
      
      switch (field.toLowerCase()) {
        case 'name':
          enhancedValue = this.enhanceName(value);
          break;
        case 'email':
          enhancedValue = this.enhanceEmail(value);
          break;
        case 'phone':
          enhancedValue = this.enhancePhone(value);
          break;
        case 'company':
          enhancedValue = this.enhanceCompany(value);
          break;
        default:
          return null;
      }
      
      if (enhancedValue !== value) {
        return {
          field,
          originalValue: value,
          enhancedValue,
          confidence,
          source
        };
      }
    } catch (error) {
      console.error(`Error enhancing field ${field}:`, error);
    }
    
    return null;
  }

  /**
   * Check if a suggestion is valid
   */
  private isValidSuggestion(field: string, value: any, context: CompletionContext): boolean {
    // Basic validation based on field type
    switch (field.toLowerCase()) {
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return typeof value === 'string' && /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''));
      case 'website':
        return typeof value === 'string' && value.startsWith('http');
      case 'value':
        return typeof value === 'number' && value > 0;
      default:
        return value !== null && value !== undefined && value !== '';
    }
  }

  // Helper methods for generating suggestions
  private generateEmailFromName(name: string): string {
    const cleanName = name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[parts.length - 1]}@example.com`;
    }
    return `${cleanName.replace(/\s/g, '')}@example.com`;
  }

  private generatePhoneFromCompany(company: string): string {
    // Generate a placeholder phone number
    return '+1-555-000-0000';
  }

  private generateWebsiteFromName(name: string): string {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://www.${cleanName}.com`;
  }

  private extractIndustryFromDescription(description: string): string {
    // Simple industry extraction based on keywords
    const keywords = description.toLowerCase();
    if (keywords.includes('tech') || keywords.includes('software')) return 'Technology';
    if (keywords.includes('finance') || keywords.includes('banking')) return 'Finance';
    if (keywords.includes('health') || keywords.includes('medical')) return 'Healthcare';
    return 'General';
  }

  private estimateDealValue(stage: string): number {
    // Estimate deal value based on stage
    const stageValues: Record<string, number> = {
      'prospecting': 5000,
      'qualification': 10000,
      'proposal': 25000,
      'negotiation': 50000,
      'closed_won': 75000,
      'closed_lost': 0
    };
    return stageValues[stage.toLowerCase()] || 15000;
  }

  private estimateCloseDate(stage: string): string {
    // Estimate close date based on stage
    const daysFromNow: Record<string, number> = {
      'prospecting': 90,
      'qualification': 60,
      'proposal': 30,
      'negotiation': 15,
      'closed_won': 0,
      'closed_lost': 0
    };
    
    const days = daysFromNow[stage.toLowerCase()] || 45;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  // Helper methods for enhancing fields
  private enhanceName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private enhanceEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private enhancePhone(phone: string): string {
    return phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
  }

  private enhanceCompany(company: string): string {
    return company.trim().replace(/\s+/g, ' ');
  }
}

// Export singleton instance
export const contextualDataCompletionService = new ContextualDataCompletionService(); 