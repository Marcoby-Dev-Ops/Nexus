const request = require('supertest');

jest.mock('../src/middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'test-user' };
    next();
  }
}));

jest.mock('../src/services/AuditService', () => ({
  recordEvent: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/database/connection', () => {
  const query = jest.fn();
  return {
    query,
    transaction: jest.fn(),
    testConnection: jest.fn(),
    closePool: jest.fn(),
    getPoolStats: jest.fn(),
    __queryMock: query
  };
});

const { __queryMock: queryMock } = require('../src/database/connection');
const app = require('../server');

describe('/api/edge endpoint', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('returns the latest business health snapshot', async () => {
    const snapshot = {
      user_id: 'test-user',
      org_id: null,
      overall_score: 72,
      data_quality_score: 68,
      connected_sources: 2,
      verified_sources: 1,
      completion_percentage: 45,
      category_scores: { sales: 25, marketing: 15 },
      data_sources: ['analytics'],
      last_calculated: '2025-03-12T10:00:00.000Z',
      created_at: '2025-03-12T09:00:00.000Z',
      updated_at: '2025-03-12T09:30:00.000Z'
    };

    queryMock.mockResolvedValueOnce({
      data: [snapshot],
      error: null
    });

    const response = await request(app)
      .post('/api/edge/business_health')
      .send({ action: 'read' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      user_id: 'test-user',
      overall_score: snapshot.overall_score,
      data_quality_score: snapshot.data_quality_score
    });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('recalculates business health metrics on refresh', async () => {
    const now = new Date().toISOString();

    queryMock
      .mockResolvedValueOnce({
        data: [
          {
            integration_slug: 'hubspot',
            status: 'active',
            last_sync_at: now
          }
        ],
        error: null
      })
      .mockResolvedValueOnce({
        data: [
          {
            company_name: 'Test Company',
            industry: 'SaaS',
            company_size: '1-10'
          }
        ],
        error: null
      })
      .mockResolvedValueOnce({
        data: [
          {
            current_phase: 'foundation',
            completed_phases: ['identity'],
            total_steps: 10,
            completed_steps: 7
          }
        ],
        error: null
      })
      .mockResolvedValueOnce({
        data: [],
        error: null
      });

    const response = await request(app)
      .post('/api/edge/business_health')
      .send({ action: 'refresh' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      user_id: 'test-user',
      connected_sources: 1,
      verified_sources: 1,
      data_quality_score: 100,
      completion_percentage: 70
    });

    expect(response.body.data.category_scores).toMatchObject({
      sales: 25
    });

    expect(queryMock).toHaveBeenCalledTimes(4);
  });
});
