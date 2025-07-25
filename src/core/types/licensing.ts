/**
 * Licensing and quota management types for production chat system
 */

export interface UserLicense {
  id: string;
  userid: string;
  org_id?: string;
  tier: 'free' | 'pro' | 'enterprise' | 'custom';
  status: 'active' | 'suspended' | 'expired';
  expires_at?: string;
  createdat: string;
  updatedat: string;
}

export interface ChatQuotas {
  // Message limits
  maxmessagesper_day: number;
  maxmessagesper_hour: number;
  maxmessagesper_month: number;
  maxconversationlength: number;
  maxconcurrentconversations: number;
  
  // Feature limits
  maxfileuploads_per_day: number;
  maxfilesize_mb: number;
  streamingenabled: boolean;
  advancedagentsenabled: boolean;
  
  // API limits
  maxairequests_per_hour: number;
  maxcontexttokens: number;
  priorityqueue: boolean;
}

export interface UsageTracking {
  userid: string;
  org_id?: string;
  date: string; // YYYY-MM-DD format
  
  // Daily counters
  messagecount: number;
  airequestsmade: number;
  filesuploaded: number;
  tokensused: number;
  
  // Costs
  estimatedcostusd: number;
  
  createdat: string;
  updatedat: string;
}

export interface LicenseTier {
  name: string;
  quotas: ChatQuotas;
  price_per_month?: number;
  features: string[];
}

// Default license tiers
export const LICENSETIERS: Record<string, LicenseTier> = {
  free: {
    name: 'Free',
    quotas: {
      maxmessagesper_day: 20,
      maxmessages_per_hour: 10,
      maxmessages_per_month: 600,
      maxconversation_length: 50,
      maxconcurrent_conversations: 3,
      maxfile_uploads_per_day: 0,
      maxfile_size_mb: 0,
      streamingenabled: false,
      advancedagents_enabled: false,
      maxai_requests_per_hour: 10,
      maxcontext_tokens: 1000,
      priorityqueue: false,
    },
    features: ['Basic chat', 'Executive agent only', 'Standard support'],
  },
  pro: {
    name: 'Pro',
    quotas: {
      maxmessagesper_day: 250,
      maxmessages_per_hour: 50,
      maxmessages_per_month: 7500,
      maxconversation_length: 200,
      maxconcurrent_conversations: 10,
      maxfile_uploads_per_day: 20,
      maxfile_size_mb: 10,
      streamingenabled: true,
      advancedagents_enabled: true,
      maxai_requests_per_hour: 75,
      maxcontext_tokens: 4000,
      priorityqueue: false,
    },
    priceper_month: 29,
    features: ['All agents', 'File uploads', 'Streaming responses', 'Priority support', 'Overage billing available'],
  },
  enterprise: {
    name: 'Enterprise',
    quotas: {
      maxmessagesper_day: 2000,
      maxmessages_per_hour: 500,
      maxmessages_per_month: 60000,
      maxconversation_length: 1000,
      maxconcurrent_conversations: 50,
      maxfile_uploads_per_day: 100,
      maxfile_size_mb: 50,
      streamingenabled: true,
      advancedagents_enabled: true,
      maxai_requests_per_hour: 500,
      maxcontext_tokens: 8000,
      priorityqueue: true,
    },
    priceper_month: 99,
    features: ['Unlimited agents', 'Large files', 'Priority queue', 'Custom integrations', 'Dedicated support', 'Team pooled quotas'],
  },
};

export interface RateLimitConfig {
  windowms: number;
  maxrequests: number;
  message: string;
  retry_after_ms?: number;
}

export const RATELIMITS: Record<string, RateLimitConfig> = {
  messages: {
    windowms: 60 * 1000, // 1 minute
    maxrequests: 20,
    message: 'Too many messages. Please wait before sending another.',
    retryafter_ms: 30 * 1000,
  },
  airequests: {
    windowms: 60 * 60 * 1000, // 1 hour  
    maxrequests: 100,
    message: 'AI request limit reached. Please try again later.',
    retryafter_ms: 5 * 60 * 1000,
  },
  fileuploads: {
    windowms: 24 * 60 * 60 * 1000, // 24 hours
    maxrequests: 50,
    message: 'Daily file upload limit reached.',
    retryafter_ms: 60 * 60 * 1000,
  },
};

// Export aliases for compatibility
export const LICENSE_TIERS = LICENSETIERS;
export const RATE_LIMITS = RATELIMITS; 