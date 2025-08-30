// src/shared/services/apiIntegrationService.ts

import { selectData, insertOne, updateOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

export type ApiIntegrationData = {
  name: string;
  version: string;
  serverUrl: string;
  endpoints: Array<{
    name: string;
    path: string;
    method: string;
    description: string;
  }>;
  authMethods?: string[];
  [key: string]: any;
};

export const getIntegrations = async (userId: string) => {
  try {
    const { data, error } = await selectData('user_integrations', { filters: { user_id: userId } });
    if (error) {
      logger.error({ error }, 'Failed to fetch integrations');
      return [];
    }
    return data || [];
  } catch (err) {
    logger.error({ err }, 'Error fetching integrations');
    return [];
  }
};

export const addIntegration = async (userId: string, integration: any) => {
  try {
    const { data, error } = await insertOne('user_integrations', { ...integration, user_id: userId });
    if (error) {
      logger.error({ error }, 'Failed to add integration');
      return null;
    }
    return data;
  } catch (err) {
    logger.error({ err }, 'Error adding integration');
    return null;
  }
};

export const updateIntegration = async (id: string, updates: any) => {
  try {
    const { data, error } = await updateOne('user_integrations', id, updates);
    if (error) {
      logger.error({ error }, 'Failed to update integration');
      return null;
    }
    return data;
  } catch (err) {
    logger.error({ err }, 'Error updating integration');
    return null;
  }
};

export const ApiIntegrationService = {
  async analyzeApiDoc(apiDoc: string): Promise<ApiIntegrationData> {
    // Minimal stub: parse JSON and return basic info
    try {
      const doc = JSON.parse(apiDoc);
      return {
        name: doc.info?.title || 'Unknown API',
        version: doc.info?.version || '1.0.0',
        serverUrl: doc.servers?.[0]?.url || '',
        endpoints: Object.entries(doc.paths || {}).map(([path, methods]: [string, any]) => {
          const method = Object.keys(methods)[0];
          const details = methods[method];
          return {
            name: details.summary || path,
            path,
            method,
            description: details.description || '',
          };
        }),
        authMethods: doc.security ? Object.keys(doc.security[0] || {}) : [],
      };
    } catch (e) {
      throw new Error('Invalid API doc');
    }
  },

  async generateIntegration(config: Partial<ApiIntegrationData>): Promise<any> {
    // Minimal stub: just return the config
    return { ...config, id: 'integration_' + Date.now() };
  },

  async saveIntegration(data: ApiIntegrationData): Promise<string> {
    // Minimal stub: pretend to save and return an ID
    return 'integration_' + Date.now();
  },
}; 
