/**
 * Licensing and quota management types for production chat system
 */

export interface UserLicense {
  id: string;
  user_id: string;
  org_id?: string;
  tier: 'free' | 'pro' | 'enterprise' | 'custom';
  status: 'active' | 'suspended' | 'expired';
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatQuotas {
  // Message limits
  max_messages_per_day: number;
  max_messages_per_hour: number;
  max_conversation_length: number;
  max_concurrent_conversations: number;
  
  // Feature limits
  max_file_uploads_per_day: number;
  max_file_size_mb: number;
  streaming_enabled: boolean;
  advanced_agents_enabled: boolean;
  
  // API limits
  max_ai_requests_per_hour: number;
  max_context_tokens: number;
  priority_queue: boolean;
}

export interface UsageTracking {
  user_id: string;
  org_id?: string;
  date: string; // YYYY-MM-DD format
  
  // Daily counters
  message_count: number;
  ai_requests_made: number;
  files_uploaded: number;
  tokens_used: number;
  
  // Costs
  estimated_cost_usd: number;
  
  created_at: string;
  updated_at: string;
}

export interface LicenseTier {
  name: string;
  quotas: ChatQuotas;
  price_per_month?: number;
  features: string[];
}

// Default license tiers
export const LICENSE_TIERS: Record<string, LicenseTier> = {
  free: {
    name: 'Free',
    quotas: {
      max_messages_per_day: 20,
      max_messages_per_hour: 10,
      max_conversation_length: 50,
      max_concurrent_conversations: 3,
      max_file_uploads_per_day: 0,
      max_file_size_mb: 0,
      streaming_enabled: false,
      advanced_agents_enabled: false,
      max_ai_requests_per_hour: 10,
      max_context_tokens: 1000,
      priority_queue: false,
    },
    features: ['Basic chat', 'Executive agent only', 'Standard support'],
  },
  pro: {
    name: 'Pro',
    quotas: {
      max_messages_per_day: 500,
      max_messages_per_hour: 100,
      max_conversation_length: 200,
      max_concurrent_conversations: 10,
      max_file_uploads_per_day: 20,
      max_file_size_mb: 10,
      streaming_enabled: true,
      advanced_agents_enabled: true,
      max_ai_requests_per_hour: 100,
      max_context_tokens: 4000,
      priority_queue: false,
    },
    price_per_month: 29,
    features: ['All agents', 'File uploads', 'Streaming responses', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    quotas: {
      max_messages_per_day: 2000,
      max_messages_per_hour: 500,
      max_conversation_length: 1000,
      max_concurrent_conversations: 50,
      max_file_uploads_per_day: 100,
      max_file_size_mb: 50,
      streaming_enabled: true,
      advanced_agents_enabled: true,
      max_ai_requests_per_hour: 500,
      max_context_tokens: 8000,
      priority_queue: true,
    },
    price_per_month: 99,
    features: ['Unlimited agents', 'Large files', 'Priority queue', 'Custom integrations', 'Dedicated support'],
  },
};

export interface RateLimitConfig {
  window_ms: number;
  max_requests: number;
  message: string;
  retry_after_ms?: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  messages: {
    window_ms: 60 * 1000, // 1 minute
    max_requests: 20,
    message: 'Too many messages. Please wait before sending another.',
    retry_after_ms: 30 * 1000,
  },
  ai_requests: {
    window_ms: 60 * 60 * 1000, // 1 hour  
    max_requests: 100,
    message: 'AI request limit reached. Please try again later.',
    retry_after_ms: 5 * 60 * 1000,
  },
  file_uploads: {
    window_ms: 24 * 60 * 60 * 1000, // 24 hours
    max_requests: 50,
    message: 'Daily file upload limit reached.',
    retry_after_ms: 60 * 60 * 1000,
  },
}; 