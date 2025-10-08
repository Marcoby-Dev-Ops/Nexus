import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { selectData, selectOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface RedirectRule {
  id: string;
  user_id: string;
  source_path: string;
  target_path: string;
  status_code: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Define public routes
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/privacy',
  '/terms',
  '/landing',
  '/waitlist',
  '/auth/callback',
  '/reset-password',
  '/email-not-verified',
  // immersive experience removed
];

export const useRedirectManager = () => {
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectInProgress] = useState(false); // reserved for future redirect flows
  const location = useLocation();

  const isPublicRoute = useCallback(() => {
    // Special handling for root route - only treat exact '/' as public
    if (location.pathname === '/') {
      return true;
    }
    
    return PUBLIC_ROUTES.some(route => {
      if (route === '/') {
        // Skip root route check for other paths
        return false;
      }
      if (route.includes(':')) {
        const routePattern = route.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${routePattern}$`);
        return regex.test(location.pathname);
      }
      return location.pathname.startsWith(route);
    });
  }, [location.pathname]);

  const fetchRedirects = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await selectData('redirect_rules', '*', { user_id: userId });
      
      if (error) {
        logger.error('Failed to fetch redirect rules', { error });
        setError('Failed to fetch redirects');
        return;
      }
      setRedirects(data || []);
    } catch (err) {
      logger.error('Error fetching redirect rules', { err });
      setError('Error fetching redirects');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRedirectById = useCallback(async (id: string) => {
    try {
      const { data, error } = await selectOne('redirect_rules', { id });
      
      if (error) {
        logger.error('Failed to fetch redirect rule', { error });
        return null;
      }
      return data;
    } catch (err) {
      logger.error('Error fetching redirect rule', { err });
      return null;
    }
  }, []);

  return {
    redirects,
    loading,
    error,
    redirectInProgress,
    isPublicRoute,
    fetchRedirects,
    getRedirectById,
  };
}; 
