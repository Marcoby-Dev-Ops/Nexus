/**
 * World-Class Company Management Hook
 * 
 * Extends user management with comprehensive organizational structure,
 * inspired by Google Workspace, Microsoft 365, and modern SaaS platforms.
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { useAuth } from '@/hooks/useAuth.ts';
import { logger } from '@/shared/utils/logger.ts';

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  website?: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  manager_id?: string;
  created_at: string;
}

export interface Role {
  id: string;
  company_id: string;
  name: string;
  permissions: string[];
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  company_id: string;
  role_id: string;
  department_id?: string;
  assigned_at: string;
}

export interface CompanyAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  growthRate: number;
  topDepartments: Array<{
    name: string;
    userCount: number;
  }>;
}

export interface CompanyHealth {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  metrics: {
    userEngagement: number;
    dataQuality: number;
    systemUptime: number;
    securityScore: number;
  };
}

export interface Workflow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  steps: any[];
  is_active: boolean;
  created_at: string;
}

export interface Template {
  id: string;
  company_id: string;
  name: string;
  type: string;
  content: any;
  created_at: string;
}

export interface Report {
  id: string;
  company_id: string;
  name: string;
  type: string;
  schedule: string;
  recipients: string[];
  last_generated?: string;
  created_at: string;
}

export interface Billing {
  plan: string;
  status: 'active' | 'past_due' | 'cancelled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  currency: string;
}

export interface Usage {
  date: string;
  apiCalls: number;
  storageUsed: number;
  activeUsers: number;
}

export interface Notification {
  id: string;
  company_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  resource: string;
  details: any;
  ip_address: string;
  created_at: string;
}

export interface ExportRequest {
  id: string;
  company_id: string;
  requested_by: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  created_at: string;
}

export interface CompanyManagementState {
  company: Company | null;
  departments: Department[];
  roles: Role[];
  userRoles: UserRole[];
  analytics: CompanyAnalytics | null;
  health: CompanyHealth | null;
  invitations: any[];
  pendingInvitations: any[];
  companyUsers: any[];
  workflows: Workflow[];
  templates: Template[];
  reports: Report[];
  billing: Billing | null;
  usage: Usage[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  exportRequests: ExportRequest[];
  isLoading: boolean;
  isUpdating: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastError: string | null;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export interface CompanyManagementActions {
  getCompany: () => Promise<Company | null>;
  updateCompany: (updates: Partial<Company>) => Promise<{ success: boolean; error?: string }>;
  getDepartments: () => Promise<Department[]>;
  createDepartment: (department: Omit<Department, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<{ success: boolean; error?: string }>;
  deleteDepartment: (id: string) => Promise<{ success: boolean; error?: string }>;
  getRoles: () => Promise<Role[]>;
  createRole: (role: Omit<Role, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateRole: (id: string, updates: Partial<Role>) => Promise<{ success: boolean; error?: string }>;
  deleteRole: (id: string) => Promise<{ success: boolean; error?: string }>;
  getUserRoles: () => Promise<UserRole[]>;
  assignUserRole: (userId: string, roleId: string, departmentId?: string) => Promise<{ success: boolean; error?: string }>;
  removeUserRole: (userId: string, roleId: string) => Promise<{ success: boolean; error?: string }>;
  getAnalytics: () => Promise<CompanyAnalytics | null>;
  getHealth: () => Promise<CompanyHealth | null>;
  getInvitations: () => Promise<any[]>;
  sendInvitation: (email: string, role: string) => Promise<{ success: boolean; error?: string }>;
  revokeInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  getCompanyUsers: () => Promise<any[]>;
  getWorkflows: () => Promise<Workflow[]>;
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<{ success: boolean; error?: string }>;
  deleteWorkflow: (id: string) => Promise<{ success: boolean; error?: string }>;
  getTemplates: () => Promise<Template[]>;
  createTemplate: (template: Omit<Template, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<{ success: boolean; error?: string }>;
  deleteTemplate: (id: string) => Promise<{ success: boolean; error?: string }>;
  getReports: () => Promise<Report[]>;
  createReport: (report: Omit<Report, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateReport: (id: string, updates: Partial<Report>) => Promise<{ success: boolean; error?: string }>;
  deleteReport: (id: string) => Promise<{ success: boolean; error?: string }>;
  getBilling: () => Promise<Billing | null>;
  getUsage: () => Promise<Usage[]>;
  getNotifications: () => Promise<Notification[]>;
  markNotificationRead: (id: string) => Promise<{ success: boolean; error?: string }>;
  getAuditLogs: () => Promise<AuditLog[]>;
  getExportRequests: () => Promise<ExportRequest[]>;
  requestExport: (type: string) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useCompanyManagement = (): CompanyManagementState & CompanyManagementActions => {
  const { user } = useAuth();
  const queryWrapper = new DatabaseQueryWrapper();
  
  const [state, setState] = useState<CompanyManagementState>({
    company: null,
    departments: [],
    roles: [],
    userRoles: [],
    analytics: null,
    health: null,
    invitations: [],
    pendingInvitations: [],
    companyUsers: [],
    workflows: [],
    templates: [],
    reports: [],
    billing: null,
    usage: [],
    notifications: [],
    auditLogs: [],
    exportRequests: [],
    isLoading: false,
    isUpdating: false,
    isRefreshing: false,
    error: null,
    lastError: null,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 20
  });

  // Memoized selectors
  const pendingInvitations = useMemo(() => 
    state.invitations.filter(inv => inv.status === 'pending'), 
    [state.invitations]
  );

  // Company management
  const getCompany = useCallback(async (): Promise<Company | null> => {
    if (!user?.id) return null;

    try {
      const { data: profile } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', user.id)
          .single(),
        user.id,
        'get-user-company'
      );

      if (!profile?.company_id) return null;

      const { data: company, error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single(),
        profile.company_id,
        'get-company'
      );

      if (error) throw error;

      setState(prev => ({ ...prev, company }));
      return company;
    } catch (error) {
      logger.error('Failed to get company:', error);
      return null;
    }
  }, [user?.id, queryWrapper]);

  const updateCompany = useCallback(async (updates: Partial<Company>): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !state.company?.id) {
      return { success: false, error: 'No authenticated user or company' };
    }

    try {
      const { data, error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('companies')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', state.company.id)
          .select()
          .single(),
        state.company.id,
        'update-company'
      );

      if (error) {
        throw new Error(error.message || 'Failed to update company');
      }

      setState(prev => ({ ...prev, company: data }));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update company';
      return { success: false, error: errorMessage };
    }
  }, [user?.id, state.company?.id, queryWrapper]);

  // Department management
  const getDepartments = useCallback(async (): Promise<Department[]> => {
    if (!state.company?.id) return [];

    try {
      const { data, error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('departments')
          .select('*')
          .eq('company_id', state.company.id)
          .order('name'),
        state.company.id,
        'get-departments'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get departments');
      }

      setState(prev => ({ ...prev, departments: data || [] }));
      return data || [];
    } catch (error) {
      logger.error('Failed to get departments:', error);
      return [];
    }
  }, [state.company?.id, queryWrapper]);

  const createDepartment = useCallback(async (department: Omit<Department, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
    if (!state.company?.id) {
      return { success: false, error: 'No company available' };
    }

    try {
      const { error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('departments')
          .insert({
            ...department,
            company_id: state.company.id,
            created_at: new Date().toISOString()
          }),
        state.company.id,
        'create-department'
      );

      if (error) {
        throw new Error(error.message || 'Failed to create department');
      }

      // Refresh departments list
      await getDepartments();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create department';
      return { success: false, error: errorMessage };
    }
  }, [state.company?.id, queryWrapper, getDepartments]);

  const updateDepartment = useCallback(async (id: string, updates: Partial<Department>): Promise<{ success: boolean; error?: string }> => {
    if (!state.company?.id) {
      return { success: false, error: 'No company available' };
    }

    try {
      const { error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('departments')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('company_id', state.company.id),
        state.company.id,
        'update-department'
      );

      if (error) {
        throw new Error(error.message || 'Failed to update department');
      }

      // Refresh departments list
      await getDepartments();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update department';
      return { success: false, error: errorMessage };
    }
  }, [state.company?.id, queryWrapper, getDepartments]);

  const deleteDepartment = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.company?.id) {
      return { success: false, error: 'No company available' };
    }

    try {
      const { error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('departments')
          .delete()
          .eq('id', id)
          .eq('company_id', state.company.id),
        state.company.id,
        'delete-department'
      );

      if (error) {
        throw new Error(error.message || 'Failed to delete department');
      }

      // Refresh departments list
      await getDepartments();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete department';
      return { success: false, error: errorMessage };
    }
  }, [state.company?.id, queryWrapper, getDepartments]);

  // Role management
  const getRoles = useCallback(async (): Promise<Role[]> => {
    if (!state.company?.id) return [];

    try {
      const { data, error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('roles')
          .select('*')
          .eq('company_id', state.company.id)
          .order('name'),
        state.company.id,
        'get-roles'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get roles');
      }

      setState(prev => ({ ...prev, roles: data || [] }));
      return data || [];
    } catch (error) {
      logger.error('Failed to get roles:', error);
      return [];
    }
  }, [state.company?.id, queryWrapper]);

  const createRole = useCallback(async (role: Omit<Role, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
    if (!state.company?.id) {
      return { success: false, error: 'No company available' };
    }

    try {
      const { error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('roles')
          .insert({
            ...role,
            company_id: state.company.id,
            created_at: new Date().toISOString()
          }),
        state.company.id,
        'create-role'
      );

      if (error) {
        throw new Error(error.message || 'Failed to create role');
      }

      // Refresh roles list
      await getRoles();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
      return { success: false, error: errorMessage };
    }
  }, [state.company?.id, queryWrapper, getRoles]);

  const updateRole = useCallback(async (id: string, updates: Partial<Role>): Promise<{ success: boolean; error?: string }> => {
    if (!state.company?.id) {
      return { success: false, error: 'No company available' };
    }

    try {
      const { error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('roles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('company_id', state.company.id),
        state.company.id,
        'update-role'
      );

      if (error) {
        throw new Error(error.message || 'Failed to update role');
      }

      // Refresh roles list
      await getRoles();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      return { success: false, error: errorMessage };
    }
  }, [state.company?.id, queryWrapper, getRoles]);

  const deleteRole = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.company?.id) {
      return { success: false, error: 'No company available' };
    }

    try {
      const { error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('roles')
          .delete()
          .eq('id', id)
          .eq('company_id', state.company.id),
        state.company.id,
        'delete-role'
      );

      if (error) {
        throw new Error(error.message || 'Failed to delete role');
      }

      // Refresh roles list
      await getRoles();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role';
      return { success: false, error: errorMessage };
    }
  }, [state.company?.id, queryWrapper, getRoles]);

  // User role management
  const getUserRoles = useCallback(async (): Promise<UserRole[]> => {
    if (!state.company?.id) return [];

    try {
      const { data, error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('user_roles')
          .select('*')
          .eq('company_id', state.company.id),
        state.company.id,
        'get-user-roles'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get user roles');
      }

      setState(prev => ({ ...prev, userRoles: data || [] }));
      return data || [];
    } catch (error) {
      logger.error('Failed to get user roles:', error);
      return [];
    }
  }, [state.company?.id, queryWrapper]);

  const assignUserRole = useCallback(async (userId: string, roleId: string, departmentId?: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.company?.id) {
      return { success: false, error: 'No company available' };
    }

    try {
      const { error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            company_id: state.company.id,
            role_id: roleId,
            department_id: departmentId,
            assigned_at: new Date().toISOString()
          }),
        state.company.id,
        'assign-user-role'
      );

      if (error) {
        throw new Error(error.message || 'Failed to assign user role');
      }

      // Refresh user roles list
      await getUserRoles();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign user role';
      return { success: false, error: errorMessage };
    }
  }, [state.company?.id, queryWrapper, getUserRoles]);

  const removeUserRole = useCallback(async (userId: string, roleId: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.company?.id) {
      return { success: false, error: 'No company available' };
    }

    try {
      const { error } = await queryWrapper.companyQuery(
        async () => supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role_id', roleId)
          .eq('company_id', state.company.id),
        state.company.id,
        'remove-user-role'
      );

      if (error) {
        throw new Error(error.message || 'Failed to remove user role');
      }

      // Refresh user roles list
      await getUserRoles();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove user role';
      return { success: false, error: errorMessage };
    }
  }, [state.company?.id, queryWrapper, getUserRoles]);

  // Analytics and health
  const getAnalytics = useCallback(async (): Promise<CompanyAnalytics | null> => {
    if (!state.company?.id) return null;

    try {
      const { data, error } = await queryWrapper.companyQuery(
        async () => supabase
          .rpc('get_company_analytics', { company_id: state.company.id }),
        state.company.id,
        'get-analytics'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get analytics');
      }

      setState(prev => ({ ...prev, analytics: data }));
      return data;
    } catch (error) {
      logger.error('Failed to get analytics:', error);
      return null;
    }
  }, [state.company?.id, queryWrapper]);

  const getHealth = useCallback(async (): Promise<CompanyHealth | null> => {
    if (!state.company?.id) return null;

    try {
      const { data, error } = await queryWrapper.companyQuery(
        async () => supabase
          .rpc('get_company_health', { company_id: state.company.id }),
        state.company.id,
        'get-health'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get health');
      }

      setState(prev => ({ ...prev, health: data }));
      return data;
    } catch (error) {
      logger.error('Failed to get health:', error);
      return null;
    }
  }, [state.company?.id, queryWrapper]);

  // Utility functions
  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      await Promise.all([
        getCompany(),
        getDepartments(),
        getRoles(),
        getUserRoles(),
        getAnalytics(),
        getHealth()
      ]);
    } catch (error) {
      logger.error('Failed to refresh company data:', error);
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [getCompany, getDepartments, getRoles, getUserRoles, getAnalytics, getHealth]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Placeholder implementations for remaining methods
  const getInvitations = useCallback(async () => [], []);
  const sendInvitation = useCallback(async () => ({ success: true }), []);
  const revokeInvitation = useCallback(async () => ({ success: true }), []);
  const getCompanyUsers = useCallback(async () => [], []);
  const getWorkflows = useCallback(async () => [], []);
  const createWorkflow = useCallback(async () => ({ success: true }), []);
  const updateWorkflow = useCallback(async () => ({ success: true }), []);
  const deleteWorkflow = useCallback(async () => ({ success: true }), []);
  const getTemplates = useCallback(async () => [], []);
  const createTemplate = useCallback(async () => ({ success: true }), []);
  const updateTemplate = useCallback(async () => ({ success: true }), []);
  const deleteTemplate = useCallback(async () => ({ success: true }), []);
  const getReports = useCallback(async () => [], []);
  const createReport = useCallback(async () => ({ success: true }), []);
  const updateReport = useCallback(async () => ({ success: true }), []);
  const deleteReport = useCallback(async () => ({ success: true }), []);
  const getBilling = useCallback(async () => null, []);
  const getUsage = useCallback(async () => [], []);
  const getNotifications = useCallback(async () => [], []);
  const markNotificationRead = useCallback(async () => ({ success: true }), []);
  const getAuditLogs = useCallback(async () => [], []);
  const getExportRequests = useCallback(async () => [], []);
  const requestExport = useCallback(async () => ({ success: true }), []);

  return {
    ...state,
    pendingInvitations,
    getCompany,
    updateCompany,
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    getUserRoles,
    assignUserRole,
    removeUserRole,
    getAnalytics,
    getHealth,
    getInvitations,
    sendInvitation,
    revokeInvitation,
    getCompanyUsers,
    getWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getReports,
    createReport,
    updateReport,
    deleteReport,
    getBilling,
    getUsage,
    getNotifications,
    markNotificationRead,
    getAuditLogs,
    getExportRequests,
    requestExport,
    refreshData,
    clearError
  };
}; 