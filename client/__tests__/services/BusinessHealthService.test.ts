import { businessHealthService } from '@/core/services/BusinessHealthService';
import { unifiedDatabaseService } from '@/core/services/UnifiedDatabaseService';

jest.mock('@/core/services/UnifiedDatabaseService', () => {
  return {
    unifiedDatabaseService: {
      callEdgeFunction: jest.fn(),
    },
  };
});

describe('BusinessHealthService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('readLatest returns snapshot on success', async () => {
    (unifiedDatabaseService.callEdgeFunction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        user_id: 'u1',
        org_id: 'o1',
        overall_score: 80,
        category_scores: { sales: 80 },
        last_calculated: new Date().toISOString(),
        data_sources: [],
        connected_sources: 1,
        verified_sources: 1,
        data_quality_score: 70,
        completion_percentage: 50,
      },
    });

    const res = await businessHealthService.readLatest();
    expect(res.success).toBe(true);
    expect(res.data?.overall_score).toBe(80);
  });

  it('refresh returns snapshot on success', async () => {
    (unifiedDatabaseService.callEdgeFunction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        user_id: 'u1',
        org_id: 'o1',
        overall_score: 85,
        category_scores: { sales: 90 },
        last_calculated: new Date().toISOString(),
        data_sources: [],
        connected_sources: 2,
        verified_sources: 2,
        data_quality_score: 75,
        completion_percentage: 60,
      },
    });

    const res = await businessHealthService.refresh();
    expect(res.success).toBe(true);
    expect(res.data?.overall_score).toBe(85);
  });
});


