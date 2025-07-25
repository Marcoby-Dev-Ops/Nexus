import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';
import { supabase } from "@/lib/supabase";

export interface Organization {
  id: string;
  name: string;
  role: string;
}

interface OrgStoreState {
  orgs: Organization[];
  activeOrgId: string | null;
  loading: boolean;
  loadMemberships: (userId: string) => Promise<void>;
  setActiveOrg: (orgId: string) => void;
  getActiveOrg: () => Organization | null;
}

export const useOrganizationStore = create<OrgStoreState>()(
  devtools((set, get) => ({
    orgs: [],
    activeOrgId: localStorage.getItem('active_org_id') ?? null,
    loading: false,

    async loadMemberships(userId) {
      set({ loading: true });
      try {
        const { data, error } = await supabase
          .from('user_organizations')
          .select('org_id, role, organizations(name)')
          .eq('user_id', userId);

        if (error) throw error;

        const orgs: Organization[] = (data || []).map((row: any) => ({
          id: row.org_id,
          name: row.organizations?.name ?? 'Org',
          role: row.role,
        }));

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
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed loading org memberships', err);
        set({ loading: false });
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
  }))
); 