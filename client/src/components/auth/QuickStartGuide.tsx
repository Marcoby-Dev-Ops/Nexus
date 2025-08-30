import React, { useState } from 'react';

interface QuickStartGuideProps {
  currentStep: 'business-info' | 'contact-info' | 'verification';
  onClose: () => void;
}

export function QuickStartGuide({ currentStep, onClose }: QuickStartGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      id: 'business-info',
      title: 'Business Information',
      description: 'Tell us about your business',
      tips: [
        'Use your official business name',
        'Select the industry that best matches your business',
        'Choose the company size range that applies to you'
      ],
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'contact-info',
      title: 'Contact Information',
      description: 'Your personal details',
      tips: [
        'Use your business email address',
        'Phone number is optional but recommended',
        'We\'ll use this to set up your account'
      ],
      estimatedTime: '1 minute'
    },
    {
      id: 'verification',
      title: 'Account Creation',
      description: 'Secure authentication',
      tips: [
        'You\'ll be redirected to Marcoby IAM',
        'Your account will be created securely',
        'You\'ll have immediate access to Nexus'
      ],
      estimatedTime: '30 seconds'
    }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-200">Quick Start Guide</h4>
            <p className="text-xs text-blue-300">Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-white transition-colors duration-200"
          >
            <svg className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Current step info */}
      <div className="mb-3">
        <h5 className="text-sm font-medium text-blue-200 mb-1">
          {currentStepData?.title}
        </h5>
        <p className="text-xs text-blue-300 mb-2">
          {currentStepData?.description} • Est. time: {currentStepData?.estimatedTime}
        </p>
      </div>

      {/* Expanded tips */}
      {isExpanded && (
        <div className="space-y-2 pt-3 border-t border-blue-500/20">
          <h6 className="text-xs font-medium text-blue-200">Quick Tips:</h6>
          <ul className="space-y-1">
            {currentStepData?.tips.map((tip, index) => (
              <li key={index} className="flex items-start space-x-2 text-xs text-blue-300">
                <svg className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mt-3 pt-3 border-t border-blue-500/20">
        <div className="flex justify-between items-center text-xs text-blue-300 mb-1">
          <span>Overall Progress</span>
          <span>{Math.round(((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-blue-500/20 rounded-full h-1">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-500"
            style={{ 
              width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}

