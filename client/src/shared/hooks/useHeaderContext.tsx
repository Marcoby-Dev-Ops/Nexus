import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';

interface HeaderContextType {
  pageTitle: string | null;
  pageSubtitle: string | null;
  setHeaderContent: (title: string | null, subtitle?: string | null) => void;
  clearHeaderContent: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const useHeaderContext = () => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeaderContext must be used within a HeaderProvider');
  }
  return context;
};

interface HeaderProviderProps {
  children: ReactNode;
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ children }) => {
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [pageSubtitle, setPageSubtitle] = useState<string | null>(null);

  const setHeaderContent = (title: string | null, subtitle?: string | null) => {
    setPageTitle(title);
    setPageSubtitle(subtitle || null);
  };

  const clearHeaderContent = () => {
    setPageTitle(null);
    setPageSubtitle(null);
  };

  return (
    <HeaderContext.Provider value={{
      pageTitle,
      pageSubtitle,
      setHeaderContent,
      clearHeaderContent,
    }}>
      {children}
    </HeaderContext.Provider>
  );
};
