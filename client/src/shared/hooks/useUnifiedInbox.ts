import { useQuery } from '@tanstack/react-query';
import { emailService, type EmailFilters, type EmailItem } from '@/services/email/EmailService';
import { logger } from '@/shared/utils/logger';

export interface UseUnifiedInboxOptions {
  filters?: EmailFilters;
  limit?: number;
  offset?: number;
  folder?: 'inbox' | 'sent' | 'trash' | 'archive' | 'starred';
}

export interface UseUnifiedInboxResult {
  items: EmailItem[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useUnifiedInbox({ filters = {}, limit = 50, offset = 0, folder = 'inbox' }: UseUnifiedInboxOptions = {}): UseUnifiedInboxResult {
  const queryKey = ['unifiedInbox', filters, limit, offset, folder];

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
        const result = await emailService.getEmails(filters, limit, offset, folder);
        logger.info('useUnifiedInbox: Successfully fetched emails', { 
          count: result.data?.items?.length || 0, 
          total: result.data?.total || 0
        });
        // Debug logging removed for production
        return result.data ? result.data : { items: [], total: 0 };
      } catch (error) {
        logger.error('useUnifiedInbox: Error fetching emails:', error);
        // Error logging removed for production
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
