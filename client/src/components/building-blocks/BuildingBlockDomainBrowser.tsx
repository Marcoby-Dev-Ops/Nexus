/**
 * Building Block Domain Browser
 * 
 * Enables users to browse the 7 building block domains (Identity, Revenue, Operations, etc.),
 * see their current state and scores through dashboards and KPIs, and interact with an
 * executive assistant chat interface to collaborate with Nexus on updating data and initiatives.
 * 
 * Follows the "See Think Act" paradigm:
 * - SEE: Current state, scores, and metrics
 * - THINK: AI insights and executive assistant collaboration
 * - ACT: Personalized playbook recommendations and actions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, DollarSign, Users, BookOpen, Settings, 
  TrendingUp, Package, ArrowRight, CheckCircle, 
  AlertCircle, Target, Zap, Brain, Activity,
  RefreshCw, Eye, BrainCircuit, Globe, Shield,
  Lightbulb, Clock, Star, Rocket, Briefcase,
  MessageSquare, FileText, PieChart, Calendar,
  Plus, BookOpen as BookOpenIcon, Target as TargetIcon,
  ChevronRight, ChevronDown, BarChart3, TrendingUp as TrendingUpIcon,
  AlertTriangle, Info, HelpCircle, Play, Pause, Square, X
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/Collapsible';
import { useAuth } from '@/hooks/index';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { 
  unifiedPlaybookService, 
  type PlaybookTemplate, 
  type UserJourney
} from '@/services/playbook/UnifiedPlaybookService';

interface BuildingBlockDomainBrowserProps {
  className?: string;
}

const BuildingBlockDomainBrowser: React.FC<BuildingBlockDomainBrowserProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { setHeaderContent } = useHeaderContext();
  const { profile } = useUserProfile();
  
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assistantContext, setAssistantContext] = useState<any | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [expandedPlaybooks, setExpandedPlaybooks] = useState<Set<string>>(new Set());

  // Set header content
  useEffect(() => {
    const displayName = profile?.display_name || profile?.first_name || 'Entrepreneur';
    setHeaderContent('Business Domains', `Your business through 7 fundamental building blocks, ${displayName}`);
    
    return () => setHeaderContent(null, null);
  }, [profile]);

  // Load domains data
  useEffect(() => {
    if (user?.id) {
      loadDomains();
    }
  }, [user?.id]);

  const loadDomains = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Check if user is authenticated before making API calls
      const { getAuthentikAuthService } = await import('@/core/auth/authentikAuthServiceInstance.dynamic');
      const authentikAuthService = await getAuthentikAuthService();
      const authResult = await authentikAuthService.isAuthenticated();
      const authenticated = authResult.success && authResult.data;
      
      if (!authenticated) {
        setLoading(false);
        return;
      }
      
      // TODO: Replace with unified playbook service when building block functionality is implemented
      const domainsData = await unifiedPlaybookService.getAvailablePlaybooks();
      setDomains(domainsData.data || []);
      
      // Load executive assistant context
      const context = await unifiedPlaybookService.getUserJourney(user.id, 'onboarding-v1');
      setAssistantContext(context);
    } catch (error) {
      console.error('Error loading domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDomains();
    setRefreshing(false);
  };

  const togglePlaybookExpansion = (playbookId: string) => {
    const newExpanded = new Set(expandedPlaybooks);
    if (newExpanded.has(playbookId)) {
      newExpanded.delete(playbookId);
    } else {
      newExpanded.add(playbookId);
    }
    setExpandedPlaybooks(newExpanded);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-success-subtle';
    if (score >= 60) return 'bg-warning-subtle';
    return 'bg-destructive-subtle';
  };

  const getMaturityColor = (level: string) => {
    switch (level) {
      case 'advanced': return 'text-purple bg-purple/10';
      case 'optimized': return 'text-accent bg-accent/10';
      case 'established': return 'text-success bg-success-subtle';
      case 'foundation': return 'text-warning bg-warning-subtle';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const renderDomainOverview = () => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Your Business Domains</CardTitle>
            <CardDescription>
              See your business through 7 fundamental building blocks. Each domain shows your current state, 
              health scores, and available playbooks for continuous improvement.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Overall Health */}
          <div className="text-center p-4 bg-primary-subtle rounded-lg border border-primary/20">
            <div className="text-3xl font-bold text-primary mb-2">
              {domains.length > 0 ? Math.round(domains.reduce((sum, d) => sum + d.healthScore, 0) / domains.length) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Overall Health</div>
          </div>
          
          {/* Domains Configured */}
          <div className="text-center p-4 bg-success-subtle rounded-lg border border-success/20">
            <div className="text-3xl font-bold text-success mb-2">
              {domains.filter(d => d.healthScore > 0).length}/7
            </div>
            <div className="text-sm text-muted-foreground">Domains Active</div>
          </div>
          
          {/* Total Playbooks */}
          <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="text-3xl font-bold text-accent mb-2">
              {domains.reduce((sum, d) => sum + d.playbooks.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Available Playbooks</div>
          </div>
          
          {/* AI Capabilities */}
          <div className="text-center p-4 bg-secondary-subtle rounded-lg border border-secondary/20">
            <div className="text-3xl font-bold text-secondary mb-2">
              {domains.reduce((sum, d) => sum + d.aiCapabilities.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">AI Capabilities</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDomainCard = (domain: any) => {
    const isSelected = selectedDomain === domain.id;
    const IconComponent = domain.icon;
    
    return (
      <motion.div
        key={domain.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            isSelected ? 'ring-2 ring-primary shadow-lg' : ''
          }`}
          onClick={() => setSelectedDomain(isSelected ? null : domain.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getHealthBgColor(domain.healthScore)}`}>
                  <IconComponent className={`h-6 w-6 ${getHealthColor(domain.healthScore)}`} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">{domain.name}</CardTitle>
                  <CardDescription className="text-sm">{domain.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getMaturityColor(domain.maturityLevel)}>
                  {domain.maturityLevel}
                </Badge>
                <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Health Score */}
              <div className="text-center">
                <div className={`text-2xl font-bold ${getHealthColor(domain.healthScore)}`}>
                  {domain.healthScore}%
                </div>
                <div className="text-xs text-muted-foreground">Health Score</div>
                <Progress value={domain.healthScore} className="mt-1" />
              </div>
              
              {/* Completion Rate */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {domain.completionRate}%
                </div>
                <div className="text-xs text-muted-foreground">Completion</div>
                <Progress value={domain.completionRate} className="mt-1" />
              </div>
              
              {/* Playbooks Count */}
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {domain.playbooks.length}
                </div>
                <div className="text-xs text-muted-foreground">Playbooks</div>
              </div>
            </div>

            {/* Key Metrics Preview */}
            {domain.keyMetrics.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Key Metrics</h4>
                <div className="grid grid-cols-2 gap-2">
                  {domain.keyMetrics.slice(0, 2).map(metric => (
                    <div key={metric.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">{metric.name}</span>
                      <span className={`font-medium ${
                        metric.status === 'healthy' ? 'text-green-600' :
                        metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {metric.currentValue}{metric.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDomain(domain.id);
                  setShowAssistant(true);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask Assistant
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDomain(domain.id);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderDomainDetails = (domain: any) => {
    const IconComponent = domain.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${getHealthBgColor(domain.healthScore)}`}>
                  <IconComponent className={`h-8 w-8 ${getHealthColor(domain.healthScore)}`} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{domain.name}</CardTitle>
                  <CardDescription className="text-base">{domain.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getMaturityColor(domain.maturityLevel)}>
                  {domain.maturityLevel}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setSelectedDomain(null)}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Health Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Health Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${getHealthColor(domain.healthScore)} mb-2`}>
                        {domain.healthScore}%
                      </div>
                      <Progress value={domain.healthScore} className="mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {domain.healthScore >= 80 ? 'Excellent health' :
                         domain.healthScore >= 60 ? 'Good health with room for improvement' :
                         'Needs attention - focus on critical playbooks'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Completion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {domain.completionRate}%
                      </div>
                      <Progress value={domain.completionRate} className="mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {domain.completionRate}% of available playbooks completed
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Zap className="h-5 w-5 mr-2" />
                        AI Capabilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {domain.aiCapabilities.length}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Available AI capabilities for this domain
                      </p>
                      <div className="space-y-1">
                        {domain.aiCapabilities.slice(0, 3).map((capability, index) => (
                          <div key={index} className="text-xs text-muted-foreground">
                            • {capability}
                          </div>
                        ))}
                        {domain.aiCapabilities.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{domain.aiCapabilities.length - 3} more
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Assistant Context */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Current Focus & Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Current Focus</h4>
                        <p className="text-sm text-muted-foreground">{domain.assistantContext.currentFocus}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Recent Activities</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {domain.assistantContext.recentActivities.slice(0, 2).map((activity, index) => (
                            <li key={index}>• {activity}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Pending Actions</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {domain.assistantContext.pendingActions.slice(0, 2).map((action, index) => (
                            <li key={index}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="playbooks" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Available Playbooks</h3>
                  <Badge variant="outline">{domain.playbooks.length} playbooks</Badge>
                </div>
                
                <div className="space-y-4">
                  {domain.playbooks.map((mapping) => (
                    <PlaybookCard 
                      key={mapping.playbook.id} 
                      mapping={mapping} 
                      isExpanded={expandedPlaybooks.has(mapping.playbook.id)}
                      onToggle={() => togglePlaybookExpansion(mapping.playbook.id)}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="metrics" className="space-y-4">
                <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {domain.keyMetrics.map((metric) => (
                    <Card key={metric.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{metric.name}</CardTitle>
                          <Badge className={
                            metric.status === 'healthy' ? 'bg-green-100 text-green-800' :
                            metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {metric.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-2xl font-bold">{metric.currentValue}{metric.unit}</div>
                          <div className="text-sm text-muted-foreground">Target: {metric.targetValue}{metric.unit}</div>
                        </div>
                        <Progress 
                          value={(metric.currentValue / metric.targetValue) * 100} 
                          className="mb-2" 
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Trend: {metric.trend}</span>
                          <span>Updated: {new Date(metric.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-4">
                <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
                <div className="space-y-4">
                  {assistantContext?.insights
                    .filter(insight => insight.domainId === domain.id)
                    .map((insight, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center">
                              {insight.insightType === 'risk' && <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />}
                              {insight.insightType === 'opportunity' && <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />}
                              {insight.insightType === 'recommendation' && <Target className="h-4 w-4 mr-2 text-blue-600" />}
                              {insight.title}
                            </CardTitle>
                            <Badge className={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="font-medium">Impact:</span> {insight.estimatedImpact}
                            </div>
                            <div>
                              <span className="font-medium">Time:</span> {insight.timeToImplement}
                            </div>
                            <div>
                              <span className="font-medium">Playbooks:</span> {insight.relatedPlaybooks.length}
                            </div>
                          </div>
                          {insight.actionable && (
                            <Button className="mt-3" size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              Take Action
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderExecutiveAssistant = () => {
    if (!assistantContext) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.3 }}
        className="fixed right-4 bottom-4 w-96 h-[600px] bg-white border rounded-lg shadow-xl z-50"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Executive Assistant
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowAssistant(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 h-[500px] overflow-y-auto">
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm">
                <strong>Current Focus:</strong> {assistantContext.currentDomain ? 
                  `Optimizing ${assistantContext.currentDomain} domain` : 
                  'Overall business optimization'
                }
              </p>
            </div>
            
            {assistantContext.insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="border p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
            ))}
            
            <div className="border p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Recent Conversations</h4>
              {assistantContext.recentConversations.map((conv, index) => (
                <div key={index} className="text-xs text-muted-foreground mb-1">
                  • {conv.topic} ({conv.domain})
                </div>
              ))}
            </div>
            
            <div className="border p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Pending Tasks</h4>
              {assistantContext.pendingTasks.map((task, index) => (
                <div key={index} className="text-xs text-muted-foreground mb-1">
                  • {task.task} ({task.priority})
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Ask about your business..." 
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button size="sm">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {renderDomainOverview()}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map(domain => renderDomainCard(domain))}
      </div>
      
      <AnimatePresence>
        {selectedDomain && (
          renderDomainDetails(domains.find(d => d.id === selectedDomain)!)
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showAssistant && renderExecutiveAssistant()}
      </AnimatePresence>
      
      {/* Floating Assistant Button */}
      {!showAssistant && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed right-4 bottom-4 z-40"
        >
          <Button 
            size="lg" 
            className="rounded-full shadow-lg"
            onClick={() => setShowAssistant(true)}
          >
            <Brain className="h-6 w-6 mr-2" />
            Ask Assistant
          </Button>
        </motion.div>
      )}
    </div>
  );
};

// Helper functions for PlaybookCard
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
    case 'in_progress': return <Play className="h-4 w-4 text-accent" />;
    case 'paused': return <Pause className="h-4 w-4 text-warning" />;
    case 'not_started': return <Square className="h-4 w-4 text-muted-foreground" />;
    default: return <Square className="h-4 w-4 text-muted-foreground" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-destructive-subtle text-destructive';
    case 'high': return 'bg-warning-subtle text-warning';
    case 'medium': return 'bg-accent/10 text-accent';
    case 'low': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

// Playbook Card Component
interface PlaybookCardProps {
  mapping: any;
  isExpanded: boolean;
  onToggle: () => void;
}

const PlaybookCard: React.FC<PlaybookCardProps> = ({ mapping, isExpanded, onToggle }) => {
  const { playbook, relevanceScore, priority, status, estimatedImpact, timeToComplete } = mapping;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status)}
              <div>
                <CardTitle className="text-base">{playbook.title}</CardTitle>
                <CardDescription className="text-sm">{playbook.description}</CardDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getPriorityColor(priority)}>
              {priority}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{relevanceScore.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Relevance</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{estimatedImpact}</div>
                <div className="text-xs text-muted-foreground">Estimated Impact</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{timeToComplete}</div>
                <div className="text-xs text-muted-foreground">Time to Complete</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Mission Objectives</h4>
                <p className="text-sm text-muted-foreground">{playbook.missionObjectives.primary}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Success Criteria</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {playbook.missionObjectives.successCriteria.slice(0, 3).map((criterion, index) => (
                    <li key={index}>• {criterion}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Start Playbook
                </Button>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default BuildingBlockDomainBrowser;
