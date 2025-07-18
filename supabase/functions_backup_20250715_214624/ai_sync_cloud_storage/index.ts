import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

interface SyncRequest {
  providers?: string[]; // 'google-drive', 'onedrive', or both
  userId: string;
}

interface CloudDocument {
  id: string;
  name: string;
  content: string;
  source: 'google-drive' | 'onedrive';
  mimeType: string;
  lastModified: string;
  webUrl: string;
  metadata: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const { providers = ['google-drive', 'onedrive'], userId }: SyncRequest = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    const results = {
      totalProcessed: 0,
      totalErrors: [] as string[],
      googleDrive: null as any,
      oneDrive: null as any
    };

    // Get user's connected integrations
    const { data: integrations } = await supabaseClient
      .from('user_integrations')
      .select('integration_name, credentials')
      .eq('user_id', userId)
      .in('integration_name', ['google-workspace', 'microsoft-365']);

    const connectedProviders = new Map(
      integrations?.map(i => [i.integration_name, i.credentials]) || []
    );

    // Sync Google Drive if requested and connected
    if (providers.includes('google-drive') && connectedProviders.has('google-workspace')) {
      try {
        const credentials = connectedProviders.get('google-workspace');
        const syncResult = await syncGoogleDrive(credentials, supabaseClient, openaiApiKey);
        results.googleDrive = syncResult;
        results.totalProcessed += syncResult.processed;
        results.totalErrors.push(...syncResult.errors);
      } catch (error) {
        const errorMsg = `Google Drive sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.totalErrors.push(errorMsg);
        results.googleDrive = { success: false, processed: 0, errors: [errorMsg] };
      }
    }

    // Sync OneDrive if requested and connected
    if (providers.includes('onedrive') && connectedProviders.has('microsoft-365')) {
      try {
        const credentials = connectedProviders.get('microsoft-365');
        const syncResult = await syncOneDrive(credentials, supabaseClient, openaiApiKey);
        results.oneDrive = syncResult;
        results.totalProcessed += syncResult.processed;
        results.totalErrors.push(...syncResult.errors);
      } catch (error) {
        const errorMsg = `OneDrive sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.totalErrors.push(errorMsg);
        results.oneDrive = { success: false, processed: 0, errors: [errorMsg] };
      }
    }

    // Update sync metadata
    for (const integration of integrations || []) {
      await supabaseClient
        .from('user_integrations')
        .update({
          metadata: {
            ...integration.metadata,
            lastCloudStorageSync: new Date().toISOString(),
            lastSyncResults: {
              processed: results.totalProcessed,
              errors: results.totalErrors.length
            }
          }
        })
        .eq('user_id', userId)
        .eq('integration_name', integration.integration_name);
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cloud storage sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

/**
 * Sync documents from Google Drive
 */
async function syncGoogleDrive(credentials: any, supabaseClient: any, openaiApiKey: string) {
  const result = {
    success: false,
    processed: 0,
    errors: [] as string[],
    newDocuments: [] as CloudDocument[]
  };

  try {
    // Get documents from Google Drive API
    const documents = await fetchGoogleDriveDocuments(credentials);
    
    for (const doc of documents) {
      try {
        // Check if document is new or updated
        const isNew = await isDocumentNew(supabaseClient, `google-drive-${doc.id}`, doc.lastModified);
        
        if (isNew) {
          const content = await extractGoogleDriveContent(doc, credentials);
          
          if (content.trim()) {
            // Store document in RAG system
            await storeDocumentInRAG(supabaseClient, openaiApiKey, {
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
 * Sync documents from OneDrive (simplified implementation)
 */
async function syncOneDrive(credentials: any, supabaseClient: any, openaiApiKey: string) {
  // Placeholder implementation - would be similar to Google Drive
  return {
    success: true,
    processed: 0,
    errors: [] as string[],
    newDocuments: [] as CloudDocument[]
  };
}

/**
 * Fetch documents from Google Drive API
 */
async function fetchGoogleDriveDocuments(credentials: any): Promise<Omit<CloudDocument, 'content' | 'source'>[]> {
  const documents = [];
  const supportedTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
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
async function extractGoogleDriveContent(doc: Omit<CloudDocument, 'content' | 'source'>, credentials: any): Promise<string> {
  try {
    let content = '';
    
    if (doc.mimeType === 'application/vnd.google-apps.document') {
      // Google Docs - export as plain text
      const url = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=text/plain`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${credentials.access_token}` }
      });
      content = await response.text();
    } else if (doc.mimeType === 'application/vnd.google-apps.spreadsheet') {
      // Google Sheets - export as CSV and format
      const url = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=text/csv`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${credentials.access_token}` }
      });
      const csv = await response.text();
      content = formatSpreadsheetContent(csv, doc.name);
    } else if (doc.mimeType === 'text/plain') {
      // Plain text files
      const url = `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${credentials.access_token}` }
      });
      content = await response.text();
    } else {
      // Other file types - just metadata
      content = `Document: ${doc.name}\nType: ${doc.mimeType}\nLocation: ${doc.webUrl}`;
    }

    // Add document metadata context
    const documentContext = `[DOCUMENT METADATA]
Title: ${doc.name}
Last Modified: ${new Date(doc.lastModified).toLocaleDateString()}
Link: ${doc.webUrl}
[END METADATA]`;

    return documentContext + '\n\n' + content;
  } catch (error) {
    console.error(`Failed to extract content from ${doc.name}:`, error);
    return `Document: ${doc.name}\nContent extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Format spreadsheet content for better RAG retrieval
 */
function formatSpreadsheetContent(csv: string, fileName: string): string {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length === 0) return '';

  const headers = lines[0].split(',');
  const dataRows = lines.slice(1, Math.min(11, lines.length)); // First 10 rows

  let formatted = `Spreadsheet: ${fileName}\n\n`;
  formatted += `Columns: ${headers.join(', ')}\n\n`;
  formatted += 'Sample Data:\n';
  
  dataRows.forEach((row, index) => {
    const values = row.split(',');
    if (values.length === headers.length && values.some(v => v.trim())) {
      formatted += `Row ${index + 1}: `;
      headers.forEach((header, i) => {
        if (values[i]?.trim()) {
          formatted += `${header}=${values[i].trim()} `;
        }
      });
      formatted += '\n';
    }
  });

  return formatted;
}

/**
 * Check if document is new or updated since last sync
 */
async function isDocumentNew(supabaseClient: any, documentId: string, lastModified: string): Promise<boolean> {
  try {
    const { data } = await supabaseClient
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
 * Store document in RAG system with vector embedding
 */
async function storeDocumentInRAG(supabaseClient: any, openaiApiKey: string, document: CloudDocument): Promise<void> {
  try {
    // Generate embedding for the document content
    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: document.content
      }),
    });

    if (!embedRes.ok) {
      throw new Error(`Embedding API error: ${embedRes.status}`);
    }

    const embedJson = await embedRes.json();
    const embedding = embedJson.data?.[0]?.embedding;

    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }

    // Store in vector documents table
    const { error } = await supabaseClient
      .from('ai_vector_documents')
      .upsert({
        document_id: `${document.source}-${document.id}`,
        content: document.content,
        content_embedding: embedding,
        metadata: {
          source: document.source,
          fileName: document.name,
          fileType: document.mimeType,
          lastModified: document.lastModified,
          webUrl: document.webUrl,
          processedAt: new Date().toISOString(),
          ...document.metadata
        }
      });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

  } catch (error) {
    console.error(`Failed to store document ${document.name} in RAG:`, error);
    throw error;
  }
} 