import React from 'react';

interface PageLayoutProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ title, actions, children }) => {
  return (
    <div>
      {(title || actions) && (
        <div className="flex justify-between items-center mb-6">
          {title && <h1 className="text-3xl font-bold">{title}</h1>}
          <div>{actions}</div>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}; 
