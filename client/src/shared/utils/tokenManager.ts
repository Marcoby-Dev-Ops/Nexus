import { selectData as select, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface Token {
  id: string;
  user_id: string;
  integration_slug: string;
  integration_id?: string;
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: string;
  scope?: string;
  settings?: any;
  status?: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export class TokenManager {
  static async getToken(user_id: string, integrationSlug: string): Promise<Token | null> {
    try {
      const { data, error } = await selectOne('user_integrations', { 
        user_id: user_id, 
        integration_slug: integrationSlug 
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
      const { data, error } = await insertOne('user_integrations', tokenData);
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

  static async updateToken(user_id: string, integrationSlug: string, updates: Partial<Token>): Promise<Token | null> {
    try {
      const { data, error } = await updateOne('user_integrations', { 
        user_id: user_id, 
        integration_slug: integrationSlug 
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

  static async deleteToken(user_id: string, integrationSlug: string): Promise<boolean> {
    try {
      const { error } = await deleteOne('user_integrations', { 
        user_id: user_id, 
        integration_slug: integrationSlug 
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

  static async getAllTokens(user_id: string): Promise<Token[]> {
    try {
      const { data, error } = await select('user_integrations', '*', { user_id: user_id });
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

  static async refreshToken(user_id: string, integrationSlug: string): Promise<Token | null> {
    try {
      const { data, error } = await updateOne('user_integrations', { 
        user_id: user_id, 
        integration_slug: integrationSlug 
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

  static async isTokenExpired(token: Token): Promise<boolean> {
    if (!token.expires_at) {
      return false;
    }
    const expirationDate = new Date(token.expires_at);
    const now = new Date();
    return now >= expirationDate;
  }

  static async getValidToken(user_id: string, integrationSlug: string): Promise<Token | null> {
    const token = await this.getToken(user_id, integrationSlug);
    if (!token) {
      return null;
    }

    if (await this.isTokenExpired(token)) {
      // Token is expired, try to refresh it
      const refreshedToken = await this.refreshToken(user_id, integrationSlug);
      return refreshedToken;
    }

    return token;
  }
}
