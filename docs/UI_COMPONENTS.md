# Nexus UI Component Library

## Overview

The Nexus UI Component Library provides a comprehensive set of components designed for data analysis, integration management, and business intelligence. This library focuses on connecting UI components to leverage data for analysis, particularly through the unified Microsoft 365 integration.

## 🎯 Core Components

### **Analytics Components**

#### **AnalyticsWidget**
```typescript
// src/domains/analytics/components/AnalyticsWidget.tsx
interface AnalyticsWidgetProps {
  title: string;
  description: string;
  data: AnalyticsData;
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  metrics: Metric[];
  insights: Insight[];
  actions: Action[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({
  title,
  description,
  data,
  chartType,
  metrics,
  insights,
  actions,
  loading,
  error,
  onRefresh
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} />}
        {data && (
          <div className="analytics-content">
            <MetricsDisplay metrics={metrics} />
            <ChartVisualization data={data} type={chartType} />
            <InsightsPanel insights={insights} />
            <ActionButtons actions={actions} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

#### **RealTimeMetrics**
```typescript
// src/domains/analytics/components/RealTimeMetrics.tsx
interface RealTimeMetricsProps {
  integrationId: string;
  updateInterval: number;
  metrics: MetricConfig[];
  onMetricUpdate: (metric: Metric) => void;
  showTrends?: boolean;
  showAlerts?: boolean;
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  integrationId,
  updateInterval,
  metrics,
  onMetricUpdate,
  showTrends = true,
  showAlerts = true
}) => {
  const { data, loading } = useRealTimeData(integrationId, updateInterval);
  
  return (
    <div className="real-time-metrics">
      <MetricsGrid metrics={data} loading={loading} />
      {showTrends && <TrendsChart data={data} />}
      {showAlerts && <AlertsPanel alerts={alerts} />}
    </div>
  );
};
```

### **Dashboard Components**

#### **UnifiedCommunicationDashboard**
```typescript
// src/domains/dashboard/components/UnifiedCommunicationDashboard.tsx
interface UnifiedCommunicationDashboardProps {
  data: CommunicationMetrics;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  config: DashboardConfig;
}

const UnifiedCommunicationDashboard: React.FC<UnifiedCommunicationDashboardProps> = ({
  data,
  loading,
  error,
  onRefresh,
  config
}) => {
  return (
    <div className="communication-dashboard">
      <DashboardHeader 
        title="Communication Analytics" 
        subtitle="Unified insights across Teams, Outlook, and collaboration tools"
        onRefresh={onRefresh}
      />
      
      {loading && <LoadingOverlay />}
      {error && <ErrorBanner error={error} onRetry={onRefresh} />}
      
      {data && (
        <div className="dashboard-grid">
          <TeamsActivityWidget data={data.teams} />
          <EmailEfficiencyWidget data={data.email} />
          <CollaborationHealthWidget data={data.collaboration} />
          <CrossPlatformInsightsWidget data={data.crossPlatform} />
        </div>
      )}
    </div>
  );
};
```

#### **CrossPlatformInsightsEngine**
```typescript
// src/domains/analytics/components/CrossPlatformInsightsEngine.tsx
interface CrossPlatformData {
  microsoft365: Microsoft365Analytics;
  googleWorkspace: GoogleWorkspaceAnalytics;
  crm: CRMAnalytics;
  communication: CommunicationAnalytics;
}

const CrossPlatformInsightsEngine: React.FC<{ data: CrossPlatformData }> = ({ data }) => {
  const insights = useMemo(() => {
    return {
      productivityComparison: compareProductivity(data.microsoft365, data.googleWorkspace),
      communicationEfficiency: analyzeCommunication(data.communication),
      businessIntelligence: generateBusinessInsights(data.crm),
      unifiedAnalytics: createUnifiedAnalytics(data)
    };
  }, [data]);

  return (
    <div className="cross-platform-insights">
      <ProductivityComparison insights={insights.productivityComparison} />
      <CommunicationEfficiency insights={insights.communicationEfficiency} />
      <BusinessIntelligence insights={insights.businessIntelligence} />
      <UnifiedAnalytics insights={insights.unifiedAnalytics} />
    </div>
  );
};
```

### **Integration Components**

#### **IntegrationMarketplace**
```typescript
// src/domains/integrations/pages/IntegrationMarketplacePage.tsx
interface MarketplaceIntegration {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  setupTime: string;
  features: string[];
  analyticsCapabilities: AnalyticsFeature[];
  dataFields: string[];
  setupComponent?: React.ComponentType<any>;
  isConnected?: boolean;
}

const IntegrationMarketplacePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="marketplace-page">
      <MarketplaceHeader />
      
      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <IntegrationGrid
        integrations={filteredIntegrations}
        viewMode={viewMode}
        onIntegrationSelect={handleIntegrationSelect}
      />
    </div>
  );
};
```

#### **Microsoft365Setup**
```typescript
// src/domains/integrations/components/MicrosoftTeamsSetup.tsx
interface Microsoft365SetupProps {
  onComplete?: (data: unknown) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, unknown>;
}

const Microsoft365Setup: React.FC<Microsoft365SetupProps> = ({
  onComplete,
  onCancel,
  existingConfig
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const setupSteps = [
    {
      id: 'authenticate',
      title: 'Connect to Microsoft 365',
      description: 'Authenticate with your Microsoft 365 account to access Teams, OneDrive, SharePoint, and Outlook'
    },
    {
      id: 'permissions',
      title: 'Configure Permissions',
      description: 'Review and approve the permissions needed for comprehensive Microsoft 365 integration'
    },
    {
      id: 'sync',
      title: 'Initial Data Sync',
      description: 'Import your Teams, OneDrive, SharePoint, and Outlook data'
    },
    {
      id: 'analytics',
      title: 'Enable Analytics',
      description: 'Set up comprehensive analytics for all Microsoft 365 services'
    }
  ];

  return (
    <div className="microsoft-365-setup">
      <SetupProgress steps={setupSteps} currentStep={currentStep} />
      
      <SetupContent
        step={currentStep}
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onPermissionApproval={handlePermissionApproval}
        onAnalyticsSetup={handleAnalyticsSetup}
      />
    </div>
  );
};
```

## 📊 Chart Components

### **LineChart**
```typescript
// src/domains/analytics/components/charts/LineChart.tsx
interface LineChartProps {
  data: ChartData;
  config: ChartConfig;
  onDataPointClick?: (point: DataPoint) => void;
  showTrends?: boolean;
  showAnnotations?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  config,
  onDataPointClick,
  showTrends = true,
  showAnnotations = true
}) => {
  return (
    <div className="line-chart">
      <ChartHeader title={config.title} subtitle={config.subtitle} />
      <ChartCanvas
        data={data}
        type="line"
        config={config}
        onDataPointClick={onDataPointClick}
      />
      {showTrends && <TrendsIndicator data={data} />}
      {showAnnotations && <AnnotationsPanel annotations={config.annotations} />}
    </div>
  );
};
```

### **BarChart**
```typescript
// src/domains/analytics/components/charts/BarChart.tsx
interface BarChartProps {
  data: ChartData;
  config: ChartConfig;
  orientation?: 'vertical' | 'horizontal';
  showValues?: boolean;
  showPercentages?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  config,
  orientation = 'vertical',
  showValues = true,
  showPercentages = false
}) => {
  return (
    <div className="bar-chart">
      <ChartHeader title={config.title} subtitle={config.subtitle} />
      <ChartCanvas
        data={data}
        type="bar"
        config={config}
        orientation={orientation}
      />
      {showValues && <ValuesDisplay data={data} />}
      {showPercentages && <PercentageDisplay data={data} />}
    </div>
  );
};
```

## 🎨 Metrics Components

### **MetricsDisplay**
```typescript
// src/domains/analytics/components/metrics/MetricsDisplay.tsx
interface MetricsDisplayProps {
  metrics: Metric[];
  layout: 'grid' | 'list' | 'cards';
  showTrends: boolean;
  showComparisons: boolean;
  showSparklines?: boolean;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  metrics,
  layout,
  showTrends,
  showComparisons,
  showSparklines = true
}) => {
  return (
    <div className={`metrics-display metrics-${layout}`}>
      {metrics.map(metric => (
        <MetricCard
          key={metric.key}
          metric={metric}
          showTrend={showTrends}
          showComparison={showComparisons}
          showSparkline={showSparklines}
        />
      ))}
    </div>
  );
};
```

### **MetricCard**
```typescript
// src/domains/analytics/components/metrics/MetricCard.tsx
interface MetricCardProps {
  metric: Metric;
  showTrend?: boolean;
  showComparison?: boolean;
  showSparkline?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  showTrend = true,
  showComparison = true,
  showSparkline = true,
  size = 'medium'
}) => {
  return (
    <Card className={`metric-card metric-${size}`}>
      <CardHeader>
        <CardTitle>{metric.label}</CardTitle>
        <CardDescription>{metric.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <MetricValue value={metric.value} format={metric.format} />
        {showTrend && <TrendIndicator trend={metric.trend} />}
        {showComparison && <ComparisonIndicator comparison={metric.comparison} />}
        {showSparkline && <Sparkline data={metric.history} />}
      </CardContent>
    </Card>
  );
};
```

## 🔍 Insights Components

### **InsightsPanel**
```typescript
// src/domains/analytics/components/insights/InsightsPanel.tsx
interface InsightsPanelProps {
  insights: Insight[];
  category: InsightCategory;
  actionable: boolean;
  onActionClick?: (action: InsightAction) => void;
  showConfidence?: boolean;
  showTrends?: boolean;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  category,
  actionable,
  onActionClick,
  showConfidence = true,
  showTrends = true
}) => {
  return (
    <div className="insights-panel">
      <InsightsHeader category={category} count={insights.length} />
      <InsightsList
        insights={insights}
        actionable={actionable}
        onActionClick={onActionClick}
        showConfidence={showConfidence}
        showTrends={showTrends}
      />
    </div>
  );
};
```

### **InsightCard**
```typescript
// src/domains/analytics/components/insights/InsightCard.tsx
interface InsightCardProps {
  insight: Insight;
  actionable?: boolean;
  onActionClick?: (action: InsightAction) => void;
  showConfidence?: boolean;
  showTrends?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  actionable = false,
  onActionClick,
  showConfidence = true,
  showTrends = true
}) => {
  return (
    <Card className="insight-card">
      <CardHeader>
        <div className="insight-header">
          <InsightIcon type={insight.type} />
          <CardTitle>{insight.title}</CardTitle>
          {showConfidence && <ConfidenceIndicator confidence={insight.confidence} />}
        </div>
        <CardDescription>{insight.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <InsightDetails insight={insight} />
        {showTrends && <TrendIndicator trend={insight.trend} />}
        {actionable && insight.actions && (
          <ActionButtons
            actions={insight.actions}
            onActionClick={onActionClick}
          />
        )}
      </CardContent>
    </Card>
  );
};
```

## 🔧 Configuration Components

### **AnalyticsConfig**
```typescript
// src/domains/analytics/components/config/AnalyticsConfig.tsx
interface AnalyticsConfigProps {
  config: AnalyticsConfig;
  onConfigChange: (config: AnalyticsConfig) => void;
  integrations: Integration[];
  userPreferences: UserPreferences;
}

const AnalyticsConfig: React.FC<AnalyticsConfigProps> = ({
  config,
  onConfigChange,
  integrations,
  userPreferences
}) => {
  return (
    <div className="analytics-config">
      <ConfigSection title="Data Sources">
        <IntegrationSelector
          integrations={integrations}
          selected={config.integrations}
          onChange={(integrations) => onConfigChange({ ...config, integrations })}
        />
        <RefreshIntervalSelector
          interval={config.dataRefreshInterval}
          onChange={(interval) => onConfigChange({ ...config, dataRefreshInterval: interval })}
        />
        <RealTimeToggle
          enabled={config.realTimeUpdates}
          onChange={(enabled) => onConfigChange({ ...config, realTimeUpdates: enabled })}
        />
      </ConfigSection>
      
      <ConfigSection title="Visualization">
        <ChartDefaultsConfig
          defaults={config.chartDefaults}
          onChange={(defaults) => onConfigChange({ ...config, chartDefaults: defaults })}
        />
        <ColorSchemeSelector
          scheme={config.colorScheme}
          onChange={(scheme) => onConfigChange({ ...config, colorScheme: scheme })}
        />
      </ConfigSection>
      
      <ConfigSection title="Performance">
        <CachingConfig
          enabled={config.cachingEnabled}
          expiration={config.cacheExpiration}
          onChange={(caching) => onConfigChange({ ...config, ...caching })}
        />
        <BatchProcessingToggle
          enabled={config.batchProcessing}
          onChange={(enabled) => onConfigChange({ ...config, batchProcessing: enabled })}
        />
      </ConfigSection>
    </div>
  );
};
```

## 🎯 Usage Patterns

### **Data-Driven Component Pattern**
```typescript
// Pattern for data-driven UI components
interface DataDrivenComponentProps<T> {
  data: T;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  analytics?: AnalyticsConfig;
}

const DataDrivenComponent = <T,>({ 
  data, 
  loading, 
  error, 
  onRefresh,
  analytics 
}: DataDrivenComponentProps<T>) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={onRefresh} />;
  
  return (
    <div className="analytics-container">
      <AnalyticsHeader data={data} />
      <AnalyticsVisualization data={data} config={analytics} />
      <AnalyticsInsights data={data} />
    </div>
  );
};
```

### **Real-time Component Pattern**
```typescript
// Pattern for real-time components
const useRealTimeData = (integrationId: string, interval: number) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const analytics = await analyticsService.getRealTimeData(integrationId);
      setData(analytics);
      setLoading(false);
    };

    fetchData();
    
    const intervalId = setInterval(fetchData, interval);
    return () => clearInterval(intervalId);
  }, [integrationId, interval]);

  return { data, loading };
};
```

## 📚 Component Library Structure

```
src/domains/analytics/components/
├── charts/
│   ├── LineChart.tsx
│   ├── BarChart.tsx
│   ├── PieChart.tsx
│   └── AreaChart.tsx
├── metrics/
│   ├── MetricsDisplay.tsx
│   ├── MetricCard.tsx
│   └── MetricValue.tsx
├── insights/
│   ├── InsightsPanel.tsx
│   ├── InsightCard.tsx
│   └── InsightIcon.tsx
├── config/
│   ├── AnalyticsConfig.tsx
│   └── DashboardConfig.tsx
└── shared/
    ├── LoadingSpinner.tsx
    ├── ErrorMessage.tsx
    └── RefreshButton.tsx
```

## 🎨 Styling Guidelines

### **Theme Variables**
```css
/* Analytics-specific theme variables */
:root {
  --analytics-primary: #3b82f6;
  --analytics-secondary: #64748b;
  --analytics-success: #10b981;
  --analytics-warning: #f59e0b;
  --analytics-error: #ef4444;
  
  --chart-grid: #e2e8f0;
  --chart-axis: #64748b;
  --chart-text: #1e293b;
  
  --metric-card-bg: #ffffff;
  --metric-card-border: #e2e8f0;
  --metric-card-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}
```

### **Component Styling**
```css
/* Analytics widget styling */
.analytics-widget {
  @apply bg-white rounded-lg border border-gray-200 shadow-sm;
  @apply p-6 space-y-4;
}

.analytics-widget-header {
  @apply flex items-center justify-between;
  @apply border-b border-gray-200 pb-4;
}

.analytics-widget-content {
  @apply space-y-4;
}

.metric-card {
  @apply bg-white rounded-lg border border-gray-200;
  @apply p-4 space-y-2;
  @apply hover:shadow-md transition-shadow;
}

.insight-card {
  @apply bg-white rounded-lg border border-gray-200;
  @apply p-4 space-y-3;
  @apply hover:border-blue-300 transition-colors;
}
```

## 🔧 Testing

### **Component Testing**
```typescript
// src/domains/analytics/components/__tests__/AnalyticsWidget.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsWidget } from '../AnalyticsWidget';

describe('AnalyticsWidget', () => {
  const mockData = {
    title: 'Test Analytics',
    description: 'Test description',
    data: { value: 100 },
    chartType: 'line' as const,
    metrics: [],
    insights: [],
    actions: []
  };

  it('renders correctly', () => {
    render(<AnalyticsWidget {...mockData} />);
    expect(screen.getByText('Test Analytics')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AnalyticsWidget {...mockData} loading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<AnalyticsWidget {...mockData} error="Test error" />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Focus**: Data Analysis and UI Integration 