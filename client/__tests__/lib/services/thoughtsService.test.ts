import { thoughtsService } from '../../../src/lib/services/thoughtsService';
import type { CreateThoughtRequest, UpdateThoughtRequest, Thought } from '../../../src/lib/types/thoughts';
import { supabase } from '../../../src/core/database/supabase';

jest.mock('../../../src/core/database/supabase');

describe('ThoughtsService', () => {
  const baseThought: CreateThoughtRequest = {
    content: 'Test thought',
    category: 'idea',
    status: 'concept',
    personal_or_professional: 'professional',
    main_sub_categories: ['sub1'],
    initiative: true,
    impact: 'high',
    parent_idea_id: undefined,
    workflow_stage: 'create_idea',
    interaction_method: 'text',
    department: 'engineering',
    priority: 'high',
    estimated_effort: '2h',
    ai_clarification_data: { clarification: 'none' },
    company_id: 'company-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('should create a thought with all fields', async () => {
    const mockInsert = jest.fn().mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: { ...baseThought, id: 'thought-1', created_by: 'user-1', updated_by: 'user-1', creation_date: new Date(), last_updated: new Date(), ai_insights: {}, created_at: new Date(), updated_at: new Date() }, error: null }) }) });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });
    const thought = await thoughtsService.createThought(baseThought);
    expect(thought.content).toBe(baseThought.content);
    expect(thought.category).toBe(baseThought.category);
    expect(thought.status).toBe(baseThought.status);
    expect(thought.department).toBe(baseThought.department);
    expect(thought.priority).toBe(baseThought.priority);
    expect(thought.estimated_effort).toBe(baseThought.estimated_effort);
    expect(thought.ai_clarification_data).toEqual(baseThought.ai_clarification_data);
  });

  it('should update a thought with all fields', async () => {
    const updateRequest: UpdateThoughtRequest = {
      id: 'thought-1',
      ...baseThought,
      content: 'Updated content',
      priority: 'medium',
      estimated_effort: '4h',
    };
    const mockUpdate = jest.fn().mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: { ...updateRequest, ai_insights: {}, created_at: new Date(), updated_at: new Date() }, error: null }) }) });
    (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });
    const thought = await thoughtsService.updateThought(updateRequest);
    expect(thought.content).toBe('Updated content');
    expect(thought.priority).toBe('medium');
    expect(thought.estimated_effort).toBe('4h');
  });

  it('should delete a thought', async () => {
    const mockDelete = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ error: null }) });
    (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });
    await expect(thoughtsService.deleteThought('thought-1')).resolves.toBeUndefined();
  });

  it('should map all fields from database to Thought', () => {
    const data = {
      id: 'thought-1',
      user_id: 'user-1',
      created_by: 'user-1',
      updated_by: 'user-1',
      creation_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      content: 'Test',
      category: 'idea',
      status: 'concept',
      personal_or_professional: 'professional',
      main_sub_categories: ['sub1'],
      initiative: true,
      impact: 'high',
      parent_idea_id: null,
      workflow_stage: 'create_idea',
      department: 'engineering',
      priority: 'high',
      estimated_effort: '2h',
      ai_clarification_data: { clarification: 'none' },
      ai_insights: {},
      interaction_method: 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const thought = (thoughtsService as any).mapDatabaseToThought(data);
    expect(thought.department).toBe('engineering');
    expect(thought.priority).toBe('high');
    expect(thought.estimated_effort).toBe('2h');
    expect(thought.ai_clarification_data).toEqual({ clarification: 'none' });
  });
}); 