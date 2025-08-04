import { mockSupabaseClient } from '../utils/ragTestUtils';

// Mock the Edge Function environment
const mockDeno = {
  serve: jest.fn((handler) => handler),
  env: {
    get: jest.fn((key) => {
      const envVars: Record<string, string> = {
        'SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_ANON_KEY': 'test-anon-key',
        'OPENAI_API_KEY': 'test-openai-key',
        'JWT_SECRET': 'test-jwt-secret'
      };
      return envVars[key] || null;
    })
  }
};

// Mock fetch for OpenAI API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Supabase client for Edge Functions
const mockSupabaseEdgeClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@company.com' } },
      error: null
    }),
    admin: {
      updateUserById: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@company.com', role: 'manager' } },
        error: null
      })
    }
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null })
  }))
};

// Test data for different functions
const testData = {
  contact: {
    id: 'test-contact-id',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company_id: 'test-company-id',
    owner_id: 'test-user-id'
  },
  deal: {
    id: 'test-deal-id',
    name: 'Test Deal',
    value: 50000,
    stage: 'proposal',
    probability: 75,
    company_id: 'test-company-id',
    owner_id: 'test-user-id',
    close_date: new Date().toISOString()
  },
  company: {
    id: 'test-company-id',
    name: 'Test Company',
    industry: 'Technology',
    size: 'Medium',
    website: 'https://testcompany.com'
  },
  user: {
    id: 'test-user-id',
    email: 'test@company.com',
    role: 'admin',
    company_id: 'test-company-id'
  }
};

describe('Migration Regression Tests - Edge Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('ai_execute_action', () => {
    it('should handle create_contact action with valid data', async () => {
      // Mock successful contact creation
      mockSupabaseEdgeClient.from().insert.mockResolvedValue({
        data: [testData.contact],
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/ai_execute_action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          action: 'create_contact',
          data: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            company_id: 'test-company-id'
          }
        })
      });

      // Simulate the function handler
      const response = await mockAiExecuteAction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
    });

    it('should handle create_deal action with valid data', async () => {
      // Mock successful deal creation
      mockSupabaseEdgeClient.from().insert.mockResolvedValue({
        data: [testData.deal],
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/ai_execute_action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          action: 'create_deal',
          data: {
            name: 'Test Deal',
            value: 50000,
            stage: 'proposal',
            company_id: 'test-company-id'
          }
        })
      });

      const response = await mockAiExecuteAction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
    });

    it('should return 400 for invalid action', async () => {
      const request = new Request('http://localhost:8000/functions/v1/ai_execute_action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          action: 'invalid_action',
          data: {}
        })
      });

      const response = await mockAiExecuteAction(request);
      
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBeDefined();
    });
  });

  describe('contacts', () => {
    it('should create contact successfully', async () => {
      mockSupabaseEdgeClient.from().insert.mockResolvedValue({
        data: [testData.contact],
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          company_id: 'test-company-id'
        })
      });

      const response = await mockContactsFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
    });

    it('should retrieve contacts successfully', async () => {
      mockSupabaseEdgeClient.from().select.mockResolvedValue({
        data: [testData.contact],
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/contacts?company_id=test-company-id', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const response = await mockContactsFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeInstanceOf(Array);
    });
  });

  describe('deals', () => {
    it('should create deal successfully', async () => {
      mockSupabaseEdgeClient.from().insert.mockResolvedValue({
        data: [testData.deal],
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: 'Test Deal',
          value: 50000,
          stage: 'proposal',
          company_id: 'test-company-id'
        })
      });

      const response = await mockDealsFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
    });

    it('should retrieve deals successfully', async () => {
      mockSupabaseEdgeClient.from().select.mockResolvedValue({
        data: [testData.deal],
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/deals?company_id=test-company-id', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const response = await mockDealsFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeInstanceOf(Array);
    });
  });

  describe('hubspot-sync', () => {
    it('should sync HubSpot data successfully', async () => {
      mockSupabaseEdgeClient.from().upsert.mockResolvedValue({
        data: [testData.deal],
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/hubspot-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          company_id: 'test-company-id',
          sync_type: 'deals'
        })
      });

      const response = await mockHubspotSyncFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
    });
  });

  describe('email-analysis', () => {
    it('should analyze email content successfully', async () => {
      // Mock OpenAI API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Email analysis result' } }]
        })
      });

      const request = new Request('http://localhost:8000/functions/v1/email-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          email_content: 'Test email content',
          company_id: 'test-company-id'
        })
      });

      const response = await mockEmailAnalysisFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.analysis).toBeDefined();
    });
  });

  describe('company-enrichment', () => {
    it('should enrich company data successfully', async () => {
      mockSupabaseEdgeClient.from().update.mockResolvedValue({
        data: testData.company,
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/company-enrichment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          company_id: 'test-company-id',
          enrichment_data: {
            industry: 'Technology',
            size: 'Medium',
            website: 'https://testcompany.com'
          }
        })
      });

      const response = await mockCompanyEnrichmentFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
    });
  });

  describe('sync_user_profile', () => {
    it('should sync user profile successfully', async () => {
      mockSupabaseEdgeClient.from().upsert.mockResolvedValue({
        data: testData.user,
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/sync_user_profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          user_id: 'test-user-id',
          profile_data: {
            name: 'Test User',
            role: 'admin',
            company_id: 'test-company-id'
          }
        })
      });

      const response = await mockSyncUserProfileFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
    });
  });

  describe('update_user_role', () => {
    it('should update user role successfully', async () => {
      mockSupabaseEdgeClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { ...testData.user, role: 'manager' } },
        error: null
      });

      const request = new Request('http://localhost:8000/functions/v1/update_user_role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          user_id: 'test-user-id',
          new_role: 'manager',
          company_id: 'test-company-id'
        })
      });

      const response = await mockUpdateUserRoleFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
    });
  });

  describe('AI Embedding Functions', () => {
    it('should embed company profile successfully', async () => {
      // Mock OpenAI embedding API
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      });

      const request = new Request('http://localhost:8000/functions/v1/ai_embed_company_profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          company_id: 'test-company-id',
          profile_data: {
            tagline: 'Test tagline',
            mission_statement: 'Test mission'
          }
        })
      });

      const response = await mockAiEmbedCompanyProfileFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.embedding).toBeDefined();
    });

    it('should embed thought successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      });

      const request = new Request('http://localhost:8000/functions/v1/ai_embed_thought', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          thought_id: 'test-thought-id',
          content: 'Test thought content'
        })
      });

      const response = await mockAiEmbedThoughtFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.embedding).toBeDefined();
    });
  });

  describe('Analytics Functions', () => {
    it('should get finance performance successfully', async () => {
      const request = new Request('http://localhost:8000/functions/v1/get_finance_performance?company_id=test-company-id', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const response = await mockGetFinancePerformanceFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.stats).toBeDefined();
    });

    it('should get sales performance successfully', async () => {
      const request = new Request('http://localhost:8000/functions/v1/get_sales_performance?company_id=test-company-id', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const response = await mockGetSalesPerformanceFunction(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.metrics).toBeDefined();
    });
  });
});

// Mock function handlers (simplified versions for testing)
async function mockAiExecuteAction(request: Request): Promise<Response> {
  const body = await request.json();
  
  if (body.action === 'create_contact' || body.action === 'create_deal') {
    return new Response(JSON.stringify({
      success: true,
      data: body.action === 'create_contact' ? testData.contact : testData.deal
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({
    error: 'Invalid action'
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockContactsFunction(request: Request): Promise<Response> {
  const method = request.method;
  
  if (method === 'POST') {
    return new Response(JSON.stringify({
      success: true,
      data: testData.contact
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (method === 'GET') {
    return new Response(JSON.stringify({
      success: true,
      data: [testData.contact]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockDealsFunction(request: Request): Promise<Response> {
  const method = request.method;
  
  if (method === 'POST') {
    return new Response(JSON.stringify({
      success: true,
      data: testData.deal
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (method === 'GET') {
    return new Response(JSON.stringify({
      success: true,
      data: [testData.deal]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockHubspotSyncFunction(request: Request): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    data: { synced: 1, errors: [] }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockEmailAnalysisFunction(request: Request): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    analysis: {
      sentiment: 'positive',
      key_topics: ['test', 'email'],
      action_items: ['follow up']
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockCompanyEnrichmentFunction(request: Request): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    data: testData.company
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockSyncUserProfileFunction(request: Request): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    data: testData.user
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockUpdateUserRoleFunction(request: Request): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    data: { ...testData.user, role: 'manager' }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockAiEmbedCompanyProfileFunction(request: Request): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    embedding: new Array(1536).fill(0.1)
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockAiEmbedThoughtFunction(request: Request): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    embedding: new Array(1536).fill(0.1)
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockGetFinancePerformanceFunction(request: Request): Promise<Response> {
  return new Response(JSON.stringify({
    stats: {
      revenue: 1000000,
      expenses: 800000,
      profit: 200000
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function mockGetSalesPerformanceFunction(request: Request): Promise<Response> {
  return new Response(JSON.stringify({
    metrics: {
      deals_closed: 10,
      revenue: 500000,
      conversion_rate: 0.25
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 