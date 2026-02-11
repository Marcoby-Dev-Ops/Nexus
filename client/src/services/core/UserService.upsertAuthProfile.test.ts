import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCallRPC, mockUpdateOne } = vi.hoisted(() => ({
  mockCallRPC: vi.fn(),
  mockUpdateOne: vi.fn(),
}));

vi.mock('@/shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/database', () => ({
  selectData: vi.fn(),
  selectOne: vi.fn(),
  insertOne: vi.fn(),
  updateOne: mockUpdateOne,
  deleteOne: vi.fn(),
  callRPC: mockCallRPC,
}));

import { UserService } from './UserService';

describe('UserService upsertAuthProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles ensure_user_profile envelopes and preserves id during validation', async () => {
    const service = new UserService();
    const userId = 'f85c26f2893f3221bf0beff64fd40c503340a1c14380b25138a43d69b32f7f57';
    const profileRow = {
      id: '9db9138c-6702-4469-bb4b-00719110ee98',
      user_id: userId,
      first_name: 'Von',
      role: 'user',
    };

    // First ensure_user_profile call (before update), then second (after cache clear).
    mockCallRPC
      .mockResolvedValueOnce({
        success: true,
        data: {
          success: true,
          data: profileRow,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          success: true,
          data: {
            ...profileRow,
            updated_at: new Date().toISOString(),
          },
        },
      });

    mockUpdateOne.mockResolvedValue({
      success: true,
      error: null,
      data: {
        ...profileRow,
        updated_at: new Date().toISOString(),
      },
    });

    const result = await service.upsertAuthProfile(userId, {
      first_name: 'Von',
      website: 'https://marcoby.com',
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
    expect(result.data?.id).toBe(profileRow.id);
    expect(result.data?.external_user_id).toBe(userId);

    expect(mockCallRPC).toHaveBeenCalledTimes(2);
    expect(mockCallRPC).toHaveBeenNthCalledWith(1, 'ensure_user_profile', { external_user_id: userId });
    expect(mockCallRPC).toHaveBeenNthCalledWith(2, 'ensure_user_profile', { external_user_id: userId });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      'user_profiles',
      { user_id: userId },
      expect.objectContaining({ first_name: 'Von' })
    );
  });
});
