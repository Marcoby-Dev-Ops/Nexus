/**
 * Salesforce-Style Permission System
 * 
 * Implements a multi-layer permission model similar to Salesforce:
 * - Profile Level (User Type)
 * - Role Level (Organizational Hierarchy)  
 * - Permission Sets (Granular Permissions)
 * - Field Level Security
 * - Record Level Security (Sharing)
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  type: 'System Administrator' | 'Standard User' | 'Read Only' | 'Custom';
  permissions: string[];
  roleId?: string;
  companyId?: string;
}

export interface UserRole {
  id: string;
  name: string;
  hierarchy: number;
  parentRoleId?: string;
  companyId: string;
}

export interface PermissionSet {
  id: string;
  name: string;
  permissions: Permission[];
  assignedTo: string[];
}

export interface FieldPermission {
  fieldName: string;
  access: 'Read' | 'Edit' | 'None';
  userId: string;
}

export interface SharingRule {
  id: string;
  objectName: string;
  type: 'Owner' | 'Role' | 'Territory' | 'Criteria';
  access: 'Read' | 'Edit' | 'All';
  criteria?: Record<string, unknown>;
}

export class SalesforceStylePermissions {
  /**
   * Check if user has permission for a specific action
   */
  async hasPermission(
    userId: string, 
    resource: string, 
    action: string
  ): Promise<boolean> {
    try {
      // 1. Get user's profile and role
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return false;

      // 2. Check profile-level permissions
      if (userProfile.type === 'System Administrator') {
        return true; // Admins have all permissions
      }

      // 3. Check role-based permissions
      const rolePermissions = await this.getRolePermissions(userProfile.roleId);
      if (rolePermissions.some(p => p.resource === resource && p.action === action)) {
        return true;
      }

      // 4. Check permission sets
      const permissionSetPermissions = await this.getPermissionSetPermissions(userId);
      if (permissionSetPermissions.some(p => p.resource === resource && p.action === action)) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Get user's profile information
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, role, company_id')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      // Map database role to Salesforce-style profile
      const profileType = this.mapRoleToProfileType(data.role);
      
      return {
        id: data.id,
        type: profileType,
        permissions: this.getDefaultPermissions(profileType),
        roleId: data.role,
        companyId: data.company_id
      };
    } catch (error) {
      logger.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Get role-based permissions
   */
  private async getRolePermissions(roleId?: string): Promise<Permission[]> {
    if (!roleId) return [];

    try {
      // In a real implementation, this would query a roles table
      // For now, we'll use predefined role permissions
      const rolePermissions: Record<string, Permission[]> = {
        'owner': [
          { id: '1', name: 'Full Access', resource: '*', action: 'manage' }
        ],
        'admin': [
          { id: '2', name: 'Company Data Access', resource: 'companies', action: 'manage' },
          { id: '3', name: 'User Management', resource: 'user_profiles', action: 'manage' }
        ],
        'manager': [
          { id: '4', name: 'Team Data Access', resource: 'business_profiles', action: 'read' },
          { id: '5', name: 'Team Data Edit', resource: 'business_profiles', action: 'update' }
        ],
        'user': [
          { id: '6', name: 'Own Data Access', resource: 'user_profiles', action: 'read' },
          { id: '7', name: 'Own Data Edit', resource: 'user_profiles', action: 'update' }
        ]
      };

      return rolePermissions[roleId] || [];
    } catch (error) {
      logger.error('Error getting role permissions:', error);
      return [];
    }
  }

  /**
   * Get permission set permissions
   */
  private async getPermissionSetPermissions(userId: string): Promise<Permission[]> {
    try {
      // In a real implementation, this would query permission sets assigned to the user
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Error getting permission set permissions:', error);
      return [];
    }
  }

  /**
   * Check field-level permissions
   */
  async hasFieldPermission(
    userId: string, 
    objectName: string, 
    fieldName: string, 
    action: 'read' | 'edit'
  ): Promise<boolean> {
    try {
      // Get user's profile
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return false;

      // System administrators have all field permissions
      if (userProfile.type === 'System Administrator') {
        return true;
      }

      // Check field-level security
      const fieldPermissions = await this.getFieldPermissions(userId, objectName);
      const fieldPermission = fieldPermissions.find(fp => fp.fieldName === fieldName);
      
      if (!fieldPermission) {
        // Default to read-only for standard users
        return action === 'read';
      }

      return fieldPermission.access === 'Edit' || 
             (action === 'read' && fieldPermission.access === 'Read');
    } catch (error) {
      logger.error('Error checking field permissions:', error);
      return false;
    }
  }

  /**
   * Apply sharing rules to query
   */
  async applySharingRules(
    query: string, 
    userId: string, 
    objectName: string
  ): Promise<string> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return query;

      // Get sharing rules for the object
      const sharingRules = await this.getSharingRules(objectName, userId);
      
      // Apply sharing rules to query
      let modifiedQuery = query;
      
      for (const rule of sharingRules) {
        switch (rule.type) {
          case 'Owner':
            modifiedQuery += ` AND owner_id = '${userId}'`;
            break;
          case 'Role':
            if (userProfile.roleId) {
              modifiedQuery += ` AND role_id = '${userProfile.roleId}'`;
            }
            break;
          case 'Company':
            if (userProfile.companyId) {
              modifiedQuery += ` AND company_id = '${userProfile.companyId}'`;
            }
            break;
        }
      }

      return modifiedQuery;
    } catch (error) {
      logger.error('Error applying sharing rules:', error);
      return query;
    }
  }

  /**
   * Helper methods
   */
  private mapRoleToProfileType(role?: string): UserProfile['type'] {
    switch (role) {
      case 'owner':
        return 'System Administrator';
      case 'admin':
        return 'System Administrator';
      case 'manager':
        return 'Standard User';
      case 'user':
      default:
        return 'Standard User';
    }
  }

  private getDefaultPermissions(profileType: UserProfile['type']): string[] {
    switch (profileType) {
      case 'System Administrator':
        return ['*']; // All permissions
      case 'Standard User':
        return ['read_own', 'edit_own', 'read_company'];
      case 'Read Only':
        return ['read_own', 'read_company'];
      default:
        return ['read_own'];
    }
  }

  private async getFieldPermissions(
    userId: string, 
    objectName: string
  ): Promise<FieldPermission[]> {
    // In a real implementation, this would query field permissions
    // For now, return empty array
    return [];
  }

  private async getSharingRules(
    objectName: string, 
    userId: string
  ): Promise<SharingRule[]> {
    // In a real implementation, this would query sharing rules
    // For now, return basic sharing rules
    return [
      {
        id: '1',
        objectName,
        type: 'Owner',
        access: 'All'
      }
    ];
  }
}

// Export singleton instance
export const salesforcePermissions = new SalesforceStylePermissions(); 