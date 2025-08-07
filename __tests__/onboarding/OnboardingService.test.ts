/**
 * OnboardingService Tests
 * 
 * Tests for the OnboardingService to ensure proper data persistence
 */

import { OnboardingService, OnboardingDataSchema } from '@/shared/services/OnboardingService';
import { supabaseService } from '@/core/services/SupabaseService';

// Mock the database helper functions
jest.mock('@/lib/supabase', () => ({
  insertOne: jest.fn(),
  updateOne: jest.fn(),
  selectOne: jest.fn(),
  upsertOne: jest.fn(),
}));

// Mock the logger
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock fetch for edge function calls
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

      (upsertOne as any).mockResolvedValue({
        data: mockStepData,
        error: null,
      });

      const stepData = { firstName: 'John', lastName: 'Doe' };
      const result = await onboardingService.saveOnboardingStep(mockUserId, 'basic-info', stepData);

      expect(result.success).toBe(true);
      expect(upsertOne).toHaveBeenCalledWith('user_onboarding_steps', expect.objectContaining({
        user_id: mockUserId,
        step_id: 'basic-info',
        step_data: stepData,
      }), 'user_id,step_id');
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      (upsertOne as any).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const stepData = { firstName: 'John', lastName: 'Doe' };
      const result = await onboardingService.saveOnboardingStep(mockUserId, 'basic-info', stepData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database operation failed');
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
      // Mock successful fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: mockUserId,
            companyId: 'company-id',
            onboardingCompleted: true,
            profileUpdated: true,
            companyCreated: true
          }
        })
      });

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

      // Mock successful fetch response for existing company
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: mockUserId,
            companyId: existingCompanyId,
            onboardingCompleted: true,
            profileUpdated: true,
            companyCreated: false
          }
        })
      });

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

      const mockSteps = {
        step_id: 'basic-info',
        completed_at: '2024-01-01T00:00:00Z',
      };

      (selectOne as any)
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockSteps,
          error: null,
        });

      const result = await onboardingService.getOnboardingStatus(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        isCompleted: true,
        completedSteps: ['basic-info'],
        completionPercentage: 100,
        lastUpdated: '2024-01-01T00:00:00Z',
      });
    });

    it('should return incomplete status for user without completed onboarding', async () => {
      const mockProfile = {
        id: mockUserId,
        onboarding_completed: false,
        updated_at: '2024-01-01T00:00:00Z',
      };

      (selectOne as any)
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const result = await onboardingService.getOnboardingStatus(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        isCompleted: false,
        completedSteps: [],
        completionPercentage: 0,
      });
    });
  });

  describe('resetOnboarding', () => {
    it('should reset onboarding status successfully', async () => {
      (updateOne as any).mockResolvedValue({
        data: { id: mockUserId, onboarding_completed: false },
        error: null,
      });

      const result = await onboardingService.resetOnboarding(mockUserId);

      expect(result.success).toBe(true);
      expect(updateOne).toHaveBeenCalledWith(
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