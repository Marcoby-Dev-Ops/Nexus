/*
 * Central route map for title / breadcrumb generation
 * Extend as new routes are added.
 */
export const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/chat': 'Chat',
  '/workspace': 'Workspace',
  '/ai-hub': 'AI Hub',
  '/integrations/api-learning': 'API Learning System',
  '/integrations/marketplace': 'Integration Marketplace',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/security': 'Security',
  '/settings/billing': 'Billing',
  '/settings/integrations': 'Integrations',
  '/operations': 'Operations',
  '/operations/analytics': 'Operations Analytics',
  '/finance': 'Finance',
  '/finance/operations': 'Financial Operations',
  '/sales': 'Sales',
  '/sales/performance': 'Sales Performance',
  '/marketing': 'Marketing',
  '/marketing/analytics': 'Marketing Analytics',
  '/support': 'Support',
  '/support/analytics': 'Support Analytics',
  '/maturity': 'Maturity',
  '/maturity/analytics': 'Maturity Analytics',
  '/analytics': 'Analytics',
  '/analytics/unified': 'Unified Analytics',
  '/analytics/business-health': 'Business Health',
  '/company-status': 'Company Status',
  '/documents': 'Documents',
  '/user-guide': 'User Guide',
  '/pricing': 'Pricing',
  '/assessment': 'Assessment',
  '/marketplace': 'Marketplace',
  '/integrations': 'Integrations',
};

export function getRouteLabel(path: string): string | undefined {
  return ROUTE_LABELS[path];
} 