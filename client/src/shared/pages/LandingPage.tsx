import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { PublicHeader } from '@/shared/components/layout/PublicHeader';
import {
  Brain,
  Shield,
  ArrowRight,
  CheckCircle,
  Lock,
  Eye,
  Server,
  UserCheck,
  MessageSquare,
  Database,
  GitBranch
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6">
              <Shield className="w-4 h-4 mr-2" />
              Private. Transparent. Yours.
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              AI that works with you,<br />
              <span className="text-primary">not instead of you</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Nexus is how AI should work: your data stays private, your decisions stay yours,
              and AI amplifies what you're already good at. No black boxes. No data harvesting.
              Just a powerful partner that makes you better at your job.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" className="text-lg px-8 py-6">
                <Link to="/signup" className="flex items-center">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/demo/assistant" className="flex items-center">
                  See How It Works
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Your data never leaves your instance
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                See everything AI does
              </span>
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                You stay in control
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What Nexus Is */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What you're signing up for
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Clear expectations. No surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* What Nexus IS */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Nexus IS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">A private AI workspace</p>
                    <p className="text-sm text-muted-foreground">Your conversations, documents, and data stay in your instance. We don't train on your data.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">AI that augments your thinking</p>
                    <p className="text-sm text-muted-foreground">Get better answers, faster research, clearer writing—while you stay in the driver's seat.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Transparent and accountable</p>
                    <p className="text-sm text-muted-foreground">See what AI is doing, why it made recommendations, and override anything you disagree with.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Built to connect your tools</p>
                    <p className="text-sm text-muted-foreground">Bring context from your existing systems so AI understands your business—without sending data elsewhere.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What Nexus is NOT */}
            <Card className="border-2 border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center text-muted-foreground text-sm">✕</span>
                  Nexus is NOT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-muted-foreground">A replacement for human judgment</p>
                    <p className="text-sm text-muted-foreground">AI suggests. You decide. Every time.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-muted-foreground">Another data-hungry cloud service</p>
                    <p className="text-sm text-muted-foreground">We minimize what leaves your instance. Your data is not our product.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-muted-foreground">Magic that "just works"</p>
                    <p className="text-sm text-muted-foreground">AI has limits. We're honest about them. You'll get better results when you understand how it works.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-muted-foreground">A locked-in ecosystem</p>
                    <p className="text-sm text-muted-foreground">Export your data anytime. Use other tools. We earn your continued use, not trap you.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Human + AI, balanced
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The best results come from collaboration, not automation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>You ask</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bring your questions, problems, or half-formed ideas. Nexus meets you where you are.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>AI thinks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Drawing on your context and knowledge, AI analyzes, researches, and drafts—showing its work.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>You decide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Review, edit, approve, or reject. Nothing happens without your say. You build judgment, not dependency.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Lock className="w-4 h-4 mr-2" />
                Privacy by Design
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Your data stays with you
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Most AI tools send everything to the cloud. Nexus is different.
                Your instance processes what it can locally, and when it does reach out to AI providers,
                it sends only what's necessary—never your full context, never your private documents.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Conversations stored in your database, not ours</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Documents processed locally when possible</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>No training on your data—ever</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Full data export anytime you want</span>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <Server className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-medium">Your Instance</p>
                <p className="text-sm text-muted-foreground">Data lives here</p>
              </Card>
              <Card className="p-6 text-center">
                <Database className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-medium">Your Database</p>
                <p className="text-sm text-muted-foreground">You control access</p>
              </Card>
              <Card className="p-6 text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-medium">Encrypted</p>
                <p className="text-sm text-muted-foreground">At rest and in transit</p>
              </Card>
              <Card className="p-6 text-center">
                <GitBranch className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-medium">Open Source</p>
                <p className="text-sm text-muted-foreground">Audit the code</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Do */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What you'll actually use it for
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real work, done better.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Research & Analysis",
                description: "Quickly understand complex topics, compare options, and find answers buried in your documents.",
              },
              {
                title: "Writing & Communication",
                description: "Draft emails, reports, and proposals that sound like you—just faster and clearer.",
              },
              {
                title: "Decision Support",
                description: "Get a second opinion on strategy, see blind spots, and pressure-test your thinking.",
              },
              {
                title: "Process Documentation",
                description: "Turn tribal knowledge into clear SOPs that your team can actually follow.",
              },
              {
                title: "Data Interpretation",
                description: "Make sense of spreadsheets, reports, and metrics without becoming a data scientist.",
              },
              {
                title: "Learning & Onboarding",
                description: "Get up to speed on new topics or help new team members understand how things work.",
              },
            ].map((item, index) => (
              <Card key={index} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to work with AI the right way?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            No credit card required. No data harvesting. Just a better way to work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6">
              <Link to="/signup" className="flex items-center">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link to="/pricing" className="flex items-center">
                View Pricing
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            14-day free trial • Full access • Cancel anytime • Export your data
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img
                  src="/Nexus/nexus-horizontal-160x48-transparent.png"
                  alt="Nexus by Marcoby"
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                AI that works with you, not instead of you. Private, transparent, and built to make you better at what you do.
              </p>
              <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} Marcoby. All rights reserved.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/demo/assistant" className="text-muted-foreground hover:text-primary transition-colors">
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

            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/help/about" className="text-muted-foreground hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/legal/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/legal/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/help/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
