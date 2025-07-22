import { useQuery } from '@tanstack/react-query';
import { callNexusAdvisor } from '@/domains/services/ai';
import { departmentId } from '../config';
import type { DepartmentState } from '../types';

export function useOperationsSuggestions(prompt: string, snapshot: DepartmentState, orgId?: string | null) {
  const enabled = !!snapshot;
  return useQuery<string>({
    queryKey: ['ops-suggest', prompt, snapshot?.updatedAt],
    queryFn: () => callNexusAdvisor({ prompt, snapshot: snapshot as DepartmentState, orgId }),
    refetchOnWindowFocus: false,
    enabled,
  });
} 