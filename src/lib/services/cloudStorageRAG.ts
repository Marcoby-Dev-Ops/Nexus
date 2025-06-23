/**
 * Cloud Storage RAG Service
 * Orchestrates document syncing from Google Drive and OneDrive for intelligent retrieval
 */

import { supabase } from '@/lib/supabase';

interface CloudDocument {
  id: string;
  name: string;
  content: string;
  source: 'google-drive' | 'onedrive';
  mimeType: string;
  lastModified: string;
  webUrl: string;
  metadata: {
    folder: string;
    size: number;
    createdBy: string;
    lastModifiedBy: string;
    [key: string]: any;
  };
}

interface SyncResult {
  success: boolean;
  processed: number;
  errors: string[];
  newDocuments: CloudDocument[];
}

export class CloudStorageRAGService {
  /**
   * Sync documents from all connected cloud storage providers
   */
  async syncAllProviders(): Promise<{
    googleDrive: SyncResult | null;
    oneDrive: SyncResult | null;
    totalProcessed: number;
    totalErrors: string[];
  }> {
    const results = {
      googleDrive: null as SyncResult | null,
      oneDrive: null as SyncResult | null,
      totalProcessed: 0,
      totalErrors: [] as string[]
    };

    // Check which providers are connected
    const connectedProviders = await this.getConnectedProviders();

    // Sync Google Drive if connected
    if (connectedProviders.includes('google-workspace')) {
      try {
        results.googleDrive = await this.syncGoogleDrive();
        results.totalProcessed += results.googleDrive.processed;
        results.totalErrors.push(...results.googleDrive.errors);
      } catch (error) {
        results.totalErrors.push(`Google Drive sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Sync OneDrive if connected
    if (connectedProviders.includes('microsoft-365')) {
      try {
        results.oneDrive = await this.syncOneDrive();
        results.totalProcessed += results.oneDrive.processed;
        results.totalErrors.push(...results.oneDrive.errors);
      } catch (error) {
        results.totalErrors.push(`OneDrive sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Get list of connected cloud storage providers
   */
  private async getConnectedProviders(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: integrations } = await supabase
        .from('user_integrations')
        .select('integration_name')
        .eq('user_id', user.id)
        .in('integration_name', ['google-workspace', 'microsoft-365']);

      return integrations?.map(i => i.integration_name) || [];
    } catch (error) {
      console.error('Failed to get connected providers:', error);
      return [];
    }
  }

  /**
   * Sync documents from Google Drive
   */
  private async syncGoogleDrive(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      processed: 0,
      errors: [],
      newDocuments: []
    };

    try {
      // Get Google Drive credentials
      const credentials = await this.getProviderCredentials('google-workspace');
      if (!credentials) {
        throw new Error('Google Drive not connected');
      }

      // Get documents from Google Drive API
      const documents = await this.fetchGoogleDriveDocuments(credentials);
      
      // Process each document
      for (const doc of documents) {
        try {
          const isNew = await this.isDocumentNew(`google-drive-${doc.id}`, doc.lastModified);
          
          if (isNew) {
            const content = await this.extractGoogleDriveContent(doc, credentials);
            
            if (content.trim()) {
              await this.storeDocumentInRAG({
                ...doc,
                content,
                source: 'google-drive'
              });
              
              result.newDocuments.push({ ...doc, content, source: 'google-drive' });
              result.processed++;
            }
          }
        } catch (error) {
          result.errors.push(`Failed to process ${doc.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = true;
      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Get provider credentials from database
   */
  private async getProviderCredentials(provider: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: integration } = await supabase
        .from('user_integrations')
        .select('credentials')
        .eq('user_id', user.id)
        .eq('integration_name', provider)
        .single();

      return integration?.credentials || null;
    } catch (error) {
      console.error(`Failed to get ${provider} credentials:`, error);
      return null;
    }
  }

  /**
   * Fetch documents from Google Drive API
   */
  private async fetchGoogleDriveDocuments(credentials: any): Promise<Omit<CloudDocument, 'content' | 'source'>[]> {
    const documents = [];
    const supportedTypes = [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation',
      'application/pdf',
      'text/plain'
    ];

    const query = `trashed=false and (${supportedTypes.map(type => `mimeType='${type}'`).join(' or ')})`;
    
    const url = `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
      q: query,
      fields: 'files(id,name,mimeType,modifiedTime,webViewLink,size)',
      pageSize: '50'
    })}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.files) {
      documents.push(...data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        lastModified: file.modifiedTime,
        webUrl: file.webViewLink,
        metadata: {
          folder: 'Drive',
          size: file.size || 0,
          createdBy: 'Unknown',
          lastModifiedBy: 'Unknown'
        }
      })));
    }

    return documents;
  }

  /**
   * Extract content from Google Drive document
   */
  private async extractGoogleDriveContent(doc: Omit<CloudDocument, 'content' | 'source'>, credentials: any): Promise<string> {
    try {
      let content = '';
      
      if (doc.mimeType === 'application/vnd.google-apps.document') {
        // Google Docs - export as plain text
        const url = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=text/plain`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${credentials.access_token}` }
        });
        content = await response.text();
      } else {
        // Other file types - just metadata
        content = `Document: ${doc.name}\nType: ${doc.mimeType}\nLocation: ${doc.webUrl}`;
      }

      return this.buildDocumentContext(doc) + '\n\n' + content;
    } catch (error) {
      console.error(`Failed to extract content from ${doc.name}:`, error);
      return `Document: ${doc.name}\nContent extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Build document context for RAG
   */
  private buildDocumentContext(doc: Omit<CloudDocument, 'content' | 'source'>): string {
    return `[DOCUMENT METADATA]
Title: ${doc.name}
Last Modified: ${new Date(doc.lastModified).toLocaleDateString()}
Link: ${doc.webUrl}
[END METADATA]`;
  }

  /**
   * Check if document is new or updated since last sync
   */
  private async isDocumentNew(documentId: string, lastModified: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('ai_vector_documents')
        .select('metadata')
        .eq('document_id', documentId)
        .single();

      if (!data) return true; // New document

      const lastSync = data.metadata?.lastModified;
      return !lastSync || new Date(lastModified) > new Date(lastSync);
    } catch {
      return true; // Assume new if check fails
    }
  }

  /**
   * Store document in RAG system
   */
  private async storeDocumentInRAG(document: CloudDocument): Promise<void> {
    try {
      // Call the embed document edge function
      const response = await fetch('/api/ai/embed-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: `${document.source}-${document.id}`,
          content: document.content,
          metadata: {
            source: document.source,
            fileName: document.name,
            fileType: document.mimeType,
            lastModified: document.lastModified,
            webUrl: document.webUrl,
            processedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to store document: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to store document ${document.name} in RAG:`, error);
      throw error;
    }
  }

  /**
   * Sync documents from OneDrive (placeholder)
   */
  private async syncOneDrive(): Promise<SyncResult> {
    // Implementation similar to Google Drive
    return {
      success: true,
      processed: 0,
      errors: [],
      newDocuments: []
    };
  }
}

export const cloudStorageRAGService = new CloudStorageRAGService(); 