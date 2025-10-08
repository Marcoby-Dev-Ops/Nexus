import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/Dialog';
import { useAuth } from '@/hooks/index';
import { useNotifications } from '@/shared/hooks/NotificationContext';
import { n8nService } from '@/services/automation/n8nService';
import { userN8nConfigService } from '@/services/automation/userN8nConfig';
import { AutomationOnboardingDashboard } from '@/components/automation/AutomationOnboardingDashboard';
import { Zap, Search, Clock, DollarSign, Calendar, MessageSquare, BarChart3, Settings, Play, ExternalLink, Workflow, Target, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Code, GitBranch, GraduationCap } from 'lucide-react';
interface AutomationRecipe {
  id: string;
  title: string;
  description: string;
  category: 'sales' | 'marketing' | 'finance' | 'operations' | 'support' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // minutes
  timeSavingsPerWeek: number; // hours
  requiredIntegrations: string[];
  triggers: string[];
  actions: string[];
  tags: string[];
  isPopular: boolean;
  workflowJson?: any;
  deploymentInstructions: string[];
}

/**
 * AutomationRecipesPage - Browse and deploy pre-built automation workflows
 * Pillar: 1,2 - Customer Success Automation + Business Workflow Intelligence
 */
const AutomationRecipesPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [recipes, setRecipes] = useState<AutomationRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<AutomationRecipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isN8nConnected, setIsN8nConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<AutomationRecipe | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const n8nService = new N8nService();

  useEffect(() => {
    loadRecipes();
    checkN8nConnection();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchTerm, selectedCategory, selectedDifficulty]);

  const loadRecipes = () => {
    // Pre-built automation recipes
    const automationRecipes: AutomationRecipe[] = [
      {
        id: 'lead-to-crm',
        title: 'Lead Capture to CRM',
        description: 'Automatically capture leads from website forms and add them to your CRM with enriched data.',
        category: 'sales',
        difficulty: 'beginner',
        estimatedSetupTime: 15,
        timeSavingsPerWeek: 3,
        requiredIntegrations: ['webhook', 'hubspot', 'clearbit'],
        triggers: ['Website form submission', 'Landing page conversion'],
        actions: ['Create CRM contact', 'Enrich with company data', 'Assign to sales rep', 'Send welcome email'],
        tags: ['lead-generation', 'crm', 'automation', 'sales'],
        isPopular: true,
        deploymentInstructions: [
          'Configure webhook endpoint for your website forms',
          'Connect HubSpot integration with API key',
          'Set up Clearbit for data enrichment',
          'Configure lead assignment rules',
          'Test with sample form submission'
        ]
      },
      {
        id: 'invoice-reminder',
        title: 'Automated Invoice Reminders',
        description: 'Send personalized invoice reminders at scheduled intervals to improve cash flow.',
        category: 'finance',
        difficulty: 'beginner',
        estimatedSetupTime: 20,
        timeSavingsPerWeek: 2,
        requiredIntegrations: ['quickbooks', 'gmail', 'scheduler'],
        triggers: ['Invoice due date approaching', 'Overdue invoice'],
        actions: ['Check payment status', 'Send reminder email', 'Escalate to manager', 'Update CRM notes'],
        tags: ['invoicing', 'cash-flow', 'reminders', 'finance'],
        isPopular: true,
        deploymentInstructions: [
          'Connect QuickBooks integration',
          'Configure Gmail for automated emails',
          'Set up reminder schedule (7, 3, 1 days before due)',
          'Create email templates for different reminder stages',
          'Test with sample invoice'
        ]
      },
      {
        id: 'social-media-scheduler',
        title: 'Content Scheduling & Publishing',
        description: 'Schedule and publish content across multiple social media platforms with analytics tracking.',
        category: 'marketing',
        difficulty: 'intermediate',
        estimatedSetupTime: 30,
        timeSavingsPerWeek: 5,
        requiredIntegrations: ['twitter', 'linkedin', 'facebook', 'buffer'],
        triggers: ['Scheduled time', 'Content approval', 'Event trigger'],
        actions: ['Post to social platforms', 'Track engagement', 'Generate reports', 'Notify team'],
        tags: ['social-media', 'content', 'scheduling', 'marketing'],
        isPopular: true,
        deploymentInstructions: [
          'Connect social media platform APIs',
          'Set up content approval workflow',
          'Configure posting schedules for each platform',
          'Set up analytics tracking',
          'Create content calendar integration'
        ]
      },
      {
        id: 'customer-onboarding',
        title: 'Customer Onboarding Sequence',
        description: 'Automate the entire customer onboarding process with personalized touchpoints and progress tracking.',
        category: 'operations',
        difficulty: 'advanced',
        estimatedSetupTime: 45,
        timeSavingsPerWeek: 8,
        requiredIntegrations: ['crm', 'email', 'slack', 'calendar', 'survey'],
        triggers: ['New customer signup', 'Trial conversion', 'Payment received'],
        actions: ['Send welcome sequence', 'Schedule onboarding calls', 'Track progress', 'Send surveys', 'Alert team'],
        tags: ['onboarding', 'customer-success', 'automation', 'operations'],
        isPopular: false,
        deploymentInstructions: [
          'Map out complete onboarding journey',
          'Connect CRM and email marketing tools',
          'Set up calendar scheduling integration',
          'Create progress tracking system',
          'Configure team notifications in Slack'
        ]
      },
      {
        id: 'support-ticket-routing',
        title: 'Smart Support Ticket Routing',
        description: 'Automatically categorize and route support tickets to the right team members based on content analysis.',
        category: 'support',
        difficulty: 'intermediate',
        estimatedSetupTime: 25,
        timeSavingsPerWeek: 4,
        requiredIntegrations: ['zendesk', 'slack', 'ai-classification'],
        triggers: ['New support ticket', 'Ticket update', 'Escalation needed'],
        actions: ['Analyze ticket content', 'Categorize issue', 'Route to specialist', 'Set priority', 'Notify team'],
        tags: ['support', 'routing', 'ai', 'automation'],
        isPopular: false,
        deploymentInstructions: [
          'Connect support platform (Zendesk, Intercom, etc.)',
          'Configure AI classification rules',
          'Set up team routing logic',
          'Create escalation workflows',
          'Test with sample tickets'
        ]
      },
      {
        id: 'expense-approval',
        title: 'Expense Report Automation',
        description: 'Streamline expense reporting with automatic receipt processing, approval workflows, and reimbursement.',
        category: 'finance',
        difficulty: 'intermediate',
        estimatedSetupTime: 35,
        timeSavingsPerWeek: 3,
        requiredIntegrations: ['expensify', 'quickbooks', 'slack', 'email'],
        triggers: ['Expense submitted', 'Receipt uploaded', 'Approval needed'],
        actions: ['Process receipt', 'Extract data', 'Route for approval', 'Update accounting', 'Process payment'],
        tags: ['expenses', 'approval', 'finance', 'automation'],
        isPopular: false,
        deploymentInstructions: [
          'Connect expense management platform',
          'Set up OCR for receipt processing',
          'Configure approval hierarchy',
          'Integrate with accounting system',
          'Set up payment processing'
        ]
      },
      {
        id: 'meeting-follow-up',
        title: 'Meeting Follow-up Automation',
        description: 'Automatically send meeting summaries, action items, and follow-up tasks after every meeting.',
        category: 'general',
        difficulty: 'beginner',
        estimatedSetupTime: 20,
        timeSavingsPerWeek: 2,
        requiredIntegrations: ['calendar', 'email', 'notion', 'slack'],
        triggers: ['Meeting ends', 'Calendar event', 'Manual trigger'],
        actions: ['Generate summary', 'Extract action items', 'Send follow-up email', 'Create tasks', 'Update CRM'],
        tags: ['meetings', 'follow-up', 'productivity', 'automation'],
        isPopular: true,
        deploymentInstructions: [
          'Connect calendar integration (Google/Outlook)',
          'Set up meeting transcription service',
          'Configure task management integration',
          'Create email templates for follow-ups',
          'Test with sample meeting'
        ]
      },
      {
        id: 'inventory-alerts',
        title: 'Inventory Management Alerts',
        description: 'Monitor inventory levels and automatically reorder products when stock runs low.',
        category: 'operations',
        difficulty: 'intermediate',
        estimatedSetupTime: 30,
        timeSavingsPerWeek: 4,
        requiredIntegrations: ['inventory-system', 'email', 'slack', 'suppliers'],
        triggers: ['Low stock threshold', 'Out of stock', 'Scheduled check'],
        actions: ['Check inventory levels', 'Generate purchase orders', 'Notify suppliers', 'Alert team', 'Update forecasts'],
        tags: ['inventory', 'alerts', 'operations', 'automation'],
        isPopular: false,
        deploymentInstructions: [
          'Connect inventory management system',
          'Set up stock level monitoring',
          'Configure reorder thresholds',
          'Integrate with supplier systems',
          'Set up team notifications'
        ]
      }
    ];

    setRecipes(automationRecipes);
    setIsLoading(false);
  };

  const checkN8nConnection = async () => {
    try {
      const configs = await userN8nConfigService.getUserConfigs();
      setIsN8nConnected(configs.length > 0);
    } catch (error) {
      setIsN8nConnected(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(recipe => 
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(recipe => recipe.difficulty === selectedDifficulty);
    }

    setFilteredRecipes(filtered);
  };

  const handleDeployRecipe = async (recipe: AutomationRecipe) => {
    if (!isN8nConnected) {
      addNotification({
        message: 'Please connect your n8n instance first to deploy workflows.',
        type: 'warning'
      });
      return;
    }

    setIsDeploying(true);
    try {
      const result = await n8nService.generateWorkflow(
        `Create automation workflow: ${recipe.title}. ${recipe.description}`,
        recipe.category as any
      );

      if (result.success) {
        addNotification({
          message: `Successfully deployed "${recipe.title}" to your n8n instance!`,
          type: 'success'
        });
        setSelectedRecipe(null);
      } else {
        addNotification({
          message: `Failed to deploy workflow: ${result.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      addNotification({
        message: 'Failed to deploy workflow. Please try again.',
        type: 'error'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return <Target className="h-4 w-4" />;
      case 'marketing': return <BarChart3 className="h-4 w-4" />;
      case 'finance': return <DollarSign className="h-4 w-4" />;
      case 'operations': return <Settings className="h-4 w-4" />;
      case 'support': return <MessageSquare className="h-4 w-4" />;
      default: return <Workflow className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/10 text-success';
      case 'intermediate': return 'bg-warning/10 text-warning';
      case 'advanced': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories', count: recipes.length },
    { value: 'sales', label: 'Sales', count: recipes.filter(r => r.category === 'sales').length },
    { value: 'marketing', label: 'Marketing', count: recipes.filter(r => r.category === 'marketing').length },
    { value: 'finance', label: 'Finance', count: recipes.filter(r => r.category === 'finance').length },
    { value: 'operations', label: 'Operations', count: recipes.filter(r => r.category === 'operations').length },
    { value: 'support', label: 'Support', count: recipes.filter(r => r.category === 'support').length },
    { value: 'general', label: 'General', count: recipes.filter(r => r.category === 'general').length }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Workflow className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading automation recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Automation Recipes
          </h1>
          <p className="text-muted-foreground">
            Pre-built workflows to automate your business processes and save time
          </p>
        </div>
        {!isN8nConnected && (
          <Button variant="outline" onClick={() => window.open('/settings', '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Connect n8n
          </Button>
        )}
      </div>

      {/* Connection Status */}
      {!isN8nConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your n8n instance to deploy these automation recipes directly to your workspace.
            <Button variant="link" className="p-0 h-auto ml-2" onClick={() => window.open('/settings', '_blank')}>
              Set up n8n connection →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md: flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search automation recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-md bg-background"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label} ({category.count})
                  </option>
                ))}
              </select>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-2 border border-border rounded-md bg-background"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Stats */}
      <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <Workflow className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">Total Recipes</p>
            <p className="text-2xl font-bold">{recipes.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <Clock className="h-8 w-8 text-success" />
            <p className="text-sm text-muted-foreground">Time Saved/Week</p>
            <p className="text-2xl font-bold">
              {recipes.reduce((total, recipe) => total + recipe.timeSavingsPerWeek, 0)}h
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <Sparkles className="h-8 w-8 text-warning" />
            <p className="text-sm text-muted-foreground">Popular Recipes</p>
            <p className="text-2xl font-bold">
              {recipes.filter(r => r.isPopular).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <CheckCircle2 className={`h-8 w-8 ${isN8nConnected ? 'text-success' : 'text-muted-foreground'}`} />
            <p className="text-sm text-muted-foreground">n8n Status</p>
            <p className="text-2xl font-bold">
              {isN8nConnected ? 'Connected' : 'Not Connected'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <Card key={recipe.id} className="hover: shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(recipe.category)}
                  <CardTitle className="text-lg">{recipe.title}</CardTitle>
                </div>
                {recipe.isPopular && (
                  <Badge variant="secondary" className="bg-warning/10 text-warning">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {recipe.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getDifficultyColor(recipe.difficulty)}>
                    {recipe.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {recipe.estimatedSetupTime}min setup
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time savings: </span>
                <span className="font-semibold text-success">{recipe.timeSavingsPerWeek}h/week</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Required integrations:</p>
                <div className="flex flex-wrap gap-1">
                  {recipe.requiredIntegrations.slice(0, 3).map((integration, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {integration}
                    </Badge>
                  ))}
                  {recipe.requiredIntegrations.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{recipe.requiredIntegrations.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getCategoryIcon(recipe.category)}
                        {recipe.title}
                        {recipe.isPopular && (
                          <Badge variant="secondary" className="bg-warning/10 text-warning">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="setup">Setup Guide</TabsTrigger>
                        <TabsTrigger value="workflow">Workflow</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{recipe.description}</p>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-sm">Difficulty: </span>
                              <Badge className={getDifficultyColor(recipe.difficulty)}>
                                {recipe.difficulty}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Setup Time: </span>
                              <span className="text-sm font-medium">{recipe.estimatedSetupTime} minutes</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Time Savings:</span>
                              <span className="text-sm font-medium text-success">{recipe.timeSavingsPerWeek}h/week</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Required Integrations</h4>
                          <div className="flex flex-wrap gap-2">
                            {recipe.requiredIntegrations.map((integration, index) => (
                              <Badge key={index} variant="secondary">
                                {integration}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Triggers</h4>
                            <ul className="text-sm space-y-1">
                              {recipe.triggers.map((trigger, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  {trigger}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Actions</h4>
                            <ul className="text-sm space-y-1">
                              {recipe.actions.map((action, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="setup" className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-3">Step-by-Step Setup Instructions</h4>
                          <div className="space-y-4">
                            {recipe.deploymentInstructions.map((instruction, index) => (
                              <div key={index} className="flex gap-4">
                                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                                <p className="text-sm pt-0.5">{instruction}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Make sure you have all required integrations connected before deploying this workflow.
                            You can manage your integrations in the Settings page.
                          </AlertDescription>
                        </Alert>
                      </TabsContent>
                      
                      <TabsContent value="workflow" className="space-y-4">
                        <div className="text-center py-8">
                          <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h4 className="font-semibold mb-2">Workflow Visualization</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            This workflow will be automatically generated when you deploy it to n8n.
                          </p>
                          <div className="bg-muted rounded-lg p-4 text-left">
                            <p className="text-sm font-medium mb-2">Workflow Overview: </p>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                <span>Trigger: {recipe.triggers[0]}</span>
                              </div>
                              {recipe.actions.slice(0, 3).map((action, index) => (
                                <div key={index} className="flex items-center gap-2 ml-4">
                                  <span className="w-2 h-2 bg-muted-foreground rounded-full"></span>
                                  <span>{action}</span>
                                </div>
                              ))}
                              {recipe.actions.length > 3 && (
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="w-2 h-2 bg-muted-foreground rounded-full"></span>
                                  <span>...and {recipe.actions.length - 3} more actions</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="flex justify-between pt-4 border-t">
                      <Button variant="outline" onClick={() => setSelectedRecipe(null)}>
                        Close
                      </Button>
                      <Button 
                        onClick={() => handleDeployRecipe(recipe)}
                        disabled={!isN8nConnected || isDeploying}
                        className="min-w-[120px]"
                      >
                        {isDeploying ? (
                          <>
                            <Workflow className="h-4 w-4 mr-2 animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Deploy Recipe
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm" 
                  onClick={() => handleDeployRecipe(recipe)}
                  disabled={!isN8nConnected || isDeploying}
                  className="flex-1"
                >
                  {isDeploying ? (
                    <Workflow className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Deploy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredRecipes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search terms or filters to find automation recipes.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Automation Learning Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Automation Learning Center
          </CardTitle>
          <CardDescription>
            Master automation workflows with interactive tutorials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutomationOnboardingDashboard
            showProgress={true}
            onModuleStart={(moduleId) => {
              // eslint-disable-next-line no-console
              console.log('Started automation module:', moduleId);
            }}
            onModuleComplete={(moduleId) => {
              // eslint-disable-next-line no-console
              console.log('Completed automation module:', moduleId);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationRecipesPage;
 
