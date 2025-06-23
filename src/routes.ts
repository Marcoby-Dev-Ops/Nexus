/*
 * Central route map for title / breadcrumb generation
 * Extend as new routes are added.
 */
export const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inbox': 'Unified Inbox',
  '/chat': 'Chat',
  '/workspace': 'Workspace',
  '/ai-hub': 'AI Hub',
  '/api-learning': 'API Learning System',
  '/integrations/api-learning': 'API Learning System',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/security': 'Security',
  '/settings/integrations': 'Integrations',
  '/operations': 'Operations',
  '/finance': 'Finance',
  '/sales': 'Sales',
  '/marketing': 'Marketing',
  '/support': 'Support',
  '/analytics': 'Analytics',
  '/pricing': 'Pricing',
};

export function getRouteLabel(path: string): string | undefined {
  return ROUTE_LABELS[path];
} 