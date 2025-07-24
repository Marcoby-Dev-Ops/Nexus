import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Lightbulb, 
  Map, 
  Play,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { useFireCyclePhase } from '@/core/fire-cycle/FireCycleProvider';
import { NorthStarCard } from './NorthStarCard';
import { KeyMetricsCard } from './KeyMetricsCard';
import { PrioritiesCard } from './PrioritiesCard';
import { BlockersCard } from './BlockersCard';
import { OpportunitiesCard } from './OpportunitiesCard';
import { RisksCard } from './RisksCard';
import { TrendsCard } from './TrendsCard';

interface FireCycleDashboardProps {
  className?: string;
}

export const FireCycleDashboard: React.FC<FireCycleDashboardProps> = ({ className }) => {
  const { phase, setPhase } = useFireCyclePhase();
  
  // Mock data for now - this would come from your analytics/domain logic
  const businessHealth = 75;
  const nextAction = 'Review your North Star goals';
  const progressSummary = {
    focus: 80,
    insight: 65,
    roadmap: 45,
    execute: 70
  };

  // Use the global phase instead of local state
  const activePhase = phase;

  const phases = [
    {
      id: 'focus' as const,
      title: 'Focus',
      icon: Target,
      description: 'Define your North Star and key outcomes',
      color: 'bg-blue-500',
      progress: progressSummary.focus
    },
    {
      id: 'insight' as const,
      title: 'Insight',
      icon: Lightbulb,
      description: 'Surface opportunities and risks',
      color: 'bg-yellow-500',
      progress: progressSummary.insight
    },
    {
      id: 'roadmap' as const,
      title: 'Roadmap',
      icon: Map,
      description: 'Set strategy and clear next actions',
      color: 'bg-green-500',
      progress: progressSummary.roadmap
    },
    {
      id: 'execute' as const,
      title: 'Execute',
      icon: Play,
      description: 'Take action and track progress',
      color: 'bg-purple-500',
      progress: progressSummary.execute
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">FIRE CYCLE Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Your business momentum framework - turn insight into impact
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Business Health</p>
            <p className="text-2xl font-bold text-foreground">{Math.round(businessHealth)}%</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
        {phases.map((phase) => (
          <motion.button
            key={phase.id}
            onClick={() => setPhase(phase.id)}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
              activePhase === phase.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover: border-primary/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${phase.color} bg-opacity-10`}>
                <phase.icon className={`w-5 h-5 ${phase.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">{phase.title}</h3>
                <p className="text-xs text-muted-foreground">{phase.description}</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(phase.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Next Best Action */}
      <div className="bg-card rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4">Next Best Action</h3>
        <p className="text-muted-foreground">{nextAction}</p>
      </div>

      {/* Active Phase Content */}
      <div className="space-y-6">
        {activePhase === 'focus' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <NorthStarCard northStar={{ id: '1', title: 'Q3 Revenue Target', description: 'Achieve $500K in Q3', targetValue: 500000, currentValue: 350000, unit: 'USD', timeframe: 'quarterly', lastUpdated: new Date() }} />
            <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
              <KeyMetricsCard metrics={[]} />
              <PrioritiesCard priorities={[]} />
            </div>
            <BlockersCard blockers={[]} />
          </motion.div>
        )}

        {activePhase === 'insight' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OpportunitiesCard opportunities={[]} />
              <RisksCard risks={[]} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendsCard trends={[]} />
            </div>
          </motion.div>
        )}

        {activePhase === 'roadmap' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">Roadmap</h3>
              <p className="text-muted-foreground">Roadmap components will be implemented here.</p>
            </div>
          </motion.div>
        )}

        {activePhase === 'execute' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">Execute</h3>
              <p className="text-muted-foreground">Execution components will be implemented here.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
          <motion.button
            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">Update North Star</span>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </motion.button>
          
          <motion.button
            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium">Add Opportunity</span>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </motion.button>
          
          <motion.button
            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium">Create Task</span>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}; 