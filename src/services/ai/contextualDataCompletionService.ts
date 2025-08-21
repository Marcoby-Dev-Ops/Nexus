/**
 * Contextual Data Completion Service
 * AI-powered data completion and enhancement based on context
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

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

export class ContextualDataCompletionService extends BaseService {
  /**
   * Complete missing data fields based on context
   */
  async completeData(context: CompletionContext): Promise<ServiceResponse<CompletionResult>> {
    const userIdValidation = this.validateIdParam(context.userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const dataTypeValidation = this.validateRequiredParam(context.dataType, 'dataType');
    if (dataTypeValidation) {
      return this.createErrorResponse(dataTypeValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Analyze existing data patterns
          const patterns = await this.analyzePatterns(context);
          
          // Generate suggestions based on patterns
          const suggestions = await this.generateSuggestions(context, patterns);
          
          // Validate suggestions against business rules
          const validatedSuggestions = await this.validateSuggestions(suggestions, context);
          
          return {
            data: {
              completed: Object.keys(validatedSuggestions).length > 0,
              suggestedData: validatedSuggestions,
              confidence: this.calculateConfidence(validatedSuggestions, patterns),
              reasoning: this.generateReasoning(validatedSuggestions, patterns)
            },
            error: null
          };
        } catch (error) {
          return {
            data: {
              completed: false,
              suggestedData: {},
              confidence: 0,
              reasoning: 'Unable to complete data due to an error'
            },
            error: error instanceof Error ? error.message : 'Data completion failed'
          };
        }
      },
      'completeData'
    );
  }

  /**
   * Enhance existing data with additional context
   */
  async enhanceData(data: Record<string, any>, context: CompletionContext): Promise<ServiceResponse<DataEnhancement[]>> {
    const userIdValidation = this.validateIdParam(context.userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const enhancements: DataEnhancement[] = [];
          
          // Analyze each field for potential enhancements
          for (const [field, value] of Object.entries(data)) {
            if (typeof value === 'string' && value.trim()) {
              const enhancement = await this.enhanceField(field, value, context);
              if (enhancement) {
                enhancements.push(enhancement);
              }
            }
          }

          return { data: enhancements, error: null };
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Data enhancement failed' };
        }
      },
      'enhanceData'
    );
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
    const validatedSuggestions: Record<string, any> = {};
    
    for (const [field, value] of Object.entries(suggestions)) {
      if (this.isValidSuggestion(field, value, context)) {
        validatedSuggestions[field] = value;
      }
    }
    
    return validatedSuggestions;
  }

  /**
   * Calculate confidence score for suggestions
   */
  private calculateConfidence(suggestions: Record<string, any>, patterns: Record<string, any>): number {
    if (Object.keys(suggestions).length === 0) {
      return 0;
    }
    
    // Simple confidence calculation based on pattern matches
    let totalConfidence = 0;
    let suggestionCount = 0;
    
    for (const [field, value] of Object.entries(suggestions)) {
      let fieldConfidence = 0.5; // Base confidence
      
      // Increase confidence based on pattern matches
      if (patterns.emailPattern && field === 'email' && patterns.emailPattern.test(value)) {
        fieldConfidence += 0.3;
      }
      if (patterns.phonePattern && field === 'phone' && patterns.phonePattern.test(value)) {
        fieldConfidence += 0.3;
      }
      if (patterns.domainPattern && field === 'website' && patterns.domainPattern.test(value)) {
        fieldConfidence += 0.3;
      }
      
      totalConfidence += Math.min(fieldConfidence, 1.0);
      suggestionCount++;
    }
    
    return suggestionCount > 0 ? totalConfidence / suggestionCount : 0;
  }

  /**
   * Generate reasoning for suggestions
   */
  private generateReasoning(suggestions: Record<string, any>, patterns: Record<string, any>): string {
    const reasons: string[] = [];
    
    for (const [field, value] of Object.entries(suggestions)) {
      reasons.push(`Generated ${field} based on existing data patterns and business rules`);
    }
    
    return reasons.length > 0 ? reasons.join('; ') : 'No suggestions generated';
  }

  /**
   * Enhance a specific field
   */
  private async enhanceField(field: string, value: string, context: CompletionContext): Promise<DataEnhancement | null> {
    try {
      let enhancedValue = value;
      let confidence = 0.5;
      const source = 'pattern_matching';
      
      switch (field.toLowerCase()) {
        case 'name':
          enhancedValue = this.enhanceName(value);
          confidence = 0.8;
          break;
        case 'email':
          enhancedValue = this.enhanceEmail(value);
          confidence = 0.9;
          break;
        case 'phone':
          enhancedValue = this.enhancePhone(value);
          confidence = 0.7;
          break;
        case 'company':
          enhancedValue = this.enhanceCompany(value);
          confidence = 0.6;
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
      
      return null;
    } catch (error) {
      this.logger.error('Error enhancing field', { error, field, value });
      return null;
    }
  }

  /**
   * Validate if a suggestion is valid
   */
  private isValidSuggestion(field: string, value: any, context: CompletionContext): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    
    // Basic validation based on field type
    switch (field.toLowerCase()) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^[\+]?[1-9][\d]{0,15}$/.test(value);
      case 'website':
        return /^https?:\/\/.+/.test(value);
      case 'value':
        return !isNaN(Number(value)) && Number(value) > 0;
      default:
        return value.trim().length > 0;
    }
  }

  // Helper methods for data generation
  private generateEmailFromName(name: string): string {
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    return `${cleanName}@example.com`;
  }

  private generatePhoneFromCompany(company: string): string {
    // Simulate phone generation
    return `+1-555-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  private generateWebsiteFromName(name: string): string {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://www.${cleanName}.com`;
  }

  private extractIndustryFromDescription(description: string): string {
    const industries = [
      'technology', 'healthcare', 'finance', 'retail', 'manufacturing', 'education',
      'real estate', 'consulting', 'marketing', 'advertising', 'legal', 'non-profit',
      'food', 'beverage', 'hospitality', 'tourism', 'transportation', 'logistics',
      'energy', 'utilities', 'construction', 'media', 'entertainment', 'fashion',
      'apparel', 'automotive', 'agriculture', 'pharmaceuticals', 'telecommunications',
      'aerospace', 'defense', 'biotechnology', 'environmental', 'sports', 'fitness',
      'beauty', 'personal care', 'home', 'garden', 'pet', 'professional services',
      'creative arts', 'government'
    ];
    const lowerDesc = description.toLowerCase();
    
    for (const industry of industries) {
      if (lowerDesc.includes(industry)) {
        return industry;
      }
    }
    
    return 'general';
  }

  private estimateDealValue(stage: string): number {
    const stageValues: Record<string, number> = {
      'prospecting': 5000,
      'qualification': 10000,
      'proposal': 25000,
      'negotiation': 50000,
      'closed_won': 75000,
      'closed_lost': 0
    };
    
    return stageValues[stage] || 10000;
  }

  private estimateCloseDate(stage: string): string {
    const now = new Date();
    const stageDelays: Record<string, number> = {
      'prospecting': 30,
      'qualification': 60,
      'proposal': 90,
      'negotiation': 120,
      'closed_won': 0,
      'closed_lost': 0
    };
    
    const daysToAdd = stageDelays[stage] || 90;
    const closeDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return closeDate.toISOString().split('T')[0];
  }

  // Field enhancement methods
  private enhanceName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private enhanceEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private enhancePhone(phone: string): string {
    // Standardize phone format
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    return `+1-${cleaned}`;
  }

  private enhanceCompany(company: string): string {
    return company.trim().replace(/\s+/g, ' ');
  }
}

// Export singleton instance
export const contextualDataCompletionService = new ContextualDataCompletionService(); 
