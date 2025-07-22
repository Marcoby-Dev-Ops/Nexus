/**
 * Onboarding Verification Panel
 * Demonstrates comprehensive verification with codebase + n8n integration
 */

import React from 'react';
import { useOnboardingVerification } from '../hooks/useOnboardingVerification';

interface OnboardingVerificationPanelProps {
  showDetails?: boolean;
  onVerificationComplete?: (result: any) => void;
  className?: string;
}

export const OnboardingVerificationPanel: React.FC<OnboardingVerificationPanelProps> = ({
  showDetails = true,
  onVerificationComplete,
  className = ''
}) => {
  const {
    isVerifying,
    verificationResult,
    error,
    verifyOnboarding,
    quickVerify,
    isComplete
  } = useOnboardingVerification();

  const handleVerify = async () => {
    await verifyOnboarding();
    if (onVerificationComplete && verificationResult) {
      onVerificationComplete(verificationResult);
    }
  };

  const handleQuickVerify = () => {
    const result = quickVerify();
    console.log('Quick verification result:', result);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Onboarding Verification
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleQuickVerify}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Quick Check
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Verify Onboarding'}
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="mb-4">
        {isVerifying && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Running comprehensive verification...
          </div>
        )}

        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {verificationResult && (
          <div className={`p-3 rounded ${isComplete ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
            <div className="flex items-center">
              {isComplete ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">
                {isComplete ? 'Onboarding Complete' : 'Onboarding Issues Found'}
              </span>
            </div>
            <p className="mt-1 text-sm">{verificationResult.summary}</p>
          </div>
        )}
      </div>

      {/* Detailed Results */}
      {showDetails && verificationResult && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Verification Details</h4>
          
          {verificationResult.checks.map((check, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
              <div className={`w-3 h-3 rounded-full mt-1 ${
                check.status === 'pass' ? 'bg-green-500' :
                check.status === 'fail' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{check.name}</div>
                <div className="text-sm text-gray-600">{check.message}</div>
                {check.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      View details
                    </summary>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}

          {/* Recommendations */}
          {verificationResult.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <h5 className="font-medium text-blue-900 mb-2">Recommendations</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                {verificationResult.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Integration Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <span>Verification System:</span>
          <div className="flex space-x-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              Codebase
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              n8n
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs">
          Uses hybrid verification: real-time codebase checks + advanced n8n analytics
        </p>
      </div>
    </div>
  );
};

export default OnboardingVerificationPanel; 