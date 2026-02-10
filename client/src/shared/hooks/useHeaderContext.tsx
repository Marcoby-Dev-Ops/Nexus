import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';

interface HeaderContextType {
  pageTitle: string | null;
  pageSubtitle: string | null;
  pageIcon: ReactNode | null;
  pageActions: ReactNode | null;
  setPageTitle: (title: string | null) => void;
  setPageSubtitle: (subtitle: string | null) => void;
  setPageIcon: (icon: ReactNode | null) => void;
  setHeaderContent: (title: string | null, subtitle?: string | null, actions?: ReactNode | null) => void;
  setPageActions: (actions: ReactNode | null) => void;
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
  const [pageTitle, setPageTitleState] = useState<string | null>(null);
  const [pageSubtitle, setPageSubtitleState] = useState<string | null>(null);
  const [pageIcon, setPageIconState] = useState<ReactNode | null>(null);
  const [pageActions, setPageActions] = useState<ReactNode | null>(null);

  const setPageTitle = (title: string | null) => {
    setPageTitleState(title);
  };

  const setPageSubtitle = (subtitle: string | null) => {
    setPageSubtitleState(subtitle);
  };

  const setPageIcon = (icon: ReactNode | null) => {
    setPageIconState(icon);
  };

  const setHeaderContent = (title: string | null, subtitle?: string | null, actions?: ReactNode | null) => {
    setPageTitleState(title);
    setPageSubtitleState(subtitle || null);
    if (actions !== undefined) {
      setPageActions(actions);
    }
  };

  const clearHeaderContent = () => {
    setPageTitleState(null);
    setPageSubtitleState(null);
    setPageIconState(null);
    setPageActions(null);
  };

  return (
    <HeaderContext.Provider value={{
      pageTitle,
      pageSubtitle,
      pageIcon,
      pageActions,
      setPageTitle,
      setPageSubtitle,
      setPageIcon,
      setHeaderContent,
      setPageActions,
      clearHeaderContent,
    }}>
      {children}
    </HeaderContext.Provider>
  );
};
