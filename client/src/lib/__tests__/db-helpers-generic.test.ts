/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock getEnv to avoid errors
vi.mock('@/core/environment', () => ({
    getEnv: () => ({ api: { baseUrl: 'http://localhost:3000' } })
}));

// Mock auth store
vi.mock('@/core/auth/authStore', () => ({
    useAuthStore: {
        getState: () => ({ session: null })
    }
}));

// Mock authentik auth service instance to avoid window access during import
vi.mock('@/core/auth/authentikAuthServiceInstance', () => ({
    authentikAuthService: {
        refreshSession: vi.fn(),
        getSession: vi.fn()
    }
}));

// Import after mocks
import { updateOne, insertOne, upsertOne, deleteOne } from '../api-client';

describe('Database Helpers Unwrap Logic', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    const mockSuccessResponse = (responseData: any) => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => responseData,
            status: 200
        });
    };

    it('updateOne should unwrap array response', async () => {
        // API returns { success: true, data: [ { id: 1 } ] }
        mockSuccessResponse({ success: true, data: [{ id: '123', name: 'Updated' }] });

        const result = await updateOne('users', { id: '123' }, { name: 'Updated' });

        expect(result.success).toBe(true);
        // Should be unwrapped object, not array
        expect(result.data).toEqual({ id: '123', name: 'Updated' });
        expect(Array.isArray(result.data)).toBe(false);
    });

    it('insertOne should unwrap array response', async () => {
        mockSuccessResponse({ success: true, data: [{ id: '456', name: 'Inserted' }] });

        const result = await insertOne('users', { name: 'Inserted' });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: '456', name: 'Inserted' });
        expect(Array.isArray(result.data)).toBe(false);
    });

    it('upsertOne should unwrap array response', async () => {
        mockSuccessResponse({ success: true, data: [{ id: '789', name: 'Upserted' }] });

        const result = await upsertOne('users', { name: 'Upserted' });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: '789', name: 'Upserted' });
        expect(Array.isArray(result.data)).toBe(false);
    });

    it('deleteOne should unwrap array response', async () => {
        mockSuccessResponse({ success: true, data: [{ id: '000', deleted: true }] });

        const result = await deleteOne('users', { id: '000' });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: '000', deleted: true });
        expect(Array.isArray(result.data)).toBe(false);
    });

    it('updateOne should handle non-array response (backward compatibility)', async () => {
        // API returns { success: true, data: { id: 1 } } (already single object)
        mockSuccessResponse({ success: true, data: { id: '123', name: 'Updated' } });

        const result = await updateOne('users', { id: '123' }, { name: 'Updated' });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: '123', name: 'Updated' });
    });
});
