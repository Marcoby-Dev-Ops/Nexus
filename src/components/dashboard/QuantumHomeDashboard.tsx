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

  const quantumBlocks = getAllQuantumBlocks();

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
              Your business through the lens of 7 fundamental building blocks
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
};

export default QuantumHomeDashboard;
