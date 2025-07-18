import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { unifiedInboxService } from '@/domains/services/unifiedInboxService';
import type { InboxFilters, InboxItem } from '@/domains/services/unifiedInboxService';

export interface UseUnifiedInboxOptions {
  filters?: InboxFilters;
  limit?: number;
  offset?: number;
}

export interface UseUnifiedInboxResult {
  items: InboxItem[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useUnifiedInbox({ filters = {}, limit = 50, offset = 0 }: UseUnifiedInboxOptions = {}): UseUnifiedInboxResult {
  const queryKey = ['unifiedInbox', filters, limit, offset];

  const queryFn = useCallback(async () => {
    return await unifiedInboxService.getInboxItems(filters, limit, offset);
  }, [filters, limit, offset]);

  const { data, isLoading, isError, error, refetch } = useQuery<{ items: InboxItem[]; total: number }, Error>({
    queryKey,
    queryFn,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    items: data?.items || [],
    total: data?.total || 0,
    isLoading,
    isError,
    error,
    refetch,
  };
} 