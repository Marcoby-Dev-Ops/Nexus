import React, { useState, useEffect } from 'react';

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  component: React.ReactNode;
  conversionTarget: number;
}

interface SignupABTestProps {
  variants: ABTestVariant[];
  onVariantSelect: (variantId: string) => void;
  currentVariant?: string;
}

export function SignupABTest({ variants, onVariantSelect, currentVariant }: SignupABTestProps) {
  const [selectedVariant, setSelectedVariant] = useState<string>(currentVariant || variants[0]?.id);
  const [showTestPanel, setShowTestPanel] = useState(false);

  useEffect(() => {
    if (currentVariant) {
      setSelectedVariant(currentVariant);
    }
  }, [currentVariant]);

  const handleVariantChange = (variantId: string) => {
    setSelectedVariant(variantId);
    onVariantSelect(variantId);
  };

  const currentVariantData = variants.find(v => v.id === selectedVariant);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return <>{currentVariantData?.component}</>;
  }

  return (
    <div className="relative">
      {/* A/B Test Panel (Development Only) */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowTestPanel(!showTestPanel)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
        >
          A/B Test
        </button>
      </div>

      {showTestPanel && (
        <div className="fixed top-16 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl max-w-sm">
          <h3 className="text-white font-semibold mb-3">A/B Test Variants</h3>
          <div className="space-y-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantChange(variant.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                  selectedVariant === variant.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="font-medium">{variant.name}</div>
                <div className="text-xs opacity-75">{variant.description}</div>
                <div className="text-xs mt-1">Target: {variant.conversionTarget}%</div>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400">
              Current: {currentVariantData?.name}
            </div>
          </div>
        </div>
      )}

      {/* Render selected variant */}
      {currentVariantData?.component}
    </div>
  );
}

// Analytics tracking for A/B tests
export const trackABTestEvent = (variantId: string, event: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('A/B Test Event:', { variantId, event, data });
  }
  
  // In production, send to analytics service
  // analytics.track('ab_test_event', { variantId, event, data });
};

// Hook for A/B test data
export const useABTest = (testId: string) => {
  const [variant, setVariant] = useState<string>('');
  const [conversionRate, setConversionRate] = useState<number>(0);

  useEffect(() => {
    // Load variant from localStorage or assign randomly
    const savedVariant = localStorage.getItem(`ab_test_${testId}`);
    if (savedVariant) {
      setVariant(savedVariant);
    } else {
      // Random assignment (50/50 for now)
      const randomVariant = Math.random() > 0.5 ? 'variant_a' : 'variant_b';
      localStorage.setItem(`ab_test_${testId}`, randomVariant);
      setVariant(randomVariant);
    }
  }, [testId]);

  const trackConversion = () => {
    const currentRate = conversionRate + 1;
    setConversionRate(currentRate);
    trackABTestEvent(variant, 'conversion', { rate: currentRate });
  };

  const trackEvent = (event: string, data?: any) => {
    trackABTestEvent(variant, event, data);
  };

  return {
    variant,
    conversionRate,
    trackConversion,
    trackEvent,
  };
};
