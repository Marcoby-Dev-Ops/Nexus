import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';
import { logger } from '@/shared/utils/logger';

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
    // Debug logging removed for production
    
    // Get Marcoby IAM session from localStorage
    const sessionData = localStorage.getItem('authentik_session');
    
    if (!sessionData) {
      logger.warn('No Marcoby IAM session available; returning empty organization list');
      // Error logging removed for production
      return [];
    }

    let session;
    try {
      session = JSON.parse(sessionData);
    } catch (parseError) {
      logger.error('Failed to parse Marcoby IAM session', { error: parseError });
      // Error logging removed for production
      return [];
    }

    const token = session?.accessToken || session?.session?.accessToken;
    
    if (!token) {
      logger.warn('No access token in Marcoby IAM session; returning empty organization list');
      // Error logging removed for production
      return [];
    }

    // API call logging removed for production
    
    // Call the API endpoint
    const response = await fetch('/api/organizations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Response logging removed for production

    if (!response.ok) {
      if (response.status === 401) {
        logger.warn('User not authenticated; returning empty organization list');
        // Error logging removed for production
        return [];
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Response logging removed for production
    
    if (!result.success) {
      logger.error('API returned error', { error: result.error });
      // Error logging removed for production
      return [];
    }

    // Reduced logging for frequently called method
    // Success logging removed for production

    return result.data || [];
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Error fetching organizations from API', { error: errorMessage, stack: err instanceof Error ? err.stack : undefined });
    // Error logging removed for production
    return [];
  }
};

export const getOrganization = async (orgId: string): Promise<Organization | null> => {
  try {
    // Get Marcoby IAM session from localStorage
    const sessionData = localStorage.getItem('authentik_session');
    
    if (!sessionData) {
      logger.warn('No Marcoby IAM session available; returning null for organization');
      return null;
    }

    let session;
    try {
      session = JSON.parse(sessionData);
    } catch (parseError) {
      logger.error('Failed to parse Marcoby IAM session', { error: parseError });
      return null;
    }

    const token = session?.accessToken || session?.session?.accessToken;
    
    if (!token) {
      logger.warn('No access token in Marcoby IAM session; returning null for organization');
      return null;
    }

    // Call the API endpoint
    const response = await fetch(`/api/organizations/${orgId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logger.warn('User not authenticated; returning null for organization');
        return null;
      }
      if (response.status === 403) {
        logger.warn('Access denied to organization');
        return null;
      }
      if (response.status === 404) {
        logger.warn('Organization not found');
        return null;
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      logger.error('API returned error', { error: result.error });
      return null;
    }

    logger.info('Successfully fetched organization from API', { orgId });

    return result.data || null;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Error fetching organization from API', { error: errorMessage, stack: err instanceof Error ? err.stack : undefined });
    return null;
  }
};

export const getOrganizationMembers = async (orgId: string): Promise<OrganizationMember[]> => {
  try {
    // Get Marcoby IAM session from localStorage
    const sessionData = localStorage.getItem('authentik_session');
    
    if (!sessionData) {
      logger.warn('No Marcoby IAM session available; returning empty organization members list');
      return [];
    }

    let session;
    try {
      session = JSON.parse(sessionData);
    } catch (parseError) {
      logger.error('Failed to parse Marcoby IAM session', { error: parseError });
      return [];
    }

    const token = session?.accessToken || session?.session?.accessToken;
    
    if (!token) {
      logger.warn('No access token in Marcoby IAM session; returning empty organization members list');
      return [];
    }

    // Call the API endpoint
    const response = await fetch(`/api/organizations/${orgId}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logger.warn('User not authenticated; returning empty organization members list');
        return [];
      }
      if (response.status === 403) {
        logger.warn('Access denied to organization members');
        return [];
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      logger.error('API returned error', { error: result.error });
      return [];
    }

    logger.info('Successfully fetched organization members from API', { orgId, count: result.data?.length || 0 });

    return result.data || [];
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Error fetching organization members from API', { error: errorMessage, stack: err instanceof Error ? err.stack : undefined });
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
            // Ensure an active org is selected when any are available
            if (orgs.length && !state.activeOrgId) {
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
            // Keep activeOrgId in sync when details are fetched
            if (org?.id) {
              state.activeOrgId = org.id;
              localStorage.setItem('active_org_id', org.id);
            }
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
      return orgs.find((o) => o.id === activeOrgId) || orgs[0] || null;
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
