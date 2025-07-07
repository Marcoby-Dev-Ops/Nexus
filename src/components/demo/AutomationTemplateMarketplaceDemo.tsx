import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Zap,
  Download,
  Star,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Settings,
  Heart,
  Sparkles,
  Upload,
  Code,
  CheckCircle2,
  ArrowRight,
  Play,
  Eye,
  Tag,
  DollarSign,
  Shield,
  Rocket,
  Target,
  Globe,
  Cpu,
  Database,
  GitBranch,
  Workflow,
  ExternalLink
} from 'lucide-react';

interface DemoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  source: 'zapier' | 'make' | 'n8n' | 'nexus';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  downloads: number;
  estimatedSetupTime: number;
  timeSavingsPerWeek: number;
  requiredIntegrations: string[];
  tags: string[];
  costSavings: number;
  conversionStatus: 'converted' | 'pending' | 'failed';
}

const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: 'zapier-lead-capture',
    name: 'Zapier Lead Capture to HubSpot',
    description: 'Automatically capture leads from web forms and add them to HubSpot CRM with intelligent lead scoring',
    category: 'Sales',
    source: 'zapier',
    difficulty: 'beginner',
    rating: 4.8,
    downloads: 1247,
    estimatedSetupTime: 10,
    timeSavingsPerWeek: 5,
    requiredIntegrations: ['hubspot', 'webhook', 'gmail'],
    tags: ['lead capture', 'crm', 'automation', 'sales'],
    costSavings: 2400,
    conversionStatus: 'converted'
  },
  {
    id: 'make-invoice-processing',
    name: 'Make.com Invoice Processing',
    description: 'Process invoices from email attachments, extract data with AI, and create records in QuickBooks',
    category: 'Finance',
    source: 'make',
    difficulty: 'intermediate',
    rating: 4.6,
    downloads: 892,
    estimatedSetupTime: 25,
    timeSavingsPerWeek: 8,
    requiredIntegrations: ['gmail', 'quickbooks', 'openai', 'stripe'],
    tags: ['invoice', 'accounting', 'ai', 'automation'],
    costSavings: 3600,
    conversionStatus: 'converted'
  },
  {
    id: 'n8n-support-router',
    name: 'n8n AI Support Ticket Router',
    description: 'Intelligently route support tickets using AI analysis of content, urgency, and customer tier',
    category: 'Customer Success',
    source: 'n8n',
    difficulty: 'advanced',
    rating: 4.9,
    downloads: 567,
    estimatedSetupTime: 35,
    timeSavingsPerWeek: 12,
    requiredIntegrations: ['zendesk', 'slack', 'openai', 'hubspot'],
    tags: ['support', 'ai', 'routing', 'customer success'],
    costSavings: 4800,
    conversionStatus: 'converted'
  },
  {
    id: 'nexus-marketing-campaign',
    name: 'Nexus Multi-Channel Campaign',
    description: 'Launch coordinated marketing campaigns across email, social media, and paid ads with performance tracking',
    category: 'Marketing',
    source: 'nexus',
    difficulty: 'intermediate',
    rating: 4.7,
    downloads: 1834,
    estimatedSetupTime: 20,
    timeSavingsPerWeek: 10,
    requiredIntegrations: ['mailchimp', 'facebook', 'google-ads', 'analytics'],
    tags: ['marketing', 'campaigns', 'multi-channel', 'analytics'],
    costSavings: 7200,
    conversionStatus: 'converted'
  }
];

const CONVERSION_EXAMPLES = {
  zapier: {
    original: `{
  "trigger": {
    "app": "webhook",
    "event": "form_submission"
  },
  "steps": [
    {
      "app": "hubspot",
      "action": "create_contact",
      "params": {
        "email": "{{trigger.email}}",
        "firstname": "{{trigger.name}}"
      }
    },
    {
      "app": "slack",
      "action": "send_message",
      "params": {
        "channel": "#sales",
        "message": "New lead: {{trigger.name}}"
      }
    }
  ]
}`,
    converted: `{
  "name": "Lead Capture Workflow",
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "name": "Form Trigger",
      "parameters": {
        "httpMethod": "POST",
        "path": "lead-capture"
      }
    },
    {
      "type": "n8n-nodes-base.hubspot",
      "name": "Create Contact",
      "parameters": {
        "operation": "create",
        "resource": "contact",
        "email": "={{$json.email}}",
        "firstname": "={{$json.name}}"
      }
    },
    {
      "type": "n8n-nodes-base.slack",
      "name": "Send Notification",
      "parameters": {
        "channel": "#sales",
        "text": "New lead: {{$json.name}}"
      }
    }
  ]
}`
  },
  make: {
    original: `{
  "modules": [
    {
      "app": "gmail",
      "module": "watch_emails",
      "filter": "has:attachment invoice"
    },
    {
      "app": "openai",
      "module": "extract_data",
      "prompt": "Extract invoice data"
    },
    {
      "app": "quickbooks",
      "module": "create_invoice"
    }
  ]
}`,
    converted: `{
  "name": "Invoice Processing",
  "nodes": [
    {
      "type": "n8n-nodes-base.gmail",
      "name": "Watch Emails",
      "parameters": {
        "operation": "getAll",
        "format": "full",
        "q": "has:attachment invoice"
      }
    },
    {
      "type": "n8n-nodes-base.openAi",
      "name": "Extract Data",
      "parameters": {
        "operation": "text",
        "prompt": "Extract invoice data: {{$json.body}}"
      }
    },
    {
      "type": "n8n-nodes-base.quickBooks",
      "name": "Create Invoice",
      "parameters": {
        "operation": "create",
        "resource": "invoice"
      }
    }
  ]
}`
  }
};

export const AutomationTemplateMarketplaceDemo: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<DemoTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [selectedConversion, setSelectedConversion] = useState<'zapier' | 'make'>('zapier');
  const [importStep, setImportStep] = useState(1);

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'nexus': return 'bg-primary/10 text-primary dark:bg-blue-900 dark:text-blue-200';
      case 'zapier': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'make': return 'bg-secondary/10 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'n8n': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default: return 'bg-muted text-foreground dark:bg-background dark:text-foreground';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/10 text-success dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-warning/10 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-destructive/10 text-destructive dark:bg-red-900 dark:text-red-200';
      default: return 'bg-muted text-foreground dark:bg-background dark:text-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sales': return TrendingUp;
      case 'marketing': return Users;
      case 'finance': return BarChart3;
      case 'operations': return Settings;
      case 'customer success': return Heart;
      default: return Sparkles;
    }
  };

  const totalSavings = DEMO_TEMPLATES.reduce((sum, template) => sum + template.costSavings, 0);
  const totalTimesSaved = DEMO_TEMPLATES.reduce((sum, template) => sum + template.timeSavingsPerWeek, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Automation Template Marketplace
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Import templates from any platform, convert automatically, and deploy with complete control
        </p>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">${totalSavings.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Annual Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalTimesSaved}h</div>
            <div className="text-sm text-muted-foreground">Time Saved/Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{DEMO_TEMPLATES.length}</div>
            <div className="text-sm text-muted-foreground">Templates Available</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace">
            <Sparkles className="w-4 h-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="w-4 h-4 mr-2" />
            Import Templates
          </TabsTrigger>
          <TabsTrigger value="conversion">
            <Code className="w-4 h-4 mr-2" />
            Conversion Engine
          </TabsTrigger>
          <TabsTrigger value="benefits">
            <Target className="w-4 h-4 mr-2" />
            Benefits
          </TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEMO_TEMPLATES.map((template) => {
              const CategoryIcon = getCategoryIcon(template.category);
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <CategoryIcon className="w-6 h-6 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{template.category}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={getSourceColor(template.source)}>
                          {template.source}
                        </Badge>
                        <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                          {template.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{template.rating}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Download className="w-4 h-4 text-primary" />
                          <span className="font-medium">{template.downloads}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Downloads</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-medium">{template.estimatedSetupTime}m</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Setup</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-success" />
                        <span className="font-medium text-success">
                          ${template.costSavings}/year saved
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">
                          {template.timeSavingsPerWeek}h/week saved
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        Deploy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Automation Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-between">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= importStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {step < importStep ? <CheckCircle2 className="w-4 h-4" /> : step}
                      </div>
                      {step < 4 && (
                        <div className={`w-16 h-0.5 mx-2 ${
                          step < importStep ? 'bg-primary' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Content */}
                {importStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Step 1: Choose Source Platform</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { name: 'Zapier', icon: Zap, color: 'orange' },
                        { name: 'Make.com', icon: Workflow, color: 'purple' },
                        { name: 'n8n', icon: GitBranch, color: 'pink' },
                        { name: 'Custom', icon: Code, color: 'gray' }
                      ].map((platform) => (
                        <Card key={platform.name} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <platform.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <div className="font-medium">{platform.name}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Button onClick={() => setImportStep(2)} className="w-full">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {importStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Step 2: Upload Template Data</h3>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Drop your template file here</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supports JSON, ZIP, or paste directly
                      </p>
                      <Button variant="outline">Browse Files</Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setImportStep(1)}>
                        Back
                      </Button>
                      <Button onClick={() => setImportStep(3)} className="flex-1">
                        Analyze Template <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {importStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Step 3: Template Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Template Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Source Platform:</span>
                            <Badge variant="outline" className="text-xs">Zapier</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Workflow Steps:</span>
                            <span className="text-sm font-medium">3</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Integrations:</span>
                            <span className="text-sm font-medium">2</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Complexity:</span>
                            <Badge variant="outline" className="text-xs">Medium</Badge>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Conversion Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-sm">Template parsed successfully</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-sm">Integrations mapped</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-sm">n8n workflow generated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-sm">Ready for deployment</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setImportStep(2)}>
                        Back
                      </Button>
                      <Button onClick={() => setImportStep(4)} className="flex-1">
                        Deploy Template <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {importStep === 4 && (
                  <div className="space-y-4 text-center">
                    <CheckCircle2 className="w-16 h-16 mx-auto text-success" />
                    <h3 className="text-lg font-semibold">Template Imported Successfully!</h3>
                    <p className="text-muted-foreground">
                      Your Zapier template has been converted and deployed as a Nexus workflow.
                    </p>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Estimated Savings:</div>
                          <div className="text-success">$2,400/year</div>
                        </div>
                        <div>
                          <div className="font-medium">Time Saved:</div>
                          <div className="text-primary">5 hours/week</div>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => setImportStep(1)} className="w-full">
                      Import Another Template
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Engine Tab */}
        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Intelligent Conversion Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-2">
                  <Button
                    variant={selectedConversion === 'zapier' ? 'default' : 'outline'}
                    onClick={() => setSelectedConversion('zapier')}
                  >
                    Zapier → n8n
                  </Button>
                  <Button
                    variant={selectedConversion === 'make' ? 'default' : 'outline'}
                    onClick={() => setSelectedConversion('make')}
                  >
                    Make.com → n8n
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Original Template</h3>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {CONVERSION_EXAMPLES[selectedConversion].original}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Converted to n8n</h3>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {CONVERSION_EXAMPLES[selectedConversion].converted}
                      </pre>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Cpu className="h-4 w-4" />
                  <AlertDescription>
                    Our AI-powered conversion engine automatically maps parameters, converts triggers, 
                    and maintains workflow logic across different platforms.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  Cost Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">vs. Zapier Professional:</span>
                    <span className="font-medium text-success">$7,188/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">vs. Make.com Pro:</span>
                    <span className="font-medium text-success">$3,588/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">vs. Multiple platforms:</span>
                    <span className="font-medium text-success">$15,000+/year</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Control & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm">Self-hosted infrastructure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm">Complete data sovereignty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm">No vendor lock-in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm">Custom integrations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-secondary" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Execution Speed:</span>
                    <span className="font-medium text-secondary">3x faster</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Workflow Complexity:</span>
                    <span className="font-medium text-secondary">Unlimited</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Data Processing:</span>
                    <span className="font-medium text-secondary">No limits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime:</span>
                    <span className="font-medium text-secondary">99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Universal Compatibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Zapier', templates: '5,000+', status: 'supported' },
                  { name: 'Make.com', templates: '1,000+', status: 'supported' },
                  { name: 'n8n', templates: '500+', status: 'native' },
                  { name: 'Custom', templates: 'Unlimited', status: 'flexible' }
                ].map((platform) => (
                  <div key={platform.name} className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-sm text-muted-foreground">{platform.templates}</div>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {platform.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">{selectedTemplate.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedTemplate.rating}</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedTemplate.downloads}</div>
                    <div className="text-sm text-muted-foreground">Downloads</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">${selectedTemplate.costSavings}</div>
                    <div className="text-sm text-muted-foreground">Annual Savings</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedTemplate.timeSavingsPerWeek}h</div>
                    <div className="text-sm text-muted-foreground">Time Saved/Week</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Required Integrations</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.requiredIntegrations.map((integration) => (
                      <Badge key={integration} variant="outline">
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Deploy Template
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Source
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 