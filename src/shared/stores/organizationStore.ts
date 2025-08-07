import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';
import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger';
import { select, selectOne } from '@/lib/supabase-compatibility';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  slug: string;
  tenant_id: string;
  org_group_id?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  member_count?: number;
  role?: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  org_id: string;
  role: string;
  permissions: string[];
  is_primary: boolean;
  joined_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface OrgStoreState {
  orgs: Organization[];
  activeOrgId: string | null;
  loading: boolean;
  currentOrg: Organization | null;
  currentOrgMembers: OrganizationMember[];
  loadMemberships: (userId: string) => Promise<void>;
  loadOrganizationDetails: (orgId: string) => Promise<void>;
  loadOrganizationMembers: (orgId: string) => Promise<void>;
  setActiveOrg: (orgId: string) => void;
  getActiveOrg: () => Organization | null;
  clearCurrentOrg: () => void;
}

export const getOrganizations = async (userId: string): Promise<Organization[]> => {
  try {
    // Get organizations through user_organizations join
    const { data, error } = await select('user_organizations', `
      org_id,
      role,
      permissions,
      is_primary,
      joined_at,
      organizations (
        id,
        name,
        description,
        slug,
        tenant_id,
        org_group_id,
        settings,
        created_at,
        updated_at
      )
    `, { user_id: userId });
    
    if (error) {
      logger.error({ error }, 'Failed to fetch organizations');
      return [];
    }
    
    // Transform the data to match our Organization interface
    return (data || []).map((item: any) => ({
      ...item.organizations,
      role: item.role,
      member_count: undefined // Will be populated separately if needed
    }));
  } catch (err) {
    logger.error({ err }, 'Error fetching organizations');
    return [];
  }
};

export const getOrganization = async (orgId: string): Promise<Organization | null> => {
  try {
    const { data, error } = await selectOne('organizations', orgId);
    
    if (error) {
      logger.error({ error }, 'Failed to fetch organization');
      return null;
    }
    return data;
  } catch (err) {
    logger.error({ err }, 'Error fetching organization');
    return null;
  }
};

export const getOrganizationMembers = async (orgId: string): Promise<OrganizationMember[]> => {
  try {
    const { data, error } = await select('user_organizations', `
      id,
      user_id,
      org_id,
      role,
      permissions,
      is_primary,
      joined_at,
      user_profiles (
        id,
        name,
        email
      )
    `, { org_id: orgId });
    
    if (error) {
      logger.error({ error }, 'Failed to fetch organization members');
      return [];
    }
    
    // Transform the data to match our OrganizationMember interface
    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      org_id: item.org_id,
      role: item.role,
      permissions: item.permissions || [],
      is_primary: item.is_primary,
      joined_at: item.joined_at,
      user: item.user_profiles ? {
        id: item.user_profiles.id,
        name: item.user_profiles.name,
        email: item.user_profiles.email
      } : undefined
    }));
  } catch (err) {
    logger.error({ err }, 'Error fetching organization members');
    return [];
  }
};

export const useOrganizationStore = create<OrgStoreState>()(
  devtools((set, get) => ({
    orgs: [],
    activeOrgId: localStorage.getItem('active_org_id') ?? null,
    loading: false,
    currentOrg: null,
    currentOrgMembers: [],

    async loadMemberships(userId) {
      set({ loading: true });
      try {
        const orgs = await getOrganizations(userId);
        set(
          produce((state: OrgStoreState) => {
            state.orgs = orgs;
            if (!state.activeOrgId && orgs.length) {
              state.activeOrgId = orgs[0].id;
              localStorage.setItem('active_org_id', orgs[0].id);
            }
            state.loading = false;
          })
        );
      } catch (err) {
        logger.error('Failed loading org memberships', err);
        set({ loading: false });
      }
    },

    async loadOrganizationDetails(orgId) {
      set({ loading: true });
      try {
        const org = await getOrganization(orgId);
        set(
          produce((state: OrgStoreState) => {
            state.currentOrg = org;
            state.loading = false;
          })
        );
      } catch (err) {
        logger.error('Failed loading organization details', err);
        set({ loading: false });
      }
    },

    async loadOrganizationMembers(orgId) {
      try {
        const members = await getOrganizationMembers(orgId);
        set(
          produce((state: OrgStoreState) => {
            state.currentOrgMembers = members;
          })
        );
      } catch (err) {
        logger.error('Failed loading organization members', err);
      }
    },

    setActiveOrg(orgId) {
      set(
        produce((state: OrgStoreState) => {
          state.activeOrgId = orgId;
          localStorage.setItem('active_org_id', orgId);
        })
      );
    },

    getActiveOrg() {
      const { orgs, activeOrgId } = get();
      return orgs.find((o) => o.id === activeOrgId) || null;
    },

    clearCurrentOrg() {
      set(
        produce((state: OrgStoreState) => {
          state.currentOrg = null;
          state.currentOrgMembers = [];
        })
      );
    },
  }))
); 