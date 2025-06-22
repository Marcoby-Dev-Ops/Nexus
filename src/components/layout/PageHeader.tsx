import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode; // For buttons or other actions
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, children }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {icon}
          {title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {description}
        </p>
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}; 