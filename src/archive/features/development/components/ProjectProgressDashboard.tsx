import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Code, 
  TestTube, 
  BookOpen, 
  Shield, 
  Zap, 
  Users, 
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  BarChart3,
  Calendar,
  Activity,
  Star,
  Award,
  Rocket,
  Brain,
  Eye,
  Settings,
  Database,
  Globe,
  Smartphone
} from 'lucide-react';

interface ProjectMetrics {
  codeQuality: {
    components: number;
    linesOfCode: number;
    typeScriptCoverage: number;
    eslintIssues: number;
    duplicateCodePercentage: number;
  };
  testing: {
    unitTests: number;
    integrationTests: number;
    e2eTests: number;
    testCoverage: number;
    passRate: number;
  };
  documentation: {
    storybookStories: number;
    documentedComponents: number;
    apiDocumentation: number;
    readmeCompleteness: number;
  };
  performance: {
    buildTime: number;
    bundleSize: number;
    lighthouseScore: number;
    loadTime: number;
  };
  security: {
    vulnerabilities: number;
    securityScore: number;
    dependencyAudit: number;
  };
  development: {
    velocity: number;
    burndownRate: number;
    commitFrequency: number;
    prMergeTime: number;
  };
}

interface FeatureProgress {
  id: string;
  name: string;
  category: 'core' | 'ai' | 'ui' | 'integration' | 'infrastructure';
  progress: number;
  status: 'planning' | 'development' | 'testing' | 'review' | 'complete';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: string;
  blockers: string[];
}

interface ProjectHealth {
  overall: number;
  codeQuality: number;
  testing: number;
  documentation: number;
  performance: number;
  security: number;
  teamVelocity: number;
}

export const ProjectProgressDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    codeQuality: {
      components: 156,
      linesOfCode: 45230,
      typeScriptCoverage: 94,
      eslintIssues: 12,
      duplicateCodePercentage: 3.2
    },
    testing: {
      unitTests: 234,
      integrationTests: 45,
      e2eTests: 18,
      testCoverage: 78,
      passRate: 96
    },
    documentation: {
      storybookStories: 89,
      documentedComponents: 134,
      apiDocumentation: 67,
      readmeCompleteness: 85
    },
    performance: {
      buildTime: 2.4,
      bundleSize: 1.2,
      lighthouseScore: 92,
      loadTime: 1.8
    },
    security: {
      vulnerabilities: 2,
      securityScore: 88,
      dependencyAudit: 94
    },
    development: {
      velocity: 23,
      burndownRate: 87,
      commitFrequency: 4.2,
      prMergeTime: 1.5
    }
  });

  const [features, setFeatures] = useState<FeatureProgress[]>([
    {
      id: 'rag-system',
      name: 'RAG System Implementation',
      category: 'ai',
      progress: 85,
      status: 'testing',
      priority: 'critical',
      assignee: 'AI Team',
      dueDate: '2025-01-20',
      blockers: ['Performance optimization needed']
    },
    {
      id: 'profile-system',
      name: 'World-Class Profile System',
      category: 'core',
      progress: 95,
      status: 'review',
      priority: 'critical',
      assignee: 'Frontend Team',
      dueDate: '2025-01-18',
      blockers: []
    },
    {
      id: 'dashboard-enhancement',
      name: 'Enhanced Dashboard',
      category: 'ui',
      progress: 70,
      status: 'development',
      priority: 'high',
      assignee: 'UI Team',
      dueDate: '2025-01-25',
      blockers: ['API integration pending']
    },
    {
      id: 'testing-infrastructure',
      name: 'Testing Infrastructure',
      category: 'infrastructure',
      progress: 60,
      status: 'development',
      priority: 'high',
      assignee: 'DevOps Team',
      dueDate: '2025-01-22',
      blockers: []
    },
    {
      id: 'storybook-coverage',
      name: 'Complete Storybook Coverage',
      category: 'ui',
      progress: 45,
      status: 'development',
      priority: 'medium',
      assignee: 'Frontend Team',
      dueDate: '2025-02-01',
      blockers: []
    }
  ]);

  const calculateProjectHealth = (): ProjectHealth => {
    return {
      overall: 84,
      codeQuality: 88,
      testing: 78,
      documentation: 82,
      performance: 90,
      security: 86,
      teamVelocity: 85
    };
  };

  const health = calculateProjectHealth();

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-success bg-success/10';
    if (score >= 75) return 'text-primary bg-primary/10';
    if (score >= 60) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Calendar className="w-4 h-4" />;
      case 'development': return <Code className="w-4 h-4" />;
      case 'testing': return <TestTube className="w-4 h-4" />;
      case 'review': return <Eye className="w-4 h-4" />;
      case 'complete': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <Database className="w-4 h-4" />;
      case 'ai': return <Brain className="w-4 h-4" />;
      case 'ui': return <Smartphone className="w-4 h-4" />;
      case 'integration': return <Globe className="w-4 h-4" />;
      case 'infrastructure': return <Settings className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nexus Development Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time project progress, quality metrics, and team performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Project Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 md:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Project Health Score
            </CardTitle>
            <CardDescription>Overall project health and quality indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              <div className="text-center">
                <div className={`text-4xl font-bold rounded-lg p-4 ${getHealthColor(health.overall)}`}>
                  {health.overall}%
                </div>
                <p className="text-sm font-medium mt-2">Overall</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold rounded-lg p-4 ${getHealthColor(health.codeQuality)}`}>
                  {health.codeQuality}%
                </div>
                <p className="text-xs mt-1">Code Quality</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold rounded-lg p-4 ${getHealthColor(health.testing)}`}>
                  {health.testing}%
                </div>
                <p className="text-xs mt-1">Testing</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold rounded-lg p-4 ${getHealthColor(health.documentation)}`}>
                  {health.documentation}%
                </div>
                <p className="text-xs mt-1">Documentation</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold rounded-lg p-4 ${getHealthColor(health.performance)}`}>
                  {health.performance}%
                </div>
                <p className="text-xs mt-1">Performance</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold rounded-lg p-4 ${getHealthColor(health.security)}`}>
                  {health.security}%
                </div>
                <p className="text-xs mt-1">Security</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold rounded-lg p-4 ${getHealthColor(health.teamVelocity)}`}>
                  {health.teamVelocity}%
                </div>
                <p className="text-xs mt-1">Velocity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Development Velocity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Development Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Story Points/Sprint</span>
                    <span className="font-bold">{metrics.development.velocity}</span>
                  </div>
                  <Progress value={metrics.development.velocity * 4} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Burndown Rate</span>
                    <span className="font-bold">{metrics.development.burndownRate}%</span>
                  </div>
                  <Progress value={metrics.development.burndownRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Code Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Code Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Components</span>
                    <Badge variant="outline">{metrics.codeQuality.components}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Lines of Code</span>
                    <Badge variant="outline">{metrics.codeQuality.linesOfCode.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">TypeScript Coverage</span>
                    <Badge variant="outline">{metrics.codeQuality.typeScriptCoverage}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ESLint Issues</span>
                    <Badge variant={metrics.codeQuality.eslintIssues > 20 ? "destructive" : "secondary"}>
                      {metrics.codeQuality.eslintIssues}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testing Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Testing Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Unit Tests</span>
                    <Badge variant="outline">{metrics.testing.unitTests}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Integration Tests</span>
                    <Badge variant="outline">{metrics.testing.integrationTests}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">E2E Tests</span>
                    <Badge variant="outline">{metrics.testing.e2eTests}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Coverage</span>
                    <Badge variant={metrics.testing.testCoverage > 80 ? "default" : "secondary"}>
                      {metrics.testing.testCoverage}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature) => (
              <Card key={feature.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {getCategoryIcon(feature.category)}
                      <div>
                        <h3 className="font-semibold">{feature.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.assignee} • Due: {feature.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(feature.priority)}`}></div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getStatusIcon(feature.status)}
                        {feature.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Progress</span>
                      <span className="font-medium">{feature.progress}%</span>
                    </div>
                    <Progress value={feature.progress} className="h-2" />
                    
                    {feature.blockers.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Blockers: {feature.blockers.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Code Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>TypeScript Coverage</span>
                    <span className="font-bold">{metrics.codeQuality.typeScriptCoverage}%</span>
                  </div>
                  <Progress value={metrics.codeQuality.typeScriptCoverage} />
                  
                  <div className="flex justify-between items-center">
                    <span>Test Coverage</span>
                    <span className="font-bold">{metrics.testing.testCoverage}%</span>
                  </div>
                  <Progress value={metrics.testing.testCoverage} />
                  
                  <div className="flex justify-between items-center">
                    <span>Documentation Coverage</span>
                    <span className="font-bold">{metrics.documentation.readmeCompleteness}%</span>
                  </div>
                  <Progress value={metrics.documentation.readmeCompleteness} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security & Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Security Score</span>
                    <span className="font-bold">{metrics.security.securityScore}%</span>
                  </div>
                  <Progress value={metrics.security.securityScore} />
                  
                  <div className="flex justify-between items-center">
                    <span>Lighthouse Score</span>
                    <span className="font-bold">{metrics.performance.lighthouseScore}%</span>
                  </div>
                  <Progress value={metrics.performance.lighthouseScore} />
                  
                  <div className="flex justify-between items-center">
                    <span>Vulnerabilities</span>
                    <Badge variant={metrics.security.vulnerabilities > 5 ? "destructive" : "secondary"}>
                      {metrics.security.vulnerabilities}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-warning" />
                <div className="text-2xl font-bold">{metrics.performance.buildTime}min</div>
                <div className="text-sm text-muted-foreground">Build Time</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{metrics.performance.bundleSize}MB</div>
                <div className="text-sm text-muted-foreground">Bundle Size</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
                <div className="text-2xl font-bold">{metrics.performance.lighthouseScore}</div>
                <div className="text-sm text-muted-foreground">Lighthouse Score</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-secondary" />
                <div className="text-2xl font-bold">{metrics.performance.loadTime}s</div>
                <div className="text-sm text-muted-foreground">Load Time</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Commits per Day</span>
                    <span className="font-bold">{metrics.development.commitFrequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PR Merge Time</span>
                    <span className="font-bold">{metrics.development.prMergeTime} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sprint Velocity</span>
                    <span className="font-bold">{metrics.development.velocity} points</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning" />
                    <span className="text-sm">Profile system completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning" />
                    <span className="text-sm">RAG testing framework established</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning" />
                    <span className="text-sm">CI/CD pipeline optimized</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 