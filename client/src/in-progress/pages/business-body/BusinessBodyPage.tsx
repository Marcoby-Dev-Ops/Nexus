/**
 * Business Body Page
 * 
 * Dedicated page for the Nexus Business Body System - showing the 8 autonomous
 * business systems and 7 building blocks as a living business organism.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Heart, Brain, Zap, Shield, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';

import { BusinessBodyDashboard } from '@/components/dashboard/BusinessBodyDashboard';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';

const BusinessBodyPage: React.FC = () => {
  const { setHeaderContent } = useHeaderContext();

  React.useEffect(() => {
    setHeaderContent(
      'Business Body Systems',
      'Your business as a living organism - 8 autonomous systems working with 7 building blocks'
    );
    
    return () => setHeaderContent(null, null);
  }, [setHeaderContent]);

  return (
    <div className="p-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <div className="p-3 rounded-full bg-red-500/10">
            <Heart className="h-8 w-8 text-red-500" />
          </div>
          <div className="p-3 rounded-full bg-blue-500/10">
            <Brain className="h-8 w-8 text-blue-500" />
          </div>
          <div className="p-3 rounded-full bg-green-500/10">
            <Zap className="h-8 w-8 text-green-500" />
          </div>
          <div className="p-3 rounded-full bg-gray-500/10">
            <Shield className="h-8 w-8 text-gray-500" />
          </div>
          <div className="p-3 rounded-full bg-purple-500/10">
            <BookOpen className="h-8 w-8 text-purple-500" />
          </div>
          <div className="p-3 rounded-full bg-emerald-500/10">
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="p-3 rounded-full bg-yellow-500/10">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">
          Your <span className="text-primary">Living Business</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Just like your body has systems that work autonomously to keep you healthy, 
          your business has 8 autonomous systems that work with 7 fundamental building blocks 
          to create a thriving, self-optimizing business organism.
        </p>
      </motion.div>

      {/* Business Body Dashboard */}
      <BusinessBodyDashboard />
    </div>
  );
};

export default BusinessBodyPage;
