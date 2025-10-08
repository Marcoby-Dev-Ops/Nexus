import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userService } from '../UserService';

describe('UserService', () => {
  beforeEach(() => {
    // Reset any service state if needed
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('CRUD Operations', () => {
    it('should create a user', async () => {
      const userData = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        company_id: 'test-company-id'
      };

      const result = await userService.create(userData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should get a user by id', async () => {
      const userId = 'test-user-id';
      
      const result = await userService.get(userId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should update a user', async () => {
      const userId = 'test-user-id';
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name'
      };

      const result = await userService.update(userId, updateData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should delete a user', async () => {
      const userId = 'test-user-id';

      const result = await userService.delete(userId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should list users', async () => {
      const filters = { company_id: 'test-company-id' };

      const result = await userService.list(filters);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user id', async () => {
      const result = await userService.get('invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const result = await userService.create({} as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate user data on create', async () => {
      const invalidData = {
        email: 'invalid-email',
        first_name: '',
        last_name: ''
      };

      const result = await userService.create(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('should validate user data on update', async () => {
      const userId = 'test-user-id';
      const invalidData = {
        email: 'invalid-email'
      };

      const result = await userService.update(userId, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
}); 
