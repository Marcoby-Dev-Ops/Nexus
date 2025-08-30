import React, { useEffect, useRef } from 'react';

interface SignupAnalyticsProps {
  currentStep: string;
  formData: any;
  isDirty: boolean;
  errors: Record<string, string>;
  onStepComplete: (step: string) => void;
}

export function SignupAnalytics({
  currentStep,
  formData,
  isDirty,
  errors,
  onStepComplete
}: SignupAnalyticsProps) {
  const lastStep = useRef<string>(currentStep);
  const lastFormData = useRef<any>({});
  const lastErrors = useRef<Record<string, string>>({});
  const lastAnalyticsTime = useRef<number>(0);

  // Track step completion
  useEffect(() => {
    if (lastStep.current !== currentStep) {
      onStepComplete(lastStep.current);
      lastStep.current = currentStep;
    }
  }, [currentStep, onStepComplete]);

  // Track form interactions - only when there are meaningful changes
  useEffect(() => {
    if (isDirty) {
      // Check if form data has actually changed
      const formDataChanged = JSON.stringify(formData) !== JSON.stringify(lastFormData.current);
      const errorsChanged = JSON.stringify(errors) !== JSON.stringify(lastErrors.current);
      
      // Only log analytics if there are meaningful changes or every 30 seconds
      const shouldLog = formDataChanged || errorsChanged || (Date.now() - lastAnalyticsTime.current > 30000);
      
      if (shouldLog) {
        // Track form field interactions
        const fieldInteractions = Object.keys(formData).filter(key => formData[key]);
        
        // Track validation errors
        const hasErrors = Object.keys(errors).length > 0;
        
        // Send analytics data (in a real app, this would go to your analytics service)
        console.log('Signup Analytics:', {
          step: currentStep,
          fieldInteractions,
          hasErrors,
          errorCount: Object.keys(errors).length,
          completionPercentage: getCompletionPercentage()
        });
        
        // Update refs
        lastFormData.current = { ...formData };
        lastErrors.current = { ...errors };
        lastAnalyticsTime.current = Date.now();
      }
    }
  }, [isDirty, formData, errors, currentStep]);

  const getCompletionPercentage = () => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(value => value && value.toString().trim() !== '').length;
    return Math.round((filledFields / totalFields) * 100);
  };

  const getStepAnalytics = () => {
    const stepData = {
      'business-info': {
        requiredFields: 4,
        optionalFields: 0,
        completionRate: 85
      },
      'contact-info': {
        requiredFields: 3,
        optionalFields: 1,
        completionRate: 92
      },
      'username-selection': {
        requiredFields: 1,
        optionalFields: 0,
        completionRate: 95
      },
      'verification': {
        requiredFields: 0,
        optionalFields: 0,
        completionRate: 98
      }
    };

    return stepData[currentStep as keyof typeof stepData] || {
      requiredFields: 0,
      optionalFields: 0,
      completionRate: 0
    };
  };

  const stepAnalytics = getStepAnalytics();
  const completionPercentage = getCompletionPercentage();
  const isAheadOfSchedule = false; // Removed timeSpent prop, so no comparison

  return (
    <div className="fixed bottom-4 right-4 w-64 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl p-3 text-xs text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-green-300 font-medium">Analytics</span>
        <span className="text-gray-400">Live</span>
      </div>
      
      <div className="space-y-2">
        {/* Step Progress */}
        <div className="flex justify-between">
          <span className="text-gray-300">Step Progress:</span>
          <span className={`font-medium ${isAheadOfSchedule ? 'text-green-400' : 'text-yellow-400'}`}>
            {completionPercentage}%
          </span>
        </div>

        {/* Time Tracking */}
        <div className="flex justify-between">
          <span className="text-gray-300">Time Spent:</span>
          <span className={`font-medium ${isAheadOfSchedule ? 'text-green-400' : 'text-yellow-400'}`}>
            {/* Removed timeSpent display */}
          </span>
        </div>

        {/* Average Comparison */}
        <div className="flex justify-between">
          <span className="text-gray-300">Avg. Time:</span>
          <span className="text-gray-400">
            {/* Removed avg time display */}
          </span>
        </div>

        {/* Completion Rate */}
        <div className="flex justify-between">
          <span className="text-gray-300">Success Rate:</span>
          <span className="text-green-400 font-medium">
            {stepAnalytics.completionRate}%
          </span>
        </div>

        {/* Performance Indicator */}
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isAheadOfSchedule ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className={`text-xs ${isAheadOfSchedule ? 'text-green-400' : 'text-yellow-400'}`}>
              {/* Removed performance indicator text */}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

