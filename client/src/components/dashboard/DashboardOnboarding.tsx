import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/Button';
import { Rocket, Sparkles, Zap, Users } from 'lucide-react';

interface DashboardOnboardingProps {
  onComplete: () => void;
  userName?: string;
}

export const DashboardOnboarding: React.FC<DashboardOnboardingProps> = ({ onComplete, userName }) => {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Insights",
      description: "Get daily briefings and predictive alerts to stay ahead of the curve."
    },
    {
      icon: Zap,
      title: "Automate Everything",
      description: "Optimize workflows and free up your team for high-impact tasks."
    },
    {
      icon: Users,
      title: "Unified View",
      description: "See data from all your departments in one place for a complete picture."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-background via-muted/30 to-primary/5 p-8 rounded-2xl border border-border/50 shadow-lg text-center"
    >
      <motion.div 
        className="inline-block p-4 bg-primary/10 rounded-full mb-4"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "backOut" }}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <Rocket className="w-8 h-8 text-primary" />
      </motion.div>
      
      <motion.h2 
        className="text-2xl md:text-3xl font-bold text-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      >
        Your Nexus Command Center{userName ? `, ${userName}` : ''}
      </motion.h2>
      
      <motion.p 
        className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
      >
        This is your new home for organizational intelligence. Connect data, gain insights, and automate workflows to propel your business forward.
      </motion.p>
      
      <motion.div 
        className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
      >
        {features.map((feature, index) => (
          <motion.div 
            key={feature.title}
            className="p-4 rounded-lg bg-card/60 dark:bg-background/40"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: 1.0 + (index * 0.2), 
              ease: "easeOut" 
            }}
            whileHover={{ 
              y: -8,
              scale: 1.02,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              transition: { duration: 0.3 }
            }}
          >
            <motion.div
              whileHover={{ 
                scale: 1.1, 
                rotate: 5,
                transition: { duration: 0.3 }
              }}
            >
              <feature.icon className="w-6 h-6 text-primary mb-2" />
            </motion.div>
            <h3 className="font-semibold text-foreground">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.8, ease: "easeOut" }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onComplete}
            size="lg"
            className="mt-8 font-semibold"
          >
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: [0, 4, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                repeatDelay: 2,
                ease: "easeInOut"
              }}
            >
              <Rocket className="w-5 h-5 mr-2" />
            </motion.div>
            Let's Get Started
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}; 
