import React from 'react';
import { OnboardingChecklist } from '@/domains/admin/onboarding/pages/OnboardingChecklist';
import { SupabaseTest } from '@/shared/components/debug/SupabaseTest';

export function OnboardingTest() {
  return (
    <div className="space-y-6 p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Onboarding Test</h2>
        <p className="text-yellow-700 text-sm">
          This page tests the OnboardingChecklist component with your fresh Supabase setup.
        </p>
      </div>

      <OnboardingChecklist />

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">🔍 Supabase Connection Test</h3>
        <SupabaseTest />
      </div>
    </div>
  );
} 