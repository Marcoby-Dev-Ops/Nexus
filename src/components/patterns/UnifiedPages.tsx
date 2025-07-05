/**
 * UnifiedPages.tsx
 * Unified page components to eliminate redundant page implementations
 * 
 * Pillar: 1 (Efficient Automation) - Reduces page maintenance overhead
 * Pillar: 5 (Speed & Performance) - Eliminates redundant page code
 */

import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { 
  DashboardLayout, 
  ContentSection, 
  TableCard,
  type UnifiedMetricCardProps 
} from './UnifiedComponents';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight,
  BookOpen,
  Zap,
  Target,
  Globe,
  Award
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { ErrorBoundary } from 'react-error-boundary';

// ===== UNIFIED DEPARTMENT PAGE =====

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface ChartData {
  name: string;
  value: number;
}

interface ActivityItem {
  description: string;
  status: string;
  time: string;
  type: string;
}

interface BusinessInsight {
  crossDepartmentalImpact: string[];
  keyBusinessDrivers: string[];
  commonChallenges: string[];
  bestPractices: string[];
  aiRecommendations: string[];
}

interface EducationalContent {
  whatThisMeans: string;
  whyItMatters: string;
  howToImprove: string[];
  industryBenchmarks: string;
}

interface EnhancedKPI {
  title: string;
  value: string;
  delta?: string;
  badge?: 'AI' | 'Auto' | 'Insight' | 'Learning';
}

interface EnhancedActivity {
  description: string;
  status: string;
  time: string;
  type: string;
  badge?: 'AI' | 'Auto' | 'Insight' | 'Learning' | 'Collaboration';
}

interface DepartmentConfig {
  title: string;
  subtitle: string;
  kpis: EnhancedKPI[];
  quickActions: Array<{
    label: string;
    icon: React.ComponentType<any>;
    onClick: () => void;
  }>;
  charts: {
    primary: {
      title: string;
      description: string;
      data: Array<{
        name: string;
        value: number;
        insight?: string;
      }>;
    };
    secondary: {
      title: string;
      description: string;
      data: Array<{
        name: string;
        value: number;
        insight?: string;
      }>;
    };
  };
  activities: EnhancedActivity[];
  businessInsights?: BusinessInsight;
  educationalContent?: EducationalContent;
}

// ===== UNIFIED SETTINGS PAGE =====

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
}

interface SettingsPageConfig {
  title: string;
  description: string;
  sections: SettingsSection[];
}

/**
 * UnifiedSettingsPage - Replaces all settings pages
 */
export const UnifiedSettingsPage: React.FC<{ config: SettingsPageConfig }> = ({ config }) => {
  const [activeSection, setActiveSection] = React.useState(config.sections[0]?.id);

  const currentSection = config.sections.find(s => s.id === activeSection);
  const CurrentComponent = currentSection?.component;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{config.title}</h1>
        <p className="text-lg text-muted-foreground">{config.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {config.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="font-medium">{section.title}</div>
                <div className="text-sm opacity-80">{section.description}</div>
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3">
          <ContentSection title="" className="mb-8">
            {CurrentComponent && <CurrentComponent />}
          </ContentSection>
        </div>
      </div>
    </div>
  );
};

// ===== UNIFIED ANALYTICS PAGE =====

interface AnalyticsConfig {
  title: string;
  subtitle: string;
  metrics: UnifiedMetricCardProps[];
  tabs: Array<{
    id: string;
    label: string;
    content: React.ComponentType;
  }>;
}

/**
 * UnifiedAnalyticsPage - Single component to replace all analytics pages
 * Replaces: AnalyticsDashboardPage, BusinessHealthDetail, etc.
 */
export const UnifiedAnalyticsPage: React.FC<{ config: AnalyticsConfig }> = ({ config }) => {
  const [activeTab, setActiveTab] = React.useState(config.tabs[0]?.id);

  const currentTab = config.tabs.find(t => t.id === activeTab);
  const CurrentComponent = currentTab?.content;

  return (
    <DashboardLayout
      title={config.title}
      subtitle={config.subtitle}
    >
      {/* Tab Navigation */}
      <div className="border-b border-border mb-8">
        <nav className="flex space-x-8">
          {config.tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {CurrentComponent && <CurrentComponent />}
      </div>
    </DashboardLayout>
  );
};

// ===== UNIFIED CALLBACK PAGE =====

interface CallbackPageConfig {
  service: string;
  title: string;
  description: string;
  successMessage: string;
  errorMessage: string;
  redirectPath: string;
}

/**
 * UnifiedCallbackPage - Single component to replace all OAuth callback pages
 * Replaces: Microsoft365Callback, GoogleWorkspaceCallback, etc.
 */
export const UnifiedCallbackPage: React.FC<{ config: CallbackPageConfig }> = ({ config }) => {
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');

  React.useEffect(() => {
    // Simulate callback processing
    const timer = setTimeout(() => {
      setStatus(Math.random() > 0.1 ? 'success' : 'error');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <ContentSection title="" className="max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">{config.title}</h2>
              <p className="text-muted-foreground">{config.description}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-emerald-500 text-4xl mb-4">✓</div>
              <h2 className="text-xl font-semibold mb-2">Success!</h2>
              <p className="text-muted-foreground mb-4">{config.successMessage}</p>
              <button 
                onClick={() => window.location.href = config.redirectPath}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-red-500 text-4xl mb-4">✗</div>
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{config.errorMessage}</p>
              <button 
                onClick={() => window.location.href = '/integrations'}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </ContentSection>
    </div>
  );
};

// ===== EXPORTS =====

export {
  type DepartmentConfig,
  type SettingsPageConfig,
  type AnalyticsConfig,
  type CallbackPageConfig
}; 

// AI-Powered Insights Panel Component
const AIInsightsPanel: React.FC<{ insights: BusinessInsight }> = ({ insights }) => {
  const [activeInsight, setActiveInsight] = useState<string>('recommendations');

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-blue-900">AI Business Intelligence</CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Powered by Nexus AI
          </Badge>
        </div>
        <CardDescription className="text-blue-700">
          Intelligent insights that connect your department to the bigger picture
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeInsight} onValueChange={setActiveInsight} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-blue-100">
            <TabsTrigger value="recommendations" className="text-xs">AI Recommendations</TabsTrigger>
            <TabsTrigger value="impact" className="text-xs">Cross-Dept Impact</TabsTrigger>
            <TabsTrigger value="drivers" className="text-xs">Business Drivers</TabsTrigger>
            <TabsTrigger value="practices" className="text-xs">Best Practices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommendations" className="space-y-3 mt-4">
            {insights.aiRecommendations.map((rec, index) => (
              <Alert key={index} className="border-green-200 bg-green-50">
                <Zap className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-green-800">AI Recommendation #{index + 1}</h3>
                <p className="text-green-700">{rec}</p>
              </Alert>
            ))}
          </TabsContent>
          
          <TabsContent value="impact" className="space-y-3 mt-4">
            {insights.crossDepartmentalImpact.map((impact, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <ArrowUpRight className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700">{impact}</p>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="drivers" className="space-y-3 mt-4">
            {insights.keyBusinessDrivers.map((driver, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <Target className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700">{driver}</p>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="practices" className="space-y-3 mt-4">
            {insights.bestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <Award className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700">{practice}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Business Education Panel Component
const BusinessEducationPanel: React.FC<{ content: EducationalContent }> = ({ content }) => {
  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-purple-900">Business Education Center</CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Learn & Grow
          </Badge>
        </div>
        <CardDescription className="text-purple-700">
          Understanding your business better leads to better decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            What This Means
          </h4>
          <p className="text-sm text-gray-700">{content.whatThisMeans}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Why It Matters
          </h4>
          <p className="text-sm text-gray-700">{content.whyItMatters}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            How to Improve
          </h4>
          <ul className="space-y-2">
            {content.howToImprove.map((tip, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Industry Benchmarks
          </h4>
          <p className="text-sm text-gray-700">{content.industryBenchmarks}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Activity Feed with Badges
const EnhancedActivityFeed: React.FC<{ activities: EnhancedActivity[] }> = ({ activities }) => {
  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'AI': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Auto': return 'bg-green-100 text-green-800 border-green-200';
      case 'Insight': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Learning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Collaboration': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Intelligent Activity Feed
        </CardTitle>
        <CardDescription>
          Real-time insights and cross-departmental collaboration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{activity.time}</span>
                  {activity.badge && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getBadgeColor(activity.badge)}`}
                    >
                      {activity.badge}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {activity.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Unified Department Page Component
export const UnifiedDepartmentPage: React.FC<{ config: DepartmentConfig }> = ({ config }) => {
  const [tab, setTab] = React.useState('think');

  return (
    <DashboardLayout title={config.title} subtitle={config.subtitle}>
      <Tabs value={tab} onValueChange={setTab} className="mb-8">
        <TabsList aria-label="Department Tabs">
          <TabsTrigger value="think">THINK (Analysis)</TabsTrigger>
          <TabsTrigger value="see">SEE (Advice)</TabsTrigger>
          <TabsTrigger value="act">ACT (Resources)</TabsTrigger>
        </TabsList>
        {/* THINK: Analysis Tab */}
        <TabsContent value="think">
          <ErrorBoundary fallback={<div>Failed to load THINK tab.</div>}>
            {/* 1. KPI Grid */}
            <ContentSection title="Key Performance Indicators" className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {config.kpis.map((kpi, idx) => (
                  <Card key={idx} className="p-4 flex flex-col items-center">
                    <CardTitle>{kpi.title}</CardTitle>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    {kpi.delta && <span className="text-sm">{kpi.delta}</span>}
                  </Card>
                ))}
              </div>
            </ContentSection>
            {/* 2. Primary Chart */}
            <ContentSection title={config.charts.primary.title} className="mb-8">
              <p>{config.charts.primary.description}</p>
              <SimpleBarChart data={config.charts.primary.data} />
            </ContentSection>
            {/* 3. Secondary Chart */}
            <ContentSection title={config.charts.secondary.title} className="mb-8">
              <p>{config.charts.secondary.description}</p>
              <SimpleBarChart data={config.charts.secondary.data} />
            </ContentSection>
            {/* 4. Quick Actions */}
            <ContentSection title="Quick Actions" className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {config.quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className="flex flex-col items-center p-6 rounded-lg border group"
                    >
                      <div className="p-4 rounded-lg mb-3">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ContentSection>
            {/* 5. Recent Activities */}
            <ContentSection title="Recent Activities" className="mb-8">
              <div className="space-y-4">
                {config.activities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {activity.type}
                      </div>
                      <div>
                        <h4 className="font-medium">{activity.description}</h4>
                        <p className="text-sm">{activity.time}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium`}>{activity.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ContentSection>
          </ErrorBoundary>
        </TabsContent>
        {/* SEE: Advice Tab */}
        <TabsContent value="see">
          <ErrorBoundary fallback={<div>Failed to load SEE tab.</div>}>
            {config.businessInsights ? (
              <AIInsightsPanel insights={config.businessInsights} />
            ) : (
              <div className="p-8 text-center">No advice available for this department yet.</div>
            )}
          </ErrorBoundary>
        </TabsContent>
        {/* ACT: Resources Tab */}
        <TabsContent value="act">
          <ErrorBoundary fallback={<div>Failed to load ACT tab.</div>}>
            {config.educationalContent ? (
              <BusinessEducationPanel content={config.educationalContent} />
            ) : (
              <div className="p-8 text-center">No resources available for this department yet.</div>
            )}
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default UnifiedDepartmentPage; 