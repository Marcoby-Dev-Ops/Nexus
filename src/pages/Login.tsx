import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { AuthForm } from '@/components/ui/AuthForm';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [currentDemo, setCurrentDemo] = useState(0);

  const handleSuccess = () => {
    navigate(from);
  };

  // Demo scenarios that showcase value for conversion
  const magicMoments = [
    {
      title: "📊 Instant Business Intelligence",
      description: "AI analyzes your data patterns and delivers actionable insights in real-time",
      visual: "Revenue up 34% • 127 new leads identified • 3 bottlenecks resolved",
      impact: "Companies see 4x faster decision-making",
      metric: "Average ROI: 340% in first quarter"
    },
    {
      title: "🤖 Smart Automation Engine",
      description: "Workflows that learn, adapt, and optimize themselves based on your business patterns",
      visual: "Auto-processed 847 orders • Generated 12 reports • Sent 45 follow-ups",
      impact: "Save 25+ hours per week on routine tasks",
      metric: "98% accuracy, 24/7 operation"
    },
    {
      title: "⚡ AI-Powered Team Intelligence",
      description: "Every department gets a personalized AI assistant that knows your business inside out",
      visual: "Sales AI closed 7 deals • Marketing AI created 23 campaigns • Finance AI found $12K savings",
      impact: "Teams become 60% more productive instantly",
      metric: "Used by 10,000+ growing businesses"
    },
    {
      title: "🎯 Predictive Business Insights",
      description: "See what's coming next with AI that predicts trends, opportunities, and risks",
      visual: "Predicted market shift 3 weeks early • Identified $50K opportunity • Prevented supply chain issue",
      impact: "Stay ahead of competition with foresight",
      metric: "85% prediction accuracy rate"
    }
  ];

  useEffect(() => {
    if (showMagicModal) {
      const interval = setInterval(() => {
        setCurrentDemo((prev) => (prev + 1) % magicMoments.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [showMagicModal]);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-card rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-8 text-primary-foreground">
          <div className="mb-8">
            <img
              src="/Nexus/nexus-square-40x40-transparent.svg"
              alt="NEXUS Logo"
              className="w-16 h-16 mb-6 filter brightness-0 invert"
            />
            <h1 className="text-4xl font-bold mb-4">
              Welcome back to Nexus
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-6">
              Your AI-powered business operating system that transforms how you work, analyze, and grow.
            </p>
            
            {/* Magic Demo Button */}
            <button
              onClick={() => setShowMagicModal(true)}
              className="inline-flex items-center px-6 py-3 bg-card/20 hover:bg-card/30 text-primary-foreground border border-card/30 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              ✨ See the Magic in Action
            </button>
          </div>
          
          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-card/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-primary-foreground/80">Unified dashboard for all business operations</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-card/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-primary-foreground/80">AI-powered analytics and automation</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-card/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <span className="text-primary-foreground/80">Team collaboration and workflow management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background dark:bg-background">
        <div className="max-w-md w-full">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/Nexus/nexus-square-40x40-transparent.svg"
              alt="NEXUS Logo"
              className="w-12 h-12 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-foreground dark:text-primary-foreground mb-4">
              Welcome back
            </h1>
            
            {/* Mobile Magic Demo Button */}
            <button
              onClick={() => setShowMagicModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg font-medium transition-all duration-200 text-sm mb-6"
            >
              <Sparkles className="w-3 h-3 mr-2" />
              ✨ See the Magic
            </button>
          </div>

          {/* Auth Form */}
          <AuthForm
            onSuccess={handleSuccess}
            onError={(error) => console.error('Login error:', error)}
          />

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground space-x-4">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Help Center</a>
            </div>
          </div>
        </div>
      </div>

      {/* Magic Slideshow Modal */}
      <AnimatePresence>
        {showMagicModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal"
              onClick={() => setShowMagicModal(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-modal flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-background dark:bg-card rounded-2xl shadow-2xl border border-border max-w-2xl w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center space-x-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">See Nexus in Action</h2>
                  </div>
                  <button
                    onClick={() => setShowMagicModal(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Slideshow Content */}
                <div className="p-6">
                  <motion.div
                    key={currentDemo}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        {magicMoments[currentDemo].title}
                      </h3>
                      <p className="text-muted-foreground text-lg mb-4">
                        {magicMoments[currentDemo].description}
                      </p>
                    </div>

                    {/* Visual Demo */}
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 mb-6 border border-primary/20">
                      <div className="text-lg font-bold text-primary mb-2">
                        Live Results Dashboard
                      </div>
                      <div className="text-foreground font-semibold text-xl mb-3">
                        {magicMoments[currentDemo].visual}
                      </div>
                      <div className="text-success font-medium">
                        ✨ {magicMoments[currentDemo].impact}
                      </div>
                    </div>

                    {/* Metric */}
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
                      <div className="text-success font-bold text-lg">
                        {magicMoments[currentDemo].metric}
                      </div>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex justify-center space-x-2 mb-6">
                      {magicMoments.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentDemo ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Ready to transform your business?
                      </p>
                      <button
                        onClick={() => {
                          setShowMagicModal(false);
                          // Focus on the auth form
                          setTimeout(() => {
                            const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                            emailInput?.focus();
                          }, 100);
                        }}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                      >
                        Start Free Trial
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}; 