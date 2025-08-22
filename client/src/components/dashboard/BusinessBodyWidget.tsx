/**
 * Business Body Widget
 * 
 * Compact widget version of the business body dashboard for integration
 * into the existing dashboard layout.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Heart, 
  Brain, 
  Zap, 
  Shield, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
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
import { useBusinessBody, useBusinessAlerts } from '@/hooks/business-systems/useBusinessBody';
import type { BusinessSystem, SystemHealth } from '@/core/business-systems/BusinessSystemTypes';

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

const getHealthColor = (health: SystemHealth) => {
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

export function BusinessBodyWidget() {
  const {
    businessBody,
    loading,
    error,
    overallHealth,
    healthySystems,
    totalSystems,
    systemHealthPercentage,
    refresh
  } = useBusinessBody();

  const {
    criticalAlerts,
    hasCriticalAlerts,
    hasHighPriorityItems
  } = useBusinessAlerts();

  const [expanded, setExpanded] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  const handleExpandToggle = () => {
    console.log('Expand button clicked, current state:', expanded);
    setExpanded(!expanded);
    setSelectedSystem(null); // Clear selected system when collapsing
  };

  const handleSystemClick = (systemId: string) => {
    console.log('System clicked:', systemId);
    setSelectedSystem(systemId);
    setExpanded(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Business Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !businessBody) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Business Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {error || 'No business body data available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Business Health
            </CardTitle>
            <CardDescription className="text-sm">
              {healthySystems}/{totalSystems} systems healthy
            </CardDescription>
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
      </CardHeader>
      
      <CardContent>
        {/* Overall Health Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getHealthColor(overallHealth).replace('text-', 'bg-').replace('-600', '-50')}`}>
              <Activity className={`w-4 h-4 ${getHealthColor(overallHealth)}`} />
            </div>
            <div>
              <div className="text-base font-medium">Overall Health</div>
              <div className={`text-sm ${getHealthColor(overallHealth)}`}>
                {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
              </div>
            </div>
          </div>
          <Progress value={systemHealthPercentage} className="w-20" />
        </div>

                          {/* System Health Grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(businessBody.systems).map(([systemId, system]) => {
            const Icon = SYSTEM_ICONS[systemId as BusinessSystem];
            const healthColor = getHealthColor(system.health);
            
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
                       const healthColor = getHealthColor(businessBody.systems[selectedSystem].health);
                       return (
                         <div className={`p-2 rounded-lg ${healthColor.replace('text-', 'bg-').replace('-600', '-50')}`}>
                           <Icon className={`w-6 h-6 ${healthColor}`} />
                         </div>
                       );
                     })()}
                     <div>
                       <h4 className="text-lg font-semibold">{businessBody.systems[selectedSystem].name}</h4>
                       <p className={`text-sm ${getHealthColor(businessBody.systems[selectedSystem].health)}`}>
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
                   const healthColor = getHealthColor(system.health);
                   
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

            {/* Building Blocks Summary */}
            <div className="space-y-2">
              <h4 className="text-base font-medium">Building Blocks</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(businessBody.buildingBlocks).map(([blockId, block]) => {
                  const blockIcons = {
                    identity: Building2,
                    revenue: DollarSign,
                    cash: DollarSign,
                    delivery: Truck,
                    people: Users,
                    knowledge: BookOpen,
                    systems: Settings
                  };
                  const Icon = blockIcons[blockId as keyof typeof blockIcons];
                  const healthColor = getHealthColor(block.health);
                  
                  return (
                    <div key={blockId} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                      <Icon className={`w-4 h-4 ${healthColor}`} />
                      <span className="text-sm font-medium capitalize">{blockId}</span>
                      <span className="text-sm text-muted-foreground">
                        {Object.values(block.metrics)[0]}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={refresh}>
                Refresh
              </Button>
              <Button size="sm" variant="ghost">
                View Full Dashboard
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Collapsed Actions */}
        {!expanded && (
                      <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                {hasHighPriorityItems ? 'High priority items available' : 'All systems operational'}
              </div>
            <Button variant="ghost" size="sm">
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
