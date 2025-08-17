// Mock app supabase client to prevent import.meta.env usage in test env
jest.mock('@/lib/supabase', () => {
  const auth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    refreshSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  };
  const from = jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({ single: jest.fn(), maybeSingle: jest.fn(), limit: jest.fn() })),
      order: jest.fn(() => ({ limit: jest.fn() })),
      limit: jest.fn(),
    })),
    insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
    update: jest.fn(() => ({ eq: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })) })),
    upsert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
    delete: jest.fn(() => ({ eq: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })) })),
  }));
  const functions = { invoke: jest.fn().mockResolvedValue({ data: { success: true }, error: null }) };
  return { supabase: { auth, from, functions } };
});
/**
 * OnboardingService Tests
 * 
 * Tests for the OnboardingService to ensure proper data persistence
 */

// Mock UnifiedDatabaseService module to avoid importing real implementation in tests
jest.mock('@/core/services/UnifiedDatabaseService', () => {
  const unifiedDatabaseServiceMock = {
    upsertOne: jest.fn(),
    selectOne: jest.fn(),
    select: jest.fn(),
    updateOne: jest.fn(),
    insertOne: jest.fn(),
    deleteOne: jest.fn(),
    callEdgeFunction: jest.fn(),
    sessionUtils: {
      refreshSession: jest.fn().mockResolvedValue({ session: null, error: null }),
    },
  } as any;
  return { unifiedDatabaseService: unifiedDatabaseServiceMock };
});

import { OnboardingService, OnboardingDataSchema } from '@/shared/services/OnboardingService';
import { unifiedDatabaseService } from '@/core/services/UnifiedDatabaseService';

// Note: We mock/spyon methods on the unifiedDatabaseService singleton directly

// Mock the logger
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock fetch if needed elsewhere (not used by service which calls supabase functions.invoke)
global.fetch = jest.fn();

describe('OnboardingService', () => {
  let onboardingService: OnboardingService;
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    onboardingService = new OnboardingService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('saveOnboardingStep', () => {
    it('should save onboarding step data successfully', async () => {
      const mockStepData = {
        id: 'test-step-id',
        user_id: mockUserId,
        step_id: 'basic-info',
        step_data: { firstName: 'John', lastName: 'Doe' },
        completed_at: expect.any(String),
        created_at: expect.any(String),
      };
      const upsertSpy = jest
        .spyOn(unifiedDatabaseService, 'upsertOne')
        .mockResolvedValue({ data: mockStepData as any, error: null });

      const stepData = { firstName: 'John', lastName: 'Doe' };
      const result = await onboardingService.saveOnboardingStep(mockUserId, 'basic-info', stepData);

      expect(result.success).toBe(true);
      expect(upsertSpy).toHaveBeenCalledWith('user_onboarding_steps', expect.objectContaining({
        user_id: mockUserId,
        step_id: 'basic-info',
        step_data: stepData,
      }), 'user_id,step_id');
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      jest
        .spyOn(unifiedDatabaseService, 'upsertOne')
        .mockResolvedValue({ data: null as any, error: mockError });

      const stepData = { firstName: 'John', lastName: 'Doe' };
      const result = await onboardingService.saveOnboardingStep(mockUserId, 'basic-info', stepData);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('completeOnboarding', () => {
    const mockOnboardingData = {
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      jobTitle: 'CEO',
      company: 'Test Company',
      industry: 'Technology',
      companySize: '1-10',
      primaryGoals: ['Increase revenue'],
      businessChallenges: ['Data fragmentation'],
      selectedIntegrations: ['microsoft-365'],
      selectedUseCases: ['business-analysis'],
      userId: mockUserId,
    };

    it('should complete onboarding successfully', async () => {
      // Mock edge function call via unified database service
      jest
        .spyOn(unifiedDatabaseService, 'callEdgeFunction')
        .mockResolvedValueOnce({
          success: true,
          data: {
            userId: mockUserId,
            companyId: 'company-id',
            onboardingCompleted: true,
            profileUpdated: true,
            companyCreated: true,
          },
        } as any);

      const result = await onboardingService.completeOnboarding(mockUserId, mockOnboardingData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        success: true,
        userId: mockUserId,
        profileUpdated: true,
        companyCreated: true,
        onboardingCompleted: true,
      });
    });

    it('should handle existing company scenario', async () => {
      const existingCompanyId = 'existing-company-id';

      // Mock edge function call for existing company
      jest
        .spyOn(unifiedDatabaseService, 'callEdgeFunction')
        .mockResolvedValueOnce({
          success: true,
          data: {
            userId: mockUserId,
            companyId: existingCompanyId,
            onboardingCompleted: true,
            profileUpdated: true,
            companyCreated: false,
          },
        } as any);

      const result = await onboardingService.completeOnboarding(mockUserId, mockOnboardingData);

      expect(result.success).toBe(true);
      expect(result.data?.companyId).toBe(existingCompanyId);
      expect(result.data?.companyCreated).toBe(false);
    });

    it('should validate onboarding data', async () => {
      const invalidData = {
        // Missing required fields
        userId: mockUserId,
      };

      const result = await onboardingService.completeOnboarding(mockUserId, invalidData as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return completed status for user with completed onboarding', async () => {
      const mockProfile = {
        id: mockUserId,
        onboarding_completed: true,
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSteps = [
        {
          step_id: 'basic-info',
          completed_at: '2024-01-01T00:00:00Z',
        },
      ];

      jest
        .spyOn(unifiedDatabaseService, 'selectOne')
        .mockResolvedValueOnce({ data: mockProfile as any, error: null });
              jest
          .spyOn(unifiedDatabaseService, 'select')
        .mockResolvedValueOnce({ data: mockSteps as any, error: null });

      const result = await onboardingService.getOnboardingStatus(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.isCompleted).toBe(true);
      expect(result.data?.completedSteps).toEqual(['basic-info']);
      expect(result.data?.completionPercentage).toBeGreaterThan(0);
      expect(result.data?.lastUpdated).toBeTruthy();
    });

    it('should return incomplete status for user without completed onboarding', async () => {
      const mockProfile = {
        id: mockUserId,
        onboarding_completed: false,
        updated_at: '2024-01-01T00:00:00Z',
      };

      jest
        .spyOn(unifiedDatabaseService, 'selectOne')
        .mockResolvedValueOnce({ data: mockProfile as any, error: null });
              jest
          .spyOn(unifiedDatabaseService, 'select')
        .mockResolvedValueOnce({ data: null as any, error: null });

      const result = await onboardingService.getOnboardingStatus(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data?.isCompleted).toBe(false);
      expect(result.data?.completedSteps).toEqual([]);
      expect(result.data?.completionPercentage).toBe(0);
    });
  });

  describe('resetOnboarding', () => {
    it('should reset onboarding status successfully', async () => {
      jest
        .spyOn(unifiedDatabaseService, 'deleteOne')
        .mockResolvedValue({ data: {} as any, error: null });
    jest
      .spyOn(unifiedDatabaseService, 'updateOne')
      .mockResolvedValue({
        data: { id: mockUserId, onboarding_completed: false } as any,
        error: null,
      });

      const result = await onboardingService.resetOnboarding(mockUserId);

      expect(result.success).toBe(true);
    expect(unifiedDatabaseService.updateOne).toHaveBeenCalledWith(
      'user_profiles',
      mockUserId,
      expect.objectContaining({
        onboarding_completed: false,
      })
    );
    });
  });

  describe('OnboardingDataSchema validation', () => {
    it('should validate complete onboarding data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        jobTitle: 'CEO',
        company: 'Test Company',
        industry: 'Technology',
        companySize: '1-10',
        primaryGoals: ['Increase revenue'],
        businessChallenges: ['Data fragmentation'],
        selectedIntegrations: ['microsoft-365'],
        selectedUseCases: ['business-analysis'],
        userId: mockUserId,
      };

      const result = OnboardingDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid onboarding data', () => {
      const invalidData = {
        // Missing required fields
        displayName: 'John Doe',
        userId: mockUserId,
      };

      const result = OnboardingDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2); // firstName and lastName are required
      }
    });
  });
}); 