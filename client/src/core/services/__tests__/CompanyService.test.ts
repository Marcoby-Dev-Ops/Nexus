import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { companyService } from '../CompanyService';

describe('CompanyService', () => {
  beforeEach(() => {
    // Reset any service state if needed
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('CRUD Operations', () => {
    it('should create a company', async () => {
      const companyData = {
        name: 'Test Company',
        domain: 'testcompany.com',
        industry: 'Technology',
        size: 'small',
        user_id: 'test-user-id'
      };

      const result = await companyService.create(companyData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should get a company by id', async () => {
      const companyId = 'test-company-id';
      
      const result = await companyService.get(companyId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should update a company', async () => {
      const companyId = 'test-company-id';
      const updateData = {
        name: 'Updated Company Name',
        industry: 'Finance'
      };

      const result = await companyService.update(companyId, updateData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should delete a company', async () => {
      const companyId = 'test-company-id';

      const result = await companyService.delete(companyId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should list companies', async () => {
      const filters = { user_id: 'test-user-id' };

      const result = await companyService.list(filters);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('Specialized Operations', () => {
    it('should get company by domain', async () => {
      const domain = 'testcompany.com';
      
      const result = await companyService.getCompanyByDomain(domain);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should search companies', async () => {
      const query = 'test';
      
      const result = await companyService.search(query);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should bulk update companies', async () => {
      const updates = [
        { id: 'company-1', name: 'Updated Company 1' },
        { id: 'company-2', industry: 'Updated Industry' }
      ];
      
      const result = await companyService.bulkUpdate(updates);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid company id', async () => {
      const result = await companyService.get('invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const result = await companyService.create({} as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate company data on create', async () => {
      const invalidData = {
        name: '',
        domain: 'invalid-domain',
        industry: ''
      };

      const result = await companyService.create(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('should validate company data on update', async () => {
      const companyId = 'test-company-id';
      const invalidData = {
        name: '',
        domain: 'invalid-domain'
      };

      const result = await companyService.update(companyId, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
}); 
