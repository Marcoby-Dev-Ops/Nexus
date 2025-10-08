import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';

interface HeaderContextType {
  pageTitle: string | null;
  pageSubtitle: string | null;
  pageActions: ReactNode | null;
  pageIcon: ReactNode | null;
  setHeaderContent: (title: string | null, subtitle?: string | null, actions?: ReactNode) => void;
  setHeaderIcon: (icon: ReactNode | null) => void;
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
  const [pageActions, setPageActions] = useState<ReactNode | null>(null);
  const [pageIcon, setPageIcon] = useState<ReactNode | null>(null);

  const setHeaderContent = (title: string | null, subtitle?: string | null, actions?: ReactNode) => {
    setPageTitle(title);
    setPageSubtitle(subtitle || null);
    setPageActions(actions || null);
  };

  const clearHeaderContent = () => {
    setPageTitle(null);
    setPageSubtitle(null);
    setPageActions(null);
    setPageIcon(null);
  };

  return (
    <HeaderContext.Provider value={{
      pageTitle,
      pageSubtitle,
      pageActions,
      pageIcon,
      setHeaderContent,
      setHeaderIcon: setPageIcon,
      clearHeaderContent,
    }}>
      {children}
    </HeaderContext.Provider>
  );
};
