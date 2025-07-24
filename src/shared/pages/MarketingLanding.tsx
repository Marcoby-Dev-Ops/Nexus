import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Check, Star, Zap, Shield, BarChart3, Bolt, Brain, Workflow } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Seo } from '@/shared/components/Seo';

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
      <Seo
        title="Nexus Marketing – Automate Your Business | Marcoby"
        description="Automate the 20% that eats 80% of your day with Nexus. Unify your business tools, automate repetitive work, and get AI-powered insights."
        canonical="https: //nexus.marcoby.com/marketing-landing"
        image="https://nexus.marcoby.com/og-image.png"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Marcoby',
          url: 'https://nexus.marcoby.com/',
          logo: 'https://nexus.marcoby.com/nexus-horizontal-160x48-transparent.png',
          sameAs: [
            'https://www.linkedin.com/company/marcoby',
            'https: //twitter.com/marcobyhq'
          ]
        }}
      />
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

        {/* HERO: Business OS */}
        <div className="flex flex-col md:flex-row items-stretch min-h-[480px] md:min-h-[600px] lg:min-h-[700px] w-full">
          {/* Left: Hero Content */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12 md:py-0 md:pl-12 md:pr-8 z-10 bg-background/90">
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20 w-fit">
              <Sparkles className="w-4 h-4 mr-2" />
              The Business Operating System
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter mb-6 text-left">
              The Operating System<br />
              <span className="block text-primary">for Modern Business</span>
            </h1>
            <p className="max-w-3xl text-lg md:text-xl text-muted-foreground mb-10 text-left">
              Nexus is a unified, modular platform—a collection of intelligent tools working together as your business operating system. <span className="text-primary font-medium">Productivity</span>, <span className="text-primary font-medium">Security</span>, and <span className="text-primary font-medium">Scalability</span> are built in.
            </p>
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-4 w-fit">
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-6 text-left">
              14-day free trial • No credit card required • All-in-one system
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

        {/* WHAT IS NEXUS? */}
        <section className="max-w-4xl mx-auto py-12 px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">What is Nexus?</h2>
          <p className="text-lg text-muted-foreground mb-4">
            Nexus is the business operating system—a foundation and a suite of integrated, intelligent tools for every department. It’s the system that connects your people, data, workflows, and AI, so your business runs smarter, faster, and safer.
          </p>
        </section>

        {/* WHY AN OPERATING SYSTEM? */}
        <section className="max-w-4xl mx-auto py-12 px-4 text-center">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Why an Operating System?</h2>
          <p className="text-lg text-muted-foreground mb-4">
            Most tools solve one problem. Nexus is the system that brings everything together—eliminating silos, automating busywork, and giving you control and clarity as you scale.
          </p>
        </section>

        {/* PILLARS: PRODUCTIVITY, SECURITY, SCALABILITY */}
        <section className="max-w-5xl mx-auto py-12 px-4">
          <div className="grid gap-8 grid-cols-1 md: grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Productivity</h3>
              <p className="text-muted-foreground text-sm">Automate workflows, unify communication, and surface insights—so your team can focus on what matters.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Security</h3>
              <p className="text-muted-foreground text-sm">Enterprise-grade security, compliance, and control—built in from the ground up.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Scalability</h3>
              <p className="text-muted-foreground text-sm">From startup to enterprise, Nexus grows with you. Add tools, connect data, and scale without chaos.</p>
            </div>
          </div>
        </section>

        {/* Features (keep as is, but update intro) */}
        <div className="py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md: text-4xl font-bold tracking-tight mb-4">
              A Modular System for Every Department
            </h2>
            <p className="text-lg text-muted-foreground">
              Nexus replaces dozens of disconnected tools with a unified, intelligent system.
            </p>
          </div>
          <div className="grid gap-8 md: grid-cols-3">
            {/* Feature Screenshot Placeholders */}
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

        {/* Testimonials (keep as is) */}
        <div className="py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md: text-4xl font-bold tracking-tight mb-4">
              Loved by leaders at growing companies
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
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
            <h2 className="text-3xl md: text-4xl font-bold tracking-tight mb-6">
              Ready to run your business on Nexus?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Experience the business OS trusted by thousands of growing companies.
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
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                All-in-one system
              </div>
            </div>
          </div>
        </div>

        {/* Footer (update tagline) */}
        <footer className="border-t border-border/50 py-12">
          <div className="flex flex-col md: flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Bolt className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold">Nexus</span>
              <span className="text-sm text-muted-foreground">The Business Operating System</span>
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
            <div className="flex gap-4">
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
