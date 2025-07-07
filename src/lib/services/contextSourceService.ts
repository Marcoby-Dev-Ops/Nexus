import type { ContextSource } from '@/components/ai/ContextChips';

export interface RAGMetadata {
  userContext?: {
    profile?: {
      name?: string;
      role?: string;
      experience_level?: string;
      department?: string;
    };
    business_context?: {
      company_name?: string;
      industry?: string;
      key_tools?: string[];
      data_sources?: string[];
    };
    activity?: {
      session_duration?: number;
      recent_pages?: string[];
      most_used_features?: string[];
    };
  };
  departmentData?: {
    [key: string]: any;
  };
  businessIntelligence?: {
    sales?: any;
    marketing?: any;
    finance?: any;
    operations?: any;
  };
  cloudDocuments?: Array<{
    fileName?: string;
    source?: string;
    lastModified?: string;
    content?: string;
  }>;
  routing?: {
    agent?: string;
    confidence?: number;
    reasoning?: string;
  };
  vectorSearchResults?: Array<{
    content?: string;
    similarity?: number;
    metadata?: any;
  }>;
}

export class ContextSourceService {
  
  /**
   * Extract context sources from RAG metadata
   */
  static extractContextSources(ragMetadata: RAGMetadata): ContextSource[] {
    const sources: ContextSource[] = [];
    
    // User Profile Context
    if (ragMetadata.userContext?.profile) {
      const profile = ragMetadata.userContext.profile;
      sources.push({
        id: 'user-profile',
        type: 'user_profile',
        title: 'User Profile',
        description: `${profile.name || 'User'} (${profile.role || 'Team Member'}) - ${profile.experience_level || 'intermediate'} level`,
        confidence: 0.95,
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'User Settings',
          dataPoints: Object.keys(profile).length,
          department: profile.department,
          experience: profile.experience_level
        },
        content: `User profile for ${profile.name || 'user'} includes role as ${profile.role || 'team member'} with ${profile.experience_level || 'intermediate'} experience level in ${profile.department || 'general'} department.`
      });
    }

    // Business Context
    if (ragMetadata.userContext?.business_context) {
      const business = ragMetadata.userContext.business_context;
      sources.push({
        id: 'business-context',
        type: 'business_data',
        title: 'Business Context',
        description: `${business.company_name || 'Company'} (${business.industry || 'Business'}) with ${business.key_tools?.length || 0} integrated tools`,
        confidence: 0.88,
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'Business Setup',
          dataPoints: (business.key_tools?.length || 0) + (business.data_sources?.length || 0),
          company: business.company_name,
          industry: business.industry
        },
        content: `Business context includes ${business.company_name || 'company'} in ${business.industry || 'industry'} with tools: ${business.key_tools?.join(', ') || 'none'} and data sources: ${business.data_sources?.join(', ') || 'none'}.`
      });
    }

    // Department Performance Data
    if (ragMetadata.departmentData && Object.keys(ragMetadata.departmentData).length > 0) {
      Object.entries(ragMetadata.departmentData).forEach(([dept, data]) => {
        if (data && typeof data === 'object') {
          sources.push({
            id: `department-${dept}`,
            type: 'department_metrics',
            title: `${dept.charAt(0).toUpperCase() + dept.slice(1)} Metrics`,
            description: `Real-time performance data for ${dept} department`,
            confidence: 0.92,
            metadata: {
              lastUpdated: new Date().toISOString(),
              source: `${dept} Dashboard`,
              dataPoints: Object.keys(data).length,
              department: dept,
              relevance: 0.9
            },
            content: `Department metrics for ${dept} include: ${Object.keys(data).join(', ')}.`
          });
        }
      });
    }

    // Business Intelligence from Integrations
    if (ragMetadata.businessIntelligence) {
      const bi = ragMetadata.businessIntelligence;
      Object.entries(bi).forEach(([source, data]) => {
        if (data && typeof data === 'object') {
          sources.push({
            id: `integration-${source}`,
            type: 'integration',
            title: `${source.charAt(0).toUpperCase() + source.slice(1)} Integration`,
            description: `Live data from ${source} integration`,
            confidence: 0.85,
            metadata: {
              lastUpdated: new Date().toISOString(),
              source: `${source} API`,
              dataPoints: Object.keys(data).length,
              integration: source,
              relevance: 0.85
            },
            content: `Integration data from ${source} includes: ${Object.keys(data).join(', ')}.`
          });
        }
      });
    }

    // Cloud Documents
    if (ragMetadata.cloudDocuments?.length) {
      ragMetadata.cloudDocuments.forEach((doc, index) => {
        sources.push({
          id: `document-${index}`,
          type: 'cloud_document',
          title: doc.fileName || `Document ${index + 1}`,
          description: `From ${doc.source || 'cloud storage'} - ${doc.lastModified ? new Date(doc.lastModified).toLocaleDateString() : 'recently updated'}`,
          confidence: 0.78,
          metadata: {
            lastUpdated: doc.lastModified,
            source: doc.source || 'Cloud Storage',
            relevance: 0.75,
            fileName: doc.fileName
          },
          content: doc.content?.substring(0, 200) + (doc.content && doc.content.length > 200 ? '...' : '')
        });
      });
    }

    // Vector Search Results
    if (ragMetadata.vectorSearchResults?.length) {
      ragMetadata.vectorSearchResults.forEach((result, index) => {
        sources.push({
          id: `vector-${index}`,
          type: 'cloud_document',
          title: `Knowledge Base Match ${index + 1}`,
          description: `Semantic match with ${Math.round((result.similarity || 0) * 100)}% relevance`,
          confidence: result.similarity || 0.7,
          metadata: {
            lastUpdated: new Date().toISOString(),
            source: 'Vector Search',
            relevance: result.similarity || 0.7,
            searchType: 'semantic'
          },
          content: result.content?.substring(0, 200) + (result.content && result.content.length > 200 ? '...' : '')
        });
      });
    }

    // User Activity Context
    if (ragMetadata.userContext?.activity) {
      const activity = ragMetadata.userContext.activity;
      sources.push({
        id: 'user-activity',
        type: 'conversation_history',
        title: 'User Activity',
        description: `${Math.round((activity.session_duration || 0) / 60)} min session, ${activity.recent_pages?.length || 0} recent pages`,
        confidence: 0.65,
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'Activity Tracking',
          dataPoints: (activity.recent_pages?.length || 0) + (activity.most_used_features?.length || 0),
          sessionDuration: activity.session_duration,
          relevance: 0.6
        },
        content: `User activity includes ${activity.session_duration || 0} seconds session time, recent pages: ${activity.recent_pages?.join(', ') || 'none'}, most used features: ${activity.most_used_features?.join(', ') || 'none'}.`
      });
    }

    return sources.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Create mock context sources for testing
   */
  static createMockContextSources(): ContextSource[] {
    return [
      {
        id: 'user-profile-mock',
        type: 'user_profile',
        title: 'User Profile',
        description: 'John Doe (Marketing Manager) - Advanced level',
        confidence: 0.95,
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'User Settings',
          dataPoints: 8,
          department: 'Marketing',
          experience: 'advanced'
        },
        content: 'User profile includes marketing expertise with 5+ years experience in campaign management and analytics.'
      },
      {
        id: 'business-data-mock',
        type: 'business_data',
        title: 'Business Intelligence',
        description: 'TechCorp Inc. (SaaS) with 12 integrated tools',
        confidence: 0.88,
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'Business Dashboard',
          dataPoints: 24,
          company: 'TechCorp Inc.',
          industry: 'SaaS'
        },
        content: 'Business intelligence shows strong Q3 performance with 23% growth in MRR, 156 new customers, and 94% retention rate.'
      },
      {
        id: 'hubspot-integration-mock',
        type: 'integration',
        title: 'HubSpot Integration',
        description: 'Live CRM data from HubSpot',
        confidence: 0.85,
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'HubSpot API',
          dataPoints: 18,
          integration: 'hubspot',
          relevance: 0.9
        },
        content: 'HubSpot integration shows 45 active deals worth $2.3M, 23% increase in qualified leads, and 87% email open rate.'
      },
      {
        id: 'marketing-doc-mock',
        type: 'cloud_document',
        title: 'Q4 Marketing Strategy.pdf',
        description: 'From Google Drive - Updated 2 days ago',
        confidence: 0.78,
        metadata: {
          lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'Google Drive',
          relevance: 0.82,
          fileName: 'Q4 Marketing Strategy.pdf'
        },
        content: 'Q4 marketing strategy focuses on enterprise segment expansion with $150K budget allocation for LinkedIn ads and content marketing...'
      }
    ];
  }
}

export default ContextSourceService; 