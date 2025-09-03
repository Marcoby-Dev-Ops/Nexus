import { getAIService } from './ai';
import { getAnalyticsService } from './analytics';
import { getAdminService } from './admin';
import { getAutomationService } from './automation';
import { getBusinessService } from './business';
import { getDashboardService } from './dashboard';
import { getDepartmentsService } from './departments';
import { getEmailService } from './email';
import { getEntrepreneurService } from './entrepreneur';
import { getHelpCenterService } from './help-center';
import { getHypeService } from './hype';
import { getIntegrationsService } from './integrations';
import { getMarketplaceService } from './marketplace';
import { getTasksService } from './tasks';
import { getSocket } from './socketService';

export const serviceRegistry = {
  ai: getAIService(),
  analytics: getAnalyticsService(),
  admin: getAdminService(),
  automation: getAutomationService(),
  business: getBusinessService(),
  dashboard: getDashboardService(),
  departments: getDepartmentsService(),
  email: getEmailService(),
  entrepreneur: getEntrepreneurService(),
  helpCenter: getHelpCenterService(),
  hype: getHypeService(),
  integrations: getIntegrationsService(),
  marketplace: getMarketplaceService(),
  tasks: getTasksService(),
  socket: getSocket(),
};

export type ServiceRegistry = typeof serviceRegistry; 
