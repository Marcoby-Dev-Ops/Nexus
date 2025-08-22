/**
 * Business Body Dashboard
 * 
 * Displays the 8 autonomous business systems and 7 building blocks as a living business organism.
 * Integrates with existing dashboard infrastructure and leverages established design patterns.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Brain, 
  Activity, 
  Zap, 
  Shield, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity as ActivityIcon,
  Users,
  DollarSign,
  Building2,
  Truck,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useBusinessBody, useBusinessAlerts } from '@/hooks/business-systems/useBusinessBody';
import type { BusinessSystem, SystemHealth } from '@/core/business-systems/BusinessSystemTypes';

// System configuration with icons and colors
const SYSTEM_CONFIG = {
  cashFlow: {
    name: 'Cash Flow Management',
    description: 'Cardiovascular system - circulates financial resources',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  intelligence: {
    name: 'Business Intelligence',
    description: 'Nervous system - processes information and coordinates',
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  customerIntel: {
    name: 'Customer Intelligence',
    description: 'Respiratory system - absorbs market information',
    icon: Activity,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  operations: {
    name: 'Operations & Delivery',
    description: 'Muscular system - executes work and delivers value',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  infrastructure: {
    name: 'Infrastructure & Governance',
    description: 'Skeletal system - provides structure and support',
    icon: Shield,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  knowledgeMgmt: {
    name: 'Knowledge Management',
    description: 'Digestive system - processes and distributes information',
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  growthDev: {
    name: 'Growth & Development',
    description: 'Endocrine system - manages growth and development',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  riskMgmt: {
    name: 'Risk Management',
    description: 'Immune system - protects from threats and maintains resilience',
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  }
};

// Building block configuration
const BUILDING_BLOCK_CONFIG = {
  identity: { name: 'Identity', icon: Building2, color: 'text-blue-600' },
  revenue: { name: 'Revenue', icon: DollarSign, color: 'text-green-600' },
  cash: { name: 'Cash', icon: DollarSign, color: 'text-emerald-600' },
  delivery: { name: 'Delivery', icon: Truck, color: 'text-orange-600' },
  people: { name: 'People', icon: Users, color: 'text-purple-600' },
  knowledge: { name: 'Knowledge', icon: BookOpen, color: 'text-indigo-600' },
  systems: { name: 'Systems', icon: Settings, color: 'text-gray-600' }
};

const getHealthColor = (health: SystemHealth) => {
  switch (health) {
    case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
    case 'healthy': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'failed': return 'text-red-800 bg-red-100 border-red-300';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getHealthIcon = (health: SystemHealth) => {
  switch (health) {
    case 'optimal':
    case 'healthy':
      return <CheckCircle className="w-4 h-4" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4" />;
    case 'critical':
    case 'failed':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <ActivityIcon className="w-4 h-4" />;
  }
};

export function BusinessBodyDashboard() {
  const {
    businessBody,
    loading,
    error,
    overallHealth,
    healthySystems,
    totalSystems,
    systemHealthPercentage,
    autoOptimizationEnabled,
    lastOptimization,
    refresh
  } = useBusinessBody();

  const {
    criticalAlerts,
    highAlerts,
    highImpactRecommendations,
    hasCriticalAlerts,
    hasHighPriorityItems
  } = useBusinessAlerts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading business body systems...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load business body systems: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!businessBody) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No business body data available. Please complete your business setup.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with overall health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Business Body Systems
                </CardTitle>
                <CardDescription>
                  Your business as a living organism - 8 autonomous systems working with 7 building blocks
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Overall Health</div>
                  <div className={`text-lg font-semibold ${getHealthColor(overallHealth).split(' ')[0]}`}>
                    {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Systems Healthy</div>
                  <div className="text-lg font-semibold">
                    {healthySystems}/{totalSystems}
                  </div>
                </div>
                <Progress value={systemHealthPercentage} className="w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Auto-optimization: {autoOptimizationEnabled ? 'Enabled' : 'Disabled'}</span>
                {lastOptimization && (
                  <span>Last optimized: {new Date(lastOptimization).toLocaleDateString()}</span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={refresh}>
                <Clock className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Critical Alerts */}
      {hasCriticalAlerts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''}</strong> require immediate attention.
              <Button variant="link" className="p-0 h-auto font-normal" onClick={() => {}}>
                View details <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Business Systems Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Autonomous Business Systems</CardTitle>
            <CardDescription>
              The 8 body systems that autonomously manage your business operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(businessBody.systems).map(([systemId, system], index) => {
                const config = SYSTEM_CONFIG[systemId as BusinessSystem];
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={systemId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={`cursor-pointer transition-all hover:shadow-md ${getHealthColor(system.health)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getHealthIcon(system.health)}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-sm mb-1">{config.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {config.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Efficiency</span>
                            <span className="font-medium">{system.metrics.efficiency}%</span>
                          </div>
                          <Progress value={system.metrics.efficiency} className="h-1" />
                          
                          <div className="flex justify-between text-xs">
                            <span>Quality</span>
                            <span className="font-medium">{system.metrics.quality}%</span>
                          </div>
                          <Progress value={system.metrics.quality} className="h-1" />
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Status</span>
                            <span className={`font-medium ${system.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {system.status}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Building Blocks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Building Blocks</CardTitle>
            <CardDescription>
              The 7 fundamental elements that compose your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(businessBody.buildingBlocks).map(([blockId, block], index) => {
                const config = BUILDING_BLOCK_CONFIG[blockId as keyof typeof BUILDING_BLOCK_CONFIG];
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={blockId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  >
                    <Card className={`cursor-pointer transition-all hover:shadow-md ${getHealthColor(block.health)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{config.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {block.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {Object.entries(block.metrics).slice(0, 2).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="capitalize">{key}</span>
                              <span className="font-medium">{typeof value === 'number' ? `${value}%` : value}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <Badge variant="outline" className="text-xs">
                            {getHealthIcon(block.health)}
                            <span className="ml-1 capitalize">{block.health}</span>
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Interactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">System Interactions</CardTitle>
            <CardDescription>
              How your business systems communicate and coordinate with each other
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businessBody.interactions.slice(0, 5).map((interaction, index) => (
                <motion.div
                  key={interaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {SYSTEM_CONFIG[interaction.fromSystem as BusinessSystem]?.name}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {SYSTEM_CONFIG[interaction.toSystem as BusinessSystem]?.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {interaction.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Strength</span>
                      <span className="text-sm font-medium">{interaction.strength}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* High Priority Recommendations */}
      {highImpactRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                High Impact Recommendations
              </CardTitle>
              <CardDescription>
                AI-generated recommendations to optimize your business systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {highImpactRecommendations.slice(0, 3).map((recommendation, index) => (
                  <motion.div
                    key={recommendation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  >
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{recommendation.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.estimatedBenefit}% benefit
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {recommendation.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm">
                          Implement
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
