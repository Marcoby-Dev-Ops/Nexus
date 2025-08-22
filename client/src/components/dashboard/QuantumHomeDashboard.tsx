/**
 * Quantum Home Dashboard
 * 
 * The home page that reflects the Quantum Business Model framework.
 * Showcases the 7 irreducible building blocks that compose any business,
 * providing a universal schema for understanding and managing business health.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, DollarSign, Users, BookOpen, Settings, 
  TrendingUp, Package, ArrowRight, CheckCircle, 
  AlertCircle, Target, Zap, Brain, Activity,
  RefreshCw, Eye, BrainCircuit, Globe, Shield,
  Lightbulb, Clock, Star, Rocket, Briefcase,
  MessageSquare, FileText, PieChart, Calendar,
  Plus, BookOpen as BookOpenIcon, Target as TargetIcon
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAuth } from '@/hooks/index';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useBusinessBody, useBusinessAlerts } from '@/hooks/business-systems/useBusinessBody';
import type { BusinessSystem, SystemHealth } from '@/core/business-systems/BusinessSystemTypes';
import { 
  getAllQuantumBlocks, 
  getQuantumBlock, 
  type QuantumBlock, 
  type QuantumBusinessProfile,
  calculateBusinessHealth,
  generateQuantumInsights,
  generateQuantumRecommendations
} from '@/core/config/quantumBusinessModel';
import { quantumBusinessService } from '@/services/QuantumBusinessService';

interface QuantumBlockStatus {
  blockId: string;
  strength: number;
  health: number;
  lastUpdated: string;
  insights: string[];
  recommendations: string[];
}

interface QuantumHomeDashboardProps {
  className?: string;
}

const QuantumHomeDashboard: React.FC<QuantumHomeDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { setHeaderContent } = useHeaderContext();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  
  const [quantumProfile, setQuantumProfile] = useState<QuantumBusinessProfile | null>(null);
  const [blockStatuses, setBlockStatuses] = useState<QuantumBlockStatus[]>([]);
  const [overallHealth, setOverallHealth] = useState<number>(0);
  const [maturityLevel, setMaturityLevel] = useState<string>('startup');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  // System icons for the widget
  const SYSTEM_ICONS = {
    cashFlow: Heart,
    intelligence: Brain,
    customerIntel: Activity,
    operations: Zap,
    infrastructure: Shield,
    knowledgeMgmt: BookOpen,
    growthDev: TrendingUp,
    riskMgmt: AlertTriangle
  };

  const getSystemHealthColor = (health: SystemHealth) => {
    switch (health) {
      case 'optimal': return 'text-green-600';
      case 'healthy': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'failed': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: SystemHealth) => {
    switch (health) {
      case 'optimal':
      case 'healthy':
        return <CheckCircle className="w-3 h-3" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3" />;
      case 'critical':
      case 'failed':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const quantumBlocks = getAllQuantumBlocks();

  // Business body hooks
  const {
    businessBody,
    loading: businessBodyLoading,
    error: businessBodyError,
    overallHealth: businessOverallHealth,
    healthySystems,
    totalSystems,
    systemHealthPercentage,
    refresh: refreshBusinessBody
  } = useBusinessBody();

  const {
    criticalAlerts,
    hasCriticalAlerts,
    hasHighPriorityItems
  } = useBusinessAlerts();

  // Set header content
  useEffect(() => {
    const displayName = profile?.display_name || profile?.first_name || 'Entrepreneur';
    setHeaderContent('Your Business Snapshot', `Your business through the lens of 7 fundamental building blocks, ${displayName}`);
    
    return () => setHeaderContent(null, null);
  }, [profile]);

  // Load quantum profile data
  useEffect(() => {
    if (user?.id) {
      loadQuantumProfile();
    }
  }, [user?.id]);

  const loadQuantumProfile = async () => {
    try {
      setLoading(true);
      // Use profile from UserContext which has company information
      const companyId = profile?.company_id;
      
      if (!companyId) {
        // No company ID - show onboarding state
        setBlockStatuses(quantumBlocks.map(block => ({
          blockId: block.id,
          strength: 0,
          health: 0,
          lastUpdated: new Date().toISOString(),
          insights: [],
          recommendations: []
        })));
        setLoading(false);
        return;
      }

      const response = await quantumBusinessService.getQuantumProfile(companyId);
      
      if (response.success && response.data) {
        setQuantumProfile(response.data);
        setOverallHealth(response.data.healthScore);
        setMaturityLevel(response.data.maturityLevel);
        
        // Create block statuses from profile
        const statuses = response.data.blocks.map(block => ({
          blockId: block.blockId,
          strength: block.strength,
          health: block.health,
          lastUpdated: response.data?.lastUpdated || new Date().toISOString(),
          insights: [],
          recommendations: []
        }));
        setBlockStatuses(statuses);
      } else {
        // No quantum profile exists yet - show onboarding state
        setBlockStatuses(quantumBlocks.map(block => ({
          blockId: block.id,
          strength: 0,
          health: 0,
          lastUpdated: new Date().toISOString(),
          insights: [],
          recommendations: []
        })));
      }
    } catch (error) {
      console.error('Error loading quantum profile:', error);
      // Show onboarding state on error
      setBlockStatuses(quantumBlocks.map(block => ({
        blockId: block.id,
        strength: 0,
        health: 0,
        lastUpdated: new Date().toISOString(),
        insights: [],
        recommendations: []
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQuantumProfile();
    setRefreshing(false);
  };

  const handleExpandToggle = () => {
    setExpanded(!expanded);
    setSelectedSystem(null); // Clear selected system when collapsing
  };

  const handleSystemClick = (systemId: string) => {
    setSelectedSystem(systemId);
    setExpanded(true);
  };

  const getBlockStatus = (blockId: string): QuantumBlockStatus | undefined => {
    return blockStatuses.find(status => status.blockId === blockId);
  };

  const getHealthColor = (health: number): string => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthColor = (strength: number): string => {
    if (strength >= 80) return 'text-blue-600';
    if (strength >= 60) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getMaturityBadgeVariant = (level: string) => {
    switch (level) {
      case 'mature': return 'default';
      case 'scaling': return 'secondary';
      case 'growing': return 'outline';
      default: return 'destructive';
    }
  };

  // Handle block setup - navigate to quantum onboarding
  const handleBlockSetup = (blockId: string) => {
    navigate('/onboarding/quantum', { 
      state: { 
        initialBlock: blockId,
        fromDashboard: true 
      } 
    });
  };

  // Handle block details view
  const handleBlockDetails = (blockId: string) => {
    navigate(`/quantum/blocks/${blockId}`, { 
      state: { 
        blockId,
        fromDashboard: true 
      } 
    });
  };

  // Handle block strengthening
  const handleBlockStrengthen = (blockId: string) => {
    navigate(`/quantum/blocks/${blockId}/strengthen`, { 
      state: { 
        blockId,
        fromDashboard: true 
      } 
    });
  };

  // Handle start quantum setup
  const handleStartQuantumSetup = () => {
    navigate('/onboarding/quantum', { 
      state: { 
        fromDashboard: true 
      } 
    });
  };

  const renderQuantumBlock = (block: QuantumBlock) => {
    const status = getBlockStatus(block.id);
    const hasData = status && (status.strength > 0 || status.health > 0);
    
    return (
      <motion.div
        key={block.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <Card 
          className={`h-full cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedBlock === block.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setSelectedBlock(selectedBlock === block.id ? null : block.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hasData ? 'bg-primary/10' : 'bg-muted'}`}>
                  <block.icon className={`h-5 w-5 ${hasData ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">{block.name}</CardTitle>
                  <CardDescription className="text-sm">{block.description}</CardDescription>
                </div>
              </div>
              {hasData && (
                <Badge variant="outline" className="text-xs">
                  {block.category}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {hasData ? (
              <div className="space-y-4">
                {/* Strength & Health Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Strength</span>
                      <span className={getStrengthColor(status!.strength)}>{status!.strength}%</span>
                    </div>
                    <Progress value={status!.strength} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Health</span>
                      <span className={getHealthColor(status!.health)}>{status!.health}%</span>
                    </div>
                    <Progress value={status!.health} className="h-2" />
                  </div>
                </div>

                {/* AI Capabilities Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">AI Capabilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {block.aiCapabilities.slice(0, 2).map(capability => (
                      <Badge key={capability.id} variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {capability.name}
                      </Badge>
                    ))}
                    {block.aiCapabilities.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{block.aiCapabilities.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBlockDetails(block.id);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBlockStrengthen(block.id);
                    }}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Strengthen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="p-3 rounded-full bg-muted/50 mx-auto w-fit mb-3">
                  <block.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your {block.name.toLowerCase()} to unlock insights and AI capabilities
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBlockSetup(block.id);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Set Up {block.name}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderBusinessHealthOverview = () => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Business Health Overview</CardTitle>
            <CardDescription>
              Your business through the lens of 7 fundamental building blocks and system health
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getMaturityBadgeVariant(maturityLevel)} className="text-sm">
              {maturityLevel.charAt(0).toUpperCase() + maturityLevel.slice(1)} Stage
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Overall Health Score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{overallHealth}%</div>
            <div className="text-sm text-muted-foreground">Overall Health</div>
            <Progress value={overallHealth} className="mt-2" />
          </div>
          
          {/* Quantum Blocks Status */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {blockStatuses.filter(s => s.strength > 0).length}/7
            </div>
            <div className="text-sm text-muted-foreground">Blocks Configured</div>
          </div>
          
          {/* AI Capabilities */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {quantumBlocks.reduce((total, block) => total + block.aiCapabilities.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">AI Capabilities Available</div>
          </div>
        </div>

        {/* System Health Grid */}
        {businessBody && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">System Health</h3>
                <p className="text-sm text-muted-foreground">
                  {healthySystems}/{totalSystems} systems healthy
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasCriticalAlerts && (
                  <Badge variant="destructive" className="text-sm">
                    {criticalAlerts.length} Critical
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleExpandToggle}
                  className="text-xs"
                >
                  {expanded ? 'Collapse' : 'Expand'}
                </Button>
              </div>
            </div>

            {/* System Health Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Object.entries(businessBody.systems).map(([systemId, system]) => {
                const Icon = SYSTEM_ICONS[systemId as BusinessSystem];
                const healthColor = getSystemHealthColor(system.health);
                
                return (
                  <motion.div
                    key={systemId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedSystem === systemId ? 'bg-muted/70 ring-2 ring-primary/20' : ''
                    }`}
                    title={`${system.name}: ${system.health}`}
                    onClick={() => handleSystemClick(systemId)}
                  >
                    <div className={`p-2 rounded-lg ${healthColor.replace('text-', 'bg-').replace('-600', '-50')} mb-2`}>
                      <Icon className={`w-5 h-5 ${healthColor}`} />
                    </div>
                    <div className="text-sm text-center w-full">
                      <div className="font-medium text-sm truncate">
                        {system.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {system.metrics.overall}%
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Expanded View */}
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t pt-4 space-y-3"
              >
                {/* Selected System Details */}
                {selectedSystem && businessBody.systems[selectedSystem] && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedSystem(null)}
                        className="text-xs p-1 h-6"
                      >
                        ← Back to all systems
                      </Button>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {(() => {
                          const Icon = SYSTEM_ICONS[selectedSystem as BusinessSystem];
                          const healthColor = getSystemHealthColor(businessBody.systems[selectedSystem].health);
                          return (
                            <div className={`p-2 rounded-lg ${healthColor.replace('text-', 'bg-').replace('-600', '-50')}`}>
                              <Icon className={`w-6 h-6 ${healthColor}`} />
                            </div>
                          );
                        })()}
                        <div>
                          <h4 className="text-lg font-semibold">{businessBody.systems[selectedSystem].name}</h4>
                          <p className={`text-sm ${getSystemHealthColor(businessBody.systems[selectedSystem].health)}`}>
                            {businessBody.systems[selectedSystem].health.charAt(0).toUpperCase() + businessBody.systems[selectedSystem].health.slice(1)} Status
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-2">Performance Metrics</h5>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Overall Health:</span>
                              <span className="font-medium">{businessBody.systems[selectedSystem].metrics.overall}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Efficiency:</span>
                              <span className="font-medium">{businessBody.systems[selectedSystem].metrics.efficiency || 'N/A'}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Reliability:</span>
                              <span className="font-medium">{businessBody.systems[selectedSystem].metrics.reliability || 'N/A'}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium mb-2">Quick Actions</h5>
                          <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              Run Diagnostics
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* All Systems Overview */}
                {!selectedSystem && (
                  <div className="space-y-2">
                    <h4 className="text-base font-medium">All Systems Overview</h4>
                    {Object.entries(businessBody.systems).map(([systemId, system]) => {
                      const Icon = SYSTEM_ICONS[systemId as BusinessSystem];
                      const healthColor = getSystemHealthColor(system.health);
                      
                      return (
                        <div key={systemId} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${healthColor}`} />
                            <span className="text-sm font-medium">{system.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{system.metrics.overall}%</span>
                            {getHealthIcon(system.health)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderQuantumBlocksGrid = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
                 <div>
           <h2 className="text-xl font-semibold">Your 7 Business Building Blocks</h2>
           <p className="text-muted-foreground">
             The fundamental parts that compose every business
           </p>
         </div>
        <Button variant="outline">
          <Target className="h-4 w-4 mr-2" />
          View All Insights
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {quantumBlocks.map(block => renderQuantumBlock(block))}
      </div>
    </div>
  );

  const renderQuantumInsights = () => {
    if (!quantumProfile) return null;

    const insights = generateQuantumInsights(quantumProfile);
    const recommendations = generateQuantumRecommendations(quantumProfile);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Key Insights
            </CardTitle>
            <CardDescription>
              AI-generated insights about your business health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 3).map(insight => (
                <div key={insight.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={insight.type === 'risk' ? 'destructive' : 'default'}>
                      {insight.type}
                    </Badge>
                    <span className="font-medium text-sm">{insight.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-green-600" />
              Recommended Actions
            </CardTitle>
            <CardDescription>
              Prioritized steps to strengthen your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{rec.type.replace('_', ' ')}</Badge>
                    <span className="font-medium text-sm">{rec.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="text-xs text-muted-foreground">
                    Impact: {rec.impact} | Effort: {rec.effort}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-8 ${className}`}>
      {/* Hero Section */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4">
            Your <span className="text-primary">Business</span> Ecosystem Overview
          </h1>
          {profile?.onboarding_completed ? (
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Welcome back! Here's your current business health snapshot and actionable insights.
            </p>
          ) : (
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every business is composed of 7 fundamental building blocks. 
              Nexus maps yours, measures their health, and helps you strengthen each one.
            </p>
          )}
        </motion.div>
      </div>

      {/* Business Health Overview */}
      {renderBusinessHealthOverview()}

      {/* Quantum Blocks Grid */}
      {renderQuantumBlocksGrid()}

      {/* Insights & Recommendations */}
      {quantumProfile && renderQuantumInsights()}

      {/* Call to Action */}
      {!quantumProfile && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="p-4 rounded-full bg-primary/10 mx-auto w-fit mb-6">
              <Target className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Ready to Map Your Business?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Complete your business snapshot to unlock personalized insights, 
              AI capabilities, and actionable recommendations for each of your 7 building blocks.
            </p>
            <Button size="lg" className="px-8" onClick={handleStartQuantumSetup}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Map Your Business
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Unified Framework Demo Link */}
      <Card className="text-center py-8">
        <CardContent>
          <div className="p-4 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 mx-auto w-fit mb-6">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Try the Unified Framework</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Experience how Nexus combines Mental Models, FIRE Cycle, and Building Blocks 
            to provide context-driven business guidance and actionable insights.
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="px-8 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => navigate('/unified-framework-demo')}
          >
            <Brain className="h-4 w-4 mr-2" />
            Launch Demo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuantumHomeDashboard;
