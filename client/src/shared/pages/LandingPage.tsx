import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { PublicHeader } from '@/shared/components/layout/PublicHeader';
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  Clock3,
  Database,
  Layers,
  Network,
  Shield,
  Sparkles,
  User,
  Workflow,
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

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main>
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
                Business intelligence that understands your world before it answers.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Nexus combines conversation, structured knowledge, and agent orchestration into one operating system so you can
                decide faster, act with confidence, and keep context intact.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="h-12 px-8 text-base">
                  <Link to="/signup" className="inline-flex items-center gap-2">
                    Start with Nexus
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  <Link to="/login" className="inline-flex items-center gap-2">
                    Open Workspace
                  </Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2">Knowledge graph with user + agent context</div>
                <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2">Short, medium, and long memory horizons</div>
                <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2">Business-aware responses from backend context</div>
                <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2">Ready for multi-agent coordination</div>
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
                    <p className="mt-1 text-xs text-muted-foreground">Reviewing identity, memory, and active priorities before response.</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Database className="h-3.5 w-3.5" />
                        Top Active Projects
                      </div>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        <li>1. Knowledge foundation</li>
                        <li>2. Context enforcement tests</li>
                        <li>3. Assistant UX polish</li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        Identity Signal
                      </div>
                      <p className="mt-2 text-sm">Voice: thoughtful, practical, proactive</p>
                      <p className="mt-1 text-sm text-muted-foreground">Domain: AI operating system</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Execution Loop
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {['Discover', 'Synthesize', 'Decide', 'Execute'].map((phase) => (
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

        <section className="border-t border-border/60 bg-muted/20">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 text-center lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Nexus is your foundation for AI-native operations.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Start with one assistant, scale to coordinated agents, and keep your business knowledge coherent as you grow.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base">
                <Link to="/signup" className="inline-flex items-center gap-2">
                  Create your workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link to="/login" className="inline-flex items-center gap-2">
                  Sign in
                </Link>
              </Button>
            </div>

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
            <a href="/#knowledge" className="transition-colors hover:text-foreground">Knowledge</a>
            <a href="/#trust" className="transition-colors hover:text-foreground">Trust</a>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <a href="https://marcoby.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">Marcoby</a>
            <Link to="/login" className="transition-colors hover:text-foreground">Log In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
