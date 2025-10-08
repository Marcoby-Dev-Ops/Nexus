import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { z } from 'zod';

// Data Mapping Schema
export const DataMappingSchema = z.object({
  id: z.string(),
  integrationType: z.string(),
  entityType: z.string(), // 'contact', 'company', 'deal', 'transaction', etc.
  externalField: z.string(),
  internalField: z.string(),
  fieldType: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
  isRequired: z.boolean().default(false),
  defaultValue: z.any().optional(),
  transformation: z.string().optional(), // JavaScript transformation function
  validation: z.string().optional(), // Validation rules
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DataMapping = z.infer<typeof DataMappingSchema>;

// Entity Schema
export const EntitySchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  description: z.string(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string().optional(),
  })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Entity = z.infer<typeof EntitySchema>;

// Mapping Template Schema
export const MappingTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  integrationType: z.string(),
  entityType: z.string(),
  mappings: z.array(DataMappingSchema),
  isDefault: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MappingTemplate = z.infer<typeof MappingTemplateSchema>;

/**
 * Data Mapping Service
 * Handles field mapping between integrations and internal data model
 * 
 * Extends BaseService for consistent error handling and logging
 */
export class DataMappingService extends BaseService {
  /**
   * Get mappings for an integration and entity type
   */
  async getMappings(integrationType: string, entityType: string): Promise<ServiceResponse<DataMapping[]>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from('data_mappings')
        .select('*')
        .eq('integration_type', integrationType)
        .eq('entity_type', entityType)
        .order('external_field');

      if (error) throw error;
      const validatedData = data?.map(item => DataMappingSchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, `get mappings for ${integrationType} ${entityType}`);
  }

  /**
   * Create a new mapping
   */
  async createMapping(mapping: Omit<DataMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<DataMapping>> {
    return this.executeDbOperation(async () => {
      const mappingData = {
        ...mapping,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: result, error } = await this.supabase
        .from('data_mappings')
        .insert(mappingData)
        .select()
        .single();

      if (error) throw error;
      return { data: DataMappingSchema.parse(result), error: null };
    }, `create mapping for ${mapping.integrationType} ${mapping.entityType}`);
  }

  /**
   * Update a mapping
   */
  async updateMapping(id: string, updates: Partial<DataMapping>): Promise<ServiceResponse<DataMapping>> {
    return this.executeDbOperation(async () => {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const { data: result, error } = await this.supabase
        .from('data_mappings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: DataMappingSchema.parse(result), error: null };
    }, `update mapping ${id}`);
  }

  /**
   * Delete a mapping
   */
  async deleteMapping(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const { error } = await this.supabase
        .from('data_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    }, `delete mapping ${id}`);
  }

  /**
   * Get all entity types
   */
  async getEntityTypes(): Promise<ServiceResponse<Entity[]>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from('entities')
        .select('*')
        .order('name');

      if (error) throw error;
      const validatedData = data?.map(item => EntitySchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, 'get entity types');
  }

  /**
   * Get mapping templates
   */
  async getMappingTemplates(integrationType?: string): Promise<ServiceResponse<MappingTemplate[]>> {
    return this.executeDbOperation(async () => {
      let query = this.supabase
        .from('mapping_templates')
        .select('*')
        .order('name');

      if (integrationType) {
        query = query.eq('integration_type', integrationType);
      }

      const { data, error } = await query;

      if (error) throw error;
      const validatedData = data?.map(item => MappingTemplateSchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, `get mapping templates${integrationType ? ` for ${integrationType}` : ''}`);
  }

  /**
   * Create a mapping template
   */
  async createMappingTemplate(template: Omit<MappingTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<MappingTemplate>> {
    return this.executeDbOperation(async () => {
      const templateData = {
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: result, error } = await this.supabase
        .from('mapping_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      return { data: MappingTemplateSchema.parse(result), error: null };
    }, `create mapping template ${template.name}`);
  }

  /**
   * Apply a mapping template to an integration
   */
  async applyMappingTemplate(templateId: string, integrationType: string, entityType: string): Promise<ServiceResponse<DataMapping[]>> {
    return this.executeDbOperation(async () => {
      // Get the template
      const { data: template, error: templateError } = await this.supabase
        .from('mapping_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Create mappings from template
      const mappings: Omit<DataMapping, 'id' | 'createdAt' | 'updatedAt'>[] = template.mappings.map((mapping: any) => ({
        integrationType,
        entityType,
        externalField: mapping.external_field,
        internalField: mapping.internal_field,
        fieldType: mapping.field_type,
        isRequired: mapping.is_required,
        defaultValue: mapping.default_value,
        transformation: mapping.transformation,
        validation: mapping.validation,
      }));

      // Insert all mappings
      const { data: results, error } = await this.supabase
        .from('data_mappings')
        .insert(mappings.map(mapping => ({
          ...mapping,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })))
        .select();

      if (error) throw error;
      const validatedData = results?.map(item => DataMappingSchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, `apply mapping template ${templateId} to ${integrationType} ${entityType}`);
  }

  /**
   * Transform data using mappings
   */
  async transformData(
    integrationType: string,
    entityType: string,
    externalData: Record<string, any>
  ): Promise<ServiceResponse<Record<string, any>>> {
    return this.executeDbOperation(async () => {
      // Get mappings
      const { data: mappings, error } = await this.getMappings(integrationType, entityType);
      if (error) throw new Error(error);

      if (!mappings?.length) {
        return { data: externalData, error: null };
      }

      const transformedData: Record<string, any> = {};

      for (const mapping of mappings) {
        const externalValue = externalData[mapping.externalField];
        
        if (externalValue !== undefined) {
          let transformedValue = externalValue;

          // Apply transformation if specified
          if (mapping.transformation) {
            try {
              const transformFn = new Function('value', 'field', mapping.transformation);
              transformedValue = transformFn(externalValue, mapping.externalField);
            } catch (error) {
              this.logger.warn(`Failed to apply transformation for field ${mapping.externalField}:`, error);
            }
          }

          // Apply validation if specified
          if (mapping.validation) {
            try {
              const validationFn = new Function('value', mapping.validation);
              const isValid = validationFn(transformedValue);
              if (!isValid) {
                this.logger.warn(`Validation failed for field ${mapping.externalField}`);
                if (mapping.isRequired) {
                  throw new Error(`Required field ${mapping.externalField} validation failed`);
                }
                continue;
              }
            } catch (error) {
              this.logger.warn(`Failed to apply validation for field ${mapping.externalField}:`, error);
            }
          }

          transformedData[mapping.internalField] = transformedValue;
        } else if (mapping.isRequired && mapping.defaultValue !== undefined) {
          transformedData[mapping.internalField] = mapping.defaultValue;
        } else if (mapping.isRequired) {
          throw new Error(`Required field ${mapping.externalField} not found in external data`);
        }
      }

      return { data: transformedData, error: null };
    }, `transform data for ${integrationType} ${entityType}`);
  }

  /**
   * Reverse transform data (internal to external)
   */
  async reverseTransformData(
    integrationType: string,
    entityType: string,
    internalData: Record<string, any>
  ): Promise<ServiceResponse<Record<string, any>>> {
    return this.executeDbOperation(async () => {
      // Get mappings
      const { data: mappings, error } = await this.getMappings(integrationType, entityType);
      if (error) throw new Error(error);

      if (!mappings?.length) {
        return { data: internalData, error: null };
      }

      const externalData: Record<string, any> = {};

      for (const mapping of mappings) {
        const internalValue = internalData[mapping.internalField];
        
        if (internalValue !== undefined) {
          let transformedValue = internalValue;

          // Apply reverse transformation if specified
          if (mapping.transformation) {
            try {
              // For reverse transformation, we might need a different approach
              // This is a simplified version
              const transformFn = new Function('value', 'field', mapping.transformation);
              transformedValue = transformFn(internalValue, mapping.internalField);
            } catch (error) {
              this.logger.warn(`Failed to apply reverse transformation for field ${mapping.internalField}:`, error);
            }
          }

          externalData[mapping.externalField] = transformedValue;
        }
      }

      return { data: externalData, error: null };
    }, `reverse transform data for ${integrationType} ${entityType}`);
  }

  /**
   * Validate mapping configuration
   */
  async validateMapping(mapping: Omit<DataMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>> {
    return this.executeDbOperation(async () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate required fields
      if (!mapping.integrationType) {
        errors.push('Integration type is required');
      }

      if (!mapping.entityType) {
        errors.push('Entity type is required');
      }

      if (!mapping.externalField) {
        errors.push('External field is required');
      }

      if (!mapping.internalField) {
        errors.push('Internal field is required');
      }

      if (!mapping.fieldType) {
        errors.push('Field type is required');
      }

      // Validate transformation function if provided
      if (mapping.transformation) {
        try {
          new Function('value', 'field', mapping.transformation);
        } catch (error) {
          errors.push(`Invalid transformation function: ${error}`);
        }
      }

      // Validate validation function if provided
      if (mapping.validation) {
        try {
          new Function('value', mapping.validation);
        } catch (error) {
          errors.push(`Invalid validation function: ${error}`);
        }
      }

      // Check for duplicate mappings
      const { data: existingMappings } = await this.getMappings(mapping.integrationType, mapping.entityType);
      const duplicate = existingMappings?.find(m => 
        m.externalField === mapping.externalField || m.internalField === mapping.internalField
      );

      if (duplicate) {
        warnings.push('Duplicate mapping detected');
      }

      return {
        data: {
          isValid: errors.length === 0,
          errors,
          warnings,
        },
        error: null
      };
    }, `validate mapping for ${mapping.integrationType} ${mapping.entityType}`);
  }
} 
