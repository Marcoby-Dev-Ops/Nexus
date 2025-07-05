/**
 * OneDrive/SharePoint Service for Document RAG Integration
 * Syncs documents from OneDrive and SharePoint for intelligent retrieval and business context
 */

import { logger } from '@/lib/security/logger';

interface OneDriveConfig {
  accessToken: string;
  refreshToken: string;
  tenantId?: string;
  siteId?: string; // For SharePoint integration
  driveId?: string; // Specific drive to sync
}

interface Microsoft365Credentials {
  access_token: string;
  refresh_token: string;
  tenant_id?: string;
  sharepoint_site_id?: string;
  drive_id?: string;
}

function isMicrosoft365Credentials(credentials: any): credentials is Microsoft365Credentials {
  return credentials && typeof credentials.access_token === 'string' && typeof credentials.refresh_token === 'string';
}

interface OneDriveItem {
  id: string;
  name: string;
  file?: {
    mimeType: string;
  };
  folder?: object;
  lastModifiedDateTime: string;
  webUrl: string;
  size: number;
  parentReference?: {
    path: string;
  };
  createdBy?: {
    user?: {
      displayName: string;
    };
  };
  lastModifiedBy?: {
    user?: {
      displayName: string;
    };
  };
}

interface OneDriveDocument {
  id: string;
  name: string;
  mimeType: string;
  content: string;
  lastModifiedDateTime: string;
  webUrl: string;
  size: number;
  parentPath: string;
  metadata: {
    createdBy: string;
    lastModifiedBy: string;
    folder: string;
    sharePoint?: {
      siteName: string;
      libraryName: string;
    };
  };
}

export class OneDriveService {
  private config: OneDriveConfig | null = null;
  private baseUrl = 'https://graph.microsoft.com/v1.0';
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
        .eq('integration_name', 'microsoft-365')
        .single()
      );

      if (integration?.credentials && isMicrosoft365Credentials(integration.credentials)) {
        this.config = {
          accessToken: integration.credentials.access_token,
          refreshToken: integration.credentials.refresh_token,
          tenantId: integration.credentials.tenant_id,
          siteId: integration.credentials.sharepoint_site_id,
          driveId: integration.credentials.drive_id
        };
        this.isAuthenticated = true;
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize OneDrive service');
      return false;
    }
  }

  /**
   * Sync documents from OneDrive/SharePoint for RAG processing
   */
  async syncDocumentsForRAG(): Promise<{
    processed: number;
    errors: string[];
    newDocuments: OneDriveDocument[];
  }> {
    if (!this.isAuthenticated || !this.config) {
      throw new Error('OneDrive service not authenticated');
    }

    const results = {
      processed: 0,
      errors: [] as string[],
      newDocuments: [] as OneDriveDocument[]
    };

    try {
      // Get documents from OneDrive
      const oneDriveDocs = await this.getOneDriveDocuments();
      
      // Get documents from SharePoint (if configured)
      const sharePointDocs = this.config.siteId ? 
        await this.getSharePointDocuments() : [];

      const allDocuments = [...oneDriveDocs, ...sharePointDocs];
      
      for (const doc of allDocuments) {
        try {
          // Check if document already processed
          const isNew = await this.isNewDocument(doc.id, doc.lastModifiedDateTime);
          
          if (isNew) {
            // Download and process document content
            const content = await this.extractDocumentContent(doc);
            
            if (content.trim()) {
              // Prepare document for RAG storage
              const ragDocument = {
                ...doc,
                content,
                source: 'onedrive',
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
   * Get documents from OneDrive
   */
  private async getOneDriveDocuments(): Promise<Omit<OneDriveDocument, 'content'>[]> {
    const documents: Omit<OneDriveDocument, 'content'>[] = [];
    
    try {
      const driveEndpoint = this.config?.driveId ? 
        `/drives/${this.config.driveId}` : 
        '/me/drive';

      const url = `${this.baseUrl}${driveEndpoint}/root/search(q='${this.buildSearchQuery()}')`;
      
      const response = await this.authenticatedRequest(url);
      const data = await response.json();

      if (data.value) {
        documents.push(...data.value
          .filter((item: OneDriveItem) => !item.folder && this.isSupportedFileType(item.name))
          .map((item: OneDriveItem) => this.mapOneDriveItem(item, 'OneDrive'))
        );
      }

      return documents;
    } catch (error) {
      logger.error({ err: error }, 'Failed to get OneDrive documents');
      return [];
    }
  }

  /**
   * Get documents from SharePoint
   */
  private async getSharePointDocuments(): Promise<Omit<OneDriveDocument, 'content'>[]> {
    if (!this.config?.siteId) return [];

    const documents: Omit<OneDriveDocument, 'content'>[] = [];
    
    try {
      // Get document libraries
      const librariesUrl = `${this.baseUrl}/sites/${this.config.siteId}/drives`;
      const librariesResponse = await this.authenticatedRequest(librariesUrl);
      const librariesData = await librariesResponse.json();

      for (const library of librariesData.value || []) {
        try {
          const searchUrl = `${this.baseUrl}/drives/${library.id}/root/search(q='${this.buildSearchQuery()}')`;
          const response = await this.authenticatedRequest(searchUrl);
          const data = await response.json();

          if (data.value) {
            documents.push(...data.value
              .filter((item: OneDriveItem) => !item.folder && this.isSupportedFileType(item.name))
              .map((item: OneDriveItem) => this.mapOneDriveItem(item, 'SharePoint', {
                siteName: library.name,
                libraryName: library.name
              }))
            );
          }
        } catch (error) {
          logger.error({ err: error, libraryName: library.name }, `Failed to get documents from library ${library.name}`);
        }
      }

      return documents;
    } catch (error) {
      logger.error({ err: error }, 'Failed to get SharePoint documents');
      return [];
    }
  }

  /**
   * Build search query for supported file types
   */
  private buildSearchQuery(): string {
    const extensions = [
      'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 
      'pdf', 'txt', 'md', 'csv'
    ];
    return extensions.map(ext => `*.${ext}`).join(' OR ');
  }

  /**
   * Check if file type is supported for content extraction
   */
  private isSupportedFileType(fileName: string): boolean {
    const supportedExtensions = [
      '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt',
      '.pdf', '.txt', '.md', '.csv'
    ];
    return supportedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  /**
   * Map OneDrive/SharePoint item to our document format
   */
  private mapOneDriveItem(
    item: OneDriveItem, 
    source: 'OneDrive' | 'SharePoint',
    sharePointInfo?: { siteName: string; libraryName: string }
  ): Omit<OneDriveDocument, 'content'> {
    return {
      id: item.id,
      name: item.name,
      mimeType: item.file?.mimeType || 'application/octet-stream',
      lastModifiedDateTime: item.lastModifiedDateTime,
      webUrl: item.webUrl,
      size: item.size || 0,
      parentPath: item.parentReference?.path || '',
      metadata: {
        createdBy: item.createdBy?.user?.displayName || 'Unknown',
        lastModifiedBy: item.lastModifiedBy?.user?.displayName || 'Unknown',
        folder: this.extractFolderName(item.parentReference?.path),
        ...(sharePointInfo && { sharePoint: sharePointInfo })
      }
    };
  }

  /**
   * Extract document content based on file type
   */
  private async extractDocumentContent(doc: Omit<OneDriveDocument, 'content'>): Promise<string> {
    try {
      let content = '';
      const fileExtension = doc.name.toLowerCase().split('.').pop();

      if (['docx', 'xlsx', 'pptx'].includes(fileExtension || '')) {
        // Office documents - use Microsoft Graph API to get content
        content = await this.extractOfficeContent(doc);
      } else if (['txt', 'md', 'csv'].includes(fileExtension || '')) {
        // Plain text files
        content = await this.extractTextContent(doc);
      } else if (fileExtension === 'pdf') {
        // PDF files - metadata only for now
        content = `PDF Document: ${doc.name}\nSize: ${doc.size} bytes\nLocation: ${doc.webUrl}`;
      }

      // Add document metadata to content for better context
      const documentContext = this.buildDocumentContext(doc);
      return `${documentContext}\n\n${content}`.trim();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error, docName: doc.name }, `Failed to extract content from ${doc.name}`);
      return `Document: ${doc.name}\nType: ${this.getDocumentTypeLabel(doc.name)}\nLocation: ${doc.webUrl}\nNote: Content extraction failed: ${errorMessage}`;
    }
  }

  /**
   * Extract content from Office documents using Microsoft Graph
   */
  private async extractOfficeContent(doc: Omit<OneDriveDocument, 'content'>): Promise<string> {
    try {
      // Use Microsoft Graph to get document content
      const driveEndpoint = this.config?.driveId ? 
        `/drives/${this.config.driveId}` : 
        '/me/drive';

      const url = `${this.baseUrl}${driveEndpoint}/items/${doc.id}/content`;
      const response = await this.authenticatedRequest(url);

      if (doc.name.toLowerCase().endsWith('.xlsx')) {
        // For Excel files, get workbook info
        const workbookUrl = `${this.baseUrl}${driveEndpoint}/items/${doc.id}/workbook/worksheets`;
        const workbookResponse = await this.authenticatedRequest(workbookUrl);
        const workbookData = await workbookResponse.json();
        
        let content = `Spreadsheet: ${doc.name}\n\n`;
        if (workbookData.value) {
          content += `Worksheets: ${workbookData.value.map((ws: any) => ws.name).join(', ')}\n\n`;
          
          // Get sample data from first worksheet
          if (workbookData.value[0]) {
            const rangeUrl = `${this.baseUrl}${driveEndpoint}/items/${doc.id}/workbook/worksheets('${workbookData.value[0].name}')/range(address='A1:J10')`;
            try {
              const rangeResponse = await this.authenticatedRequest(rangeUrl);
              const rangeData = await rangeResponse.json();
              
              if (rangeData.values) {
                content += 'Sample Data:\n';
                rangeData.values.forEach((row: any, index: number) => {
                  if (row.some((cell: any) => cell !== null && cell !== '')) {
                    content += `Row ${index + 1}: ${row.filter((cell: any) => cell !== null && cell !== '').join(' | ')}\n`;
                  }
                });
              }
            } catch (error) {
              console.error('Failed to get range data:', error);
            }
          }
        }
        return content;
      } else {
        // For Word and PowerPoint, try to get text content
        // This is a simplified approach - in production, you'd want more sophisticated extraction
        const blob = await response.blob();
        return `Document: ${doc.name}\nSize: ${blob.size} bytes\nContent extraction available via Microsoft Graph API`;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error, docName: doc.name }, `Failed to extract Office content from ${doc.name}`);
      return `Office Document: ${doc.name}\nContent extraction failed: ${errorMessage}`;
    }
  }

  /**
   * Extract content from text files
   */
  private async extractTextContent(doc: Omit<OneDriveDocument, 'content'>): Promise<string> {
    try {
      const response = await this.authenticatedRequest(doc.webUrl);
      return await response.text();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error, docName: doc.name }, `Failed to extract text content from ${doc.name}`);
      return `Text file: ${doc.name}\nContent extraction failed: ${errorMessage}`;
    }
  }

  /**
   * Build document context for RAG
   */
  private buildDocumentContext(doc: Omit<OneDriveDocument, 'content'>): string {
    let context = `[DOCUMENT METADATA]
Title: ${doc.name}
Type: ${this.getDocumentTypeLabel(doc.name)}
Last Modified: ${new Date(doc.lastModifiedDateTime).toLocaleDateString()}
Modified By: ${doc.metadata.lastModifiedBy}
Folder: ${doc.metadata.folder}
Link: ${doc.webUrl}`;

    if (doc.metadata.sharePoint) {
      context += `\nSharePoint Site: ${doc.metadata.sharePoint.siteName}
Library: ${doc.metadata.sharePoint.libraryName}`;
    }

    context += '\n[END METADATA]';
    return context;
  }

  /**
   * Get human-readable document type label
   */
  private getDocumentTypeLabel(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    const typeMap: Record<string, string> = {
      'docx': 'Word Document',
      'doc': 'Word Document (Legacy)',
      'xlsx': 'Excel Spreadsheet',
      'xls': 'Excel Spreadsheet (Legacy)',
      'pptx': 'PowerPoint Presentation',
      'ppt': 'PowerPoint Presentation (Legacy)',
      'pdf': 'PDF Document',
      'txt': 'Text File',
      'md': 'Markdown File',
      'csv': 'CSV Spreadsheet'
    };
    return typeMap[extension || ''] || 'Document';
  }

  /**
   * Extract folder name from path
   */
  private extractFolderName(path?: string): string {
    if (!path) return 'Root';
    const parts = path.split('/');
    return parts[parts.length - 1] || 'Root';
  }

  /**
   * Check if document is new or updated since last sync
   */
  private async isNewDocument(documentId: string, lastModifiedDateTime: string): Promise<boolean> {
    try {
      const { data } = await import('@/lib/supabase').then(m => m.supabase
        .from('ai_vector_documents')
        .select('metadata')
        .eq('document_id', `onedrive-${documentId}`)
        .single()
      );

      if (!data) return true; // New document

      const lastSync = data.metadata?.lastModified;
      return !lastSync || new Date(lastModifiedDateTime) > new Date(lastSync);
    } catch {
      return true; // Assume new if check fails
    }
  }

  /**
   * Store document in RAG system
   */
  private async storeDocumentForRAG(document: OneDriveDocument): Promise<void> {
    try {
      // Call the embed document edge function
      const response = await fetch('/api/ai/embed-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: `onedrive-${document.id}`,
          content: document.content,
          metadata: {
            source: 'onedrive',
            fileName: document.name,
            fileType: document.mimeType,
            lastModified: document.lastModifiedDateTime,
            webUrl: document.webUrl,
            folder: document.metadata.folder,
            size: document.size,
            sharePoint: document.metadata.sharePoint,
            processedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to store document: ${response.statusText} - ${errorBody}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error, documentId: document.id }, 'Error storing document for RAG in Supabase');
      throw new Error(`Failed to store document ${document.id} for RAG: ${errorMessage}`);
    }
  }

  /**
   * Make authenticated request to Microsoft Graph API
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
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
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
      const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.VITE_MS_TEAMS_CLIENT_ID || '',
          client_secret: process.env.MS_TEAMS_CLIENT_SECRET || '',
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/.default'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to refresh token: ${errorData?.error_description || res.statusText}`);
      }
      const newTokens = await res.json();
      
      if (this.config) {
        this.config.accessToken = newTokens.access_token;
      
        // Also update refresh token if a new one is provided (best practice)
        if (newTokens.refresh_token) {
          this.config.refreshToken = newTokens.refresh_token;
        }
      }
      
      this.isAuthenticated = true;

      // Update stored credentials
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      if (user && this.config) {
        await import('@/lib/supabase').then(m => m.supabase
          .from('user_integrations')
          .update({
            credentials: {
              ...this.config,
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token || this.config.refreshToken,
            }
          })
          .eq('user_id', user.id)
          .eq('integration_name', 'microsoft-365')
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, 'OneDrive token refresh failed');
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
        .eq('integration_name', 'microsoft-365')
        .single()
      );

      const lastSync = integration?.metadata?.lastOneDriveSync || null;

      // Count documents in RAG system
      const { count: totalDocuments } = await import('@/lib/supabase').then(m => m.supabase
        .from('ai_vector_documents')
        .select('*', { count: 'exact', head: true })
        .like('document_id', 'onedrive-%')
      );

      return {
        lastSync,
        totalDocuments: totalDocuments || 0,
        pendingSync: 0, // Would need to calculate based on Graph API
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
    newDocuments: OneDriveDocument[];
  }> {
    try {
      if (!this.isAuthenticated) {
        await this.initialize();
      }
      const syncResult = await this.syncDocumentsForRAG();
      return { success: true, ...syncResult };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, 'Manual sync trigger failed');
      return { success: false, processed: 0, errors: [errorMessage], newDocuments: [] };
    }
  }
}

export const oneDriveService = new OneDriveService(); 