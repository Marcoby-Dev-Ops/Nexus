import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  displayName: string;
  onRefresh: () => void;
  refreshing: boolean;
}

export function DashboardHeader({ displayName, onRefresh, refreshing }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-primary-subtle via-muted-subtle to-secondary-subtle rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="text-muted-foreground">
            Nexus has updated your Business Health and prepared next steps to grow your business.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </motion.div>
  );
}
