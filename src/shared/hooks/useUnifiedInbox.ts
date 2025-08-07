import { useQuery } from '@tanstack/react-query';
import { owaInboxService } from '@/services/email/owaInboxService';
import type { OWAInboxFilters, OWAEmailItem } from '@/services/email/owaInboxService';
import { logger } from '@/shared/utils/logger';

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
        logger.info('useUnifiedInbox: Starting email fetch with filters:', filters);
        const result = await owaInboxService.getEmails(filters, limit, offset);
        logger.info('useUnifiedInbox: Successfully fetched emails:', result);
        return result;
      } catch (error) {
        logger.error('useUnifiedInbox: Error fetching emails:', error);
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