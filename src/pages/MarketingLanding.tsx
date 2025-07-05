import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Check, Star, Zap, Shield, Globe, BarChart3, Bolt, Brain, Workflow, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const MarketingLanding: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  const handleGetStarted = () => {
    window.location.href = '/login';
  };

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Intelligence",
      description: "Every department gets a personalized AI assistant",
      benefit: "Save 25+ hours per week"
    },
    {
      icon: <Workflow className="w-6 h-6" />,
      title: "Smart Automation", 
      description: "Workflows that adapt and optimize themselves",
      benefit: "98% accuracy, 24/7 operation"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Predictive Analytics",
      description: "See what's coming next with AI predictions",
      benefit: "85% prediction accuracy"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      company: "TechStart Inc.",
      role: "CEO",
      quote: "Nexus transformed our operations completely.",
      avatar: "SC",
      rating: 5
    },
    {
      name: "Marcus Johnson", 
      company: "Growth Digital",
      role: "Operations Director",
      quote: "The AI automation saves us 25+ hours per week.",
      avatar: "MJ",
      rating: 5
    }
  ];

  const stats = [
    { number: "340%", label: "Average ROI" },
    { number: "25+", label: "Hours Saved" },
    { number: "98%", label: "Accuracy Rate" },
    { number: "60%", label: "Tool Reduction" }
  ];

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="flex justify-between items-center py-6">
          <div className="flex items-center gap-4">
            <Bolt className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-tighter">Nexus</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.href = '/pricing'}>
              Pricing
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/login'}>
              Log In
            </Button>
            <Button onClick={handleGetStarted}>
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-stretch min-h-[480px] md:min-h-[600px] lg:min-h-[700px] w-full">
          {/* Left: Hero Content */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12 md:py-0 md:pl-12 md:pr-8 z-10 bg-background/90">
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20 w-fit">
              <Sparkles className="w-4 h-4 mr-2" />
              Trusted by 2,847+ businesses
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter mb-6 text-left">
              Automate the 20% that eats 80% of your day
              <span className="block text-primary">with Nexus</span>
            </h1>
            <p className="max-w-3xl text-lg md:text-xl text-muted-foreground mb-10 text-left">
              Nexus unifies your business tools, automates repetitive work, and delivers AI-powered insights—so you can focus on what matters.
            </p>
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-4 w-fit">
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-6 text-left">
              14-day free trial • No credit card required • Setup in 5 minutes
            </p>
          </div>
          {/* Right: Video Section */}
          <div className="flex-1 relative min-h-[320px] md:min-h-0">
            <video
              className="absolute inset-0 w-full h-full object-cover rounded-none"
              src="/7947490-hd_1920_1080_30fps.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
            />
            {/* Overlay for readability on small screens */}
            <div className="absolute inset-0 bg-background/30 md:bg-background/10" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-t border-b border-border/50">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
              <div className="text-sm font-semibold text-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to run a modern business
            </h2>
            <p className="text-lg text-muted-foreground">
              One platform that replaces dozens of tools
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature Screenshot Placeholders */}
            {/*
              SUGGESTED SCREENSHOTS (for later):
              1. AI Assistant in action: Show a chat or recommendation from the AI for a department (e.g., sales or operations).
              2. Workflow Automation: Visualize a workflow builder or automation running (e.g., invoice sent, email synced, etc.).
              3. Predictive Analytics: Show a chart or dashboard with predictive metrics and actionable insights.
            */}
            {features.map((feature, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    {feature.benefit}
                  </Badge>
                  {/* Placeholder for feature screenshot */}
                  <div className="mt-4 w-full aspect-video bg-muted rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground text-center">
                      [Feature Screenshot Placeholder]<br />
                      {feature.title} UI in action
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Loved by leaders at growing companies
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Ready to automate your business operations?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of growing businesses using Nexus to work smarter.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-4">
                Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.location.href = '/pricing'} className="text-lg px-8 py-4">
                View Pricing
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                No credit card required
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border/50 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Bolt className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold">Nexus</span>
              <span className="text-sm text-muted-foreground">The AI-powered business OS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="/login" className="hover:text-foreground transition-colors">Login</a>
              <a href="mailto:support@marcoby.com" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Marcoby Nexus. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDemo(false)}>
          <div className="bg-background rounded-lg p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Demo Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              We're preparing an interactive demo. In the meantime, start your free trial!
            </p>
            <div className="flex gap-3">
              <Button onClick={handleGetStarted} className="flex-1">
                Start Free Trial
              </Button>
              <Button variant="outline" onClick={() => setShowDemo(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingLanding;
