import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { PublicHeader } from '@/shared/components/layout/PublicHeader';
import {
  ArrowRight,
  Check,
  Lock,
  Eye,
  Terminal,
  Shield,
  Database,
  Server,
  Code2,
  Fingerprint
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero - Bold, minimal, distinctive */}
      <section className="relative min-h-[85vh] flex items-center">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px'
          }}
        />

        {/* Accent line */}
        <div className="absolute left-0 top-1/4 w-1 h-32 bg-[#1bb072]" />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-[#1bb072]" />
              <span className="text-sm font-mono text-[#1bb072] tracking-wider uppercase">
                Private AI Workspace
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              AI that works
              <br />
              <span className="text-[#1bb072]">with</span> you.
            </h1>

            {/* Subhead */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
              Your data stays private. Your decisions stay yours.
              Nexus is how AI should work—a powerful partner that makes you better,
              not a black box that replaces you.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-16">
              <Button
                size="lg"
                className="h-14 px-8 text-lg bg-[#1bb072] hover:bg-[#159960] border-0"
              >
                <Link to="/signup" className="flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg border-2"
              >
                <Link to="/demo/assistant" className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  See Demo
                </Link>
              </Button>
            </div>

            {/* Trust badges - minimal */}
            <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#1bb072]" />
                Data stays local
              </span>
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#1bb072]" />
                Fully transparent
              </span>
              <span className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-[#1bb072]" />
                You stay in control
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* The Promise - What you get */}
      <section className="py-32 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Statement */}
            <div className="lg:sticky lg:top-32">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Clear expectations.
                <br />
                <span className="text-muted-foreground">No surprises.</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Before you sign up, know exactly what Nexus is—and isn't.
              </p>
            </div>

            {/* Right: IS / IS NOT */}
            <div className="space-y-8">
              {/* IS */}
              <div className="p-8 rounded-lg border-2 border-[#1bb072]/30 bg-[#1bb072]/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#1bb072] flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Nexus is</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    { title: 'A private AI workspace', desc: 'Your data lives in your instance. We never train on it.' },
                    { title: 'AI that augments you', desc: 'Better answers, faster research—you stay in control.' },
                    { title: 'Transparent by default', desc: 'See what AI does, why it recommends, override anything.' },
                    { title: 'Built to connect your tools', desc: 'Context from your systems, processed locally.' },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1bb072] mt-2.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* IS NOT */}
              <div className="p-8 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                    <span className="text-muted-foreground font-bold">✕</span>
                  </div>
                  <h3 className="text-xl font-bold text-muted-foreground">Nexus is not</h3>
                </div>
                <ul className="space-y-4 text-muted-foreground">
                  {[
                    { title: 'A replacement for your judgment', desc: 'AI suggests. You decide. Every time.' },
                    { title: 'Another data-hungry service', desc: 'Your data is not our product.' },
                    { title: 'Magic that "just works"', desc: 'AI has limits. We\'re honest about them.' },
                    { title: 'A locked-in ecosystem', desc: 'Export your data anytime. No traps.' },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Simple flow */}
      <section className="py-32 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Human + AI
            </h2>
            <p className="text-xl text-muted-foreground">
              The best results come from collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'You ask',
                desc: 'Bring your questions, problems, or half-formed ideas.',
                icon: Terminal
              },
              {
                step: '02',
                title: 'AI thinks',
                desc: 'Analyzes your context, researches, drafts—shows its work.',
                icon: Code2
              },
              {
                step: '03',
                title: 'You decide',
                desc: 'Review, edit, approve. Nothing happens without your say.',
                icon: Fingerprint
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-border -translate-x-1/2 z-0" />
                )}
                <div className="relative bg-card p-8 rounded-lg border border-border">
                  <span className="text-6xl font-bold text-[#1bb072]/20 absolute top-4 right-6">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 rounded-lg bg-[#1bb072]/10 flex items-center justify-center mb-6">
                    <item.icon className="h-6 w-6 text-[#1bb072]" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy architecture */}
      <section className="py-32 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Visual */}
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Server, label: 'Your Instance', sub: 'Data lives here' },
                  { icon: Database, label: 'Your Database', sub: 'You control access' },
                  { icon: Shield, label: 'Encrypted', sub: 'At rest & in transit' },
                  { icon: Code2, label: 'Open Source', sub: 'Audit the code' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-lg border border-border bg-card hover:border-[#1bb072]/50 transition-colors"
                  >
                    <item.icon className="h-8 w-8 text-[#1bb072] mb-4" />
                    <p className="font-bold">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Copy */}
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-[#1bb072]" />
                <span className="text-sm font-mono text-[#1bb072] tracking-wider uppercase">
                  Privacy by Design
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Your data
                <br />
                stays with you.
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Most AI tools send everything to the cloud. Nexus is different—your instance
                processes locally, and when it reaches AI providers, it sends only what's
                necessary. Never your full context. Never your private documents.
              </p>
              <ul className="space-y-3">
                {[
                  'Conversations stored in your database',
                  'Documents processed locally when possible',
                  'No training on your data—ever',
                  'Full data export anytime'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#1bb072]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases - minimal */}
      <section className="py-32 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What you'll use it for
            </h2>
            <p className="text-xl text-muted-foreground">
              Real work. Done better.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Research & Analysis', desc: 'Understand complex topics, compare options, find buried answers.' },
              { title: 'Writing & Comms', desc: 'Draft emails, reports, proposals—faster and clearer.' },
              { title: 'Decision Support', desc: 'Second opinions, blind spots, pressure-tested thinking.' },
              { title: 'Process Docs', desc: 'Turn tribal knowledge into clear SOPs.' },
              { title: 'Data Interpretation', desc: 'Make sense of spreadsheets without becoming a data scientist.' },
              { title: 'Learning', desc: 'Get up to speed. Help others understand.' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-lg border border-border bg-card hover:border-[#1bb072]/50 transition-colors group"
              >
                <div className="w-2 h-2 rounded-full bg-[#1bb072] mb-4 group-hover:scale-150 transition-transform" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Clean */}
      <section className="py-32 border-t border-border">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to work with AI
            <br />
            <span className="text-[#1bb072]">the right way?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            No credit card. No data harvesting. Just a better way to work.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button
              size="lg"
              className="h-14 px-10 text-lg bg-[#1bb072] hover:bg-[#159960] border-0"
            >
              <Link to="/signup" className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-10 text-lg border-2"
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            14-day trial • Full access • Cancel anytime • Export your data
          </p>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <img
                src="/Nexus/nexus-horizontal-160x48-transparent.png"
                alt="Nexus"
                className="h-8 mb-6"
              />
              <p className="text-muted-foreground max-w-sm">
                AI that works with you, not instead of you.
                Private, transparent, built to make you better.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/pricing" className="hover:text-[#1bb072] transition-colors">Pricing</Link></li>
                <li><Link to="/demo/assistant" className="hover:text-[#1bb072] transition-colors">Demo</Link></li>
                <li><Link to="/signup" className="hover:text-[#1bb072] transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/help/about" className="hover:text-[#1bb072] transition-colors">About</Link></li>
                <li><Link to="/legal/privacy" className="hover:text-[#1bb072] transition-colors">Privacy</Link></li>
                <li><Link to="/legal/terms" className="hover:text-[#1bb072] transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-wrap justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Marcoby. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              Built with intention.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
