import React, { useState, useEffect } from 'react';

interface ExitIntentModalProps {
  isVisible: boolean;
  onClose: () => void;
  onContinue: () => void;
  onSaveProgress: () => void;
  formData: any;
  currentStep: string;
}

export function ExitIntentModal({
  isVisible,
  onClose,
  onContinue,
  onSaveProgress,
  formData,
  currentStep,
}: ExitIntentModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleContinue = () => {
    setIsClosing(true);
    setTimeout(() => {
      onContinue();
    }, 300);
  };

  const handleSaveProgress = () => {
    onSaveProgress();
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 transform transition-all duration-300 ${
        isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        <div className="backdrop-blur-2xl bg-black/60 border border-white/40 rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Don't lose your progress!
            </h3>
            <p className="text-green-200 text-sm">
              You've made great progress on your signup. Would you like to continue or save your progress for later?
            </p>
          </div>

          {/* Progress Summary */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-200">Current Progress</span>
              <span className="text-sm text-green-300 capitalize">{currentStep.replace('-', ' ')}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                style={{ 
                  width: currentStep === 'business-info' ? '33%' : 
                         currentStep === 'contact-info' ? '66%' : '100%' 
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Continue Signup
            </button>
            
            <button
              onClick={handleSaveProgress}
              className="w-full py-4 px-6 bg-white/10 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-white/20"
            >
              Save Progress & Continue Later
            </button>
            
            <button
              onClick={handleClose}
              className="w-full py-3 px-6 text-green-300 hover:text-white transition-colors duration-200 text-sm"
            >
              Close (lose progress)
            </button>
          </div>

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center space-x-3 text-sm text-green-300">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your data is automatically saved</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-green-300 mt-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Complete setup in under 3 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
