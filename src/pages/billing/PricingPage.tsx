import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Check, 
  X, 
  Star, 
  ArrowRight, 
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  Shield,
  HeadphonesIcon,
  Crown,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  billingCycle: 'month' | 'year';
  description: string;
  features: string[];
  limitations?: string[];
  highlighted?: boolean;
  ctaText: string;
  badge?: string;
  roiHighlight?: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'month',
    description: 'Perfect for trying out Nexus and light automation needs',
    features: [
      'Up to 20 messages per day',
      'Basic executive agent',
      'Standard response time',
      'Community support',
      'Core integrations (PayPal, Microsoft 365)',
    ],
    limitations: [
      'No file uploads',
      'No streaming responses',
      'Limited to 3 conversations',
    ],
    ctaText: 'Start Free',
    badge: 'Early Access - Help Shape the Future',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    billingCycle: 'month',
    description: 'Designed for founders who want to automate their daily operations',
    features: [
      'Up to 250 messages per day (7,500/month)',
      'All AI agents (Finance, Sales, Operations)',
      'File uploads up to 10MB',
      'Streaming responses',
      'Priority support',
      'All integrations',
      'Overage billing available',
    ],
    highlighted: true,
    ctaText: 'Start Pro Trial',
    badge: 'Most Popular',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    billingCycle: 'month',
    description: 'For growing teams that need unlimited automation power',
    features: [
      'Up to 2,000 messages per day (60,000/month)',
      'Team pooled quotas',
      'Large file uploads (50MB)',
      'Priority processing queue',
      'Custom integrations',
      'Dedicated support',
      'Advanced analytics',
    ],
    ctaText: 'Contact Sales',
    badge: 'Best Value',
  }
];

// Updated to be honest about early stage
const EARLY_USER_TESTIMONIALS = [
  {
    name: 'Beta User',
    company: 'Early Access Program',
    role: 'Founder',
    quote: 'The PayPal integration and AI chat are already saving me hours each week. Excited to see what comes next!',
    rating: 5,
    savings: 'Early adopter'
  },
  {
    name: 'Development Partner',
    company: 'Alpha Testing',
    role: 'Operations Lead',
    quote: 'The automation potential is clear. The foundation is solid and the team is responsive to feedback.',
    rating: 5,
    savings: 'In testing'
  },
  {
    name: 'Preview User',
    company: 'Beta Program',
    role: 'Tech Founder',
    quote: 'Love the vision and execution so far. The passkey auth and real-time features work beautifully.',
    rating: 5,
    savings: 'Early access'
  }
];

const FAQ_ITEMS = [
  {
    question: 'What integrations are currently available?',
    answer: 'We currently have live integrations with PayPal (financial tracking), Stripe (billing), and Microsoft 365 (productivity). QuickBooks and HubSpot integrations are in development. We\'re actively expanding our integration library based on user feedback.'
  },
  {
    question: 'How quickly will I see results?',
    answer: 'Most users see immediate time savings from our AI chat and action cards within the first week. The PayPal integration provides instant financial insights. Time savings estimates are based on typical automation scenarios, but actual results will vary by use case.'
  },
  {
    question: 'Can I change plans anytime?',
    answer: 'Yes! You can upgrade, downgrade, or cancel anytime. Changes take effect immediately, and we prorate billing fairly. No long-term contracts required.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade encryption, row-level security, comprehensive audit logging, and secure passkey authentication. Our architecture follows security best practices with regular updates.'
  },
  {
    question: 'What kind of support do you provide?',
    answer: 'Free tier gets community support and documentation. Professional tier gets priority email support with faster response times. Enterprise gets dedicated account management with phone support and custom training.'
  },
  {
    question: 'Are you SOC 2 compliant?',
    answer: 'We\'re building with SOC 2 compliance in mind and have implemented many security controls. We\'re currently working toward formal certification as we scale. Our security practices include encryption, audit logging, and access controls.'
  }
];

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const calculateAnnualSavings = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.2); // 20% annual discount
  };

  const handleCtaClick = (tier: PricingTier) => {
    if (tier.id === 'free') {
      // Direct to signup
      window.location.href = '/signup';
    } else if (tier.id === 'enterprise') {
      // Contact sales
      window.location.href = 'mailto:sales@nexus.com?subject=Enterprise Inquiry';
    } else {
      // Start trial flow
      window.location.href = '/signup?plan=pro&trial=14';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Early Access - Help Shape the Future
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Stop doing work that
              <span className="block text-primary">AI can automate</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Join early adopters using Nexus to automate operations, track KPIs in real-time, 
              and focus on growing their business. Built by founders, for founders.
            </p>
            
            {/* Honest early stage notice */}
            <div className="inline-flex items-center gap-4 p-4 bg-accent/10 border border-accent/20 rounded-lg mb-8">
              <AlertTriangle className="h-5 w-5 text-accent" />
              <div className="text-left">
                <div className="font-semibold text-accent-foreground">Early Access Product</div>
                <div className="text-sm text-muted-foreground">Core features live, more coming based on your feedback</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <div className="inline-flex items-center p-1 bg-muted rounded-lg">
            <button
              onClick={() => setBillingCycle('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'year'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <Badge variant="outline" className="ml-2 text-xs">Save 20%</Badge>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING_TIERS.map((tier) => {
            const price = billingCycle === 'year' && tier.price > 0 
              ? tier.price - calculateAnnualSavings(tier.price) / 12 
              : tier.price;
            const annualPrice = price * 12;

            return (
              <Card
                key={tier.id}
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  tier.highlighted
                    ? 'ring-2 ring-primary shadow-lg scale-105'
                    : 'hover:shadow-md'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="px-3 py-1">
                      <Crown className="h-3 w-3 mr-1" />
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${Math.round(price)}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === 'year' ? 'month' : 'month'}
                    </span>
                    {billingCycle === 'year' && tier.price > 0 && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                        ${annualPrice}/year (save ${calculateAnnualSavings(tier.price)})
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2">{tier.description}</p>
                  {tier.roiHighlight && (
                    <div className="inline-flex items-center gap-2 mt-3 p-2 bg-accent/10 border border-accent/20 rounded-md">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium text-accent-foreground">{tier.roiHighlight}</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button
                    onClick={() => handleCtaClick(tier)}
                    className={`w-full ${
                      tier.highlighted
                        ? ''
                        : ''
                    }`}
                    variant={tier.highlighted ? 'default' : 'secondary'}
                    size="lg"
                  >
                    {tier.ctaText}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                      What's included:
                    </h4>
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {tier.limitations && (
                      <div className="border-t pt-3">
                        <ul className="space-y-2">
                          {tier.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start">
                              <X className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Early User Feedback */}
      <div className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Early User Feedback</h2>
            <p className="text-muted-foreground">What our beta testers and early adopters are saying</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {EARLY_USER_TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground mb-4">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {testimonial.savings}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Everything you need to know about Nexus pricing and features</p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <Card key={index} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-0">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <h3 className="font-semibold">{item.question}</h3>
                  <ArrowRight
                    className={`h-4 w-4 transition-transform ${
                      expandedFaq === index ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to automate your business operations?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Join early adopters building the future of business automation with Nexus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = '/signup?plan=pro&trial=14'}
              size="lg"
              variant="secondary"
            >
              Start 14-Day Free Trial
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              onClick={() => window.location.href = '/signup'}
              variant="outline"
              size="lg"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Start Free Forever
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-4">
            No credit card required • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}; 