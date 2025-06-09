import React, { createContext, useContext, useState } from 'react';

interface OnboardingContextType {
  isOnboardingActive: boolean;
  setIsOnboardingActive: (active: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);

  return (
    <OnboardingContext.Provider value={{ isOnboardingActive, setIsOnboardingActive }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}; 