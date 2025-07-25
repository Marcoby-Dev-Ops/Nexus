/**
 * Business Benchmarking Service
 * Provides business health assessment and benchmarking data
 */

export interface BusinessProfile {
  industry: string;
  size: string;
  founded: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  points: number;
}

export interface Benchmark {
  yourRank: number;
  percentile: number;
  peerAverage: number;
  topPerformers: number;
}

export interface PeerComparison {
  similarBusinesses: number;
  scoreComparison: {
    higher: number;
    lower: number;
    same: number;
  };
  industryComparison: {
    rank: number;
    total: number;
  };
}

export interface Trend {
  monthlyChange: number;
  weeklyChange: number;
  direction: 'up' | 'down' | 'stable';
}

export interface LivingAssessment {
  currentScore: number;
  benchmarks: Benchmark;
  peerComparison: PeerComparison;
  achievements: Achievement[];
  trends: Trend;
  lastUpdated: string;
}

export const businessBenchmarkingService = {
  async getLivingAssessment(userId: string, businessProfile: BusinessProfile): Promise<LivingAssessment> {
    // Mock implementation - in a real app, this would fetch from a database
    const mockScore = Math.floor(Math.random() * 40) + 30; // Score between 30-70
    const mockRank = Math.floor(Math.random() * 100) + 1;
    const mockPercentile = Math.floor(Math.random() * 60) + 20; // 20-80 percentile
    
    return {
      currentScore: mockScore,
      benchmarks: {
        yourRank: mockRank,
        percentile: mockPercentile,
        peerAverage: 45,
        topPerformers: 85
      },
      peerComparison: {
        similarBusinesses: 150,
        scoreComparison: {
          higher: Math.floor(Math.random() * 50),
          lower: Math.floor(Math.random() * 50),
          same: Math.floor(Math.random() * 10)
        },
        industryComparison: {
          rank: Math.floor(Math.random() * 200) + 1,
          total: 500
        }
      },
      achievements: [
        {
          id: '1',
          title: 'First Integration',
          description: 'Connected your first data source',
          date: new Date().toISOString(),
          category: 'integration',
          points: 10
        },
        {
          id: '2',
          title: 'Data Pioneer',
          description: 'Connected 3+ data sources',
          date: new Date().toISOString(),
          category: 'integration',
          points: 25
        }
      ],
      trends: {
        monthlyChange: Math.floor(Math.random() * 20) - 10, // -10 to +10
        weeklyChange: Math.floor(Math.random() * 10) - 5, // -5 to +5
        direction: 'up' as const
      },
      lastUpdated: new Date().toISOString()
    };
  }
}; 