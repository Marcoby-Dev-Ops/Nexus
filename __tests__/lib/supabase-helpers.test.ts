/**
 * @jest-environment node
 */

// Mock the logger
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the supabase client
const mockSupabaseClient = {
  from: jest.fn()
};

// Mock the entire supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

// Import the functions after mocking
import { select, selectOne, selectWithOptions, insertOne, updateOne, deleteOne } from '../../src/lib/supabase';

describe('Database Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('select', () => {
    it('should select all columns with no filter', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await select('test_table');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_table');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should select specific columns', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await select('test_table', 'id, name');

      expect(mockQuery.select).toHaveBeenCalledWith('id, name');
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should apply filters', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await select('test_table', '*', { status: 'active', role: 'admin' });

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQuery.eq).toHaveBeenCalledWith('role', 'admin');
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed');
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await select('test_table');

      expect(result).toEqual({ data: null, error: mockError });
    });

    it('should handle unexpected errors', async () => {
      const mockError = new Error('Unexpected error');
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockRejectedValue(mockError)
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await select('test_table');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('selectOne', () => {
    it('should select single record by id', async () => {
      const mockData = { id: '123', name: 'Test' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await selectOne('test_table', '123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_table');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123');
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should select single record by custom id column', async () => {
      const mockData = { user_id: '123', name: 'Test' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await selectOne('test_table', '123', 'user_id');

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', '123');
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should handle not found errors', async () => {
      const mockError = { message: 'No rows returned' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await selectOne('test_table', '999');

      expect(result).toEqual({ data: null, error: mockError });
    });

    it('should handle unexpected errors', async () => {
      const mockError = new Error('Database error');
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(mockError)
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await selectOne('test_table', '123');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('selectWithOptions', () => {
    it('should select with all options', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const options = {
        filter: { status: 'active' },
        orderBy: { column: 'created_at', ascending: true },
        limit: 10,
        columns: 'id, name, status'
      };

      const result = await selectWithOptions('test_table', options);

      expect(mockQuery.select).toHaveBeenCalledWith('id, name, status');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should select with minimal options', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await selectWithOptions('test_table', {});

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should handle orderBy with default ascending false', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await selectWithOptions('test_table', {
        orderBy: { column: 'created_at' }
      });

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockRejectedValue(mockError)
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await selectWithOptions('test_table', {});

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('insertOne', () => {
    it('should insert single record', async () => {
      const mockData = { id: '123', name: 'Test', email: 'test@example.com' };
      const insertData = { name: 'Test', email: 'test@example.com' };
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await insertOne('test_table', insertData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_table');
      expect(mockQuery.insert).toHaveBeenCalledWith(insertData);
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should handle insert errors', async () => {
      const mockError = { message: 'Duplicate key violation' };
      const insertData = { email: 'existing@example.com' };
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await insertOne('test_table', insertData);

      expect(result).toEqual({ data: null, error: mockError });
    });

    it('should handle unexpected errors', async () => {
      const mockError = new Error('Database error');
      const insertData = { name: 'Test' };
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(mockError)
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await insertOne('test_table', insertData);

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('updateOne', () => {
    it('should update single record by id', async () => {
      const mockData = { id: '123', name: 'Updated Test', email: 'test@example.com' };
      const updateData = { name: 'Updated Test' };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await updateOne('test_table', '123', updateData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_table');
      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should update single record by custom id column', async () => {
      const mockData = { user_id: '123', name: 'Updated Test' };
      const updateData = { name: 'Updated Test' };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await updateOne('test_table', '123', updateData, 'user_id');

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', '123');
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should handle update errors', async () => {
      const mockError = { message: 'Record not found' };
      const updateData = { name: 'Updated Test' };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await updateOne('test_table', '999', updateData);

      expect(result).toEqual({ data: null, error: mockError });
    });

    it('should handle unexpected errors', async () => {
      const mockError = new Error('Database error');
      const updateData = { name: 'Updated Test' };
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(mockError)
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await updateOne('test_table', '123', updateData);

      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('deleteOne', () => {
    it('should delete single record by id', async () => {
      const mockData = { id: '123' };
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await deleteOne('test_table', '123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_table');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123');
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should delete single record by custom id column', async () => {
      const mockData = { user_id: '123' };
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await deleteOne('test_table', '123', 'user_id');

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', '123');
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should handle delete errors', async () => {
      const mockError = { message: 'Record not found' };
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await deleteOne('test_table', '999');

      expect(result).toEqual({ data: null, error: mockError });
    });

    it('should handle unexpected errors', async () => {
      const mockError = new Error('Database error');
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockRejectedValue(mockError)
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await deleteOne('test_table', '123');

      expect(result).toEqual({ data: null, error: mockError });
    });
  });
}); 