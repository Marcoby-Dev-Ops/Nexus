/**
 * UnifiedPages.tsx
 * Unified page components to eliminate redundant page implementations
 * 
 * Pillar: 1 (Efficient Automation) - Reduces page maintenance overhead
 * Pillar: 5 (Speed & Performance) - Eliminates redundant page code
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { 
  Brain, 
  Zap, 
  ArrowUpRight, 
  Target, 
  Award, 
  BookOpen, 
  Lightbulb, 
  TrendingUp, 
  CheckCircle, 
  Globe 
} from 'lucide-react';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';

// Type definitions
interface UnifiedMetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface BusinessInsight {
  aiRecommendations: string[];
  crossDepartmentalImpact: string[];
  keyBusinessDrivers: string[];
  bestPractices: string[];
}

interface EducationalContent {
  whatThisMeans: string;
  whyItMatters: string;
  howToImprove: string[];
  industryBenchmarks: string;
}

interface EnhancedActivity {
  description: string;
  time: string;
  status: string;
  badge?: string;
}

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface DepartmentConfig {
  title: string;
  subtitle: string;
  kpis: Array<{ title: string; value: string | number; delta?: string }>;
  quickActions: QuickAction[];
  charts: {
    primary: { title: string; description: string; data: any };
    secondary: { title: string; description: string; data: any };
  };
  activities: EnhancedActivity[];
  businessInsights?: BusinessInsight;
  educationalContent?: EducationalContent;
}

// Mock components and services
const DashboardLayout: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const ContentSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <h2 className="text-xl font-semibold">{title}</h2>
    {children}
  </div>
);

const SimpleBarChart: React.FC<{ data: any }> = ({ data }) => (
  <div className="h-full flex items-end justify-center space-x-1">
    <div className="text-xs text-muted-foreground">Chart placeholder</div>
  </div>
);

// Mock analytics service
const analyticsService = {
  init: (userId: string, config: any) => console.log('Analytics init:', userId, config),
  track: (event: string, data: any) => console.log('Analytics track:', event, data),
  reset: () => console.log('Analytics reset')
};

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
}

interface SettingsConfig {
  title: string;
  description: string;
  sections: SettingsSection[];
}

export const UnifiedSettingsPage: React.FC<{ config: SettingsConfig }> = ({ config }) => {
  const [activeSection, setActiveSection] = React.useState(config.sections[0]?.id);

  const currentSection = config.sections.find(s => s.id === activeSection);
  const CurrentComponent = currentSection?.component;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{config.title}</h1>
        <p className="text-muted-foreground mt-2">{config.description}</p>
      </div>
      
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          {config.sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="text-xs">
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {config.sections.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <Card>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </CardHeader>
              <CardContent>
                <section.component />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
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
            {insights.aiRecommendations.map((rec: string, index: number) => (
              <Alert key={index} className="border-success-subtle bg-success-subtle">
                <Zap className="h-4 w-4 text-success" />
                <h3 className="font-semibold text-success-foreground">AI Recommendation #{index + 1}</h3>
                <p className="text-success-foreground/80">{rec}</p>
              </Alert>
            ))}
          </TabsContent>
          
          <TabsContent value="impact" className="space-y-4 mt-4">
            {insights.crossDepartmentalImpact.map((impact: string, index: number) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border">
                <ArrowUpRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{impact}</p>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="drivers" className="space-y-4 mt-4">
            {insights.keyBusinessDrivers.map((driver: string, index: number) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border">
                <Target className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{driver}</p>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="practices" className="space-y-4 mt-4">
            {insights.bestPractices.map((practice: string, index: number) => (
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
            {content.howToImprove.map((tip: string, index: number) => (
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
          {config.kpis.map((kpi: any, index: number) => (
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
          {config.quickActions.map((action: QuickAction, index: number) => (
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