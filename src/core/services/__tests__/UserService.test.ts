import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService, UserProfileSchema, userService } from '../UserService';
import { serviceFactory } from '../ServiceFactory';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-user-id',
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
              role: 'user',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            error: null
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'new-user-id',
                email: 'new@example.com',
                first_name: 'New',
                last_name: 'User',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-user-id',
                  email: 'updated@example.com',
                  first_name: 'Updated',
                  last_name: 'User',
                  updated_at: '2024-01-01T00:00:00Z'
                },
                error: null
              }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      }
    }))
  }
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    serviceFactory.clear();
    serviceFactory.register('user', userService);
  });

  describe('CRUD Operations', () => {
    it('should get a user by ID', async () => {
      const result = await userService.get('test-user-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('test-user-id');
      expect(result.data?.email).toBe('test@example.com');
    });

    it('should create a new user', async () => {
      const newUser = {
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User'
      };

      const result = await userService.create(newUser);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe('new@example.com');
    });

    it('should update a user', async () => {
      const updates = {
        email: 'updated@example.com',
        first_name: 'Updated'
      };

      const result = await userService.update('test-user-id', updates);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe('updated@example.com');
    });

    it('should delete a user', async () => {
      const result = await userService.delete('test-user-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should list users with filters', async () => {
      const result = await userService.list({ role: 'user' });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should validate user profile schema', () => {
      const validUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const result = UserProfileSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid user data', () => {
      const invalidUser = {
        id: 'invalid-uuid',
        email: 'invalid-email',
        role: 'invalid-role'
      };

      const result = UserProfileSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('Service Factory Integration', () => {
    it('should register and retrieve user service', () => {
      expect(serviceFactory.has('user')).toBe(true);
      
      const retrievedService = serviceFactory.get('user');
      expect(retrievedService).toBeInstanceOf(UserService);
    });

    it('should list registered services', () => {
      const services = serviceFactory.list();
      expect(services).toContain('user');
    });

    it('should throw error for non-existent service', () => {
      expect(() => {
        serviceFactory.get('non-existent');
      }).toThrow('Service non-existent not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      });

      const result = await userService.get('invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Advanced Operations', () => {
    it('should search users', async () => {
      const result = await userService.search('test', { role: 'user' });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should bulk update user roles', async () => {
      const updates = [
        { userId: 'user-1', role: 'admin' },
        { userId: 'user-2', role: 'manager' }
      ];

      const result = await userService.bulkUpdateRoles(updates);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get user by email', async () => {
      const result = await userService.getUserByEmail('test@example.com');
      
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });
  });
}); 