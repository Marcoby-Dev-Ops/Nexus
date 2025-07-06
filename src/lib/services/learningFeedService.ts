import { logger } from '@/lib/security/logger';

export interface LearningMaterial {
  id: string;
  type: 'article' | 'video' | 'course' | 'playbook';
  title: string;
  summary: string;
  source: string;
  url: string;
  tags: string[];
}

const mockLearningMaterials: LearningMaterial[] = [
  {
    id: '1',
    type: 'article',
    title: 'Mastering the Art of Cold Emails',
    summary: 'Learn the best practices for writing cold emails that get responses and build relationships.',
    source: 'Sales Hacker',
    url: '#',
    tags: ['sales', 'outreach'],
  },
  {
    id: '2',
    type: 'video',
    title: 'How to Build a High-Performing Sales Team',
    summary: 'A 15-minute video on the key pillars of building and motivating a successful sales team.',
    source: 'YouTube',
    url: '#',
    tags: ['sales', 'management'],
  },
  {
    id: '3',
    type: 'course',
    title: 'Advanced Negotiation Skills',
    summary: 'An in-depth course covering strategies for high-stakes negotiations and deal-making.',
    source: 'Coursera',
    url: '#',
    tags: ['sales', 'negotiation'],
  },
  {
    id: '4',
    type: 'playbook',
    title: 'The Nexus Guide to Product-Led Growth',
    summary: 'Our internal playbook on leveraging your product to drive acquisition, conversion, and expansion.',
    source: 'Nexus Internal',
    url: '#',
    tags: ['growth', 'product'],
  },
];

class LearningFeedService {
  async getLearningMaterials(): Promise<LearningMaterial[]> {
    try {
      // In the future, this could fetch from a CMS or a recommendation engine
      return mockLearningMaterials;
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch learning materials');
      return [];
    }
  }
}

export const learningFeedService = new LearningFeedService(); 