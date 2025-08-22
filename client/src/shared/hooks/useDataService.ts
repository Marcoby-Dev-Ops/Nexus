import { selectData, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import type { ServiceResponse } from '@/core/types/service';

export interface DataServiceConfig {
  table: string;
  select?: string;
  filters?: Record<string, any>;
}

export const useDataService = () => {
  const fetchData = async (config: DataServiceConfig): Promise<ServiceResponse<any[]>> => {
    try {
      const { data, error } = await selectData(config.table, config.select, config.filters);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Database operation failed' };
    }
  };

  const fetchOne = async (table: string, id: string): Promise<ServiceResponse<any>> => {
    try {
      const { data, error } = await selectOne(table, id);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Database operation failed' };
    }
  };

  const createData = async (table: string, data: any): Promise<ServiceResponse<any>> => {
    try {
      const { data: result, error } = await insertOne(table, data);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: 'Database operation failed' };
    }
  };

  const updateData = async (table: string, id: string, data: any): Promise<ServiceResponse<any>> => {
    try {
      const { data: result, error } = await updateOne(table, id, data);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: 'Database operation failed' };
    }
  };

  const deleteData = async (table: string, id: string): Promise<ServiceResponse<boolean>> => {
    try {
      const { data, error } = await deleteOne(table, id);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: 'Database operation failed' };
    }
  };

  return {
    fetchData,
    fetchOne,
    createData,
    updateData,
    deleteData,
  };
};
