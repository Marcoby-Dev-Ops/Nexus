import React from 'react';

interface SignupProgressIndicatorProps {
  currentStep: 'business-info' | 'contact-info' | 'username-selection' | 'verification';
  progress: number;
  timeSpent?: number; // seconds
  autoSaveStatus: 'saved' | 'saving' | 'error';
  isDirty: boolean;
}

export function SignupProgressIndicator({
  currentStep,
  progress,
  timeSpent,
  autoSaveStatus,
  isDirty,
}: SignupProgressIndicatorProps) {
  const steps = [
    { id: 'business-info', label: 'Business Info', number: 1 },
    { id: 'contact-info', label: 'Contact Info', number: 2 },
    { id: 'username-selection', label: 'Username', number: 3 },
    { id: 'verification', label: 'Verification', number: 4 },
  ];

  const getAutoSaveIcon = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center space-x-2 text-blue-400 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center space-x-2 text-green-400 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Save failed</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-green-200">Progress</span>
          <span className="text-sm text-green-300">{progress}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-3">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-green-600 text-white ring-4 ring-green-600/30' 
                    : isCompleted
                    ? 'bg-green-400 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                
                {/* Step Label */}
                <div className="ml-2 hidden sm:block">
                  <div className={`text-xs font-medium transition-colors duration-300 ${
                    isCurrent ? 'text-green-200' : isCompleted ? 'text-green-300' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                    isCompleted ? 'bg-green-400' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center text-xs text-green-300">
        <div className="flex items-center space-x-4">
          {isDirty && getAutoSaveIcon()}
        </div>
        <div className="flex items-center space-x-2">
          <span>Time: {timeSpent ? `${Math.floor(timeSpent/60)}:${String(timeSpent%60).padStart(2,'0')}` : '0:00'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}</span>
        </div>
      </div>
    </div>
  );
}
