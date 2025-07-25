import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Rocket, Sparkles, Zap, Users } from 'lucide-react';

interface DashboardOnboardingProps {
  onComplete: () => void;
  userName?: string;
}

export const DashboardOnboarding: React.FC<DashboardOnboardingProps> = ({ onComplete, userName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-background via-muted/30 to-primary/5 p-8 rounded-2xl border border-border/50 shadow-lg text-center"
    >
      <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
        <Rocket className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">
        Welcome to Your Nexus Command Center{userName ? `, ${userName}` : ''}!
      </h2>
      <p className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto">
        This is your new home for organizational intelligence. Connect data, gain insights, and automate workflows to propel your business forward.
      </p>
      <div className="mt-6 grid grid-cols-1 md: grid-cols-3 gap-6 text-left">
        <div className="p-4 rounded-lg bg-card/60 dark:bg-background/40">
          <Sparkles className="w-6 h-6 text-warning mb-2" />
          <h3 className="font-semibold">AI-Powered Insights</h3>
          <p className="text-sm text-muted-foreground">Get daily briefings and predictive alerts to stay ahead of the curve.</p>
        </div>
        <div className="p-4 rounded-lg bg-card/60 dark:bg-background/40">
          <Zap className="w-6 h-6 text-success mb-2" />
          <h3 className="font-semibold">Automate Everything</h3>
          <p className="text-sm text-muted-foreground">Optimize workflows and free up your team for high-impact tasks.</p>
        </div>
        <div className="p-4 rounded-lg bg-card/60 dark:bg-background/40">
          <Users className="w-6 h-6 text-secondary mb-2" />
          <h3 className="font-semibold">Unified View</h3>
          <p className="text-sm text-muted-foreground">See data from all your departments in one place for a complete picture.</p>
        </div>
      </div>
      <Button 
        onClick={onComplete}
        size="lg"
        className="mt-8 font-semibold"
      >
        <Rocket className="w-5 h-5 mr-2" />
        Let's Get Started
      </Button>
    </motion.div>
  );
}; 