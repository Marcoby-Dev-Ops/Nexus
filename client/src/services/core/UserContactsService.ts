import { z } from 'zod';
import { ApiClient } from '@/lib/api-client';
import { getEnv } from '@/core/environment';
import { logger } from '@/shared/utils/logger';

// Schemas aligned with backend route payloads/responses
export const UserEmailSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  email: z.string().email(),
  label: z.string().nullable().optional(),
  is_primary: z.boolean().optional().default(false),
  is_shared: z.boolean().optional().default(false),
  verified: z.boolean().optional().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserPhoneSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  phone_number: z.string(),
  label: z.string().nullable().optional(),
  is_primary: z.boolean().optional().default(false),
  verified: z.boolean().optional().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserEmail = z.infer<typeof UserEmailSchema>;
export type UserPhone = z.infer<typeof UserPhoneSchema>;

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error: string };
type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export class UserContactsService {
  private api: ApiClient;
  private basePath: string;

  constructor() {
    const apiUrl = getEnv().api.url;
    this.api = new ApiClient({ baseUrl: apiUrl });
    this.basePath = '/api/user-contacts';
  }

  async listEmails(userId: string): Promise<ApiResult<UserEmail[]>> {
    const res = await this.api.get<{ success: boolean; data: unknown }>(`${this.basePath}/${userId}/emails`);
    if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to fetch emails' };
    try {
      const parsed = z.array(UserEmailSchema).parse((res.data as any).data);
      return { success: true, data: parsed };
    } catch (e) {
      logger.error('UserContactsService.listEmails parse error', e);
      return { success: false, error: 'Invalid email data received' };
    }
  }

  async addEmail(userId: string, payload: { email: string; label?: string | null; is_primary?: boolean; is_shared?: boolean; verified?: boolean; }): Promise<ApiResult<UserEmail>> {
    const res = await this.api.post<{ success: boolean; data?: unknown; error?: string }>(`${this.basePath}/${userId}/emails`, payload);
    if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to add email' };
    try {
      const parsed = UserEmailSchema.parse((res.data as any).data);
      return { success: true, data: parsed };
    } catch (e) {
      logger.error('UserContactsService.addEmail parse error', e);
      return { success: false, error: 'Invalid email data received' };
    }
  }

  async updateEmail(userId: string, id: string, patch: Partial<Pick<UserEmail, 'email' | 'label' | 'is_primary' | 'is_shared' | 'verified'>>): Promise<ApiResult<UserEmail>> {
    const res = await this.api.put<{ success: boolean; data?: unknown; error?: string }>(`${this.basePath}/${userId}/emails/${id}`, patch);
    if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to update email' };
    try {
      const parsed = UserEmailSchema.parse((res.data as any).data);
      return { success: true, data: parsed };
    } catch (e) {
      logger.error('UserContactsService.updateEmail parse error', e);
      return { success: false, error: 'Invalid email data received' };
    }
  }

  async deleteEmail(userId: string, id: string): Promise<ApiResult<true>> {
    const res = await this.api.delete<{ success: boolean; error?: string }>(`${this.basePath}/${userId}/emails/${id}`);
    if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to delete email' };
    const ok = (res.data as any).success === true;
    return ok ? { success: true, data: true } : { success: false, error: 'Delete failed' };
  }

  async listPhones(userId: string): Promise<ApiResult<UserPhone[]>> {
    const res = await this.api.get<{ success: boolean; data: unknown }>(`${this.basePath}/${userId}/phones`);
    if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to fetch phones' };
    try {
      const parsed = z.array(UserPhoneSchema).parse((res.data as any).data);
      return { success: true, data: parsed };
    } catch (e) {
      logger.error('UserContactsService.listPhones parse error', e);
      return { success: false, error: 'Invalid phone data received' };
    }
  }

  async addPhone(userId: string, payload: { phone: string; label?: string | null; is_primary?: boolean; verified?: boolean; }): Promise<ApiResult<UserPhone>> {
    const res = await this.api.post<{ success: boolean; data?: unknown; error?: string }>(`${this.basePath}/${userId}/phones`, payload);
    if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to add phone' };
    try {
      const parsed = UserPhoneSchema.parse((res.data as any).data);
      return { success: true, data: parsed };
    } catch (e) {
      logger.error('UserContactsService.addPhone parse error', e);
      return { success: false, error: 'Invalid phone data received' };
    }
  }

  async updatePhone(userId: string, id: string, patch: Partial<{ phone: string; label: string | null; is_primary: boolean; verified: boolean; }>): Promise<ApiResult<UserPhone>> {
    const res = await this.api.put<{ success: boolean; data?: unknown; error?: string }>(`${this.basePath}/${userId}/phones/${id}`, patch);
    if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to update phone' };
    try {
      const parsed = UserPhoneSchema.parse((res.data as any).data);
      return { success: true, data: parsed };
    } catch (e) {
      logger.error('UserContactsService.updatePhone parse error', e);
      return { success: false, error: 'Invalid phone data received' };
    }
  }

  async deletePhone(userId: string, id: string): Promise<ApiResult<true>> {
    const res = await this.api.delete<{ success: boolean; error?: string }>(`${this.basePath}/${userId}/phones/${id}`);
    if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to delete phone' };
    const ok = (res.data as any).success === true;
    return ok ? { success: true, data: true } : { success: false, error: 'Delete failed' };
  }
}

export const userContactsService = new UserContactsService();


