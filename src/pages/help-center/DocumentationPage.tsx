import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  FileText, 
  Code, 
  Settings,
  Zap,
  Shield,
  Users,
  BarChart3,
  Workflow,
  Globe,
  Database,
  Lock,
  Play,
  Download,
  Star,
  MessageSquare
} from 'lucide-react';

interface DocSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  articles: DocArticle[];
}

interface DocArticle {
  title: string;
  description: string;
  url: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeToRead: string;
  tags: string[];
}

export const DocumentationPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const docSections: DocSection[] = [
    {
      title: "Getting Started",
      description: "Learn the basics and get up and running quickly",
      icon: <Zap className="h-5 w-5" />,
      color: "bg-blue-500",
      articles: [
        {
          title: "Quick Start Guide",
          description: "Get Nexus up and running in under 10 minutes",
          url: "/docs/quick-start",
          difficulty: "Beginner",
          timeToRead: "10 min",
          tags: ["setup", "onboarding", "basics"]
        },
        {
          title: "First Integration Setup",
          description: "Connect your first tool and see Nexus in action",
          url: "/docs/first-integration",
          difficulty: "Beginner",
          timeToRead: "15 min",
          tags: ["integrations", "setup", "paypal"]
        },
        {
          title: "Understanding the Dashboard",
          description: "Learn how to navigate and customize your dashboard",
          url: "/docs/dashboard-guide",
          difficulty: "Beginner",
          timeToRead: "20 min",
          tags: ["dashboard", "ui", "navigation"]
        }
      ]
    },
    {
      title: "Core Features",
      description: "Master the essential features of Nexus",
      icon: <Settings className="h-5 w-5" />,
      color: "bg-green-500",
      articles: [
        {
          title: "AI Assistant Guide",
          description: "Learn how to use Nexus AI for business insights",
          url: "/docs/ai-assistant",
          difficulty: "Beginner",
          timeToRead: "25 min",
          tags: ["ai", "assistant", "automation"]
        },
        {
          title: "Workflow Automation",
          description: "Create and manage automated workflows",
          url: "/docs/workflows",
          difficulty: "Intermediate",
          timeToRead: "30 min",
          tags: ["automation", "workflows", "productivity"]
        },
        {
          title: "Data Analytics & Reporting",
          description: "Generate insights and reports from your data",
          url: "/docs/analytics",
          difficulty: "Intermediate",
          timeToRead: "35 min",
          tags: ["analytics", "reporting", "insights"]
        }
      ]
    },
    {
      title: "Integrations",
      description: "Connect and configure your favorite tools",
      icon: <Globe className="h-5 w-5" />,
      color: "bg-purple-500",
      articles: [
        {
          title: "PayPal Integration",
          description: "Connect PayPal for financial tracking and insights",
          url: "/docs/paypal-integration",
          difficulty: "Beginner",
          timeToRead: "20 min",
          tags: ["paypal", "finance", "payments"]
        },
        {
          title: "Microsoft 365 Setup",
          description: "Integrate with Microsoft 365 for productivity",
          url: "/docs/microsoft-365",
          difficulty: "Intermediate",
          timeToRead: "25 min",
          tags: ["microsoft", "productivity", "office"]
        },
        {
          title: "Custom API Integrations",
          description: "Build custom integrations with your own APIs",
          url: "/docs/custom-integrations",
          difficulty: "Advanced",
          timeToRead: "45 min",
          tags: ["api", "custom", "development"]
        }
      ]
    },
    {
      title: "Security & Compliance",
      description: "Understand security features and compliance standards",
      icon: <Shield className="h-5 w-5" />,
      color: "bg-red-500",
      articles: [
        {
          title: "Security Overview",
          description: "Learn about Nexus security features and best practices",
          url: "/docs/security",
          difficulty: "Beginner",
          timeToRead: "20 min",
          tags: ["security", "encryption", "compliance"]
        },
        {
          title: "Data Privacy & GDPR",
          description: "Understand how we handle your data and privacy",
          url: "/docs/privacy-gdpr",
          difficulty: "Intermediate",
          timeToRead: "25 min",
          tags: ["privacy", "gdpr", "data-protection"]
        },
        {
          title: "Access Control & Permissions",
          description: "Manage user access and role-based permissions",
          url: "/docs/access-control",
          difficulty: "Intermediate",
          timeToRead: "30 min",
          tags: ["permissions", "roles", "access"]
        }
      ]
    },
    {
      title: "Advanced Topics",
      description: "Dive deep into advanced features and configurations",
      icon: <Code className="h-5 w-5" />,
      color: "bg-orange-500",
      articles: [
        {
          title: "API Reference",
          description: "Complete API documentation for developers",
          url: "/docs/api-reference",
          difficulty: "Advanced",
          timeToRead: "60 min",
          tags: ["api", "reference", "development"]
        },
        {
          title: "Custom Dashboards",
          description: "Build custom dashboards and widgets",
          url: "/docs/custom-dashboards",
          difficulty: "Advanced",
          timeToRead: "40 min",
          tags: ["dashboard", "custom", "widgets"]
        },
        {
          title: "Performance Optimization",
          description: "Optimize Nexus performance for your business",
          url: "/docs/performance",
          difficulty: "Advanced",
          timeToRead: "35 min",
          tags: ["performance", "optimization", "scaling"]
        }
      ]
    }
  ];

  const popularArticles = [
    {
      title: "Quick Start Guide",
      description: "Get up and running in 10 minutes",
      url: "/docs/quick-start",
      icon: <Star className="h-4 w-4" />
    },
    {
      title: "PayPal Integration Setup",
      description: "Connect your PayPal account",
      url: "/docs/paypal-integration",
      icon: <Star className="h-4 w-4" />
    },
    {
      title: "AI Assistant Basics",
      description: "Learn to use Nexus AI effectively",
      url: "/docs/ai-assistant",
      icon: <Star className="h-4 w-4" />
    },
    {
      title: "Dashboard Customization",
      description: "Customize your dashboard layout",
      url: "/docs/dashboard-guide",
      icon: <Star className="h-4 w-4" />
    }
  ];

  const filteredSections = docSections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(section => section.articles.length > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Documentation</h1>
            <p className="text-muted-foreground">Comprehensive guides and tutorials for Nexus</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          Find detailed guides, tutorials, and reference materials to help you get the most out of Nexus.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search documentation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Popular Articles */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Popular Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularArticles.map((article, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  {article.icon}
                  <h3 className="font-semibold text-sm">{article.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{article.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Read
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Documentation Sections */}
      <div className="space-y-8">
        {filteredSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${section.color} text-white`}>
                {section.icon}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground">{section.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.articles.map((article, articleIndex) => (
                <Card key={articleIndex} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      <Badge 
                        variant={
                          article.difficulty === 'Beginner' ? 'default' :
                          article.difficulty === 'Intermediate' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {article.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{article.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>⏱️ {article.timeToRead}</span>
                        <span>📖 Read</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Read Article
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Additional Resources */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Video Tutorials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Watch step-by-step video tutorials for visual learners.
              </p>
              <Button variant="outline" className="w-full">
                Watch Videos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download PDFs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Download documentation as PDF for offline reading.
              </p>
              <Button variant="outline" className="w-full">
                Download All
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Join our community forum for tips and discussions.
              </p>
              <Button variant="outline" className="w-full">
                Join Forum
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Feedback */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Help Us Improve</h2>
        <p className="text-muted-foreground mb-6">
          Found an error or have a suggestion? Let us know how we can improve our documentation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Report an Issue
          </Button>
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Suggest Improvement
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};
