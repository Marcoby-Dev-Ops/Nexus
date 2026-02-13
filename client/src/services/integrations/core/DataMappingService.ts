import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectData, insertOne, updateOne, deleteOne, selectOne } from '@/lib/api-client';
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
      const { data, success, error } = await selectData<any>({
        table: 'data_mappings',
        filters: {
          integration_type: integrationType,
          entity_type: entityType
        },
        orderBy: [{ column: 'external_field', ascending: true }]
      });

      if (!success) throw new Error(error || 'Failed to fetch mappings');
      const validatedData = data?.map(item => DataMappingSchema.parse(item)) || [];
      return { data: validatedData, error: null, success: true };
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

      const { data: result, success, error } = await insertOne<any>('data_mappings', mappingData);

      if (!success) throw new Error(error || 'Failed to create mapping');
      return { data: DataMappingSchema.parse(result), error: null, success: true };
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

      const { data: result, success, error } = await updateOne<any>(
        'data_mappings',
        { id: id },
        updateData
      );

      if (!success) throw new Error(error || 'Failed to update mapping');
      return { data: DataMappingSchema.parse(result), error: null, success: true };
    }, `update mapping ${id}`);
  }

  /**
   * Delete a mapping
   */
  async deleteMapping(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const { success, error } = await deleteOne('data_mappings', { id: id });

      if (!success) throw new Error(error || 'Failed to delete mapping');
      return { data: true, error: null, success: true };
    }, `delete mapping ${id}`);
  }

  /**
   * Get all entity types
   */
  async getEntityTypes(): Promise<ServiceResponse<Entity[]>> {
    return this.executeDbOperation(async () => {
      const { data, success, error } = await selectData<any>({
        table: 'entities',
        orderBy: [{ column: 'name', ascending: true }]
      });

      if (!success) throw new Error(error || 'Failed to fetch entity types');
      const validatedData = data?.map(item => EntitySchema.parse(item)) || [];
      return { data: validatedData, error: null, success: true };
    }, 'get entity types');
  }

  /**
   * Get mapping templates
   */
  async getMappingTemplates(integrationType?: string): Promise<ServiceResponse<MappingTemplate[]>> {
    return this.executeDbOperation(async () => {
      const { data, success, error } = await selectData<any>({
        table: 'mapping_templates',
        filters: integrationType ? { integration_type: integrationType } : undefined,
        orderBy: [{ column: 'name', ascending: true }]
      });

      if (!success) throw new Error(error || 'Failed to fetch mapping templates');
      const validatedData = data?.map(item => MappingTemplateSchema.parse(item)) || [];
      return { data: validatedData, error: null, success: true };
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

      const { data: result, success, error } = await insertOne<any>('mapping_templates', templateData);

      if (!success) throw new Error(error || 'Failed to create template');
      return { data: MappingTemplateSchema.parse(result), error: null, success: true };
    }, `create mapping template ${template.name}`);
  }

  /**
   * Apply a mapping template to an integration
   */
  async applyMappingTemplate(templateId: string, integrationType: string, entityType: string): Promise<ServiceResponse<DataMapping[]>> {
    return this.executeDbOperation(async () => {
      // Get the template
      const { data: template, success: templateSuccess, error: templateError } = await selectOne<any>(
        'mapping_templates',
        { id: templateId }
      );

      if (!templateSuccess) throw new Error(templateError || 'Template not found');

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

      // Insert all mappings - note: insertOne only handles single row, 
      // but for simplicity here we'll iterate or assume a bulk helper if needed.
      // Since our api-client doesn't have insertMany, we'll iterate.
      const results: DataMapping[] = [];
      for (const mapping of mappings) {
        const { data: result, success } = await insertOne<any>('data_mappings', {
          ...mapping,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        if (success && result) results.push(DataMappingSchema.parse(result));
      }

      return { data: results, error: null, success: true };
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
        return { data: externalData, error: null, success: true };
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

      return { data: transformedData, error: null, success: true };
    }, `transformData for ${integrationType} ${entityType}`);
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
        return { data: internalData, error: null, success: true };
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

      return { data: externalData, error: null, success: true };
    }, `reverseTransformData for ${integrationType} ${entityType}`);
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
        error: null,
        success: true
      };
    }, `validate mapping for ${mapping.integrationType} ${mapping.entityType}`);
  }
} 
