import { selectData, insertOne, updateOne } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

export type LicenseTierId = 'free' | 'pro' | 'enterprise' | 'custom';

export interface ChatQuotaLimits {
  max_messages_per_day: number;
  max_messages_per_hour: number;
  max_conversation_length: number;
  max_concurrent_conversations: number;
  max_ai_requests_per_hour: number;
}

export interface UsageSummary {
  message_count: number;
  ai_requests_made: number;
  estimated_cost_usd: number;
}

export interface UserUsageStats {
  licenseTier: LicenseTierId;
  currentQuotas: ChatQuotaLimits;
  todayUsage: UsageSummary;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  quotas?: ChatQuotaLimits;
  retryAfter?: number;
}

interface UserLicenseRow {
  id?: string;
  user_id: string;
  tier?: LicenseTierId | string | null;
  license_type?: string | null;
  status?: 'active' | 'suspended' | 'expired' | string | null;
  expires_at?: string | null;
  quota_overrides?: Partial<ChatQuotaLimits> | string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

interface UsageTrackingRow {
  id?: string;
  user_id: string;
  date: string;
  messages_sent?: number;
  ai_requests_made?: number;
  estimated_cost_usd?: number;
  created_at?: string;
  updated_at?: string;
}

const LICENSE_QUOTAS: Record<Exclude<LicenseTierId, 'custom'>, ChatQuotaLimits> = {
  free: {
    max_messages_per_day: 20,
    max_messages_per_hour: 10,
    max_conversation_length: 50,
    max_concurrent_conversations: 3,
    max_ai_requests_per_hour: 10,
  },
  pro: {
    max_messages_per_day: 500,
    max_messages_per_hour: 100,
    max_conversation_length: 200,
    max_concurrent_conversations: 10,
    max_ai_requests_per_hour: 75,
  },
  enterprise: {
    max_messages_per_day: 2000,
    max_messages_per_hour: 500,
    max_conversation_length: 1000,
    max_concurrent_conversations: 50,
    max_ai_requests_per_hour: 500,
  },
};

const DEFAULT_COST_PER_MESSAGE = 0.002;

function resolveDefaultTier(): LicenseTierId {
  const envValue = import.meta.env.VITE_DEFAULT_LICENSE_TIER as LicenseTierId | undefined;
  if (envValue && ['free', 'pro', 'enterprise', 'custom'].includes(envValue)) {
    return envValue;
  }
  return 'free';
}

function normalizeOverrides(value: unknown): Partial<ChatQuotaLimits> | undefined {
  if (!value) return undefined;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed as Partial<ChatQuotaLimits>;
      }
    } catch (error) {
      logger.warn('[QuotaService] Failed to parse quota overrides string', { error });
      return undefined;
    }
  }

  if (typeof value === 'object') {
    return value as Partial<ChatQuotaLimits>;
  }

  return undefined;
}

function extractRows<T>(payload: unknown): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload === 'object') {
    const data = (payload as any).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

function extractRecord<T>(payload: unknown): T | null {
  if (!payload) return null;
  if (Array.isArray(payload)) return (payload[0] as T) ?? null;
  if (typeof payload === 'object') {
    const data = (payload as any).data;
    if (Array.isArray(data)) return (data[0] as T) ?? null;
    if (data && typeof data === 'object') return data as T;
    return payload as T;
  }
  return null;
}

class PostgresQuotaService {
  private readonly defaultTier = resolveDefaultTier();
  private readonly costPerMessageUsd = Number(
    import.meta.env.VITE_COST_PER_MESSAGE_USD ??
      import.meta.env.VITE_COST_PER_1K_TOKENS ??
      DEFAULT_COST_PER_MESSAGE,
  );

  private get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private resolveTier(row: UserLicenseRow | null): LicenseTierId {
    if (!row) return this.defaultTier;

    const candidate = (row.tier ?? row.license_type ?? (row.metadata as any)?.tier) as string | undefined;
    if (candidate && ['free', 'pro', 'enterprise', 'custom'].includes(candidate)) {
      return candidate as LicenseTierId;
    }

    return this.defaultTier;
  }

  private resolveQuotaForTier(tier: LicenseTierId, overrides?: Partial<ChatQuotaLimits> | null): ChatQuotaLimits {
    const base = tier === 'custom'
      ? LICENSE_QUOTAS.enterprise
      : LICENSE_QUOTAS[tier] ?? LICENSE_QUOTAS[this.defaultTier === 'custom' ? 'free' : this.defaultTier];

    return {
      ...base,
      ...(overrides ?? {}),
    };
  }

  private async fetchUserLicense(userId: string): Promise<UserLicenseRow | null> {
    try {
      const response = await selectData<UserLicenseRow>({
        table: 'user_licenses',
        filters: { user_id: userId, status: 'active' },
        orderBy: [{ column: 'expires_at', ascending: false }],
        limit: 1,
      });

      if (!response.success || !response.data) {
        return null;
      }

      const rows = extractRows<UserLicenseRow>(response.data);
      if (rows.length > 0) return rows[0];

      // Fallback: try without status filter in case schema differs
      const fallback = await selectData<UserLicenseRow>({
        table: 'user_licenses',
        filters: { user_id: userId },
        orderBy: [{ column: 'expires_at', ascending: false }],
        limit: 1,
      });

      if (!fallback.success || !fallback.data) return null;
      const fallbackRows = extractRows<UserLicenseRow>(fallback.data);
      return fallbackRows[0] ?? null;
    } catch (error) {
      logger.warn('[QuotaService] Failed to fetch user license', { userId, error });
      return null;
    }
  }

  private async fetchUsageRow(userId: string, date: string): Promise<UsageTrackingRow | null> {
    try {
      const response = await selectData<UsageTrackingRow>({
        table: 'chat_usage_tracking',
        filters: { user_id: userId, date },
        limit: 1,
      });

      if (!response.success || !response.data) return null;
      const rows = extractRows<UsageTrackingRow>(response.data);
      return rows[0] ?? null;
    } catch (error) {
      logger.warn('[QuotaService] Failed to fetch usage row', { userId, date, error });
      return null;
    }
  }

  async getUserUsageStats(userId: string): Promise<UserUsageStats> {
    const licenseRow = await this.fetchUserLicense(userId);
    const tier = this.resolveTier(licenseRow);
    const overrides = normalizeOverrides(licenseRow?.quota_overrides ?? (licenseRow?.metadata as any)?.quotas);
    const quotas = this.resolveQuotaForTier(tier, overrides);

    const usageRow = await this.fetchUsageRow(userId, this.today);
    const todayUsage: UsageSummary = {
      message_count: usageRow?.messages_sent ?? 0,
      ai_requests_made: usageRow?.ai_requests_made ?? 0,
      estimated_cost_usd: usageRow?.estimated_cost_usd ?? 0,
    };

    return { licenseTier: tier, currentQuotas: quotas, todayUsage };
  }

  async canSendMessage(userId: string): Promise<QuotaCheckResult> {
    const stats = await this.getUserUsageStats(userId);
    const { todayUsage, currentQuotas } = stats;

    if (todayUsage.message_count >= currentQuotas.max_messages_per_day) {
      return {
        allowed: false,
        reason: 'Daily message limit reached',
        quotas: currentQuotas,
        retryAfter: 24 * 60 * 60 * 1000,
      };
    }

    if (todayUsage.ai_requests_made >= currentQuotas.max_ai_requests_per_hour) {
      return {
        allowed: false,
        reason: 'Hourly AI request limit reached',
        quotas: currentQuotas,
        retryAfter: 60 * 60 * 1000,
      };
    }

    return { allowed: true, quotas: currentQuotas };
  }

  async recordUsage(userId: string, type: 'message' | 'ai_request'): Promise<void> {
    const today = this.today;
    const usageRow = await this.fetchUsageRow(userId, today);
    const now = new Date().toISOString();

    if (!usageRow) {
      const payload: Record<string, unknown> = {
        user_id: userId,
        date: today,
        messages_sent: type === 'message' ? 1 : 0,
        ai_requests_made: type === 'ai_request' ? 1 : 0,
        estimated_cost_usd: type === 'message' ? this.costPerMessageUsd : 0,
        created_at: now,
        updated_at: now,
      };

      const response = await insertOne('chat_usage_tracking', payload);
      if (!response.success) {
        logger.warn('[QuotaService] Failed to insert usage tracking record', { userId, type, error: response.error });
      }
      return;
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: now,
      messages_sent: usageRow.messages_sent ?? 0,
      ai_requests_made: usageRow.ai_requests_made ?? 0,
      estimated_cost_usd: usageRow.estimated_cost_usd ?? 0,
    };

    if (type === 'message') {
      updatePayload.messages_sent = (usageRow.messages_sent ?? 0) + 1;
      const newCost = (usageRow.estimated_cost_usd ?? 0) + this.costPerMessageUsd;
      updatePayload.estimated_cost_usd = Number(newCost.toFixed(6));
    }

    if (type === 'ai_request') {
      updatePayload.ai_requests_made = (usageRow.ai_requests_made ?? 0) + 1;
    }

    if (usageRow.id) {
      const response = await updateOne('chat_usage_tracking', usageRow.id, updatePayload);
      if (!response.success) {
        logger.warn('[QuotaService] Failed to update usage tracking record', { userId, type, error: response.error });
      }
    } else {
      // Fallback: insert new row if ID is unavailable (schema without PK)
      const fallbackPayload = {
        user_id: userId,
        date: today,
        ...updatePayload,
      };
      const response = await insertOne('chat_usage_tracking', fallbackPayload);
      if (!response.success) {
        logger.warn('[QuotaService] Failed to upsert usage tracking record without ID', { userId, type, error: response.error });
      }
    }
  }
}

export const quotaService = new PostgresQuotaService();
