import { OAuth2Client } from 'google-auth-library';
import { Client } from '@microsoft/microsoft-graph-client';

export type StorageProvider = 'm365' | 'gdrive';
export type DocumentDomain = 'HR' | 'Ops' | 'Sales' | 'Finance' | 'IT' | 'Legal' | 'Compliance';
export type DocumentType = 'policy' | 'process' | 'runbook' | 'template' | 'record' | 'certificate';

export interface StoragePointer {
  provider: StorageProvider;
  driveId: string;
  fileId: string;
  webUrl: string;
  path?: string;
  version?: string;
  aclHash: string; // Hash of groups/roles for ACL trimming
}

export interface KnowledgeDocumentMeta {
  pointer: StoragePointer;
  title: string;
  mime: string;
  domain: DocumentDomain[];
  docType: DocumentType;
  lastModified: string; // ISO
  taxonomy: string[]; // ISO27001, SOC2, Onboarding, etc.
  businessEntity?: string; // For entity registration, compliance docs
  renewalDate?: string; // ISO
  complianceStatus?: 'active' | 'expired' | 'pending_renewal';
}

export interface IndexChunk {
  id: string;
  fileId: string;
  headingPath?: string; // "Employee Handbook > PTO"
  pageFrom?: number;
  pageTo?: number;
  text: string;
  embedding: number[]; // Stored in CUSTOMER index only
  meta: KnowledgeDocumentMeta;
}

export interface StorageConnection {
  id: string;
  provider: StorageProvider;
  tenantId?: string; // For M365
  folderIds: string[]; // Selected folders for monitoring
  templateFolderId?: string; // For document templates
  oauthTokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  permissions: {
    read: boolean;
    write: boolean;
    search: boolean;
  };
  createdAt: string;
  lastUsed: string;
}

export interface ZeroRetentionConfig {
  retentionPolicy: 'zero_content';
  dataResidency: 'customer_controlled';
  auditLogging: 'metadata_only';
  ephemeralCache: '10_minutes_max';
  aclTrimming: boolean;
  contentRedaction?: boolean;
}

export class ZeroRetentionStorageService {
  private connections: Map<string, StorageConnection> = new Map();
  private config: ZeroRetentionConfig;

  constructor(config: ZeroRetentionConfig) {
    this.config = config;
  }

  // OAuth Connection Management
  async initiateOAuthConnection(provider: StorageProvider, redirectUri: string): Promise<string> {
    const state = this.generateSecureState();
    
    if (provider === 'gdrive') {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/drive.file', // Least privilege - only files user selects
          'https://www.googleapis.com/auth/drive.metadata.readonly'
        ],
        state
      });
      
      return authUrl;
    } else if (provider === 'm365') {
      // Microsoft Graph OAuth with Sites.Selected scope
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${process.env.MICROSOFT_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent('Sites.Selected Files.ReadWrite.All')}&` +
        `state=${state}`;
      
      return authUrl;
    }
    
    throw new Error(`Unsupported provider: ${provider}`);
  }

  async completeOAuthConnection(
    provider: StorageProvider, 
    code: string, 
    redirectUri: string,
    selectedFolders: string[]
  ): Promise<StorageConnection> {
    let tokens: any;
    
    if (provider === 'gdrive') {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );
      
      const { tokens: oauthTokens } = await oauth2Client.getToken(code);
      tokens = oauthTokens;
    } else if (provider === 'm365') {
      // Exchange code for Microsoft Graph tokens
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      
      tokens = await tokenResponse.json();
    }
    
    const connection: StorageConnection = {
      id: this.generateConnectionId(),
      provider,
      folderIds: selectedFolders,
      oauthTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000)
      },
      permissions: {
        read: true,
        write: true,
        search: true
      },
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    this.connections.set(connection.id, connection);
    return connection;
  }

  // Zero-Retention Document Search
  async searchDocuments(
    connectionId: string, 
    query: string, 
    options: { maxDocs?: number; domains?: DocumentDomain[] }
  ): Promise<KnowledgeDocumentMeta[]> {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error('Connection not found');
    
    // Use provider's native search - no content stored in Nexus
    if (connection.provider === 'gdrive') {
      return this.searchGoogleDrive(connection, query, options);
    } else if (connection.provider === 'm365') {
      return this.searchMicrosoftGraph(connection, query, options);
    }
    
    throw new Error(`Unsupported provider: ${connection.provider}`);
  }

  private async searchGoogleDrive(
    connection: StorageConnection, 
    query: string, 
    options: { maxDocs?: number; domains?: DocumentDomain[] }
  ): Promise<KnowledgeDocumentMeta[]> {
    // Use Google Drive API search - content never touches Nexus servers
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,modifiedTime,parents)`,
      {
        headers: {
          'Authorization': `Bearer ${connection.oauthTokens.accessToken}`
        }
      }
    );
    
    const data = await response.json();
    
    // Convert to KnowledgeDocumentMeta - only metadata, no content
    return data.files.map((file: any) => ({
      pointer: {
        provider: 'gdrive',
        driveId: 'primary',
        fileId: file.id,
        webUrl: file.webViewLink,
        aclHash: this.generateAclHash(connection.id, file.id)
      },
      title: file.name,
      mime: file.mimeType,
      domain: this.classifyDocumentDomain(file.name, file.mimeType),
      docType: this.classifyDocumentType(file.name, file.mimeType),
      lastModified: file.modifiedTime,
      taxonomy: this.extractTaxonomy(file.name),
      complianceStatus: this.determineComplianceStatus(file.modifiedTime)
    }));
  }

  private async searchMicrosoftGraph(
    connection: StorageConnection, 
    query: string, 
    options: { maxDocs?: number; domains?: DocumentDomain[] }
  ): Promise<KnowledgeDocumentMeta[]> {
    // Use Microsoft Graph search - content never touches Nexus servers
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, connection.oauthTokens.accessToken);
      }
    });
    
    const searchResults = await graphClient
      .api('/search/query')
      .post({
        requests: [{
          entityTypes: ['driveItem'],
          query: { queryString: query },
          from: 0,
          size: options.maxDocs || 10
        }]
      });
    
    // Convert to KnowledgeDocumentMeta - only metadata, no content
    return searchResults.value[0].hitsContainers[0].hits.map((hit: any) => ({
      pointer: {
        provider: 'm365',
        driveId: hit.resource.parentReference.driveId,
        fileId: hit.resource.id,
        webUrl: hit.resource.webUrl,
        aclHash: this.generateAclHash(connection.id, hit.resource.id)
      },
      title: hit.resource.name,
      mime: hit.resource.file?.mimeType || 'application/octet-stream',
      domain: this.classifyDocumentDomain(hit.resource.name, hit.resource.file?.mimeType),
      docType: this.classifyDocumentType(hit.resource.name, hit.resource.file?.mimeType),
      lastModified: hit.resource.lastModifiedDateTime,
      taxonomy: this.extractTaxonomy(hit.resource.name),
      complianceStatus: this.determineComplianceStatus(hit.resource.lastModifiedDateTime)
    }));
  }

  // Zero-Retention Document Generation
  async generateDocument(
    connectionId: string,
    template: { fileId: string; format: 'docx' | 'gdoc' | 'pdf' },
    data: Record<string, any>,
    destination: { folderId: string; fileName: string }
  ): Promise<StoragePointer> {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error('Connection not found');
    
    // Fetch template in memory (no disk storage)
    const templateBytes = await this.fetchTemplateBytes(connection, template.fileId);
    
    // Merge template with data in memory
    const mergedBytes = await this.mergeTemplateInMemory(templateBytes, template.format, data);
    
    // Stream upload directly to customer storage (no Nexus storage)
    const uploadResult = await this.streamUploadToCustomerStorage(
      connection, 
      destination.folderId, 
      destination.fileName, 
      mergedBytes
    );
    
    // Log only metadata for audit
    this.logDocumentGeneration({
      connectionId,
      templateId: template.fileId,
      destination: uploadResult,
      dataKeys: Object.keys(data), // Only keys, not values
      timestamp: new Date().toISOString()
    });
    
    return uploadResult;
  }

  private async fetchTemplateBytes(connection: StorageConnection, fileId: string): Promise<ArrayBuffer> {
    if (connection.provider === 'gdrive') {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: { 'Authorization': `Bearer ${connection.oauthTokens.accessToken}` }
        }
      );
      return response.arrayBuffer();
    } else if (connection.provider === 'm365') {
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, connection.oauthTokens.accessToken);
        }
      });
      
      const response = await graphClient
        .api(`/me/drive/items/${fileId}/content`)
        .get();
      
      return response.arrayBuffer();
    }
    
    throw new Error(`Unsupported provider: ${connection.provider}`);
  }

  private async mergeTemplateInMemory(
    templateBytes: ArrayBuffer, 
    format: string, 
    data: Record<string, any>
  ): Promise<ArrayBuffer> {
    // In-memory template merging - no disk writes
    if (format === 'docx') {
      // Use DocxTemplater or similar for in-memory DOCX processing
      return this.mergeDocxInMemory(templateBytes, data);
    } else if (format === 'gdoc') {
      // Use Google Docs API for in-memory processing
      return this.mergeGoogleDocInMemory(templateBytes, data);
    } else if (format === 'pdf') {
      // Use HTML template + headless Chrome for PDF generation
      return this.generatePdfInMemory(templateBytes, data);
    }
    
    throw new Error(`Unsupported format: ${format}`);
  }

  private async streamUploadToCustomerStorage(
    connection: StorageConnection,
    folderId: string,
    fileName: string,
    fileBytes: ArrayBuffer
  ): Promise<StoragePointer> {
    if (connection.provider === 'gdrive') {
      return this.uploadToGoogleDrive(connection, folderId, fileName, fileBytes);
    } else if (connection.provider === 'm365') {
      return this.uploadToMicrosoftGraph(connection, folderId, fileName, fileBytes);
    }
    
    throw new Error(`Unsupported provider: ${connection.provider}`);
  }

  private async uploadToGoogleDrive(
    connection: StorageConnection,
    folderId: string,
    fileName: string,
    fileBytes: ArrayBuffer
  ): Promise<StoragePointer> {
    // Use Google Drive resumable upload - stream directly to customer storage
    const metadata = {
      name: fileName,
      parents: [folderId]
    };
    
    // Create resumable upload session
    const sessionResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.oauthTokens.accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'application/octet-stream',
          'X-Upload-Content-Length': fileBytes.byteLength.toString()
        },
        body: JSON.stringify(metadata)
      }
    );
    
    const sessionUrl = sessionResponse.headers.get('Location');
    if (!sessionUrl) throw new Error('Failed to create upload session');
    
    // Upload file bytes in chunks - no Nexus storage
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    for (let offset = 0; offset < fileBytes.byteLength; offset += chunkSize) {
      const chunk = fileBytes.slice(offset, Math.min(offset + chunkSize, fileBytes.byteLength));
      
      await fetch(sessionUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${offset}-${offset + chunk.byteLength - 1}/${fileBytes.byteLength}`
        },
        body: chunk
      });
    }
    
    // Get the uploaded file info
    const fileResponse = await fetch(sessionUrl, { method: 'PUT' });
    const fileData = await fileResponse.json();
    
    return {
      provider: 'gdrive',
      driveId: 'primary',
      fileId: fileData.id,
      webUrl: fileData.webViewLink,
      aclHash: this.generateAclHash(connection.id, fileData.id)
    };
  }

  private async uploadToMicrosoftGraph(
    connection: StorageConnection,
    folderId: string,
    fileName: string,
    fileBytes: ArrayBuffer
  ): Promise<StoragePointer> {
    // Use Microsoft Graph upload session - stream directly to customer storage
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, connection.oauthTokens.accessToken);
      }
    });
    
    // Create upload session
    const session = await graphClient
      .api(`/me/drive/items/${folderId}:/${fileName}:/createUploadSession`)
      .post({
        item: {
          '@microsoft.graph.conflictBehavior': 'rename'
        }
      });
    
    // Upload file bytes in chunks - no Nexus storage
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    for (let offset = 0; offset < fileBytes.byteLength; offset += chunkSize) {
      const chunk = fileBytes.slice(offset, Math.min(offset + chunkSize, fileBytes.byteLength));
      
      await fetch(session.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${offset}-${offset + chunk.byteLength - 1}/${fileBytes.byteLength}`
        },
        body: chunk
      });
    }
    
    // Get the uploaded file info
    const fileResponse = await graphClient
      .api(`/me/drive/items/${session.id}`)
      .get();
    
    return {
      provider: 'm365',
      driveId: fileResponse.parentReference.driveId,
      fileId: fileResponse.id,
      webUrl: fileResponse.webUrl,
      aclHash: this.generateAclHash(connection.id, fileResponse.id)
    };
  }

  // Compliance Tracking (metadata only)
  async trackComplianceDocument(
    connectionId: string,
    documentMeta: KnowledgeDocumentMeta,
    complianceRules: {
      renewalPeriod?: number; // days
      requiredDomains?: DocumentDomain[];
      taxonomy?: string[];
    }
  ): Promise<void> {
    // Store only compliance metadata, not document content
    const complianceRecord = {
      id: this.generateComplianceId(),
      connectionId,
      documentId: documentMeta.pointer.fileId,
      title: documentMeta.title,
      domain: documentMeta.domain,
      docType: documentMeta.docType,
      lastModified: documentMeta.lastModified,
      renewalDate: this.calculateRenewalDate(documentMeta.lastModified, complianceRules.renewalPeriod),
      complianceStatus: this.determineComplianceStatus(documentMeta.lastModified),
      taxonomy: documentMeta.taxonomy,
      auditTrail: [{
        action: 'tracked',
        timestamp: new Date().toISOString(),
        metadata: 'compliance_tracking_initiated'
      }]
    };
    
    // Store in customer's database or Nexus metadata store (no content)
    await this.storeComplianceMetadata(complianceRecord);
  }

  // Helper methods
  private generateSecureState(): string {
    return crypto.randomUUID();
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAclHash(connectionId: string, fileId: string): string {
    return crypto.createHash('sha256').update(`${connectionId}:${fileId}`).digest('hex');
  }

  private generateComplianceId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private classifyDocumentDomain(fileName: string, mimeType: string): DocumentDomain[] {
    const nameLower = fileName.toLowerCase();
    const domains: DocumentDomain[] = [];
    
    if (nameLower.includes('hr') || nameLower.includes('employee') || nameLower.includes('personnel')) {
      domains.push('HR');
    }
    if (nameLower.includes('legal') || nameLower.includes('compliance') || nameLower.includes('policy')) {
      domains.push('Legal');
    }
    if (nameLower.includes('finance') || nameLower.includes('accounting') || nameLower.includes('budget')) {
      domains.push('Finance');
    }
    if (nameLower.includes('it') || nameLower.includes('technology') || nameLower.includes('system')) {
      domains.push('IT');
    }
    if (nameLower.includes('sales') || nameLower.includes('marketing') || nameLower.includes('customer')) {
      domains.push('Sales');
    }
    if (nameLower.includes('operation') || nameLower.includes('process') || nameLower.includes('workflow')) {
      domains.push('Ops');
    }
    
    return domains.length > 0 ? domains : ['Compliance'];
  }

  private classifyDocumentType(fileName: string, mimeType: string): DocumentType {
    const nameLower = fileName.toLowerCase();
    
    if (nameLower.includes('policy') || nameLower.includes('procedure')) return 'policy';
    if (nameLower.includes('process') || nameLower.includes('workflow')) return 'process';
    if (nameLower.includes('template') || nameLower.includes('form')) return 'template';
    if (nameLower.includes('certificate') || nameLower.includes('license')) return 'certificate';
    if (nameLower.includes('runbook') || nameLower.includes('playbook')) return 'runbook';
    
    return 'record';
  }

  private extractTaxonomy(fileName: string): string[] {
    const nameLower = fileName.toLowerCase();
    const taxonomy: string[] = [];
    
    // Compliance standards
    if (nameLower.includes('iso27001') || nameLower.includes('iso 27001')) taxonomy.push('ISO27001');
    if (nameLower.includes('soc2') || nameLower.includes('soc 2')) taxonomy.push('SOC2');
    if (nameLower.includes('gdpr')) taxonomy.push('GDPR');
    if (nameLower.includes('hipaa')) taxonomy.push('HIPAA');
    
    // Business processes
    if (nameLower.includes('onboarding')) taxonomy.push('Onboarding');
    if (nameLower.includes('offboarding')) taxonomy.push('Offboarding');
    if (nameLower.includes('pto') || nameLower.includes('vacation')) taxonomy.push('PTO');
    if (nameLower.includes('incident')) taxonomy.push('IncidentResponse');
    
    return taxonomy;
  }

  private determineComplianceStatus(lastModified: string): 'active' | 'expired' | 'pending_renewal' {
    const modifiedDate = new Date(lastModified);
    const now = new Date();
    const daysSinceModified = (now.getTime() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceModified > 365) return 'expired';
    if (daysSinceModified > 300) return 'pending_renewal';
    return 'active';
  }

  private calculateRenewalDate(lastModified: string, renewalPeriod?: number): string {
    const modifiedDate = new Date(lastModified);
    const renewalDays = renewalPeriod || 365;
    const renewalDate = new Date(modifiedDate.getTime() + (renewalDays * 24 * 60 * 60 * 1000));
    return renewalDate.toISOString();
  }

  private logDocumentGeneration(logData: {
    connectionId: string;
    templateId: string;
    destination: StoragePointer;
    dataKeys: string[];
    timestamp: string;
  }): void {
    // Log only metadata for audit - no content
    console.log('Document Generation Audit:', {
      ...logData,
      retentionPolicy: this.config.retentionPolicy,
      dataResidency: this.config.dataResidency
    });
  }

  private async storeComplianceMetadata(complianceRecord: any): Promise<void> {
    // Store in customer's database or Nexus metadata store
    // This is metadata only - no document content
    console.log('Storing compliance metadata:', complianceRecord);
  }

  // Placeholder methods for template merging (implement based on your needs)
  private async mergeDocxInMemory(templateBytes: ArrayBuffer, data: Record<string, any>): Promise<ArrayBuffer> {
    // Implement DOCX template merging in memory
    // Use libraries like DocxTemplater, PizZip, etc.
    throw new Error('DOCX merging not implemented');
  }

  private async mergeGoogleDocInMemory(templateBytes: ArrayBuffer, data: Record<string, any>): Promise<ArrayBuffer> {
    // Implement Google Docs template merging in memory
    // Use Google Docs API
    throw new Error('Google Docs merging not implemented');
  }

  private async generatePdfInMemory(templateBytes: ArrayBuffer, data: Record<string, any>): Promise<ArrayBuffer> {
    // Implement PDF generation in memory
    // Use headless Chrome/Playwright
    throw new Error('PDF generation not implemented');
  }
}
