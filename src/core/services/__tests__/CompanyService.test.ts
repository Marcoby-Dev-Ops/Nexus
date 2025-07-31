import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompanyService, CompanySchema, DepartmentSchema, companyService } from '../CompanyService';
import { serviceFactory } from '../ServiceFactory';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-company-id',
              name: 'Test Company',
              domain: 'test.com',
              industry: 'Technology',
              size: 'Medium',
              owner_id: 'test-owner-id',
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
                id: 'new-company-id',
                name: 'New Company',
                domain: 'new.com',
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
                  id: 'test-company-id',
                  name: 'Updated Company',
                  domain: 'updated.com',
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
        })),
        order: vi.fn(() => ({
          data: [
            {
              id: 'dept-1',
              company_id: 'test-company-id',
              name: 'Engineering',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ],
          error: null
        }))
      }
    }))
  }
}));

describe('CompanyService', () => {
  let companyService: CompanyService;

  beforeEach(() => {
    companyService = new CompanyService();
    serviceFactory.clear();
    serviceFactory.register('company', companyService);
  });

  describe('CRUD Operations', () => {
    it('should get a company by ID', async () => {
      const result = await companyService.get('test-company-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('test-company-id');
      expect(result.data?.name).toBe('Test Company');
    });

    it('should create a new company', async () => {
      const newCompany = {
        name: 'New Company',
        domain: 'new.com',
        industry: 'Technology'
      };

      const result = await companyService.create(newCompany);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('New Company');
    });

    it('should update a company', async () => {
      const updates = {
        name: 'Updated Company',
        domain: 'updated.com'
      };

      const result = await companyService.update('test-company-id', updates);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Updated Company');
    });

    it('should delete a company', async () => {
      const result = await companyService.delete('test-company-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should list companies with filters', async () => {
      const result = await companyService.list({ industry: 'Technology' });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should validate company schema', () => {
      const validCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        domain: 'test.com',
        industry: 'Technology',
        size: 'Medium',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const result = CompanySchema.safeParse(validCompany);
      expect(result.success).toBe(true);
    });

    it('should reject invalid company data', () => {
      const invalidCompany = {
        id: 'invalid-uuid',
        name: '', // Empty name
        email: 'invalid-email'
      };

      const result = CompanySchema.safeParse(invalidCompany);
      expect(result.success).toBe(false);
    });

    it('should validate department schema', () => {
      const validDepartment = {
        id: 'dept-1',
        company_id: 'test-company-id',
        name: 'Engineering',
        description: 'Software Engineering Department',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const result = DepartmentSchema.safeParse(validDepartment);
      expect(result.success).toBe(true);
    });
  });

  describe('Service Factory Integration', () => {
    it('should register and retrieve company service', () => {
      expect(serviceFactory.has('company')).toBe(true);
      
      const retrievedService = serviceFactory.get('company');
      expect(retrievedService).toBeInstanceOf(CompanyService);
    });

    it('should list registered services', () => {
      const services = serviceFactory.list();
      expect(services).toContain('company');
    });
  });

  describe('Advanced Operations', () => {
    it('should get company by domain', async () => {
      const result = await companyService.getCompanyByDomain('test.com');
      
      expect(result.success).toBe(true);
      expect(result.data?.domain).toBe('test.com');
    });

    it('should get companies by industry', async () => {
      const result = await companyService.getCompaniesByIndustry('Technology');
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should search companies', async () => {
      const result = await companyService.searchCompanies('test', { industry: 'Technology' });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get company departments', async () => {
      const result = await companyService.getCompanyDepartments('test-company-id');
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should create department', async () => {
      const newDepartment = {
        company_id: 'test-company-id',
        name: 'Marketing',
        description: 'Marketing Department'
      };

      const result = await companyService.createDepartment(newDepartment);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Marketing');
    });

    it('should update department', async () => {
      const updates = {
        name: 'Updated Department',
        description: 'Updated description'
      };

      const result = await companyService.updateDepartment('dept-1', updates);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Department');
    });

    it('should delete department', async () => {
      const result = await companyService.deleteDepartment('dept-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should get company roles', async () => {
      const result = await companyService.getCompanyRoles('test-company-id');
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should create company role', async () => {
      const newRole = {
        company_id: 'test-company-id',
        name: 'Manager',
        description: 'Department Manager',
        permissions: ['read', 'write'],
        is_system_role: false
      };

      const result = await companyService.createCompanyRole(newRole);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Manager');
    });

    it('should get company analytics', async () => {
      const result = await companyService.getCompanyAnalytics('test-company-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should get company health', async () => {
      const result = await companyService.getCompanyHealth('test-company-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should transfer ownership', async () => {
      const result = await companyService.transferOwnership(
        'test-company-id',
        'new-owner-id',
        'current-owner-id'
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should get companies by owner', async () => {
      const result = await companyService.getCompaniesByOwner('test-owner-id');
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get company statistics', async () => {
      const result = await companyService.getCompanyStats('test-company-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('userCount');
      expect(result.data).toHaveProperty('departmentCount');
      expect(result.data).toHaveProperty('roleCount');
      expect(result.data).toHaveProperty('integrationCount');
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

      const result = await companyService.get('invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Complex Operations', () => {
    it('should get company with full details', async () => {
      const result = await companyService.getCompanyWithDetails('test-company-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('company');
      expect(result.data).toHaveProperty('owner');
      expect(result.data).toHaveProperty('departments');
      expect(result.data).toHaveProperty('analytics');
      expect(result.data).toHaveProperty('health');
    });
  });
}); 