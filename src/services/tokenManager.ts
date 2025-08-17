import { selectData as select, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface Token {
  id: string;
  user_id: string;
  integration_type: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export class TokenManager {
  static async getToken(userId: string, integrationType: string): Promise<Token | null> {
    try {
      const { data, error } = await selectOne('user_tokens', { 
        user_id: userId, 
        integration_type: integrationType 
      });
      if (error) {
        logger.error('Failed to fetch token', { error });
        return null;
      }
      return data as Token | null;
    } catch (err) {
      logger.error('Error fetching token', { err });
      return null;
    }
  }

  static async saveToken(tokenData: Omit<Token, 'id' | 'created_at' | 'updated_at'>): Promise<Token | null> {
    try {
      const { data, error } = await insertOne('user_tokens', tokenData);
      if (error) {
        logger.error('Failed to save token', { error });
        return null;
      }
      return data as Token | null;
    } catch (err) {
      logger.error('Error saving token', { err });
      return null;
    }
  }

  static async updateToken(userId: string, integrationType: string, updates: Partial<Token>): Promise<Token | null> {
    try {
      const { data, error } = await updateOne('user_tokens', { 
        user_id: userId, 
        integration_type: integrationType 
      }, updates);
      if (error) {
        logger.error('Failed to update token', { error });
        return null;
      }
      return data as Token | null;
    } catch (err) {
      logger.error('Error updating token', { err });
      return null;
    }
  }

  static async deleteToken(userId: string, integrationType: string): Promise<boolean> {
    try {
      const { error } = await deleteOne('user_tokens', { 
        user_id: userId, 
        integration_type: integrationType 
      });
      if (error) {
        logger.error('Failed to delete token', { error });
        return false;
      }
      return true;
    } catch (err) {
      logger.error('Error deleting token', { err });
      return false;
    }
  }

  static async getAllTokens(userId: string): Promise<Token[]> {
    try {
      const { data, error } = await select('user_tokens', '*', { user_id: userId });
      if (error) {
        logger.error('Failed to fetch all tokens', { error });
        return [];
      }
      return (data as Token[]) || [];
    } catch (err) {
      logger.error('Error fetching all tokens', { err });
      return [];
    }
  }

  static async refreshToken(userId: string, integrationType: string): Promise<Token | null> {
    try {
      const { data, error } = await updateOne('user_tokens', { 
        user_id: userId, 
        integration_type: integrationType 
      }, {
        updated_at: new Date().toISOString()
      });
      if (error) {
        logger.error('Failed to refresh token', { error });
        return null;
      }
      return data as Token | null;
    } catch (err) {
      logger.error('Error refreshing token', { err });
      return null;
    }
  }
} 
