/**
 * Google Drive Service for Document RAG Integration
 * Syncs documents from Google Drive for intelligent retrieval and business context
 */

import { logger } from '@/lib/security/logger';

interface GoogleDriveConfig {
  accessToken: string;
  refreshToken: string;
  folderId?: string; // Optional: specific folder to sync
}

interface GoogleWorkspaceCredentials {
  access_token: string;
  refresh_token: string;
  drive_folder_id?: string;
}

function isGoogleWorkspaceCredentials(credentials: any): credentials is GoogleWorkspaceCredentials {
  return credentials && typeof credentials.access_token === 'string' && typeof credentials.refresh_token === 'string';
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  size?: number;
  parents?: string[];
  createdBy?: { displayName: string };
  lastModifyingUser?: { displayName: string };
  permissions?: { role: string; id: string; type: string }[];
}

interface DriveDocument {
  id: string;
  name: string;
  mimeType: string;
  content: string;
  modifiedTime: string;
  webViewLink: string;
  size: number;
  parents: string[];
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    permissions: string[];
    folder: string;
  };
}

export class GoogleDriveService {
  private config: GoogleDriveConfig | null = null;
  private baseUrl = 'https://www.googleapis.com/drive/v3';
  private isAuthenticated = false;

  /**
   * Initialize service with stored credentials
   */
  async initialize(): Promise<boolean> {
    try {
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      if (!user) return false;

      const { data: integration } = await import('@/lib/supabase').then(m => m.supabase
        .from('user_integrations')
        .select('credentials')
        .eq('user_id', user.id)
        .eq('integration_name', 'google-workspace')
        .single()
      );

      if (integration?.credentials && isGoogleWorkspaceCredentials(integration.credentials)) {
        this.config = {
          accessToken: integration.credentials.access_token,
          refreshToken: integration.credentials.refresh_token,
          folderId: integration.credentials.drive_folder_id
        };
        this.isAuthenticated = true;
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize Google Drive service');
      return false;
    }
  }

  /**
   * Sync documents from Google Drive for RAG processing
   */
  async syncDocumentsForRAG(): Promise<{
    processed: number;
    errors: string[];
    newDocuments: DriveDocument[];
  }> {
    if (!this.isAuthenticated || !this.config) {
      throw new Error('Google Drive service not authenticated');
    }

    const results = {
      processed: 0,
      errors: [] as string[],
      newDocuments: [] as DriveDocument[]
    };

    try {
      // Get all documents from Drive
      const documents = await this.getAllDocuments();
      
      for (const doc of documents) {
        try {
          // Check if document already processed
          const isNew = await this.isNewDocument(doc.id, doc.modifiedTime);
          
          if (isNew) {
            // Download and process document content
            const content = await this.extractDocumentContent(doc);
            
            if (content.trim()) {
              // Prepare document for RAG storage
              const ragDocument = {
                ...doc,
                content,
                source: 'google-drive',
                processedAt: new Date().toISOString()
              };

              // Store in RAG system
              await this.storeDocumentForRAG(ragDocument);
              results.newDocuments.push(ragDocument);
              results.processed++;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.errors.push(`Failed to process ${doc.name}: ${errorMessage}`);
        }
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Document sync failed: ${errorMessage}`);
    }
  }

  /**
   * Get all documents from Google Drive
   */
  private async getAllDocuments(): Promise<Omit<DriveDocument, 'content'>[]> {
    const documents: Omit<DriveDocument, 'content'>[] = [];
    let pageToken = '';

    do {
      const query = this.buildDriveQuery();
      const url = `${this.baseUrl}/files?${new URLSearchParams({
        q: query,
        fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,size,parents,createdBy,lastModifyingUser,permissions)',
        pageSize: '100',
        ...(pageToken && { pageToken })
      })}`;

      const response = await this.authenticatedRequest(url);
      const data = await response.json();

      if (data.files) {
        documents.push(...data.files.map((file: DriveFile) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          modifiedTime: file.modifiedTime,
          webViewLink: file.webViewLink,
          size: file.size || 0,
          parents: file.parents || [],
          metadata: {
            createdBy: file.createdBy?.displayName || 'Unknown',
            lastModifiedBy: file.lastModifyingUser?.displayName || 'Unknown',
            permissions: file.permissions?.map(p => p.role) || [],
            folder: this.getFolderName(file.parents?.[0])
          }
        })));
      }

      pageToken = data.nextPageToken || '';
    } while (pageToken);

    return documents;
  }

  /**
   * Build query for Drive API to get relevant documents
   */
  private buildDriveQuery(): string {
    const supportedTypes = [
      'application/vnd.google-apps.document',      // Google Docs
      'application/vnd.google-apps.spreadsheet',  // Google Sheets
      'application/vnd.google-apps.presentation', // Google Slides
      'application/pdf',                          // PDF files
      'text/plain',                              // Text files
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word docs
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // Excel
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PowerPoint
    ];

    let query = `trashed=false and (${supportedTypes.map(type => `mimeType='${type}'`).join(' or ')})`;
    
    // Limit to specific folder if configured
    if (this.config?.folderId) {
      query += ` and '${this.config.folderId}' in parents`;
    }

    return query;
  }

  /**
   * Extract text content from various document types
   */
  private async extractDocumentContent(doc: Omit<DriveDocument, 'content'>): Promise<string> {
    try {
      let content = '';

      if (doc.mimeType === 'application/vnd.google-apps.document') {
        // Google Docs - export as plain text
        const url = `${this.baseUrl}/files/${doc.id}/export?mimeType=text/plain`;
        const response = await this.authenticatedRequest(url);
        content = await response.text();
      } 
      else if (doc.mimeType === 'application/vnd.google-apps.spreadsheet') {
        // Google Sheets - export as CSV and convert to readable format
        const url = `${this.baseUrl}/files/${doc.id}/export?mimeType=text/csv`;
        const response = await this.authenticatedRequest(url);
        const csv = await response.text();
        content = this.formatSpreadsheetContent(csv, doc.name);
      }
      else if (doc.mimeType === 'application/vnd.google-apps.presentation') {
        // Google Slides - export as plain text
        const url = `${this.baseUrl}/files/${doc.id}/export?mimeType=text/plain`;
        const response = await this.authenticatedRequest(url);
        content = await response.text();
      }
      else if (doc.mimeType === 'application/pdf' || doc.mimeType === 'text/plain') {
        // Direct download for PDFs and text files
        const url = `${this.baseUrl}/files/${doc.id}?alt=media`;
        const response = await this.authenticatedRequest(url);
        
        if (doc.mimeType === 'text/plain') {
          content = await response.text();
        } else {
          // For PDFs, we'd need a PDF parser - for now, just store metadata
          content = `PDF Document: ${doc.name}\nSize: ${doc.size} bytes\nLocation: ${doc.webViewLink}`;
        }
      }

      // Add document metadata to content for better context
      const documentContext = this.buildDocumentContext(doc);
      return `${documentContext}\n\n${content}`.trim();

    } catch (error) {
      logger.error({ err: error, docName: doc.name }, `Failed to extract content from ${doc.name}`);
      return `Document: ${doc.name}\nType: ${doc.mimeType}\nLocation: ${doc.webViewLink}\nNote: Content extraction failed`;
    }
  }

  /**
   * Format spreadsheet content for better RAG retrieval
   */
  private formatSpreadsheetContent(csv: string, fileName: string): string {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '';

    const headers = lines[0].split(',');
    const dataRows = lines.slice(1, Math.min(21, lines.length)); // Limit to first 20 rows

    let formatted = `Spreadsheet: ${fileName}\n\n`;
    
    if (headers.length > 1) {
      formatted += `Columns: ${headers.join(', ')}\n\n`;
      
      // Add sample data
      formatted += 'Sample Data:\n';
      dataRows.forEach((row, index) => {
        const values = row.split(',');
        if (values.length === headers.length) {
          formatted += `Row ${index + 1}: `;
          headers.forEach((header, i) => {
            if (values[i]?.trim()) {
              formatted += `${header}=${values[i].trim()} `;
            }
          });
          formatted += '\n';
        }
      });
    } else {
      formatted += csv;
    }

    return formatted;
  }

  /**
   * Build document context for RAG
   */
  private buildDocumentContext(doc: Omit<DriveDocument, 'content'>): string {
    return `[DOCUMENT METADATA]
Title: ${doc.name}
Type: ${this.getDocumentTypeLabel(doc.mimeType)}
Last Modified: ${new Date(doc.modifiedTime).toLocaleDateString()}
Modified By: ${doc.metadata.lastModifiedBy}
Folder: ${doc.metadata.folder}
Link: ${doc.webViewLink}
[END METADATA]`;
  }

  /**
   * Get human-readable document type label
   */
  private getDocumentTypeLabel(mimeType: string): string {
    const typeMap: { [key: string]: string } = {
      'application/vnd.google-apps.document': 'Google Doc',
      'application/vnd.google-apps.spreadsheet': 'Google Sheet',
      'application/vnd.google-apps.presentation': 'Google Slides',
      'application/pdf': 'PDF Document',
      'text/plain': 'Text File',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation'
    };
    return typeMap[mimeType] || 'Document';
  }

  /**
   * Check if document is new or updated since last sync
   */
  private async isNewDocument(documentId: string, modifiedTime: string): Promise<boolean> {
    try {
      const { data } = await import('@/lib/supabase').then(m => m.supabase
        .from('ai_vector_documents')
        .select('metadata')
        .eq('document_id', `google-drive-${documentId}`)
        .single()
      );

      if (!data) return true; // New document

      const lastSync = data.metadata?.lastModified;
      return !lastSync || new Date(modifiedTime) > new Date(lastSync);
    } catch {
      return true; // Assume new if check fails
    }
  }

  /**
   * Store document in RAG system
   */
  private async storeDocumentForRAG(document: DriveDocument): Promise<void> {
    try {
      // Call the embed document edge function
      const response = await fetch('/api/ai/embed-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: `google-drive-${document.id}`,
          content: document.content,
          metadata: {
            source: 'google-drive',
            fileName: document.name,
            fileType: document.mimeType,
            lastModified: document.modifiedTime,
            webViewLink: document.webViewLink,
            folder: document.metadata.folder,
            size: document.size,
            processedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to store document: ${response.statusText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error, documentId: document.id }, 'Error storing document for RAG in Supabase');
      throw new Error(`Failed to store document ${document.id} for RAG: ${errorMessage}`);
    }
  }

  /**
   * Get folder name by ID
   */
  private getFolderName(folderId?: string): string {
    if (!folderId) return 'Root';
    // In a real implementation, you'd cache folder names
    // For now, just return the ID
    return folderId;
  }

  /**
   * Make authenticated request to Google Drive API
   */
  private async authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.config?.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      await this.refreshAccessToken();
      
      // Retry request with new token
      return fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    }

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.config?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.VITE_GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.config.accessToken = data.access_token;

      // Update stored credentials
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      if (user) {
        await import('@/lib/supabase').then(m => m.supabase
          .from('user_integrations')
          .update({
            credentials: {
              ...this.config,
              access_token: data.access_token
            }
          })
          .eq('user_id', user.id)
          .eq('integration_name', 'google-workspace')
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, 'Google Drive token refresh failed');
      this.isAuthenticated = false;
      throw new Error(`Token refresh failed: ${errorMessage}`);
    }
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<{
    lastSync: string | null;
    totalDocuments: number;
    pendingSync: number;
    errors: string[];
  }> {
    try {
      // Get last sync time from user_integrations
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      if (!user) throw new Error('User not authenticated');

      const { data: integration } = await import('@/lib/supabase').then(m => m.supabase
        .from('user_integrations')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('integration_name', 'google-workspace')
        .single()
      );

      const lastSync = integration?.metadata?.lastDriveSync || null;

      // Count documents in RAG system
      const { count: totalDocuments } = await import('@/lib/supabase').then(m => m.supabase
        .from('ai_vector_documents')
        .select('*', { count: 'exact', head: true })
        .like('document_id', 'google-drive-%')
      );

      return {
        lastSync,
        totalDocuments: totalDocuments || 0,
        pendingSync: 0, // Would need to calculate based on Drive API
        errors: []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, 'Failed to get sync status');
      return {
        lastSync: null,
        totalDocuments: 0,
        pendingSync: 0,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Trigger a manual sync process
   */
  async triggerSync(): Promise<{
    success: boolean;
    processed: number;
    errors: string[];
    newDocuments: DriveDocument[];
  }> {
    try {
      const syncResult = await this.syncDocumentsForRAG();
      
      // Update last sync time
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      if (user) {
        await import('@/lib/supabase').then(m => m.supabase
          .from('user_integrations')
          .update({
            metadata: {
              lastDriveSync: new Date().toISOString(),
              lastSyncResult: {
                processed: syncResult.processed,
                errors: syncResult.errors.length
              }
            }
          })
          .eq('user_id', user.id)
          .eq('integration_name', 'google-workspace')
        );
      }
      return {
        success: true,
        ...syncResult,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, 'Manual sync trigger failed');
      return {
        success: false,
        processed: 0,
        errors: [errorMessage],
        newDocuments: []
      };
    }
  }
}

export const googleDriveService = new GoogleDriveService(); 