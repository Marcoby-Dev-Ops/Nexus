import { logger } from '@/shared/utils/logger';

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export type NotificationFrequency = 'immediate' | 'daily' | 'weekly' | 'never';

export interface NotificationChannelSetting {
  name: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  enabled: boolean;
}

export interface NotificationCategorySetting {
  name: string;
  description: string;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
    in_app: boolean;
  };
  frequency: NotificationFrequency;
}

export interface NotificationSettings {
  global_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  channels: Record<string, NotificationChannelSetting>;
  categories: Record<string, NotificationCategorySetting>;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  global_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  channels: {
    email: {
      name: 'Email',
      type: 'email',
      enabled: true
    },
    push: {
      name: 'Push Notifications',
      type: 'push',
      enabled: true
    },
    in_app: {
      name: 'In-App',
      type: 'in_app',
      enabled: true
    }
  },
  categories: {
    security: {
      name: 'Security & Privacy',
      description: 'Login alerts, password changes, and security updates',
      channels: {
        email: true,
        push: true,
        sms: false,
        in_app: true
      },
      frequency: 'immediate'
    },
    business: {
      name: 'Business Updates',
      description: 'Important business metrics and performance alerts',
      channels: {
        email: true,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'daily'
    },
    integrations: {
      name: 'Integration Status',
      description: 'Integration sync status and connection issues',
      channels: {
        email: false,
        push: true,
        sms: false,
        in_app: true
      },
      frequency: 'immediate'
    },
    team: {
      name: 'Team Activity',
      description: 'Team member activities and collaboration updates',
      channels: {
        email: false,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'daily'
    },
    calendar: {
      name: 'Calendar & Events',
      description: 'Meeting reminders and calendar updates',
      channels: {
        email: true,
        push: true,
        sms: false,
        in_app: true
      },
      frequency: 'immediate'
    },
    documents: {
      name: 'Document Updates',
      description: 'Document changes and collaboration updates',
      channels: {
        email: false,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'daily'
    },
    billing: {
      name: 'Billing & Payments',
      description: 'Payment confirmations and billing alerts',
      channels: {
        email: true,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'immediate'
    },
    analytics: {
      name: 'Analytics & Insights',
      description: 'Performance reports and trend analysis',
      channels: {
        email: true,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'weekly'
    }
  }
};

const cloneSettings = (settings: NotificationSettings): NotificationSettings =>
  JSON.parse(JSON.stringify(settings));

const deepMerge = <T extends Record<string, any>>(target: T, source?: Record<string, any>): T => {
  if (!source || typeof source !== 'object') {
    return target;
  }

  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge(
        target[key] && typeof target[key] === 'object' ? { ...target[key] } : {},
        value as Record<string, any>
      );
    } else {
      target[key] = value as any;
    }
  });

  return target;
};

class NotificationPreferencesService {
  private baseUrl = '/api/user-preferences/notifications';

  private buildHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private buildError(operation: string, error: unknown): ServiceResponse<NotificationSettings> {
    logger.error(`NotificationPreferencesService.${operation} failed`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false
    };
  }

  private mergeWithDefaults(settings?: Partial<NotificationSettings>): NotificationSettings {
    return deepMerge(cloneSettings(DEFAULT_SETTINGS), settings);
  }

  getDefaultSettings(): NotificationSettings {
    return cloneSettings(DEFAULT_SETTINGS);
  }

  async fetchSettings(token?: string): Promise<ServiceResponse<NotificationSettings>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: this.buildHeaders(token)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notification preferences: ${response.statusText}`);
      }

      const payload = await response.json();

      if (!payload.success) {
        throw new Error(payload.error || 'Failed to fetch notification preferences');
      }

      return {
        data: this.mergeWithDefaults(payload.data),
        error: null,
        success: true
      };
    } catch (error) {
      return this.buildError('fetchSettings', error);
    }
  }

  async saveSettings(
    settings: NotificationSettings,
    token?: string
  ): Promise<ServiceResponse<NotificationSettings>> {
    try {
      const payload = this.mergeWithDefaults(settings);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.buildHeaders(token),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to save notification preferences: ${response.statusText}`);
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to save notification preferences');
      }

      return {
        data: this.mergeWithDefaults(json.data),
        error: null,
        success: true
      };
    } catch (error) {
      return this.buildError('saveSettings', error);
    }
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
