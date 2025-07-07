/**
 * UnifiedPages.tsx
 * Unified page components to eliminate redundant page implementations
 * 
 * Pillar: 1 (Efficient Automation) - Reduces page maintenance overhead
 * Pillar: 5 (Speed & Performance) - Eliminates redundant page code
 */

import React, { useEffect } from 'react';
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
import { analyticsService } from '@/lib/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';

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
                className={`w-full text-left p-4 rounded-lg transition-colors duration-200 ${
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
 * UnifiedCallbackPage - Handles OAuth, etc. callbacks
 */
export const UnifiedCallbackPage: React.FC<{ config: CallbackPageConfig }> = ({ config }) => {
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');

  React.useEffect(() => {
    // Mocking the async operation
    const timer = setTimeout(() => {
      // Logic to determine success/error would go here
      setStatus('success');
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
              <div className="text-success text-4xl mb-4">✓</div>
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
              <div className="text-destructive text-4xl mb-4">✗</div>
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

// ===== UNIFIED DEPARTMENT PAGE COMPONENTS =====

// AI-Powered Insights Panel Component
const AIInsightsPanel: React.FC<{ insights: BusinessInsight }> = ({ insights }) => {
  const [activeInsight, setActiveInsight] = React.useState<string>('recommendations');

  return (
    <Card className="border-primary-subtle bg-gradient-to-br from-primary-subtle to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <CardTitle className="text-primary-foreground">AI Business Intelligence</CardTitle>
          <Badge variant="secondary" className="bg-primary-foreground text-primary">
            Powered by Nexus AI
          </Badge>
        </div>
        <CardDescription className="text-primary-foreground/80">
          Intelligent insights that connect your department to the bigger picture
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeInsight} onValueChange={setActiveInsight} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-primary-subtle">
            <TabsTrigger value="recommendations" className="text-xs">AI Recommendations</TabsTrigger>
            <TabsTrigger value="impact" className="text-xs">Cross-Dept Impact</TabsTrigger>
            <TabsTrigger value="drivers" className="text-xs">Business Drivers</TabsTrigger>
            <TabsTrigger value="practices" className="text-xs">Best Practices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommendations" className="space-y-4 mt-4">
            {insights.aiRecommendations.map((rec, index) => (
              <Alert key={index} className="border-success-subtle bg-success-subtle">
                <Zap className="h-4 w-4 text-success" />
                <h3 className="font-semibold text-success-foreground">AI Recommendation #{index + 1}</h3>
                <p className="text-success-foreground/80">{rec}</p>
              </Alert>
            ))}
          </TabsContent>
          
          <TabsContent value="impact" className="space-y-4 mt-4">
            {insights.crossDepartmentalImpact.map((impact, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border">
                <ArrowUpRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{impact}</p>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="drivers" className="space-y-4 mt-4">
            {insights.keyBusinessDrivers.map((driver, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border">
                <Target className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{driver}</p>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="practices" className="space-y-4 mt-4">
            {insights.bestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border">
                <Award className="w-4 h-4 text-warning mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{practice}</p>
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
    <Card className="border-secondary-subtle bg-gradient-to-br from-secondary-subtle to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-secondary" />
          <CardTitle className="text-secondary-foreground">Business Education Center</CardTitle>
          <Badge variant="secondary" className="bg-secondary-foreground text-secondary">
            Learn & Grow
          </Badge>
        </div>
        <CardDescription className="text-secondary-foreground/80">
          Understanding your business better leads to better decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-background rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            What This Means
          </h4>
          <p className="text-sm text-muted-foreground">{content.whatThisMeans}</p>
        </div>
        
        <div className="bg-background rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Why It Matters
          </h4>
          <p className="text-sm text-muted-foreground">{content.whyItMatters}</p>
        </div>
        
        <div className="bg-background rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            How to Improve
          </h4>
          <ul className="space-y-2">
            {content.howToImprove.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-background rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Industry Benchmarks
          </h4>
          <p className="text-sm text-muted-foreground">{content.industryBenchmarks}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Activity Feed Component
const EnhancedActivityFeed: React.FC<{ activities: EnhancedActivity[] }> = ({ activities }) => {
  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'AI': return 'bg-primary-subtle text-primary border-primary-subtle';
      case 'Auto': return 'bg-success-subtle text-success border-success-subtle';
      case 'Insight': return 'bg-secondary-subtle text-secondary border-secondary-subtle';
      case 'Learning': return 'bg-warning-subtle text-warning border-warning-subtle';
      case 'Collaboration': return 'bg-info-subtle text-info border-info-subtle';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Stream</CardTitle>
        <CardDescription>Live feed of key events and actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
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
  )
};

// Main Component
export const UnifiedDepartmentPage: React.FC<{ config: DepartmentConfig }> = ({ config }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      analyticsService.init(user.id, { department: config.title });
      analyticsService.track('department_page_viewed', {
        department: config.title,
      });
    }
    return () => analyticsService.reset();
  }, [user, config.title]);

  const handleActionClick = (action: QuickAction) => {
    analyticsService.track('department_quick_action_clicked', {
      department: config.title,
      action: action.label,
    });
    action.onClick();
  };

  return (
    <DashboardLayout 
      title={config.title}
      subtitle={config.subtitle}
    >
      <ContentSection title="Key Performance Indicators">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {config.kpis.map((kpi, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.delta && <p className="text-xs text-muted-foreground">{kpi.delta}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </ContentSection>

      <ContentSection title="Quick Actions">
        <div className="flex flex-wrap gap-4">
          {config.quickActions.map((action, index) => (
            <Button key={index} variant="outline" onClick={() => handleActionClick(action)}>
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </ContentSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <ContentSection title="Analytics Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{config.charts.primary.title}</CardTitle>
                <CardDescription>{config.charts.primary.description}</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <SimpleBarChart data={config.charts.primary.data} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{config.charts.secondary.title}</CardTitle>
                <CardDescription>{config.charts.secondary.description}</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <SimpleBarChart data={config.charts.secondary.data} />
              </CardContent>
            </Card>
          </div>
        </ContentSection>

        <ContentSection title="Live Activity">
          <EnhancedActivityFeed activities={config.activities} />
        </ContentSection>
      </div>

      {config.businessInsights && (
        <ContentSection title="Strategic Intelligence">
          <AIInsightsPanel insights={config.businessInsights} />
        </ContentSection>
      )}

      {config.educationalContent && (
        <ContentSection title="Knowledge Hub">
          <BusinessEducationPanel content={config.educationalContent} />
        </ContentSection>
      )}
    </DashboardLayout>
  );
};

export default UnifiedDepartmentPage; 