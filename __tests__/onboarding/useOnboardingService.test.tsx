import React from 'react';
import { renderHook, act } from '@testing-library/react';

import { useOnboardingService } from '@/shared/hooks/useOnboardingService';
import { onboardingService } from '@/shared/services/OnboardingService';

describe('useOnboardingService', () => {
  it('saves a step and completes onboarding successfully', async () => {
    jest.spyOn(onboardingService, 'saveOnboardingStep').mockResolvedValueOnce({
      success: true,
      data: { stepId: 'basic-info', data: { firstName: 'A', lastName: 'B' }, completedAt: new Date().toISOString() },
      error: null,
    } as any);

    jest.spyOn(onboardingService, 'completeOnboarding').mockResolvedValueOnce({
      success: true,
      data: { success: true, userId: 'u1', onboardingCompleted: true, profileUpdated: true, companyCreated: true },
      error: null,
    } as any);

    const { result } = renderHook(() => useOnboardingService());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      const ok = await result.current.saveStep('basic-info', { userId: 'u1', firstName: 'A', lastName: 'B' });
      expect(ok).toBe(true);
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      const ok = await result.current.completeOnboarding({ userId: 'u1', firstName: 'A', lastName: 'B' } as any);
      expect(ok).toBe(true);
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches progress and updates current phase/step', async () => {
    const { result } = renderHook(() => useOnboardingService());

    jest.spyOn(onboardingService, 'getOnboardingProgress').mockResolvedValueOnce({
      success: true,
      data: { currentPhase: 'new-user-setup', currentStep: 'welcome-introduction', completedPhases: [], completedSteps: [], totalPhases: 5, totalSteps: 20, phaseProgress: {} },
      error: null,
    } as any);

    await act(async () => {
      const progress = await result.current.getOnboardingProgress('u1');
      expect(progress).toBeTruthy();
    });

    expect(result.current.currentPhase).toBe('new-user-setup');
    expect(result.current.currentStep).toBe('welcome-introduction');
  });
});


