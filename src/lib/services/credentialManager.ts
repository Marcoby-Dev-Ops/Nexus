import { encrypt, decrypt } from '../security';
import { supabase } from '@/lib/core/supabase';

interface CredentialMetadata {
  id: string;
  integrationId: string;
  userId: string;
  type: 'oauth' | 'api_key' | 'basic';
  createdAt: Date;
  lastUsed: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
  scopes?: string[];
}

interface StoredCredential {
  metadata: CredentialMetadata;
  encryptedData: string;
}

export class CredentialManager {
  private static instance: CredentialManager;
  private readonly CREDENTIALS_TABLE = 'secure_integrations';
  private readonly AUDIT_TABLE = 'security_audit_log';

  private constructor() {}

  public static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  /**
   * Store new credentials securely
   */
  async storeCredentials(
    integrationId: string,
    credentials: any,
    metadata: Partial<CredentialMetadata>
  ): Promise<string> {
    try {
      // Encrypt credentials
      const encryptedData = await encrypt(JSON.stringify(credentials));

      // Create metadata
      const credentialMetadata: CredentialMetadata = {
        id: crypto.randomUUID(),
        integrationId,
        userId: (await supabase.auth.getUser()).data.user?.id || '',
        type: metadata.type || 'api_key',
        createdAt: new Date(),
        lastUsed: new Date(),
        status: 'active',
        ...metadata
      };

      // Store in database
      const { error } = await supabase
        .from(this.CREDENTIALS_TABLE)
        .insert({
          id: credentialMetadata.id,
          user_id: credentialMetadata.userId,
          integration_id: integrationId,
          metadata: credentialMetadata,
          encrypted_data: encryptedData,
          is_active: true
        });

      if (error) throw error;

      // Log security event
      await this.logCredentialEvent('credential_stored', credentialMetadata);

      return credentialMetadata.id;
    } catch (error) {
      console.error('Failed to store credentials:', error);
      throw new Error('Credential storage failed');
    }
  }

  /**
   * Retrieve credentials securely
   */
  async getCredentials(credentialId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from(this.CREDENTIALS_TABLE)
        .select('*')
        .eq('id', credentialId)
        .single();

      if (error || !data) throw error || new Error('Credential not found');

      // Verify access permissions
      const user = await supabase.auth.getUser();
      if (data.user_id !== user.data.user?.id) {
        throw new Error('Unauthorized access');
      }

      // Decrypt credentials
      const decryptedData = await decrypt(data.encrypted_data);
      const credentials = JSON.parse(decryptedData);

      // Update last used timestamp
      await this.updateLastUsed(credentialId);

      // Log access
      await this.logCredentialEvent('credential_accessed', data.metadata);

      return credentials;
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      throw new Error('Credential retrieval failed');
    }
  }

  /**
   * Revoke credentials
   */
  async revokeCredentials(credentialId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.CREDENTIALS_TABLE)
        .update({ is_active: false, status: 'revoked' })
        .eq('id', credentialId);

      if (error) throw error;

      // Log revocation
      await this.logCredentialEvent('credential_revoked', { id: credentialId });
    } catch (error) {
      console.error('Failed to revoke credentials:', error);
      throw new Error('Credential revocation failed');
    }
  }

  /**
   * Rotate credentials
   */
  async rotateCredentials(credentialId: string, newCredentials: any): Promise<string> {
    try {
      // Store new credentials
      const newCredentialId = await this.storeCredentials(
        credentialId,
        newCredentials,
        { type: 'api_key' }
      );

      // Revoke old credentials
      await this.revokeCredentials(credentialId);

      // Log rotation
      await this.logCredentialEvent('credential_rotated', {
        oldId: credentialId,
        newId: newCredentialId
      });

      return newCredentialId;
    } catch (error) {
      console.error('Failed to rotate credentials:', error);
      throw new Error('Credential rotation failed');
    }
  }

  /**
   * List all credentials for an integration
   */
  async listCredentials(integrationId: string): Promise<CredentialMetadata[]> {
    try {
      const { data, error } = await supabase
        .from(this.CREDENTIALS_TABLE)
        .select('metadata')
        .eq('integration_id', integrationId)
        .eq('is_active', true);

      if (error) throw error;

      return data.map((item: { metadata: CredentialMetadata }) => item.metadata);
    } catch (error) {
      console.error('Failed to list credentials:', error);
      throw new Error('Failed to list credentials');
    }
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(credentialId: string): Promise<void> {
    try {
      await supabase
        .from(this.CREDENTIALS_TABLE)
        .update({ last_used: new Date().toISOString() })
        .eq('id', credentialId);
    } catch (error) {
      console.error('Failed to update last used timestamp:', error);
    }
  }

  /**
   * Log credential-related events
   */
  private async logCredentialEvent(
    eventType: string,
    details: any
  ): Promise<void> {
    try {
      await supabase
        .from(this.AUDIT_TABLE)
        .insert({
          event_type: eventType,
          event_details: details,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Failed to log credential event:', error);
    }
  }

  /**
   * Get client IP address
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }
}

// Export singleton instance
export const credentialManager = CredentialManager.getInstance(); 