/**
 * Salesforce-Style Data Service
 * 
 * Provides data access with built-in security features:
 * - Automatic permission checking
 * - Sharing rules application
 * - Field-level security
 * - Record-level security
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/database';
import { salesforcePermissions } from '@/core/permissions/SalesforceStylePermissions';
import { z } from 'zod';

// Query Options Schema
export const QueryOptionsSchema = z.object({
  userId: z.string(),
  objectName: z.string(),
  fields: z.array(z.string()).optional(),
  where: z.string().optional(),
  orderBy: z.string().optional(),
  limit: z.number().optional(),
  includeDeleted: z.boolean().optional(),
});

export type QueryOptions = z.infer<typeof QueryOptionsSchema>;

// Query Result Schema
export const QueryResultSchema = z.object({
  data: z.array(z.any()).nullable(),
  error: z.string().nullable(),
  totalSize: z.number(),
  done: z.boolean(),
});

export type QueryResult<T = any> = z.infer<typeof QueryResultSchema>;

// Record Operation Result Schema
export const RecordOperationResultSchema = z.object({
  data: z.any().nullable(),
  error: z.string().nullable(),
});

export type RecordOperationResult<T = any> = z.infer<typeof RecordOperationResultSchema>;

// Delete Result Schema
export const DeleteResultSchema = z.object({
  success: z.boolean(),
  error: z.string().nullable(),
});

export type DeleteResult = z.infer<typeof DeleteResultSchema>;

// Record Access Schema
export const RecordAccessSchema = z.object({
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

export type RecordAccess = z.infer<typeof RecordAccessSchema>;

/**
 * Salesforce-Style Data Service
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 * Provides data access with built-in security features
 */
export class SalesforceStyleDataService extends BaseService {
  /**
   * Query records with automatic security enforcement
   */
  async queryRecords<T = any>(options: QueryOptions): Promise<ServiceResponse<QueryResult<T>>> {
    return this.executeDbOperation(async () => {
      try {
        const validatedOptions = QueryOptionsSchema.parse(options);
        const { userId, objectName, fields = ['*'], where = '', orderBy, limit = 200 } = validatedOptions;

        // 1. Check user permissions for the object
        const hasPermission = await salesforcePermissions.hasPermission(userId, objectName, 'read');
        if (!hasPermission) {
          return {
            data: {
              data: null,
              error: 'Insufficient permissions to access this object',
              totalSize: 0,
              done: true,
            } as QueryResult<T>,
            error: null,
            success: true
          };
        }

        // 2. Apply sharing rules to the query
        const sharingQuery = await salesforcePermissions.applySharingRules(where, userId, objectName);

        // 3. Build the final query
        const filters: Record<string, any> = {};
        if (sharingQuery) {
          filters.user_id = userId; // Basic owner-based sharing
        }

        // Apply where clause (simplified)
        if (where && where.includes('=')) {
          const [key, value] = where.split('=').map(s => s.trim().replace(/'/g, ''));
          filters[key] = value;
        }

        const orderByList: { column: string; ascending?: boolean }[] = [];
        if (orderBy) {
          const [field, direction] = orderBy.split(' ');
          orderByList.push({ column: field, ascending: direction !== 'DESC' });
        }

        // 4. Execute the query
        const { data, success, error } = await select<T>({
          table: objectName,
          columns: fields.join(','),
          filters,
          orderBy: orderByList,
          limit
        });

        if (!success) {
          this.logger.error('Query error:', error);
          return {
            data: {
              data: null,
              error: error || 'Failed to execute query',
              totalSize: 0,
              done: true,
            } as QueryResult<T>,
            error: null,
            success: true
          };
        }

        // 5. Apply field-level security
        const securedData = await this.applyFieldLevelSecurity(data || [], userId, objectName);

        return {
          data: {
            data: securedData as T[],
            error: null,
            totalSize: securedData?.length || 0,
            done: true,
          } as QueryResult<T>,
          error: null,
          success: true
        };
      } catch (error) {
        this.logger.error('Error querying records:', error);
        return {
          data: {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            totalSize: 0,
            done: true,
          } as QueryResult<T>,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        };
      }
    }, `query records for object ${options.objectName}`);
  }

  /**
   * Insert a new record with security enforcement
   */
  async insertRecord<T = any>(
    objectName: string,
    record: any,
    userId: string
  ): Promise<ServiceResponse<RecordOperationResult<T>>> {
    return this.executeDbOperation(async () => {
      try {
        // 1. Check user permissions for the object
        const hasPermission = await salesforcePermissions.hasPermission(userId, objectName, 'create');
        if (!hasPermission) {
          return {
            data: {
              data: null,
              error: 'Insufficient permissions to create records in this object',
            },
            error: null,
            success: true
          };
        }

        // 2. Apply field-level security for insert
        const securedRecord = await this.applyFieldLevelSecurityForInsert(record, userId, objectName);

        // 3. Add audit fields
        const recordWithAudit = {
          ...securedRecord,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_by: userId,
          updated_at: new Date().toISOString(),
        };

        // 4. Insert the record
        const { data: result, success, error } = await insertOne<T>(objectName, recordWithAudit);

        if (!success) {
          this.logger.error('Insert error:', error);
          return {
            data: {
              data: null,
              error: error || 'Failed to insert record',
            },
            error: null,
            success: true
          };
        }

        return {
          data: {
            data: result,
            error: null,
          } as RecordOperationResult<T>,
          error: null,
          success: true
        };
      } catch (error) {
        this.logger.error('Error inserting record:', error);
        return {
          data: {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          } as RecordOperationResult<T>,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        };
      }
    }, `insert record in object ${objectName}`);
  }

  /**
   * Update an existing record with security enforcement
   */
  async updateRecord<T = any>(
    objectName: string,
    recordId: string,
    updates: any,
    userId: string
  ): Promise<ServiceResponse<RecordOperationResult<T>>> {
    return this.executeDbOperation(async () => {
      try {
        // 1. Check user permissions for the object
        const hasPermission = await salesforcePermissions.hasPermission(userId, objectName, 'update');
        if (!hasPermission) {
          return {
            data: {
              data: null,
              error: 'Insufficient permissions to update records in this object',
            },
            error: null,
            success: true
          };
        }

        // 2. Check record access
        const { canEdit } = await this.checkRecordAccess(objectName, recordId, userId);
        if (!canEdit) {
          return {
            data: {
              data: null,
              error: 'Insufficient permissions to update this record',
            },
            error: null,
            success: true
          };
        }

        // 3. Apply field-level security for update
        const securedUpdates = await this.applyFieldLevelSecurityForUpdate(updates, userId, objectName);

        // 4. Add audit fields
        const updatesWithAudit = {
          ...securedUpdates,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        };

        // 5. Update the record
        const { data: result, success, error } = await updateOne<T>(objectName, { id: recordId }, updatesWithAudit);

        if (!success) {
          this.logger.error('Update error:', error);
          return {
            data: {
              data: null,
              error: error || 'Failed to update record',
            },
            error: null,
            success: true
          };
        }

        return {
          data: {
            data: result,
            error: null,
          } as RecordOperationResult<T>,
          error: null,
          success: true
        };
      } catch (error) {
        this.logger.error('Error updating record:', error);
        return {
          data: {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          } as RecordOperationResult<T>,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        };
      }
    }, `update record ${recordId} in object ${objectName}`);
  }

  /**
   * Delete a record with security enforcement
   */
  async deleteRecord(
    objectName: string,
    recordId: string,
    userId: string
  ): Promise<ServiceResponse<DeleteResult>> {
    return this.executeDbOperation(async () => {
      try {
        // 1. Check user permissions for the object
        const hasPermission = await salesforcePermissions.hasPermission(userId, objectName, 'delete');
        if (!hasPermission) {
          return {
            data: {
              success: false,
              error: 'Insufficient permissions to delete records in this object',
            } as DeleteResult,
            error: null,
            success: true
          };
        }

        // 2. Check record access
        const { canDelete } = await this.checkRecordAccess(objectName, recordId, userId);
        if (!canDelete) {
          return {
            data: {
              success: false,
              error: 'Insufficient permissions to delete this record',
            } as DeleteResult,
            error: null,
            success: true
          };
        }

        // 3. Soft delete (mark as deleted)
        const { success, error } = await updateOne(objectName, { id: recordId }, {
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        });

        if (!success) {
          this.logger.error('Delete error:', error);
          return {
            data: {
              success: false,
              error: error || 'Failed to delete record',
            } as DeleteResult,
            error: null,
            success: true
          };
        }

        return {
          data: {
            success: true,
            error: null,
          } as DeleteResult,
          error: null,
          success: true
        };
      } catch (error) {
        this.logger.error('Error deleting record:', error);
        return {
          data: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        };
      }
    }, `delete record ${recordId} from object ${objectName}`);
  }

  /**
   * Apply field-level security to records
   */
  private async applyFieldLevelSecurity(
    records: any[],
    userId: string,
    objectName: string
  ): Promise<any[]> {
    // Removed executeDbOperation and try/catch as per instruction.
    // Error handling for getFieldPermissions will now propagate up.
    const fieldPermissions = await salesforcePermissions.getFieldPermissions(userId, objectName);

    return records.map(record => {
      const securedRecord: any = {};

      Object.keys(record).forEach(field => {
        if (fieldPermissions[field]?.read) {
          securedRecord[field] = record[field];
        }
      });

      return securedRecord;
    });
  }

  /**
   * Apply field-level security for insert operations
   */
  private async applyFieldLevelSecurityForInsert(
    record: any,
    userId: string,
    objectName: string
  ): Promise<any> {
    // Removed executeDbOperation and try/catch as per instruction.
    // Error handling for getFieldPermissions will now propagate up.
    const fieldPermissions = await salesforcePermissions.getFieldPermissions(userId, objectName);

    const securedRecord: any = {};

    Object.keys(record).forEach(field => {
      if (fieldPermissions[field]?.create) {
        securedRecord[field] = record[field];
      }
    });

    return securedRecord;
  }

  /**
   * Apply field-level security for update operations
   */
  private async applyFieldLevelSecurityForUpdate(
    updates: any,
    userId: string,
    objectName: string
  ): Promise<any> {
    // Removed executeDbOperation and try/catch as per instruction.
    // Error handling for getFieldPermissions will now propagate up.
    const fieldPermissions = await salesforcePermissions.getFieldPermissions(userId, objectName);

    const securedUpdates: any = {};

    Object.keys(updates).forEach(field => {
      if (fieldPermissions[field]?.update) {
        securedUpdates[field] = updates[field];
      }
    });

    return securedUpdates;
  }

  /**
   * Check record access permissions
   */
  private async checkRecordAccess(
    objectName: string,
    recordId: string,
    userId: string
  ): Promise<RecordAccess> {
    // Removed executeDbOperation and try/catch as per instruction.
    try { // Re-added try/catch for selectOne as it's a DB operation
      // Get the record to check ownership
      const { data: record, success } = await selectOne<any>(
        objectName,
        { id: recordId }
      );

      if (!success || !record) {
        this.logger.error('Error checking record access'); // Removed 'error' variable from log
        return { canEdit: false, canDelete: false };
      }

      // Check if user is the owner
      const isOwner = record.created_by === userId || record.owner_id === userId;

      // Check additional permissions
      const canEdit = isOwner || await salesforcePermissions.hasPermission(userId, objectName, 'edit_all');
      const canDelete = isOwner || await salesforcePermissions.hasPermission(userId, objectName, 'delete_all');

      return { canEdit, canDelete };
    } catch (error) {
      this.logger.error('Error checking record access:', error);
      return { canEdit: false, canDelete: false };
    }
  }

  /**
   * Get user permissions for an object
   */
  async getUserPermissions(userId: string, objectName: string): Promise<ServiceResponse<{
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canEditAll: boolean;
    canDeleteAll: boolean;
  }>> {
    return this.executeDbOperation(async () => {
      try {
        const permissions = {
          canRead: await salesforcePermissions.hasPermission(userId, objectName, 'read'),
          canCreate: await salesforcePermissions.hasPermission(userId, objectName, 'create'),
          canUpdate: await salesforcePermissions.hasPermission(userId, objectName, 'update'),
          canDelete: await salesforcePermissions.hasPermission(userId, objectName, 'delete'),
          canEditAll: await salesforcePermissions.hasPermission(userId, objectName, 'edit_all'),
          canDeleteAll: await salesforcePermissions.hasPermission(userId, objectName, 'delete_all'),
        };

        return { data: permissions, error: null, success: true };
      } catch (error) {
        this.logger.error('Error getting user permissions:', error);
        return { data: null, error: 'Failed to get user permissions', success: false };
      }
    }, `get user permissions for object ${objectName}`);
  }

  /**
   * Get field permissions for a user and object
   */
  async getFieldPermissions(userId: string, objectName: string): Promise<ServiceResponse<Record<string, {
    read: boolean;
    create: boolean;
    update: boolean;
  }>>> {
    return this.executeDbOperation(async () => {
      try {
        const fieldPermissions = await salesforcePermissions.getFieldPermissions(userId, objectName);
        return { data: fieldPermissions, error: null, success: true };
      } catch (error) {
        this.logger.error('Error getting field permissions:', error);
        return { data: null, error: 'Failed to get field permissions', success: false };
      }
    }, `get field permissions for object ${objectName}`);
  }
} 
