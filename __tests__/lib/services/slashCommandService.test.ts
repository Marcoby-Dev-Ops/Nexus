import { 
  fetchSlashCommands, 
  getSlashCommands, 
  filterSlashCommands, 
  clearSlashCommandsCache,
  type SlashCommand 
} from '@/lib/services/slashCommandService';
import { supabase } from '@/lib/core/supabase';

// Mock Supabase
jest.mock('@/lib/core/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('SlashCommandService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSlashCommandsCache();
  });

  describe('fetchSlashCommands', () => {
    it('successfully fetches commands from database', async () => {
      const mockTemplates = [
        {
          slug: 'create-task',
          title: 'Create Task',
          description: 'Create a task in your PM tool',
          category: 'productivity',
          template_data: { actions: [] },
        },
        {
          slug: 'send-invoice',
          title: 'Send Invoice',
          description: 'Send a Stripe invoice',
          category: 'finance',
          template_data: { actions: [] },
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockTemplates,
              error: null,
            }),
          }),
        }),
      } as any);

      const commands = await fetchSlashCommands();

      expect(commands).toHaveLength(2);
      expect(commands[0]).toEqual({
        slug: 'create-task',
        title: 'Create Task',
        description: 'Create a task in your PM tool',
        category: 'productivity',
        templateData: { actions: [] },
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('ai_action_card_templates');
    });

    it('falls back to static commands on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);

      const commands = await fetchSlashCommands();

      expect(commands).toHaveLength(4); // Static fallback commands
      expect(commands[0].slug).toBe('create-task');
    });

    it('falls back to static commands when no templates found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const commands = await fetchSlashCommands();

      expect(commands).toHaveLength(4); // Static fallback commands
    });
  });

  describe('getSlashCommands', () => {
    it('caches commands to avoid repeated database calls', async () => {
      const mockTemplates = [
        {
          slug: 'create-task',
          title: 'Create Task',
          description: 'Create a task',
          category: 'productivity',
          template_data: {},
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockTemplates,
              error: null,
            }),
          }),
        }),
      } as any);

      // First call
      const commands1 = await getSlashCommands();
      // Second call should use cache
      const commands2 = await getSlashCommands();

      expect(commands1).toEqual(commands2);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });

  describe('filterSlashCommands', () => {
    const mockCommands: SlashCommand[] = [
      { slug: 'create-task', title: 'Create Task', description: 'Create a task' },
      { slug: 'send-invoice', title: 'Send Invoice', description: 'Send Stripe invoice' },
      { slug: 'update-crm', title: 'Update CRM', description: 'Update HubSpot contact' },
    ];

    it('filters commands by slug', () => {
      const filtered = filterSlashCommands(mockCommands, 'create');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('create-task');
    });

    it('filters commands by title', () => {
      const filtered = filterSlashCommands(mockCommands, 'invoice');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('send-invoice');
    });

    it('filters commands by description', () => {
      const filtered = filterSlashCommands(mockCommands, 'hubspot');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('update-crm');
    });

    it('returns all commands for empty query', () => {
      const filtered = filterSlashCommands(mockCommands, '');
      expect(filtered).toHaveLength(3);
    });

    it('returns empty array for no matches', () => {
      const filtered = filterSlashCommands(mockCommands, 'nonexistent');
      expect(filtered).toHaveLength(0);
    });

    it('is case insensitive', () => {
      const filtered = filterSlashCommands(mockCommands, 'CREATE');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('create-task');
    });
  });

  describe('clearSlashCommandsCache', () => {
    it('clears the cache so next call fetches fresh data', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ slug: 'test', title: 'Test', template_data: {} }],
              error: null,
            }),
          }),
        }),
      } as any);

      // First call
      await getSlashCommands();
      
      // Clear cache
      clearSlashCommandsCache();
      
      // Second call should fetch fresh data
      await getSlashCommands();

      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });
}); 