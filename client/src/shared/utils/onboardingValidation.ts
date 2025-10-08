/**
 * Onboarding Validation Service
 * Validates onboarding data and ensures compliance
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  field: string;
  type: 'required' | 'email' | 'phone' | 'url' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
  category: 'personal' | 'business' | 'compliance' | 'technical';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
  recommendations: string[];
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  field: string;
  rule: string;
  message: string;
  recommendation: string;
}

export interface OnboardingData {
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
  };
  businessInfo: {
    companyName: string;
    industry: string;
    businessModel: string;
    companySize: string;
    website?: string;
  };
  complianceInfo: {
    dataProcessingConsent: boolean;
    marketingConsent: boolean;
    termsAccepted: boolean;
    privacyPolicyAccepted: boolean;
  };
  technicalInfo: {
    preferredTimezone: string;
    preferredLanguage: string;
    notificationPreferences: string[];
  };
}

export class OnboardingValidationService extends BaseService {
  private validationRules: ValidationRule[] = [
    {
      id: 'first_name_required',
      name: 'First Name Required',
      description: 'First name is required for account creation',
      field: 'personalInfo.firstName',
      type: 'required',
      message: 'First name is required',
      severity: 'error',
      category: 'personal'
    },
    {
      id: 'last_name_required',
      name: 'Last Name Required',
      description: 'Last name is required for account creation',
      field: 'personalInfo.lastName',
      type: 'required',
      message: 'Last name is required',
      severity: 'error',
      category: 'personal'
    },
    {
      id: 'email_required',
      name: 'Email Required',
      description: 'Valid email address is required',
      field: 'personalInfo.email',
      type: 'email',
      message: 'Valid email address is required',
      severity: 'error',
      category: 'personal'
    },
    {
      id: 'company_name_required',
      name: 'Company Name Required',
      description: 'Company name is required for business setup',
      field: 'businessInfo.companyName',
      type: 'required',
      message: 'Company name is required',
      severity: 'error',
      category: 'business'
    },
    {
      id: 'industry_required',
      name: 'Industry Required',
      description: 'Industry selection is required',
      field: 'businessInfo.industry',
      type: 'required',
      message: 'Industry selection is required',
      severity: 'error',
      category: 'business'
    },
    {
      id: 'data_consent_required',
      name: 'Data Processing Consent Required',
      description: 'Data processing consent is required for compliance',
      field: 'complianceInfo.dataProcessingConsent',
      type: 'required',
      message: 'Data processing consent is required',
      severity: 'error',
      category: 'compliance'
    },
    {
      id: 'terms_required',
      name: 'Terms Acceptance Required',
      description: 'Terms of service acceptance is required',
      field: 'complianceInfo.termsAccepted',
      type: 'required',
      message: 'Terms of service acceptance is required',
      severity: 'error',
      category: 'compliance'
    }
  ];

  /**
   * Validate onboarding data
   */
  async validateOnboardingData(data: OnboardingData): Promise<ServiceResponse<ValidationResult>> {
    const userIdValidation = this.validateIdParam(data.userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const errors: ValidationError[] = [];
          const warnings: ValidationWarning[] = [];
          let score = 100;

          // Validate each field against rules
          for (const rule of this.validationRules) {
            const fieldValue = this.getFieldValue(data, rule.field);
            const validationResponse = await this.validateField(fieldValue, rule);

            if (!validationResponse.data?.isValid) {
              errors.push({
                field: rule.field,
                rule: rule.name,
                message: rule.message,
                severity: rule.severity
              });

              if (rule.severity === 'error') {
                score -= 10;
              } else if (rule.severity === 'warning') {
                score -= 5;
              }
            }
          }

          // Generate warnings for optional improvements
          const improvementWarnings = this.generateImprovementWarnings(data);
          warnings.push(...improvementWarnings);

          // Generate recommendations
          const recommendations = this.generateRecommendations(errors, warnings);

          return {
            data: {
              isValid: errors.filter(e => e.severity === 'error').length === 0,
              errors,
              warnings,
              score: Math.max(0, score),
              recommendations
            },
            error: null,
            success: true
          } as ServiceResponse<ValidationResult>;
        } catch (error) {
          return {
            data: null,
            error: error instanceof Error ? error.message : 'Validation failed',
            success: false
          };
        }
      },
      'validateOnboardingData'
    );
  }

  /**
   * Validate specific field
   */
  async validateField(fieldValue: any, rule: ValidationRule): Promise<ServiceResponse<{ isValid: boolean; message?: string }>> {
    const fieldValidation = this.validateRequiredParams({ fieldValue }, ['fieldValue']);
    if (!fieldValidation.isValid) {
      return this.createErrorResponse(fieldValidation.error || 'Missing required field');
    }

    return this.executeDbOperation(
      async () => {
        try {
          const isValid = this.performFieldValidation(fieldValue, rule);
          return {
            data: {
              isValid,
              message: isValid ? undefined : rule.message
            },
            error: null,
            success: true
          } as ServiceResponse<{ isValid: boolean; message?: string }>;
        } catch (error) {
          return {
            data: null,
            error: error instanceof Error ? error.message : 'Validation failed',
            success: false
          };
        }
      },
      'validateField'
    );
  }

  /**
   * Get validation rules by category
   */
  async getValidationRules(category?: string): Promise<ServiceResponse<ValidationRule[]>> {
    return this.executeDbOperation(
      async () => {
        try {
          let rules = this.validationRules;

          if (category) {
            rules = rules.filter(rule => rule.category === category);
          }

          return { data: rules, error: null, success: true } as ServiceResponse<ValidationRule[]>;
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Failed to get validation rules', success: false };
        }
      },
      'getValidationRules'
    );
  }

  /**
   * Add custom validation rule
   */
  async addValidationRule(rule: Omit<ValidationRule, 'id'>): Promise<ServiceResponse<string>> {
    const nameValidation = this.validateRequiredParams({ name: rule.name }, ['name']);
    if (!nameValidation.isValid) {
      return this.createErrorResponse(nameValidation.error || 'Missing required name');
    }

    const fieldValidation = this.validateRequiredParams({ field: rule.field }, ['field']);
    if (!fieldValidation.isValid) {
      return this.createErrorResponse(fieldValidation.error || 'Missing required field');
    }

    return this.executeDbOperation(
      async () => {
        try {
          const newRule: ValidationRule = {
            ...rule,
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };

          this.validationRules.push(newRule);

          return { data: newRule.id, error: null, success: true } as ServiceResponse<string>;
        } catch (error) {
          return { data: '', error: error instanceof Error ? error.message : 'Failed to add validation rule', success: false };
        }
      },
      'addValidationRule'
    );
  }

  /**
   * Update validation rule
   */
  async updateValidationRule(ruleId: string, updates: Partial<ValidationRule>): Promise<ServiceResponse<void>> {
    const validation = this.validateIdParam(ruleId, 'ruleId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const ruleIndex = this.validationRules.findIndex(rule => rule.id === ruleId);
          if (ruleIndex === -1) {
            return { data: null, error: 'Validation rule not found', success: false };
          }

          this.validationRules[ruleIndex] = {
            ...this.validationRules[ruleIndex],
            ...updates
          };

          return { data: undefined, error: null, success: true } as ServiceResponse<void>;
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to update validation rule', success: false };
        }
      },
      'updateValidationRule'
    );
  }

  /**
   * Delete validation rule
   */
  async deleteValidationRule(ruleId: string): Promise<ServiceResponse<boolean>> {
    const validation = this.validateIdParam(ruleId, 'ruleId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const initialLength = this.validationRules.length;
          this.validationRules = this.validationRules.filter(rule => rule.id !== ruleId);
          const deleted = this.validationRules.length < initialLength;

          return { data: deleted, error: null, success: true } as ServiceResponse<boolean>;
        } catch (error) {
          return { data: false, error: error instanceof Error ? error.message : 'Failed to delete validation rule', success: false };
        }
      },
      'deleteValidationRule'
    );
  }

  /**
   * Get validation statistics
   */
  async getValidationStatistics(): Promise<ServiceResponse<{
    totalRules: number;
    rulesByCategory: Record<string, number>;
    rulesBySeverity: Record<string, number>;
    rulesByType: Record<string, number>;
  }>> {
    return this.executeDbOperation(
      async () => {
        try {
          const rulesByCategory = this.validationRules.reduce((acc, rule) => {
            acc[rule.category] = (acc[rule.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const rulesBySeverity = this.validationRules.reduce((acc, rule) => {
            acc[rule.severity] = (acc[rule.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const rulesByType = this.validationRules.reduce((acc, rule) => {
            acc[rule.type] = (acc[rule.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return {
            data: {
              totalRules: this.validationRules.length,
              rulesByCategory,
              rulesBySeverity,
              rulesByType
            },
            error: null,
            success: true
          };
        } catch (error) {
          return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to get validation statistics',
            success: false
          };
        }
      },
      'getValidationStatistics'
    );
  }

  // Private helper methods
  private getFieldValue(data: OnboardingData, fieldPath: string): any {
    const path = fieldPath.split('.');
    let value: any = data;

    for (const key of path) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private performFieldValidation(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value !== undefined && value !== null && value !== '';
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        // '+' does not need escaping outside character class
        return typeof value === 'string' && /^[+]?\d{1,16}$/.test(value);
      case 'url':
        return typeof value === 'string' && /^https?:\/\/.+/.test(value);
      case 'min_length':
        return typeof value === 'string' && value.length >= (rule.value || 0);
      case 'max_length':
        return typeof value === 'string' && value.length <= (rule.value || 1000);
      case 'pattern':
        return typeof value === 'string' && new RegExp(rule.value || '').test(value);
      case 'custom':
        return rule.value ? rule.value(value) : true;
      default:
        return true;
    }
  }

  private generateImprovementWarnings(data: OnboardingData): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for optional improvements
    if (!data.personalInfo.phone) {
      warnings.push({
        field: 'personalInfo.phone',
        rule: 'Phone Number Recommended',
        message: 'Phone number is recommended for account security',
        recommendation: 'Add a phone number for two-factor authentication'
      });
    }

    if (!data.businessInfo.website) {
      warnings.push({
        field: 'businessInfo.website',
        rule: 'Website Recommended',
        message: 'Business website is recommended',
        recommendation: 'Add your business website for better profile completion'
      });
    }

    if (!data.complianceInfo.marketingConsent) {
      warnings.push({
        field: 'complianceInfo.marketingConsent',
        rule: 'Marketing Consent Recommended',
        message: 'Marketing consent is recommended for updates',
        recommendation: 'Consider opting in for product updates and news'
      });
    }

    return warnings;
  }

  private generateRecommendations(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const recommendations: string[] = [];

    // Add recommendations based on errors
    if (errors.some(e => e.field.includes('personalInfo'))) {
      recommendations.push('Complete your personal information to proceed');
    }

    if (errors.some(e => e.field.includes('businessInfo'))) {
      recommendations.push('Complete your business information for better service');
    }

    if (errors.some(e => e.field.includes('complianceInfo'))) {
      recommendations.push('Accept required terms and consents to continue');
    }

    // Add recommendations based on warnings
    if (warnings.some(w => w.field.includes('phone'))) {
      recommendations.push('Add a phone number for enhanced security');
    }

    if (warnings.some(w => w.field.includes('website'))) {
      recommendations.push('Add your business website for better profile completion');
    }

    return recommendations;
  }
}

// Export singleton instance
export const onboardingValidationService = new OnboardingValidationService(); 
