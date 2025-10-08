/**
 * Document Processing Service
 * 
 * Handles file uploads, content extraction, and analysis for the chat interface.
 * Supports PDFs, documents, images, and other file types.
 */

import { BaseService, type ServiceResponse } from './BaseService';
import { logger } from '@/shared/utils/logger';

export interface DocumentAnalysis {
  id: string;
  name: string;
  type: string;
  size: number;
  extracted_content: string;
  analysis: {
    relevance: 'high' | 'medium' | 'low';
    topics: string[];
    insights: string[];
    word_count: number;
    key_phrases: string[];
  };
  processed_at: string;
}

export interface FileUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // Base64 encoded content
}

export class DocumentProcessingService extends BaseService {
  /**
   * Process uploaded documents and extract content
   */
  async processDocuments(files: FileUpload[]): Promise<ServiceResponse<DocumentAnalysis[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('processDocuments', { fileCount: files.length });

      const processedDocuments: DocumentAnalysis[] = [];

      for (const file of files) {
        try {
          const analysis = await this.analyzeDocument(file);
          processedDocuments.push(analysis);
        } catch (error) {
          logger.error('Failed to process document', { file: file.name, error });
          processedDocuments.push({
            id: file.id,
            name: file.name,
            type: 'error',
            size: file.size,
            extracted_content: '',
            analysis: {
              relevance: 'low',
              topics: [],
              insights: ['Failed to process document'],
              word_count: 0,
              key_phrases: []
            },
            processed_at: new Date().toISOString()
          });
        }
      }

      return { data: processedDocuments, error: null, success: true };
    }, 'process documents');
  }

  /**
   * Analyze a single document
   */
  private async analyzeDocument(file: FileUpload): Promise<DocumentAnalysis> {
    let extractedContent = '';
    let documentType = 'unknown';

    // Extract content based on file type
    if (file.type.includes('pdf')) {
      extractedContent = await this.extractPdfContent(file);
      documentType = 'pdf';
    } else if (file.type.includes('text') || file.type.includes('document')) {
      extractedContent = await this.extractTextContent(file);
      documentType = 'document';
    } else if (file.type.includes('image')) {
      extractedContent = await this.extractImageContent(file);
      documentType = 'image';
    } else if (file.type.includes('spreadsheet')) {
      extractedContent = await this.extractSpreadsheetContent(file);
      documentType = 'spreadsheet';
    }

    // Analyze the extracted content
    const analysis = await this.analyzeContent(extractedContent);

    return {
      id: file.id,
      name: file.name,
      type: documentType,
      size: file.size,
      extracted_content: extractedContent,
      analysis,
      processed_at: new Date().toISOString()
    };
  }

  /**
   * Extract content from PDF files
   */
  private async extractPdfContent(file: FileUpload): Promise<string> {
    // For now, we'll use the content if provided
    // In a real implementation, this would use a PDF parsing library
    if (file.content) {
      // Decode base64 content if needed
      try {
        const decoded = atob(file.content);
        return decoded;
      } catch {
        return file.content;
      }
    }
    
    return 'PDF content extraction not implemented yet';
  }

  /**
   * Extract content from text-based documents
   */
  private async extractTextContent(file: FileUpload): Promise<string> {
    if (file.content) {
      try {
        const decoded = atob(file.content);
        return decoded;
      } catch {
        return file.content;
      }
    }
    
    return 'Document content not available';
  }

  /**
   * Extract content from images using OCR
   */
  private async extractImageContent(file: FileUpload): Promise<string> {
    // In a real implementation, this would use OCR services
    return 'Image content - OCR processing not implemented yet';
  }

  /**
   * Extract content from spreadsheets
   */
  private async extractSpreadsheetContent(file: FileUpload): Promise<string> {
    // In a real implementation, this would parse Excel/CSV files
    return 'Spreadsheet content - parsing not implemented yet';
  }

  /**
   * Analyze extracted content for business relevance
   */
  private async analyzeContent(content: string): Promise<DocumentAnalysis['analysis']> {
    if (!content || content.length < 10) {
      return {
        relevance: 'low',
        topics: [],
        insights: [],
        word_count: 0,
        key_phrases: []
      };
    }

    const topics = this.extractTopics(content);
    const insights = this.extractInsights(content);
    const relevance = this.determineRelevance(content);
    const keyPhrases = this.extractKeyPhrases(content);

    return {
      relevance,
      topics,
      insights,
      word_count: content.split(' ').length,
      key_phrases: keyPhrases
    };
  }

  /**
   * Extract business topics from content
   */
  private extractTopics(content: string): string[] {
    const commonTopics = [
      'sales', 'marketing', 'finance', 'operations', 'customer service',
      'product development', 'strategy', 'growth', 'optimization',
      'revenue', 'profit', 'cost', 'efficiency', 'automation'
    ];

    return commonTopics.filter(topic => 
      content.toLowerCase().includes(topic)
    );
  }

  /**
   * Extract business insights from content
   */
  private extractInsights(content: string): string[] {
    const insights: string[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('revenue') || lowerContent.includes('sales')) {
      insights.push('Financial performance mentioned');
    }

    if (lowerContent.includes('customer') || lowerContent.includes('client')) {
      insights.push('Customer focus identified');
    }

    if (lowerContent.includes('growth') || lowerContent.includes('expand')) {
      insights.push('Growth objectives mentioned');
    }

    if (lowerContent.includes('efficiency') || lowerContent.includes('optimize')) {
      insights.push('Operational improvement focus');
    }

    if (lowerContent.includes('automation') || lowerContent.includes('technology')) {
      insights.push('Technology adoption mentioned');
    }

    return insights;
  }

  /**
   * Determine business relevance of content
   */
  private determineRelevance(content: string): 'high' | 'medium' | 'low' {
    const businessKeywords = [
      'business', 'company', 'organization', 'revenue', 'profit',
      'customer', 'market', 'strategy', 'growth', 'optimization',
      'sales', 'marketing', 'finance', 'operations'
    ];

    const keywordCount = businessKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;

    if (keywordCount >= 5) return 'high';
    if (keywordCount >= 2) return 'medium';
    return 'low';
  }

  /**
   * Extract key phrases from content
   */
  private extractKeyPhrases(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  /**
   * Convert File objects to FileUpload format
   */
  async filesToUploads(files: File[]): Promise<FileUpload[]> {
    const uploads: FileUpload[] = [];

    for (const file of files) {
      try {
        const content = await this.fileToBase64(file);
        uploads.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          content
        });
      } catch (error) {
        logger.error('Failed to convert file to upload format', { file: file.name, error });
      }
    }

    return uploads;
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

// Service instance
export const documentProcessingService = new DocumentProcessingService();
