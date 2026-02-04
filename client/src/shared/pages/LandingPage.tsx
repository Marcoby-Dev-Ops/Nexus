import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { PublicHeader } from '@/shared/components/layout/PublicHeader';
import { ArrowRight, Check } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero - Confident, minimal, memorable */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#1bb072]/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 py-32">
          <div className="max-w-3xl">
            {/* The statement */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.95] mb-10">
              AI that works
              <br />
              <span className="text-[#1bb072]">with</span> you.
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-14 max-w-xl">
              Private. Transparent. Human-centered.
              <br />
              The way AI should be.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <Button
                size="lg"
                className="h-14 px-10 text-lg bg-[#1bb072] hover:bg-[#159960] border-0"
              >
                <Link to="/signup" className="flex items-center gap-3">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-14 px-10 text-lg text-muted-foreground hover:text-foreground"
              >
                <Link to="/demo/assistant">See it in action</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles - Let them breathe */}
      <section className="py-32 border-t border-border/50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-16 lg:gap-24">
            <div>
              <div className="w-3 h-3 rounded-full bg-[#1bb072] mb-8" />
              <h3 className="text-2xl font-semibold mb-4">Private</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your data stays yours. We never see it, never train on it, never sell it.
              </p>
            </div>
            <div>
              <div className="w-3 h-3 rounded-full bg-[#1bb072] mb-8" />
              <h3 className="text-2xl font-semibold mb-4">Transparent</h3>
              <p className="text-muted-foreground leading-relaxed">
                See exactly what AI is thinking. No black boxes, no hidden agendas.
              </p>
            </div>
            <div>
              <div className="w-3 h-3 rounded-full bg-[#1bb072] mb-8" />
              <h3 className="text-2xl font-semibold mb-4">Human-centered</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI that enhances your judgment. You stay in control, always.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Promise - Clear, direct */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 leading-tight">
              We believe AI should
              <br />
              amplify humanity,
              <br />
              not replace it.
            </h2>

            <div className="space-y-6">
              {[
                'Your conversations never leave your system',
                'Full visibility into every AI decision',
                'Export everything, anytime—no lock-in',
                'Human support from real people'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Check className="h-5 w-5 text-[#1bb072] flex-shrink-0" />
                  <span className="text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Elegant simplicity */}
      <section className="py-32 bg-muted/20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-20">How it works</h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                num: '01',
                title: 'Ask',
                desc: 'Type a question, share a problem, or upload a document.'
              },
              {
                num: '02',
                title: 'Understand',
                desc: 'AI analyzes and explains its reasoning every step of the way.'
              },
              {
                num: '03',
                title: 'Decide',
                desc: 'Review, refine, and choose what works. You have the final say.'
              }
            ].map((item, i) => (
              <div key={i}>
                <span className="text-sm font-mono text-[#1bb072] mb-4 block">
                  {item.num}
                </span>
                <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Confident, minimal */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Ready to try a better way?
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              14-day free trial. No credit card required.
            </p>
            <Button
              size="lg"
              className="h-14 px-10 text-lg bg-[#1bb072] hover:bg-[#159960] border-0"
            >
              <Link to="/signup" className="flex items-center gap-3">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Clean, professional */}
      <footer className="py-16 border-t border-border/50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <img
                src="/Nexus/nexus-horizontal-160x48-transparent.png"
                alt="Nexus by Marcoby"
                className="h-8 mb-6"
              />
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                AI that keeps your data private, shows its work, and helps you make better decisions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-5">Product</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/demo/assistant" className="hover:text-foreground transition-colors">Demo</Link></li>
                <li><Link to="/signup" className="hover:text-foreground transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-5">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link to="/help/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link to="/help/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Marcoby
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/legal/security" className="hover:text-foreground transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
