import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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
  const [pageActions, setPageActionsState] = useState<ReactNode | null>(null);

  const setPageTitle = useCallback((title: string | null) => {
    setPageTitleState(title);
  }, []);

  const setPageSubtitle = useCallback((subtitle: string | null) => {
    setPageSubtitleState(subtitle);
  }, []);

  const setPageIcon = useCallback((icon: ReactNode | null) => {
    setPageIconState(icon);
  }, []);

  const setPageActions = useCallback((actions: ReactNode | null) => {
    setPageActionsState(actions);
  }, []);

  const setHeaderContent = useCallback((title: string | null, subtitle?: string | null, actions?: ReactNode | null) => {
    setPageTitleState(title);
    setPageSubtitleState(subtitle || null);
    if (actions !== undefined) {
      setPageActionsState(actions);
    }
  }, []);

  const clearHeaderContent = useCallback(() => {
    setPageTitleState(null);
    setPageSubtitleState(null);
    setPageIconState(null);
    setPageActionsState(null);
  }, []);

  const contextValue = useMemo(() => ({
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
  }), [
    pageTitle,
    pageSubtitle,
    pageIcon,
    pageActions,
    setPageTitle,
    setPageSubtitle,
    setPageIcon,
    setHeaderContent,
    setPageActions,
    clearHeaderContent
  ]);

  return (
    <HeaderContext.Provider value={contextValue}>
      {children}
    </HeaderContext.Provider>
  );
};
