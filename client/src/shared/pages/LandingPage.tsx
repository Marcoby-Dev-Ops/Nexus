import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { PublicHeader } from '@/shared/components/layout/PublicHeader';
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  Globe,
  Layers,
  Network,
  Shield,
  Sparkles,
  User,
  Workflow,
  Zap,
  Bot
} from 'lucide-react';

const platformPillars = [
  {
    icon: Brain,
    title: 'Context-First Intelligence',
    description:
      'Every response is grounded in live business context, active priorities, and your organization identity.'
  },
  {
    icon: Network,
    title: 'Knowledge Graph Foundation',
    description:
      'Nexus organizes user, agent, and shared operational knowledge into structured domains you can inspect and evolve.'
  },
  {
    icon: Workflow,
    title: 'Actionable Orchestration',
    description:
      'Move from chat to execution with guided phases, clear metadata, and workflows designed for business outcomes.'
  }
];

const memoryHorizons = [
  {
    horizon: 'Short-Term',
    icon: Clock3,
    detail: 'Current conversation signals and immediate intent for responsive interactions.'
  },
  {
    horizon: 'Medium-Term',
    icon: Layers,
    detail: 'Active projects, recurring work patterns, and operating context for continuity.'
  },
  {
    horizon: 'Long-Term',
    icon: Shield,
    detail: 'Identity, principles, and strategic direction that keep your assistant aligned over time.'
  }
];

const trustSignals = [
  'Structured context blocks with source-aware knowledge',
  'Phase-aware guidance instead of blind code generation',
  'Transparent agent behavior with visible thinking states',
  'Built for assistant-first workflows with multi-agent expansion'
];

const platformIntegrations = [
  {
    name: 'Salesforce',
    description: 'Sync leads, update opportunities, and log interactions automatically.',
    icon: Database
  },
  {
    name: 'HubSpot',
    description: 'Manage contacts and trigger marketing workflows from chat.',
    icon: Network
  },
  {
    name: 'Jira',
    description: 'Create tickets, update status, and track project progress seamlessly.',
    icon: Layers
  },
  {
    name: 'Slack',
    description: 'Orchestrate team communication and summarize channels instantly.',
    icon: Globe
  }
];

const pricingTiers = [
  {
    name: 'Startup',
    price: '$49',
    period: '/month',
    description: 'Perfect for small teams getting started with AI operations.',
    features: [
      '5 Team Members',
      'Basic AI Context Memory',
      'Standard Integrations',
      'Community Support'
    ],
    cta: 'Start Free Trial',
    highlight: false
  },
  {
    name: 'Growth',
    price: '$149',
    period: '/month',
    description: 'For growing businesses needing advanced automation and scale.',
    features: [
      '20 Team Members',
      'Advanced Knowledge Graph',
      'Premium Integrations (Salesforce, etc.)',
      'Priority Email Support',
      'Custom workflows'
    ],
    cta: 'Upgrade to Growth',
    highlight: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Tailored solutions for large organizations with complex needs.',
    features: [
      'Unlimited Team Members',
      'Dedicated Infrastructure',
      'SSO & Advanced Security',
      '24/7 Dedicated Support',
      'Custom AI Model Tuning'
    ],
    cta: 'Contact Sales',
    highlight: false
  }
];

export const LandingPage: React.FC = () => {
  const appPortalBase = String(import.meta.env.VITE_APP_PORTAL_URL || '').trim().replace(/\/+$/, '');
  const toPortalHref = (path: string) => (appPortalBase ? `${appPortalBase}${path}` : path);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-[10%] h-[340px] w-[340px] rounded-full bg-primary/18 blur-3xl" />
            <div className="absolute top-24 right-[4%] h-[280px] w-[280px] rounded-full bg-cyan-500/10 blur-3xl" />
          </div>

          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Nexus AI Operating System
              </div>

              <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                Ignite Growth: AI-Powered Operations with Seamless Integrations.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Nexus utilizes intelligent conversation, structured knowledge, and deep integrations to automate workflows across your entire tech stack.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="h-12 px-8 text-base">
                  <a href={toPortalHref('/signup')} className="inline-flex items-center gap-2">
                    Start Your Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  <a href="#pricing" className="inline-flex items-center gap-2">
                    View Pricing
                  </a>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Instant CRM Sync
                </div>
                <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Unified Data Context
                </div>
                <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Intelligent Automation
                </div>
                <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Enterprise Security
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-border/70 bg-card/75 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm">
                  <span className="font-medium">Nexus Workspace</span>
                  <span className="inline-flex items-center gap-2 text-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    System Healthy
                  </span>
                </div>

                <div className="space-y-4 p-4">
                  <div className="rounded-xl border border-primary/25 bg-primary/10 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Bot className="h-4 w-4" />
                      Marcoby is thinking
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Analyzing integration points with Salesforce and Slack...</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Database className="h-3.5 w-3.5" />
                        CRM Updates
                      </div>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        <li>1. Lead created: Acme Corp</li>
                        <li>2. Opportunity moved to Closed-Won</li>
                        <li>3. Contact updated: Jane Doe</li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        Identity Signal
                      </div>
                      <p className="mt-2 text-sm">Voice: strategic, accurate</p>
                      <p className="mt-1 text-sm text-muted-foreground">Role: Growth Consultant</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Execution Loop
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {['Analyze', 'Connect', 'Sync', 'Report'].map((phase) => (
                        <div key={phase} className="rounded-md bg-muted/60 px-2 py-1.5">
                          {phase}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars Section */}
        <section id="platform" className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Why Nexus feels different</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Familiar chat ergonomics, but designed as a true operating system for business context and accountable execution.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {platformPillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm">
                <div className="mb-4 inline-flex rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Knowledge Section */}
        <section id="knowledge" className="border-y border-border/60 bg-muted/25">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Knowledge architecture by design</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Nexus separates what it knows about the user, what it knows about the agent, and what both should share.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {memoryHorizons.map((item) => (
                <div key={item.horizon} className="rounded-xl border border-border/70 bg-background/85 p-5">
                  <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <item.icon className="h-4 w-4" />
                    {item.horizon}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/85 p-5">
                <h3 className="text-lg font-semibold">User Knowledge</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Preferences, goals, constraints, and strategic direction that shape personalized support.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/85 p-5">
                <h3 className="text-lg font-semibold">Agent Knowledge</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Agent identity, role boundaries, and operational memory to keep execution predictable and aligned.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section id="trust" className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Built for trust at production speed</h2>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                Nexus is designed for real operations: reliable context, visible reasoning, and intentional phase control.
              </p>
              <div className="mt-8 space-y-4">
                {trustSignals.map((signal) => (
                  <div key={signal} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm">
              <h3 className="text-xl font-semibold">From prompt to outcome</h3>
              <div className="mt-5 space-y-4">
                {[
                  ['Capture intent', 'Understand user request and goal'],
                  ['Inject context', 'Apply active projects + knowledge graph'],
                  ['Guide phase', 'Enforce discovery, synthesis, and decision quality'],
                  ['Execute safely', 'Produce actions with metadata and traceability']
                ].map(([title, subtitle]) => (
                  <div key={title} className="rounded-lg border border-border/70 bg-background/70 p-3">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="border-t border-border/60 bg-muted/20">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
            <div className="mb-12 max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Nexus Integrations: Your Business, Connected</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Connect your entire business ecosystem. Unify your tools, eliminate data silos, and automate cross-platform workflows.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {platformIntegrations.map((integration) => (
                <div key={integration.name} className="flex flex-col rounded-xl border border-border/70 bg-background/60 p-6 transition-all hover:bg-background/80 hover:shadow-md">
                  <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
                    <integration.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{integration.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {integration.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Button variant="outline" className="gap-2">
                <Link to="/#integrations">Explore Integrations</Link>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that fits your business stage. No hidden fees.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border ${tier.highlight ? 'border-primary/50 bg-primary/5 shadow-lg' : 'border-border/70 bg-card/40'} p-8`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <div className="my-4 flex items-baseline">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">{tier.description}</p>

                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${tier.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant={tier.highlight ? 'default' : 'outline'} className="w-full">
                  <a href={toPortalHref('/signup')}>{tier.cta}</a>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/60 bg-muted/20">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 text-center lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Ready to Transform Your Business with AI?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Join thousands of leaders who accelerate growth and automate operations with Nexus.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base">
                <a href={toPortalHref('/signup')} className="inline-flex items-center gap-2">
                  Start Your Growth Now
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                <a href={toPortalHref('/signup')} className="inline-flex items-center gap-2">
                  Request a Strategic Demo
                </a>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Need help getting setup? <a href="/docs/client-onboarding-guide.md" className="text-primary hover:underline">View our Self-Serve Onboarding Guide</a>
            </p>

            <p className="mt-8 text-sm text-muted-foreground">
              Built by Marcoby for teams that want AI-native operations with human accountability.
            </p>
            <a
              href="https://marcoby.com"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm text-primary hover:underline"
            >
              Learn more about Marcoby
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/Nexus/nexus-horizontal-160x48-transparent.png"
              alt="Nexus by Marcoby"
              className="h-7 w-auto"
            />
            <span>AI Operating System for Business</span>
          </div>

          <div className="flex items-center gap-5">
            <a href="/#platform" className="transition-colors hover:text-foreground">Platform</a>
            <a href="/#integrations" className="transition-colors hover:text-foreground">Integrations</a>
            <a href="/#pricing" className="transition-colors hover:text-foreground">Pricing</a>
            <a href="/#trust" className="transition-colors hover:text-foreground">Trust</a>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <a href="https://marcoby.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">Marcoby</a>
            <a href={toPortalHref('/login')} className="transition-colors hover:text-foreground">Log In</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
