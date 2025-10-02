/**
 * AI Form Assistance Service
 * 
 * Provides AI-powered form completion assistance with:
 * - Context-aware field suggestions
 * - Form completion tracking
 * - Integration with existing AI conversation system
 * - Real-time completion percentage calculation
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { postgres } from '@/lib/postgres';

// ============================================================================
// INTERFACES
// ============================================================================

export interface FormAssistanceSession {
  id: string;
  user_id: string;
  company_id: string;
  conversation_id?: string;
  form_type: string;
  session_data: Record<string, any>;
  conversation_history: any[];
  suggestions_generated: any[];
  fields_completed: string[];
  completion_percentage: number;
  status: 'active' | 'completed' | 'abandoned';
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface FormSuggestion {
  id: string;
  session_id: string;
  field_name: string;
  field_type: 'text' | 'select' | 'textarea' | 'array';
  suggested_value: string;
  confidence_score: number;
  reasoning: string;
  source_context: Record<string, any>;
  accepted: boolean;
  applied_at?: Date;
  created_at: Date;
}

export interface FormAssistanceContext {
  userId: string;
  companyId: string;
  formType: string;
  existingData?: Record<string, any>;
  conversationId?: string;
}

// Contextual Data Completion Interfaces (Merged from contextualDataCompletionService)
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

export interface FieldSuggestionRequest {
  sessionId: string;
  fieldName: string;
  fieldType: 'text' | 'select' | 'textarea' | 'array';
  currentValue?: string;
  contextData?: Record<string, any>;
}

export interface FormCompletionResult {
  sessionId: string;
  completionPercentage: number;
  fieldsCompleted: string[];
  suggestionsGenerated: number;
  status: 'active' | 'completed' | 'abandoned';
}

// ============================================================================
// AI FORM ASSISTANCE SERVICE
// ============================================================================

export class AIFormAssistanceService extends BaseService {
  /**
   * Create a new form assistance session
   */
  async createSession(context: FormAssistanceContext): Promise<ServiceResponse<FormAssistanceSession>> {
    const userIdValidation = this.validateIdParam(context.userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const companyIdValidation = this.validateIdParam(context.companyId, 'companyId');
    if (companyIdValidation) {
      return this.createErrorResponse(companyIdValidation);
    }

    if (!context.formType) {
      return this.createErrorResponse('formType is required');
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Create AI conversation for this session
          const conversationResult = await postgres.query(
            `INSERT INTO ai_conversations (user_id, title, context)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [
              context.userId,
              `Form Assistance - ${context.formType}`,
              JSON.stringify({
                formType: context.formType,
                companyId: context.companyId,
                existingData: context.existingData || {}
              })
            ]
          );

          const conversationId = conversationResult.rows[0]?.id;

          // Create form assistance session
          const sessionResult = await postgres.query(
            `INSERT INTO ai_form_assistance_sessions (
              user_id, company_id, conversation_id, form_type, session_data
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
              context.userId,
              context.companyId,
              conversationId,
              context.formType,
              JSON.stringify(context.existingData || {})
            ]
          );

          const session = sessionResult.rows[0];
          
          this.logger.info('Form assistance session created', {
            sessionId: session.id,
            formType: context.formType,
            userId: context.userId
          });

          return {
            data: this.mapDatabaseRowToSession(session),
            error: null
          };
        } catch (error) {
          this.logger.error('Error creating form assistance session', error);
          throw error;
        }
      },
      'createSession'
    );
  }

  /**
   * Get an existing form assistance session
   */
  async getSession(sessionId: string): Promise<ServiceResponse<FormAssistanceSession>> {
    const sessionIdValidation = this.validateIdParam(sessionId, 'sessionId');
    if (sessionIdValidation) {
      return this.createErrorResponse(sessionIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const result = await postgres.query(
            'SELECT * FROM ai_form_assistance_sessions WHERE id = $1',
            [sessionId]
          );

          if (result.rows.length === 0) {
            return {
              data: null,
              error: 'Form assistance session not found'
            };
          }

          return {
            data: this.mapDatabaseRowToSession(result.rows[0]),
            error: null
          };
        } catch (error) {
          this.logger.error('Error retrieving form assistance session', error);
          throw error;
        }
      },
      'getSession'
    );
  }

  /**
   * Update session data and recalculate completion percentage
   */
  async updateSessionData(
    sessionId: string, 
    sessionData: Record<string, any>
  ): Promise<ServiceResponse<FormCompletionResult>> {
    const sessionIdValidation = this.validateIdParam(sessionId, 'sessionId');
    if (sessionIdValidation) {
      return this.createErrorResponse(sessionIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Update session data
          const result = await postgres.query(
            `UPDATE ai_form_assistance_sessions 
             SET session_data = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [JSON.stringify(sessionData), sessionId]
          );

          if (result.rows.length === 0) {
            return {
              data: null,
              error: 'Form assistance session not found'
            };
          }

          const session = result.rows[0];
          
          // Calculate completion metrics
          const completionMetrics = this.calculateCompletionMetrics(sessionData);
          
          this.logger.info('Form assistance session updated', {
            sessionId,
            completionPercentage: completionMetrics.completionPercentage
          });

          return {
            data: {
              sessionId: session.id,
              completionPercentage: completionMetrics.completionPercentage,
              fieldsCompleted: completionMetrics.fieldsCompleted,
              suggestionsGenerated: session.suggestions_generated?.length || 0,
              status: session.status
            },
            error: null
          };
        } catch (error) {
          this.logger.error('Error updating form assistance session', error);
          throw error;
        }
      },
      'updateSessionData'
    );
  }

  /**
   * Generate AI suggestions for a specific field
   */
  async generateFieldSuggestion(request: FieldSuggestionRequest): Promise<ServiceResponse<FormSuggestion>> {
    const sessionIdValidation = this.validateIdParam(request.sessionId, 'sessionId');
    if (sessionIdValidation) {
      return this.createErrorResponse(sessionIdValidation);
    }

    const fieldNameValidation = this.validateRequiredParam(request.fieldName, 'fieldName');
    if (fieldNameValidation) {
      return this.createErrorResponse(fieldNameValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Get session context
          const sessionResult = await postgres.query(
            'SELECT * FROM ai_form_assistance_sessions WHERE id = $1',
            [request.sessionId]
          );

          if (sessionResult.rows.length === 0) {
            return {
              data: null,
              error: 'Form assistance session not found'
            };
          }

          const session = sessionResult.rows[0];

          // Get company knowledge for context
          const companyKnowledgeResult = await postgres.query(
            'SELECT data FROM company_knowledge_data WHERE company_id = $1',
            [session.company_id]
          );

          const companyKnowledge = companyKnowledgeResult.rows[0]?.data || {};

          // Generate AI suggestion (placeholder - would integrate with actual AI service)
          const suggestion = await this.generateAISuggestion(
            request.fieldName,
            request.fieldType,
            request.currentValue,
            {
              sessionData: session.session_data,
              companyKnowledge,
              contextData: request.contextData || {}
            }
          );

          // Save suggestion to database
          const suggestionResult = await postgres.query(
            `INSERT INTO ai_form_suggestions (
              session_id, field_name, field_type, suggested_value, 
              confidence_score, reasoning, source_context
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
              request.sessionId,
              request.fieldName,
              request.fieldType,
              suggestion.value,
              suggestion.confidence,
              suggestion.reasoning,
              JSON.stringify(suggestion.sourceContext)
            ]
          );

          const savedSuggestion = suggestionResult.rows[0];

          this.logger.info('AI field suggestion generated', {
            sessionId: request.sessionId,
            fieldName: request.fieldName,
            confidence: suggestion.confidence
          });

          return {
            data: this.mapDatabaseRowToSuggestion(savedSuggestion),
            error: null
          };
        } catch (error) {
          this.logger.error('Error generating field suggestion', error);
          throw error;
        }
      },
      'generateFieldSuggestion'
    );
  }

  /**
   * Accept and apply a field suggestion
   */
  async acceptSuggestion(suggestionId: string): Promise<ServiceResponse<boolean>> {
    const suggestionIdValidation = this.validateIdParam(suggestionId, 'suggestionId');
    if (suggestionIdValidation) {
      return this.createErrorResponse(suggestionIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Get the suggestion
          const suggestionResult = await postgres.query(
            'SELECT * FROM ai_form_suggestions WHERE id = $1',
            [suggestionId]
          );

          if (suggestionResult.rows.length === 0) {
            return {
              data: null,
              error: 'Suggestion not found'
            };
          }

          const suggestion = suggestionResult.rows[0];

          // Update suggestion as accepted
          await postgres.query(
            `UPDATE ai_form_suggestions 
             SET accepted = true, applied_at = NOW()
             WHERE id = $1`,
            [suggestionId]
          );

          // Update session data with the accepted suggestion
          const sessionResult = await postgres.query(
            'SELECT session_data FROM ai_form_assistance_sessions WHERE id = $1',
            [suggestion.session_id]
          );

          if (sessionResult.rows.length > 0) {
            const sessionData = sessionResult.rows[0].session_data || {};
            sessionData[suggestion.field_name] = suggestion.suggested_value;

            await postgres.query(
              `UPDATE ai_form_assistance_sessions 
               SET session_data = $1, updated_at = NOW()
               WHERE id = $2`,
              [JSON.stringify(sessionData), suggestion.session_id]
            );
          }

          this.logger.info('Field suggestion accepted', {
            suggestionId,
            fieldName: suggestion.field_name,
            sessionId: suggestion.session_id
          });

          return {
            data: true,
            error: null
          };
        } catch (error) {
          this.logger.error('Error accepting suggestion', error);
          throw error;
        }
      },
      'acceptSuggestion'
    );
  }

  /**
   * Complete a form assistance session
   */
  async completeSession(sessionId: string): Promise<ServiceResponse<FormCompletionResult>> {
    const sessionIdValidation = this.validateIdParam(sessionId, 'sessionId');
    if (sessionIdValidation) {
      return this.createErrorResponse(sessionIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const result = await postgres.query(
            `UPDATE ai_form_assistance_sessions 
             SET status = 'completed', completed_at = NOW(), updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [sessionId]
          );

          if (result.rows.length === 0) {
            return {
              data: null,
              error: 'Form assistance session not found'
            };
          }

          const session = result.rows[0];
          const completionMetrics = this.calculateCompletionMetrics(session.session_data);

          this.logger.info('Form assistance session completed', {
            sessionId,
            completionPercentage: completionMetrics.completionPercentage
          });

          return {
            data: {
              sessionId: session.id,
              completionPercentage: completionMetrics.completionPercentage,
              fieldsCompleted: completionMetrics.fieldsCompleted,
              suggestionsGenerated: session.suggestions_generated?.length || 0,
              status: session.status
            },
            error: null
          };
        } catch (error) {
          this.logger.error('Error completing form assistance session', error);
          throw error;
        }
      },
      'completeSession'
    );
  }

  // ============================================================================
  // CONTEXTUAL DATA COMPLETION (Merged from contextualDataCompletionService)
  // ============================================================================

  /**
   * Complete missing data fields based on context
   */
  async completeData(context: CompletionContext): Promise<ServiceResponse<CompletionResult>> {
    const userIdValidation = this.validateIdParam(context.userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    if (!context.dataType) {
      return this.createErrorResponse('dataType is required');
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
          return {
            data: [],
            error: error instanceof Error ? error.message : 'Data enhancement failed'
          };
        }
      },
      'enhanceData'
    );
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate completion metrics from session data
   */
  private calculateCompletionMetrics(sessionData: Record<string, any>) {
    const fields = Object.keys(sessionData);
    const completedFields = fields.filter(field => {
      const value = sessionData[field];
      return value && typeof value === 'string' && value.trim().length > 0;
    });

    const completionPercentage = fields.length > 0 
      ? Math.round((completedFields.length / fields.length) * 100)
      : 0;

    return {
      completionPercentage,
      fieldsCompleted: completedFields
    };
  }

  /**
   * Generate AI suggestion for a field (placeholder implementation)
   */
  private async generateAISuggestion(
    fieldName: string,
    fieldType: string,
    currentValue?: string,
    context?: Record<string, any>
  ) {
    // This would integrate with the actual AI service
    // For now, return a placeholder suggestion
    return {
      value: `AI-generated ${fieldName}`,
      confidence: 0.85,
      reasoning: `Generated based on ${fieldType} field type and context`,
      sourceContext: context || {}
    };
  }

  // ============================================================================
  // CONTEXTUAL DATA COMPLETION HELPER METHODS
  // ============================================================================

  /**
   * Analyze patterns in existing data
   */
  private async analyzePatterns(context: CompletionContext): Promise<Record<string, any>> {
    const patterns: Record<string, any> = {};
    
    // Analyze existing data for patterns
    for (const [field, value] of Object.entries(context.existingData)) {
      if (typeof value === 'string' && value.trim()) {
        patterns[field] = {
          type: this.detectFieldType(field),
          commonValues: [value],
          format: this.detectFormat(value)
        };
      }
    }
    
    return patterns;
  }

  /**
   * Generate suggestions based on patterns
   */
  private async generateSuggestions(context: CompletionContext, patterns: Record<string, any>): Promise<Record<string, any>> {
    const suggestions: Record<string, any> = {};
    
    // Generate suggestions for missing fields
    for (const [field, value] of Object.entries(context.partialData)) {
      if (!value || (typeof value === 'string' && !value.trim())) {
        const suggestion = await this.generateFieldSuggestion(field, patterns, context);
        if (suggestion) {
          suggestions[field] = suggestion;
        }
      }
    }
    
    return suggestions;
  }

  /**
   * Validate suggestions against business rules
   */
  private async validateSuggestions(suggestions: Record<string, any>, context: CompletionContext): Promise<Record<string, any>> {
    const validated: Record<string, any> = {};
    
    for (const [field, suggestion] of Object.entries(suggestions)) {
      if (this.validateFieldValue(field, suggestion.value, context)) {
        validated[field] = suggestion;
      }
    }
    
    return validated;
  }

  /**
   * Enhance a specific field
   */
  private async enhanceField(field: string, value: string, context: CompletionContext): Promise<DataEnhancement | null> {
    const enhancement = await this.generateFieldEnhancement(field, value, context);
    
    if (enhancement && enhancement.confidence > 0.7) {
      return {
        field,
        originalValue: value,
        enhancedValue: enhancement.value,
        confidence: enhancement.confidence,
        source: enhancement.source
      };
    }
    
    return null;
  }

  /**
   * Detect field type based on field name
   */
  private detectFieldType(field: string): string {
    const fieldLower = field.toLowerCase();
    
    if (fieldLower.includes('email')) return 'email';
    if (fieldLower.includes('phone')) return 'phone';
    if (fieldLower.includes('name')) return 'name';
    if (fieldLower.includes('address')) return 'address';
    if (fieldLower.includes('company')) return 'company';
    if (fieldLower.includes('title')) return 'title';
    if (fieldLower.includes('industry')) return 'industry';
    
    return 'text';
  }

  /**
   * Detect format of a value
   */
  private detectFormat(value: string): string {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
    if (/^\+?[\d\s\-\(\)]+$/.test(value)) return 'phone';
    if (/^\d{1,5}\s+[A-Za-z\s]+/.test(value)) return 'address';
    
    return 'text';
  }



  /**
   * Validate field value
   */
  private validateFieldValue(field: string, value: any, context: CompletionContext): boolean {
    if (!value) return false;
    
    const fieldType = this.detectFieldType(field);
    
    switch (fieldType) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^\+?[\d\s\-\(\)]+$/.test(value);
      default:
        return typeof value === 'string' && value.trim().length > 0;
    }
  }

  /**
   * Generate field enhancement
   */
  private async generateFieldEnhancement(field: string, value: string, context: CompletionContext): Promise<any> {
    const fieldType = this.detectFieldType(field);
    
    // Enhance value based on field type
    switch (fieldType) {
      case 'email':
        return this.enhanceEmail(value);
      case 'phone':
        return this.enhancePhone(value);
      case 'name':
        return this.enhanceName(value);
      default:
        return null;
    }
  }

  /**
   * Enhance email format
   */
  private enhanceEmail(email: string): any {
    const normalized = email.toLowerCase().trim();
    if (normalized.includes('@')) {
      return {
        value: normalized,
        confidence: 0.9,
        source: 'format-normalization'
      };
    }
    return null;
  }

  /**
   * Enhance phone format
   */
  private enhancePhone(phone: string): any {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length >= 10) {
      const formatted = `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      return {
        value: formatted,
        confidence: 0.85,
        source: 'format-standardization'
      };
    }
    return null;
  }

  /**
   * Enhance name format
   */
  private enhanceName(name: string): any {
    const words = name.trim().split(/\s+/);
    const capitalized = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return {
      value: capitalized,
      confidence: 0.8,
      source: 'case-normalization'
    };
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(suggestions: Record<string, any>, patterns: Record<string, any>): number {
    if (Object.keys(suggestions).length === 0) return 0;
    
    const scores = Object.values(suggestions).map((s: any) => s.confidence || 0);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Generate reasoning for suggestions
   */
  private generateReasoning(suggestions: Record<string, any>, patterns: Record<string, any>): string {
    const fields = Object.keys(suggestions);
    if (fields.length === 0) return 'No suggestions generated';
    
    return `Generated ${fields.length} suggestions based on ${Object.keys(patterns).length} data patterns`;
  }

  /**
   * Map database row to FormAssistanceSession interface
   */
  private mapDatabaseRowToSession(row: any): FormAssistanceSession {
    return {
      id: row.id,
      user_id: row.user_id,
      company_id: row.company_id,
      conversation_id: row.conversation_id,
      form_type: row.form_type,
      session_data: row.session_data || {},
      conversation_history: row.conversation_history || [],
      suggestions_generated: row.suggestions_generated || [],
      fields_completed: row.fields_completed || [],
      completion_percentage: row.completion_percentage || 0,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined
    };
  }

  /**
   * Map database row to FormSuggestion interface
   */
  private mapDatabaseRowToSuggestion(row: any): FormSuggestion {
    return {
      id: row.id,
      session_id: row.session_id,
      field_name: row.field_name,
      field_type: row.field_type,
      suggested_value: row.suggested_value,
      confidence_score: parseFloat(row.confidence_score) || 0,
      reasoning: row.reasoning,
      source_context: row.source_context || {},
      accepted: row.accepted || false,
      applied_at: row.applied_at ? new Date(row.applied_at) : undefined,
      created_at: new Date(row.created_at)
    };
  }
}

// Export singleton instance
export const aiFormAssistanceService = new AIFormAssistanceService();
