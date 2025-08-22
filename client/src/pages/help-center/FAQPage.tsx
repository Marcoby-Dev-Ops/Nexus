import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Shield,
  Users,
  CreditCard,
  Settings,
  Globe,
  Lock,
  BarChart3
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

export const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const faqItems: FAQItem[] = [
    // Getting Started
    {
      question: "How do I get started with Nexus?",
      answer: "Getting started is easy! Sign up for a free trial, complete the onboarding process, and connect your first integration. Our guided setup will walk you through everything you need to know to get up and running quickly.",
      category: "Getting Started",
      tags: ["onboarding", "setup", "trial"]
    },
    {
      question: "What integrations are currently available?",
      answer: "We currently support integrations with PayPal (financial tracking), Stripe (billing), Microsoft 365 (productivity), and more. We're actively expanding our integration library based on user feedback. Check our integrations page for the complete list.",
      category: "Getting Started",
      tags: ["integrations", "paypal", "stripe", "microsoft"]
    },
    {
      question: "How quickly will I see results?",
      answer: "Most users see immediate time savings from our AI chat and action cards within the first week. The PayPal integration provides instant financial insights. Time savings estimates are based on typical automation scenarios, but actual results will vary by use case.",
      category: "Getting Started",
      tags: ["results", "time-savings", "ai"]
    },

    // Account & Billing
    {
      question: "Can I change plans anytime?",
      answer: "Yes! You can upgrade, downgrade, or cancel anytime. Changes take effect immediately, and we prorate billing fairly. No long-term contracts required.",
      category: "Account & Billing",
      tags: ["billing", "plans", "upgrade", "downgrade"]
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover) and PayPal. Enterprise customers can also pay by invoice with net 30 terms.",
      category: "Account & Billing",
      tags: ["payment", "credit-cards", "paypal", "invoice"]
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer prorated refunds for downgrades and cancellations. If you're not satisfied within the first 30 days, we'll provide a full refund. Contact our support team for assistance.",
      category: "Account & Billing",
      tags: ["refunds", "cancellation", "satisfaction"]
    },

    // Security & Privacy
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade encryption, row-level security, comprehensive audit logging, and secure passkey authentication. Our architecture follows security best practices with regular updates.",
      category: "Security & Privacy",
      tags: ["security", "encryption", "data-protection"]
    },
    {
      question: "Are you SOC 2 compliant?",
      answer: "We're building with SOC 2 compliance in mind and have implemented many security controls. We're currently working toward formal certification as we scale. Our security practices include encryption, audit logging, and access controls.",
      category: "Security & Privacy",
      tags: ["soc2", "compliance", "certification"]
    },
    {
      question: "Can I export my data?",
      answer: "Yes, you can export your data at any time. We provide data export tools in your account settings, and you can also request a complete data export by contacting our support team.",
      category: "Security & Privacy",
      tags: ["data-export", "portability", "backup"]
    },

    // Features & Functionality
    {
      question: "How does the AI assistant work?",
      answer: "Our AI assistant uses advanced language models to understand your business context and provide intelligent responses. It can help with data analysis, automation suggestions, and answering questions about your business operations.",
      category: "Features & Functionality",
      tags: ["ai", "assistant", "automation", "analysis"]
    },
    {
      question: "Can I customize the dashboard?",
      answer: "Yes! You can customize your dashboard by adding, removing, and rearranging widgets. You can also create multiple dashboards for different purposes or team members.",
      category: "Features & Functionality",
      tags: ["dashboard", "customization", "widgets"]
    },
    {
      question: "Does Nexus work on mobile devices?",
      answer: "Yes, Nexus is fully responsive and works great on mobile devices. You can access all core features through your mobile browser, and we're working on native mobile apps.",
      category: "Features & Functionality",
      tags: ["mobile", "responsive", "apps"]
    },

    // Support & Help
    {
      question: "What kind of support do you provide?",
      answer: "Free tier gets community support and documentation. Professional tier gets priority email support with faster response times. Enterprise gets dedicated account management with phone support and custom training.",
      category: "Support & Help",
      tags: ["support", "help", "training", "enterprise"]
    },
    {
      question: "How can I get help with a specific issue?",
      answer: "You can contact our support team through email, live chat (during business hours), or phone (for enterprise customers). You can also check our documentation and community forums for self-service help.",
      category: "Support & Help",
      tags: ["contact", "support", "help"]
    },
    {
      question: "Do you offer training for my team?",
      answer: "Yes! We offer training sessions for teams of all sizes. Enterprise customers get custom training programs, while other customers can join our regular group training sessions or access our video tutorials.",
      category: "Support & Help",
      tags: ["training", "team", "enterprise", "tutorials"]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'Getting Started', name: 'Getting Started', icon: <Zap className="h-4 w-4" /> },
    { id: 'Account & Billing', name: 'Account & Billing', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'Security & Privacy', name: 'Security & Privacy', icon: <Shield className="h-4 w-4" /> },
    { id: 'Features & Functionality', name: 'Features & Functionality', icon: <Settings className="h-4 w-4" /> },
    { id: 'Support & Help', name: 'Support & Help', icon: <Users className="h-4 w-4" /> }
  ];

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const filteredItems = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">Find answers to common questions about Nexus</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          Can't find what you're looking for? Use the search below or contact our support team.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search questions, answers, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              {category.icon}
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No questions found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or browse all questions.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleExpanded(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-start gap-3">
                      <span className="flex-1">{item.question}</span>
                      {expandedItems.has(index) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground mt-1" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground mt-1" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      {item.tags.slice(0, 3).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              {expandedItems.has(index) && (
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <Separator />

      {/* Still Need Help */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Still Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <Button className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Community Forum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Connect with other Nexus users and share tips and best practices.
              </p>
              <Button variant="outline" className="w-full">
                Visit Forum
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};
