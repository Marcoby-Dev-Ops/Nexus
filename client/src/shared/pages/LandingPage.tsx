import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { PublicHeader } from '@/shared/components/layout/PublicHeader';
import {
  Eye,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Layers,
  BookOpen,
  MessageSquareDot,
  Clock,
  Shield
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const painPoints = [
    {
      icon: Layers,
      problem: 'Teams working from different playbooks',
      solution: 'Nexus gives every department the same operating system',
      benefit: 'Operate from one shared plan'
    },
    {
      icon: Clock,
      problem: 'Answering business questions takes hours',
      solution: 'Context-aware chat surfaces the right insight instantly',
      benefit: 'Decide in minutes, not meetings'
    },
    {
      icon: BookOpen,
      problem: 'Institutional knowledge lives in scattered docs',
      solution: 'The knowledge vault keeps documentation, playbooks, and history in one place',
      benefit: 'Onboard fast, keep know-how'
    }
  ];

  const useCases = [
    {
      type: 'Leadership',
      scenario: 'Need one source of truth for the company',
      solution: 'Stand up every department in the Nexus workspace and inspect health, focus, and priorities in one view',
      result: 'Stay ahead of risks without chasing updates'
    },
    {
      type: 'Operations',
      scenario: 'Documentation is tribal, processes are invisible',
      solution: 'Publish SOPs, decision logs, and playbooks into the knowledge vault and reference it live inside chat',
      result: 'Keep execution consistent even as the team grows'
    },
    {
      type: 'Revenue',
      scenario: 'Revenue team needs quick answers across departments',
      solution: 'Ask the Nexus assistant for pipeline status, blockers, and insights without leaving the OS',
      result: 'Focus coaching time on action instead of gathering data'
    }
  ];

  const roadmapHighlights = [
    {
      title: 'Integrations & automation',
      detail: 'HubSpot, Microsoft 365 discovery, and workflow hand-offs are in active development.'
    },
    {
      title: 'Deeper agent tooling',
      detail: 'Expanding the Nexus agent hierarchy with specialist tool routing and team assignments.'
    },
    {
      title: 'Advanced reporting',
      detail: 'Richer cross-department analytics layered onto the unified workspace.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Your business command center
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Run your company from one context-aware operating system
            </h1>
            <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
              Nexus brings every department into the same workspace, keeps your documentation and playbooks alive, and gives you a chat partner that already understands your business.
            </p>
            <div className="flex justify-center items-center gap-4 mb-8">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20 animate-flow-highlight delay-0">
                Unite
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary border border-primary/20 animate-flow-highlight delay-1">
                Understand
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-50 text-green-700 border border-green-100 animate-flow-highlight delay-2">
                Act
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/signup" className="flex items-center justify-center w-full">
                  Launch the Command Center
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                <Link to="/demo/assistant" className="flex items-center justify-center w-full">
                  See the Workspace
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/demo/assistant" className="flex items-center justify-center w-full">
                  From Chaos to Clarity (Demo)
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution Section */}
      <div className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              The pains Nexus was built to solve
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:auto-rows-fr">
            {painPoints.map((item, index) => (
              <Card
                key={index}
                className="h-full min-h-[260px] rounded-lg border-2 bg-card text-card-foreground shadow-sm border-l-4 border-l-red-500 flex flex-col"
              >
                <CardHeader className="flex flex-col space-y-1.5 p-6 pb-4">
                  <div className="flex items-center mb-4">
                    <item.icon className="w-6 h-6 text-red-500 mr-3" />
                    <CardTitle className="text-lg font-semibold leading-none tracking-tight text-red-600">{item.problem}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 flex flex-col gap-4">
                  <div className="flex items-start">
                    <ArrowRight className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{item.solution}</p>
                  </div>
                  <div className="mt-auto inline-flex w-full items-center justify-center text-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 min-h-[48px]">
                    <span className="leading-snug">{item.benefit}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Callout placed after the cards: title -> cards -> callout */}
          <div className="text-center mt-8">
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nexus turns departmental silos into a shared operating rhythm, so leaders, operators, and teams stay aligned.
            </p>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Built for teams who need one operating system
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every company confronts the same pattern: fragmented tools, slow answers, and tribal knowledge. Nexus fixes that from day one.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:auto-rows-fr">
            {useCases.map((useCase, index) => (
              <Card
                key={index}
                className="h-full min-h-[240px] hover:shadow-lg transition-shadow flex flex-col"
              >
                <CardHeader className="pb-4">
                  <Badge variant="outline" className="w-fit mb-3">{useCase.type}</Badge>
                  <CardTitle className="text-lg">{useCase.scenario}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <p className="text-muted-foreground text-sm">{useCase.solution}</p>
                  <div className="flex items-center pt-4">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-600">{useCase.result}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How Nexus Works */}
      <div className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How Nexus keeps your company aligned
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three pillars—shared operating system, contextual intelligence, and living documentation—work together to keep everyone on the same page.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Operate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Stand up every department in one place. Nexus ships with opinionated spaces for leadership, revenue, operations, finance, and more—no spreadsheets required.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Dedicated workspaces for each function
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Shared metrics and health checks across the company
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    RBAC and audit history built in
                  </li>
                </ul>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/demo/trinity-brain" className="flex items-center">
                    Explore the workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquareDot className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Understand</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Ask Nexus what’s happening and get answers enriched by your departments, docs, and historical context.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Chat that understands your org structure and priorities
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Instant summaries and follow-up questions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Actionable insights generated from your knowledge base
                  </li>
                </ul>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/demo/cross-departmental-intelligence" className="flex items-center">
                    Watch the assistant in action
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Remember</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Capture documentation, playbooks, and decisions in a living knowledge system that feeds every conversation.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Structured spaces for SOPs, meeting notes, and decision logs
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Search that understands business context
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Reference documentation live inside chat
                  </li>
                </ul>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/demo/automated-workflow" className="flex items-center">
                    Tour the knowledge vault
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Knowledge & Documentation */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your institutional memory, finally organized
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nexus keeps meeting notes, SOPs, strategic plans, and decision histories in one knowledge vault that the whole OS can use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="h-full min-h-[220px] hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-3">
                  Structured Docs
                </Badge>
                <CardTitle className="text-lg">Playbooks & SOPs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  Capture how work gets done across departments. Keep versions, owners, and related metrics tied together.
                </p>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-600">Live inside the OS—no more buried docs</span>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full min-h-[220px] hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-3">
                  Knowledge Search
                </Badge>
                <CardTitle className="text-lg">Semantic recall</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  Ask the assistant for the latest decision or policy and get the exact excerpt, not just a link.
                </p>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-600">Keeps conversations grounded in fact</span>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full min-h-[160px] hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-3">
                  Context Sharing
                </Badge>
                <CardTitle className="text-lg">Hand-offs that stick</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  Every department can see the same context—no more recreating history when leadership changes or teams rotate.
                </p>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-600">Nothing gets lost between teams</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* What’s Next */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              On the roadmap
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We’re building toward deep integrations and automation. Here’s what’s in flight.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {roadmapHighlights.map((item, index) => (
              <Card key={index} className="border-l-4 border-l-primary/70">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="w-5 h-5 text-primary mr-2" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Badge variant="secondary" className="text-xs">
              We share roadmap updates inside Nexus routinely—join the community to follow along.
            </Badge>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need in one operating system
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nexus brings clarity, context, and control to every department.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Layers,
                title: 'Unified departments',
                description: 'Give sales, finance, operations, and leadership shared visibility and rituals.',
                example: 'Every team works from the same health dashboards and priorities.'
              },
              {
                icon: MessageSquareDot,
                title: 'Context-aware chat',
                description: 'Ask Nexus for an update and get answers that reference your people, plans, and docs.',
                example: '“What changed in Operations this week?” returns a curated summary with links.'
              },
              {
                icon: BookOpen,
                title: 'Living knowledge vault',
                description: 'Store SOPs, meeting notes, and decision logs in one place and surface them inside chat.',
                example: 'The assistant pulls the latest onboarding checklist when a new hire joins.'
              },
              {
                icon: Eye,
                title: 'Executive command center',
                description: 'Monitor company health with opinionated dashboards across every department.',
                example: 'See at a glance where attention is needed before your next leadership meeting.'
              },
              {
                icon: Shield,
                title: 'Governance by design',
                description: 'Marcoby SSO, RBAC, and audit history keep sensitive information protected.',
                example: 'Trace who updated a policy and when it was reviewed.'
              },
              {
                icon: Clock,
                title: 'Onboarding that sticks',
                description: 'New teammates see the full context on day one—no more digging through files.',
                example: 'Review past plans, decisions, and progress without a hand-off call.'
              }
            ].map((feature, index) => (
              <Card key={index} className="h-full min-h-[160px] hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{feature.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    {feature.example}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of businesses already using Nexus to scale intelligently
          </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/signup" className="flex items-center justify-center w-full">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing" className="flex items-center justify-center w-full">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img 
                  src="/Nexus/nexus-horizontal-160x48-transparent.png" 
                  alt="Nexus by Marcoby" 
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Nexus is the operating system for modern business—a unified, secure, and scalable platform to run your entire company.
              </p>
              <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} Marcoby. All rights reserved.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/demo/nexus-operating-system" className="text-muted-foreground hover:text-primary transition-colors">
                    Demo
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-muted-foreground hover:text-primary transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/help" className="text-muted-foreground hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/help/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/help/faq" className="text-muted-foreground hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/help/documentation" className="text-muted-foreground hover:text-primary transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal Links */}
          <div className="border-t mt-8 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <Link to="/legal/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/legal/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link to="/legal/cookies" className="hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
                <Link to="/legal/security" className="hover:text-primary transition-colors">
                  Security
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="https://twitter.com/marcobyhq" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link to="https://linkedin.com/company/marcoby" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 
