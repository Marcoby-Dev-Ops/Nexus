/**
 * Salesforce-Style Data Service
 * 
 * Provides data access with built-in security features:
 * - Automatic permission checking
 * - Sharing rules application
 * - Field-level security
 * - Record-level security
 */

import { supabase } from '@/core/supabase';
import { salesforcePermissions } from '@/core/permissions/SalesforceStylePermissions';
import { logger } from '@/shared/utils/logger';

export interface QueryOptions {
  userId: string;
  objectName: string;
  fields?: string[];
  where?: string;
  orderBy?: string;
  limit?: number;
  includeDeleted?: boolean;
}

export interface QueryResult<T = any> {
  data: T[] | null;
  error: string | null;
  totalSize: number;
  done: boolean;
}

export class SalesforceStyleDataService {
  /**
   * Query records with automatic security enforcement
   */
  async queryRecords<T = any>(options: QueryOptions): Promise<QueryResult<T>> {
    try {
      const { userId, objectName, fields = ['*'], where = '', orderBy, limit = 200 } = options;

      // 1. Check user permissions for the object
      const hasPermission = await salesforcePermissions.hasPermission(userId, objectName, 'read');
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions to access this object',
          totalSize: 0,
          done: true
        };
      }

      // 2. Apply sharing rules to the query
      const sharingQuery = await salesforcePermissions.applySharingRules(where, userId, objectName);

      // 3. Build the final query
      let query = supabase
        .from(objectName)
        .select(fields.join(','));

      // Apply where clause with sharing rules
      if (sharingQuery) {
        // Parse and apply the sharing query
        // This is a simplified version - in a real implementation, you'd parse the SQL
        query = query.eq('user_id', userId); // Basic owner-based sharing
      }

      // Apply ordering
      if (orderBy) {
        const [field, direction] = orderBy.split(' ');
        query = direction === 'DESC' ? query.order(field, { ascending: false }) : query.order(field);
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      // 4. Execute the query
      const { data, error } = await query;

      if (error) {
        logger.error('Query error:', error);
        return {
          data: null,
          error: error.message,
          totalSize: 0,
          done: true
        };
      }

      // 5. Apply field-level security
      const securedData = await this.applyFieldLevelSecurity(data, userId, objectName);

      return {
        data: securedData,
        error: null,
        totalSize: securedData?.length || 0,
        done: true
      };

    } catch (error) {
      logger.error('Error in queryRecords:', error);
      return {
        data: null,
        error: 'Failed to query records',
        totalSize: 0,
        done: true
      };
    }
  }

  /**
   * Insert a record with security validation
   */
  async insertRecord<T = any>(
    objectName: string,
    record: any,
    userId: string
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      // 1. Check create permission
      const hasPermission = await salesforcePermissions.hasPermission(userId, objectName, 'create');
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions to create records'
        };
      }

      // 2. Apply field-level security for insert
      const securedRecord = await this.applyFieldLevelSecurityForInsert(record, userId, objectName);

      // 3. Add audit fields
      const finalRecord = {
        ...securedRecord,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 4. Insert the record
      const { data, error } = await supabase
        .from(objectName)
        .insert(finalRecord)
        .select()
        .single();

      if (error) {
        logger.error('Insert error:', error);
        return {
          data: null,
          error: error.message
        };
      }

      return { data, error: null };

    } catch (error) {
      logger.error('Error in insertRecord:', error);
      return {
        data: null,
        error: 'Failed to insert record'
      };
    }
  }

  /**
   * Update a record with security validation
   */
  async updateRecord<T = any>(
    objectName: string,
    recordId: string,
    updates: any,
    userId: string
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      // 1. Check update permission
      const hasPermission = await salesforcePermissions.hasPermission(userId, objectName, 'update');
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions to update records'
        };
      }

      // 2. Check record-level access
      const recordAccess = await this.checkRecordAccess(objectName, recordId, userId);
      if (!recordAccess.canEdit) {
        return {
          data: null,
          error: 'Insufficient permissions to edit this record'
        };
      }

      // 3. Apply field-level security for update
      const securedUpdates = await this.applyFieldLevelSecurityForUpdate(updates, userId, objectName);

      // 4. Add audit fields
      const finalUpdates = {
        ...securedUpdates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      };

      // 5. Update the record
      const { data, error } = await supabase
        .from(objectName)
        .update(finalUpdates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        logger.error('Update error:', error);
        return {
          data: null,
          error: error.message
        };
      }

      return { data, error: null };

    } catch (error) {
      logger.error('Error in updateRecord:', error);
      return {
        data: null,
        error: 'Failed to update record'
      };
    }
  }

  /**
   * Delete a record with security validation
   */
  async deleteRecord(
    objectName: string,
    recordId: string,
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // 1. Check delete permission
      const hasPermission = await salesforcePermissions.hasPermission(userId, objectName, 'delete');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Insufficient permissions to delete records'
        };
      }

      // 2. Check record-level access
      const recordAccess = await this.checkRecordAccess(objectName, recordId, userId);
      if (!recordAccess.canDelete) {
        return {
          success: false,
          error: 'Insufficient permissions to delete this record'
        };
      }

      // 3. Soft delete (mark as deleted)
      const { error } = await supabase
        .from(objectName)
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', recordId);

      if (error) {
        logger.error('Delete error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true, error: null };

    } catch (error) {
      logger.error('Error in deleteRecord:', error);
      return {
        success: false,
        error: 'Failed to delete record'
      };
    }
  }

  /**
   * Apply field-level security to query results
   */
  private async applyFieldLevelSecurity(
    records: any[],
    userId: string,
    objectName: string
  ): Promise<any[]> {
    if (!records || records.length === 0) return records;

    const securedRecords = [];

    for (const record of records) {
      const securedRecord: any = {};

      for (const [fieldName, value] of Object.entries(record)) {
        const hasFieldPermission = await salesforcePermissions.hasFieldPermission(
          userId,
          objectName,
          fieldName,
          'read'
        );

        if (hasFieldPermission) {
          securedRecord[fieldName] = value;
        }
      }

      securedRecords.push(securedRecord);
    }

    return securedRecords;
  }

  /**
   * Apply field-level security for insert operations
   */
  private async applyFieldLevelSecurityForInsert(
    record: any,
    userId: string,
    objectName: string
  ): Promise<any> {
    const securedRecord: any = {};

    for (const [fieldName, value] of Object.entries(record)) {
      const hasFieldPermission = await salesforcePermissions.hasFieldPermission(
        userId,
        objectName,
        fieldName,
        'edit'
      );

      if (hasFieldPermission) {
        securedRecord[fieldName] = value;
      }
    }

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
    const securedUpdates: any = {};

    for (const [fieldName, value] of Object.entries(updates)) {
      const hasFieldPermission = await salesforcePermissions.hasFieldPermission(
        userId,
        objectName,
        fieldName,
        'edit'
      );

      if (hasFieldPermission) {
        securedUpdates[fieldName] = value;
      }
    }

    return securedUpdates;
  }

  /**
   * Check record-level access permissions
   */
  private async checkRecordAccess(
    objectName: string,
    recordId: string,
    userId: string
  ): Promise<{ canEdit: boolean; canDelete: boolean }> {
    try {
      // Get the record to check ownership
      const { data: record, error } = await supabase
        .from(objectName)
        .select('user_id, owner_id, created_by')
        .eq('id', recordId)
        .single();

      if (error || !record) {
        return { canEdit: false, canDelete: false };
      }

      // Check if user is the owner or creator
      const isOwner = record.user_id === userId || 
                     record.owner_id === userId || 
                     record.created_by === userId;

      // Check if user has admin permissions
      const isAdmin = await salesforcePermissions.hasPermission(userId, objectName, 'manage');

      return {
        canEdit: isOwner || isAdmin,
        canDelete: isOwner || isAdmin
      };

    } catch (error) {
      logger.error('Error checking record access:', error);
      return { canEdit: false, canDelete: false };
    }
  }
}

// Export singleton instance
export const salesforceDataService = new SalesforceStyleDataService(); 