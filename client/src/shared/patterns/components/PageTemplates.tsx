import React from 'react';

/**
 * Standardized Page Templates
 * 
 * Provides consistent page layouts across the application.
 * Fixes page structure inconsistencies identified in the analysis.
 */

export interface DepartmentPageProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export interface SettingsPageProps {
  children: React.ReactNode;
}

export const PageTemplates = {
  /**
   * Dashboard page template - reference implementation
   */
  Dashboard: ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark: from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="p-8 space-y-8">
        {children}
      </div>
    </div>
  ),

  /**
   * Department page template - consistent structure
   */
  Department: ({ title, subtitle, children }: DepartmentPageProps) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark: from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="p-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-lg">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  ),

  /**
   * Settings page template - constrained width
   */
  Settings: ({ children }: SettingsPageProps) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark: from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {children}
      </div>
    </div>
  ),

  /**
   * Authentication page template - split layout
   */
  Auth: ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex">
      {children}
    </div>
  )
};

/**
 * Higher-order component for applying page templates
 */
export const withPageTemplate = <P extends object>(
  Component: React.ComponentType<P>,
  templateType: 'dashboard' | 'department' | 'settings' | 'auth',
  templateProps?: DepartmentPageProps
) => {
  return (props: P) => {
    if (templateType === 'department' && templateProps) {
      const DepartmentTemplate = PageTemplates.Department;
      return (
        <DepartmentTemplate {...templateProps}>
          <Component {...props} />
        </DepartmentTemplate>
      );
    }
    
    const Template = PageTemplates[templateType as keyof typeof PageTemplates] as React.ComponentType<{ children: React.ReactNode }>;
    return (
      <Template>
        <Component {...props} />
      </Template>
    );
  };
};

export default PageTemplates; 