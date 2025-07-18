import { useState } from 'react';

export function useSubscription() {
  // TODO: Replace with real API call to fetch subscription status
  // For now, mock as free tier
  const [isLoading] = useState(false);
  const [plan] = useState<'free' | 'pro'>('free');
  const [hasAIFeatures] = useState(false);

  return { hasAIFeatures, plan, isLoading };
} 