import { useQuery } from '@tanstack/react-query';
import { owaInboxService } from '@/domains/email/services/owaInboxService';
import type { OWAInboxFilters, OWAEmailItem } from '@/domains/email/services/owaInboxService';

export interface UseUnifiedInboxOptions {
  filters?: OWAInboxFilters;
  limit?: number;
  offset?: number;
}

export interface UseUnifiedInboxResult {
  items: OWAEmailItem[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useUnifiedInbox({ filters = {}, limit = 50, offset = 0 }: UseUnifiedInboxOptions = {}): UseUnifiedInboxResult {
  const queryKey = ['unifiedInbox', filters, limit, offset];

  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('useUnifiedInbox: Starting email fetch with filters:', filters);
        const result = await owaInboxService.getEmails(filters, limit, offset);
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('useUnifiedInbox: Successfully fetched emails:', result);
        return result;
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('useUnifiedInbox: Error fetching emails:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('not authenticated')) {
        return false;
      }
      return failureCount < 3;
    },
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