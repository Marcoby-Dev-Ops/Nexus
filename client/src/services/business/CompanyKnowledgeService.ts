import { postgres } from '@/lib/postgres';
import { logger } from '@/shared/utils/logger';

export interface CompanyKnowledgeData {
  // Basic Information
  companyName: string;
  legalName: string;
  ein: string;
  domain: string;
  website: string;
  
  // Contact Information
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Business Identity
  industry: string;
  sector: string;
  companySize: string;
  foundedYear: string;
  businessType: string;
  
  // Mission & Vision
  mission: string;
  vision: string;
  motto: string;
  tagline: string;
  
  // Values & Culture
  coreValues: string[];
  cultureDescription: string;
  workStyle: string;
  
  // Brand Identity
  brandDescription: string;
  targetAudience: string;
  uniqueValueProposition: string;
  competitiveAdvantages: string;
  
  // Business Model
  revenueModel: string;
  pricingStrategy: string;
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  
  // Market Information
  targetMarket: string;
  marketSize: string;
  competitors: string;
  marketPosition: string;
  
  // Goals & Objectives
  shortTermGoals: string;
  longTermGoals: string;
  keyMetrics: string;
  
  // Additional Context
  challenges: string;
  opportunities: string;
  strengths: string;
  weaknesses: string;
}

export interface CompanyKnowledgeVector {
  id: string;
  company_id: string;
  content: string;
  content_type: string;
  embedding: number[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// CKB Document Intelligence Interfaces
export interface CKBDocument {
  id: string;
  company_id: string;
  title: string;
  content: string;
  content_type: 'pdf' | 'docx' | 'txt' | 'xlsx' | 'csv' | 'pptx';
  source: 'onedrive' | 'gdrive' | 'upload';
  source_id: string;
  source_url: string;
  embedding: number[];
  metadata: {
    author?: string;
    created_date?: string;
    modified_date?: string;
    file_size?: number;
    page_count?: number;
    tags?: string[];
    department?: string;
    category?: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface CKBSearchResult {
  document: CKBDocument;
  score: number;
  highlights: string[];
  context: string;
}

export interface CKBSearchQuery {
  query: string;
  filters?: {
    content_type?: string[];
    department?: string[];
    tags?: string[];
    date_range?: {
      from: string;
      to: string;
    };
  };
  limit?: number;
  offset?: number;
}

export interface CKBQAResponse {
  answer: string;
  sources: CKBDocument[];
  confidence: number;
  reasoning: string;
}

class CompanyKnowledgeService {
  private async generateEmbedding(text: string, tenantId: string = 'default-tenant'): Promise<number[]> {
    try {
      // Call the embedding service to generate vector
      const response = await fetch('/api/ai/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          model: 'text-embedding-3-small',
          tenantId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const result = await response.json();
      return result.embedding;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding for text');
    }
  }

  private chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private async createKnowledgeVectors(
    companyId: string,
    data: CompanyKnowledgeData,
    tenantId: string = 'default-tenant'
  ): Promise<CompanyKnowledgeVector[]> {
    const vectors: CompanyKnowledgeVector[] = [];
    const timestamp = new Date();

    // Process each field and create vectors
    const fieldsToVectorize = [
      { field: 'companyName', type: 'company_name', weight: 1.0 },
      { field: 'legalName', type: 'legal_name', weight: 0.8 },
      { field: 'mission', type: 'mission', weight: 1.2 },
      { field: 'vision', type: 'vision', weight: 1.1 },
      { field: 'motto', type: 'motto', weight: 0.9 },
      { field: 'tagline', type: 'tagline', weight: 0.9 },
      { field: 'uniqueValueProposition', type: 'value_proposition', weight: 1.3 },
      { field: 'targetAudience', type: 'target_audience', weight: 1.2 },
      { field: 'competitors', type: 'competitors', weight: 1.1 },
      { field: 'revenueModel', type: 'revenue_model', weight: 1.0 },
      { field: 'shortTermGoals', type: 'short_term_goals', weight: 1.1 },
      { field: 'longTermGoals', type: 'long_term_goals', weight: 1.1 },
      { field: 'keyMetrics', type: 'key_metrics', weight: 1.0 },
      { field: 'challenges', type: 'challenges', weight: 1.0 },
      { field: 'opportunities', type: 'opportunities', weight: 1.0 },
      { field: 'strengths', type: 'strengths', weight: 1.0 },
      { field: 'weaknesses', type: 'weaknesses', weight: 1.0 },
    ];

    for (const { field, type, weight } of fieldsToVectorize) {
      const value = data[field as keyof CompanyKnowledgeData];
      if (value && typeof value === 'string' && value.trim()) {
        const chunks = this.chunkText(value);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await this.generateEmbedding(chunk, tenantId);
          
          vectors.push({
            id: `${companyId}_${type}_${i}`,
            company_id: companyId,
            content: chunk,
            content_type: type,
            embedding,
            metadata: {
              field,
              weight,
              chunk_index: i,
              total_chunks: chunks.length,
              industry: data.industry,
              company_size: data.companySize,
              founded_year: data.foundedYear,
            },
            created_at: timestamp,
            updated_at: timestamp,
          });
        }
      }
    }

    // Handle core values array
    if (data.coreValues && data.coreValues.length > 0) {
      const valuesText = data.coreValues.join(', ');
      const embedding = await this.generateEmbedding(valuesText, tenantId);
      
      vectors.push({
        id: `${companyId}_core_values`,
        company_id: companyId,
        content: valuesText,
        content_type: 'core_values',
        embedding,
        metadata: {
          field: 'coreValues',
          weight: 1.1,
          values_count: data.coreValues.length,
          industry: data.industry,
          company_size: data.companySize,
        },
        created_at: timestamp,
        updated_at: timestamp,
      });
    }

    // Create a comprehensive company overview vector
    const overviewText = this.createOverviewText(data);
    if (overviewText) {
      const embedding = await this.generateEmbedding(overviewText, tenantId);
      
      vectors.push({
        id: `${companyId}_overview`,
        company_id: companyId,
        content: overviewText,
        content_type: 'company_overview',
        embedding,
        metadata: {
          field: 'overview',
          weight: 1.5,
          industry: data.industry,
          company_size: data.companySize,
          founded_year: data.foundedYear,
        },
        created_at: timestamp,
        updated_at: timestamp,
      });
    }

    return vectors;
  }

  private createOverviewText(data: CompanyKnowledgeData): string {
    const parts: string[] = [];

    if (data.companyName) parts.push(`Company: ${data.companyName}`);
    if (data.industry) parts.push(`Industry: ${data.industry}`);
    if (data.companySize) parts.push(`Size: ${data.companySize}`);
    if (data.foundedYear) parts.push(`Founded: ${data.foundedYear}`);
    if (data.mission) parts.push(`Mission: ${data.mission}`);
    if (data.vision) parts.push(`Vision: ${data.vision}`);
    if (data.uniqueValueProposition) parts.push(`Value Proposition: ${data.uniqueValueProposition}`);
    if (data.targetAudience) parts.push(`Target Audience: ${data.targetAudience}`);
    if (data.revenueModel) parts.push(`Revenue Model: ${data.revenueModel}`);

    return parts.join('. ');
  }

  async saveCompanyKnowledge(companyId: string, data: CompanyKnowledgeData, tenantId: string = 'default-tenant'): Promise<void> {
    try {
      // First, delete existing vectors for this company
      await this.deleteCompanyKnowledge(companyId);

      // Generate new vectors
      const vectors = await this.createKnowledgeVectors(companyId, data, tenantId);

      // Insert vectors into pgvector
      for (const vector of vectors) {
        await postgres.query(
          `INSERT INTO company_knowledge_vectors (
            id, company_id, content, content_type, embedding, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            vector.id,
            vector.company_id,
            vector.content,
            vector.content_type,
            vector.embedding,
            JSON.stringify(vector.metadata),
            vector.created_at,
            vector.updated_at,
          ]
        );
      }

      // Also save the raw data for reference
      await postgres.query(
        `INSERT INTO company_knowledge_data (
          company_id, data, created_at, updated_at
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (company_id) 
        DO UPDATE SET data = $2, updated_at = $4`,
        [
          companyId,
          JSON.stringify(data),
          new Date(),
          new Date(),
        ]
      );

      logger.info(`Saved ${vectors.length} knowledge vectors for company ${companyId}`);
    } catch (error) {
      logger.error('Error saving company knowledge:', error);
      throw new Error('Failed to save company knowledge');
    }
  }

  async getCompanyKnowledge(companyId: string): Promise<CompanyKnowledgeData | null> {
    try {
      const result = await postgres.query(
        'SELECT data FROM company_knowledge_data WHERE company_id = $1',
        [companyId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].data as CompanyKnowledgeData;
    } catch (error) {
      logger.error('Error retrieving company knowledge:', error);
      throw new Error('Failed to retrieve company knowledge');
    }
  }

  async searchCompanyKnowledge(
    companyId: string,
    query: string,
    limit: number = 5,
    tenantId: string = 'default-tenant'
  ): Promise<CompanyKnowledgeVector[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query, tenantId);

      // Search for similar vectors using cosine similarity
      const result = await postgres.query(
        `SELECT id, company_id, content, content_type, metadata, 
                (embedding <=> $1) as similarity
         FROM company_knowledge_vectors 
         WHERE company_id = $2 
         ORDER BY embedding <=> $1 
         LIMIT $3`,
        [queryEmbedding, companyId, limit]
      );

      return result.rows.map(row => ({
        id: row.id,
        company_id: row.company_id,
        content: row.content,
        content_type: row.content_type,
        embedding: [], // Not returning embedding for performance
        metadata: row.metadata,
        created_at: new Date(),
        updated_at: new Date(),
      }));
    } catch (error) {
      logger.error('Error searching company knowledge:', error);
      throw new Error('Failed to search company knowledge');
    }
  }

  async deleteCompanyKnowledge(companyId: string): Promise<void> {
    try {
      await postgres.query(
        'DELETE FROM company_knowledge_vectors WHERE company_id = $1',
        [companyId]
      );

      await postgres.query(
        'DELETE FROM company_knowledge_data WHERE company_id = $1',
        [companyId]
      );

      logger.info(`Deleted knowledge vectors for company ${companyId}`);
    } catch (error) {
      logger.error('Error deleting company knowledge:', error);
      throw new Error('Failed to delete company knowledge');
    }
  }

  async getKnowledgeStrength(companyId: string): Promise<number> {
    try {
      const data = await this.getCompanyKnowledge(companyId);
      if (!data) return 0;

      // Calculate completeness score based on filled fields
      const requiredFields = [
        'companyName', 'mission', 'uniqueValueProposition', 'targetAudience'
      ];
      
      const importantFields = [
        'vision', 'industry', 'revenueModel', 'shortTermGoals', 'longTermGoals'
      ];

      let score = 0;
      let totalWeight = 0;

      // Check required fields (weight: 2.0)
      for (const field of requiredFields) {
        const value = data[field as keyof CompanyKnowledgeData];
        if (value && typeof value === 'string' && value.trim().length > 10) {
          score += 2.0;
        }
        totalWeight += 2.0;
      }

      // Check important fields (weight: 1.0)
      for (const field of importantFields) {
        const value = data[field as keyof CompanyKnowledgeData];
        if (value && typeof value === 'string' && value.trim().length > 10) {
          score += 1.0;
        }
        totalWeight += 1.0;
      }

      return Math.round((score / totalWeight) * 100);
    } catch (error) {
      logger.error('Error calculating knowledge strength:', error);
      return 0;
    }
  }

  // CKB Document Intelligence Methods
  async addDocument(document: Omit<CKBDocument, 'id' | 'created_at' | 'updated_at'>): Promise<CKBDocument> {
    try {
      const result = await postgres.query(
        `INSERT INTO ckb_documents 
         (company_id, title, content, content_type, source, source_id, source_url, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          document.company_id,
          document.title,
          document.content,
          document.content_type,
          document.source,
          document.source_id,
          document.source_url,
          document.embedding,
          document.metadata
        ]
      );

      return {
        ...result.rows[0],
        created_at: new Date(result.rows[0].created_at),
        updated_at: new Date(result.rows[0].updated_at)
      };
    } catch (error) {
      logger.error('Error adding CKB document:', error);
      throw new Error('Failed to add document');
    }
  }

  async searchDocuments(companyId: string, query: CKBSearchQuery): Promise<CKBSearchResult[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query.query);

      // Build the search query with filters
      let sql = `
        SELECT id, company_id, title, content, content_type, source, source_id, source_url, metadata,
               (embedding <=> $1) as similarity
        FROM ckb_documents 
        WHERE company_id = $2
      `;
      
      const params = [queryEmbedding, companyId];
      let paramIndex = 3;

      // Add filters
      if (query.filters?.content_type?.length) {
        sql += ` AND content_type = ANY($${paramIndex})`;
        params.push(query.filters.content_type);
        paramIndex++;
      }

      if (query.filters?.department?.length) {
        sql += ` AND metadata->>'department' = ANY($${paramIndex})`;
        params.push(query.filters.department);
        paramIndex++;
      }

      sql += ` ORDER BY embedding <=> $1 LIMIT $${paramIndex}`;
      params.push(query.limit || 10);

      const result = await postgres.query(sql, params);

      return result.rows.map(row => ({
        document: {
          id: row.id,
          company_id: row.company_id,
          title: row.title,
          content: row.content,
          content_type: row.content_type,
          source: row.source,
          source_id: row.source_id,
          source_url: row.source_url,
          embedding: [],
          metadata: row.metadata,
          created_at: new Date(row.created_at),
          updated_at: new Date(row.updated_at)
        },
        score: 1 - row.similarity, // Convert distance to similarity score
        highlights: [], // TODO: Implement text highlighting
        context: row.content.substring(0, 200) + '...'
      }));
    } catch (error) {
      logger.error('Error searching CKB documents:', error);
      throw new Error('Failed to search documents');
    }
  }

  async askQuestion(companyId: string, question: string): Promise<CKBQAResponse> {
    try {
      // Search for relevant documents
      const searchResults = await this.searchDocuments(companyId, {
        query: question,
        limit: 5
      });

      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find any relevant documents to answer your question.",
          sources: [],
          confidence: 0,
          reasoning: "No relevant documents found in your knowledge base."
        };
      }

      // Prepare context from top documents
      const context = searchResults
        .map(result => `${result.document.title}:\n${result.document.content}`)
        .join('\n\n');

      // Call AI service for Q&A
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that answers questions based on the provided company documents. Only use information from the documents provided. If you cannot answer the question based on the documents, say so.`
            },
            {
              role: 'user',
              content: `Based on these company documents:\n\n${context}\n\nQuestion: ${question}`
            }
          ],
          model: 'gpt-4o-mini',
          temperature: 0.3
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse = await response.json();
      const answer = aiResponse.choices[0].message.content;

      return {
        answer,
        sources: searchResults.map(result => result.document),
        confidence: searchResults[0].score,
        reasoning: `Based on ${searchResults.length} relevant documents with confidence scores ranging from ${Math.round(searchResults[searchResults.length - 1].score * 100)}% to ${Math.round(searchResults[0].score * 100)}%.`
      };
    } catch (error) {
      logger.error('Error asking question:', error);
      throw new Error('Failed to get answer');
    }
  }

  async getDocuments(companyId: string, limit: number = 50, offset: number = 0): Promise<CKBDocument[]> {
    try {
      const result = await postgres.query(
        `SELECT * FROM ckb_documents 
         WHERE company_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [companyId, limit, offset]
      );

      return result.rows.map(row => ({
        ...row,
        embedding: [],
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at)
      }));
    } catch (error) {
      logger.error('Error getting CKB documents:', error);
      throw new Error('Failed to get documents');
    }
  }

  async deleteDocument(documentId: string, companyId: string): Promise<void> {
    try {
      await postgres.query(
        'DELETE FROM ckb_documents WHERE id = $1 AND company_id = $2',
        [documentId, companyId]
      );
    } catch (error) {
      logger.error('Error deleting CKB document:', error);
      throw new Error('Failed to delete document');
    }
  }
}

export const companyKnowledgeService = new CompanyKnowledgeService();
