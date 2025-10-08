import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Loader2, Mail, AlertCircle, Search, Star, EyeOff, Unlink, Plus, Settings, Inbox, Send, Archive, Trash2, Filter, MoreHorizontal, RefreshCw, Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap, Target, Lightbulb, Map as MapIcon, Play, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/Avatar';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Badge } from '@/shared/components/ui/Badge';
import { Tooltip } from '@/shared/components/ui/Tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/shared/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useUnifiedInbox } from '@/shared/hooks/useUnifiedInbox';
import type { EmailFilters, EmailItem } from '@/services/email/EmailService';
import { EmailService } from '@/services/email';
import { serviceRegistry } from '@/core/services/ServiceRegistry';
import { postgres } from '@/lib/postgres';
import { emailService } from '@/services/email/EmailService';
import { thoughtsService } from '@/lib/services/thoughtsService';
import { useToast } from '@/shared/components/ui/use-toast';
import { useAuth } from '@/hooks/index';

type InboxItem = EmailItem;

interface InboxData {
  items: InboxItem[];
  total: number;
}

interface AIAnalysis {
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    confidence: number;
    category: string;
  }>;
  predictions: Array<{
    id: string;
    title: string;
    description: string;
    probability: number;
    timeframe: string;
  }>;
  workflows: Array<{
    id: string;
    name: string;
    status: string;
    type: string;
    priority: string;
  }>;
  businessValue: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface IntelligenceInsight {
  type: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  priority: string;
  emailId: string;
}

interface CreateThoughtData {
  content: string;
  firePhase: 'focus' | 'insight' | 'roadmap' | 'execute';
  category: string;
  priority: 'low' | 'medium' | 'high';
  sourceEmailId?: string;
  sourceEmailSubject?: string;
  sourceEmailSender?: string;
}

// Fire Cycle phase configuration
const FIRE_PHASES = [
  { id: 'focus', label: 'Focus', description: 'Clarifying the core idea or goal', icon: Target },
  { id: 'insight', label: 'Insight', description: 'Gaining deeper understanding and context', icon: Lightbulb },
  { id: 'roadmap', label: 'Roadmap', description: 'Planning the path forward', icon: MapIcon },
  { id: 'execute', label: 'Execute', description: 'Taking action and implementing', icon: Play }
];

// Use the imported email service

const UnifiedInbox: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [filters, setFilters] = useState<EmailFilters>({});
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<Map<string, AIAnalysis>>(new Map());
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set());
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [intelligenceInsights, setIntelligenceInsights] = useState<IntelligenceInsight[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<Map<string, string>>(new Map());
  const [activeTab, setActiveTab] = useState<'inbox' | 'starred' | 'sent' | 'archive' | 'trash'>('inbox');
  
  // Fire Cycle thought creation state
  const [isCreateThoughtOpen, setIsCreateThoughtOpen] = useState(false);
  const [selectedEmailForThought, setSelectedEmailForThought] = useState<InboxItem | null>(null);
  const [isCreatingThought, setIsCreatingThought] = useState(false);

  // Email viewer state
  const [viewingEmail, setViewingEmail] = useState<InboxItem | null>(null);
  const [isEmailViewerOpen, setIsEmailViewerOpen] = useState(false);
  const [fullEmailContent, setFullEmailContent] = useState<{
    content?: string;
    html_content?: string;
    isLoading: boolean;
    error?: string;
  }>({ isLoading: false });
  const [emailViewMode, setEmailViewMode] = useState<'html' | 'text'>('html');

  // Get connected providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      const providers = await emailService.getSupportedProviders();
      setConnectedProviders(providers as unknown as string[]);
      console.log('Connected providers:', providers); // Debug log
    };
    fetchProviders();
  }, []);

  // Use the data service hook instead of OWA service
  const { items: emails, total, error, refetch, isLoading } = useUnifiedInbox({ filters, limit: 50, offset: 0, folder: activeTab });
  const isError = !!error;

  // Real-time email processing
  useEffect(() => {
    if (realTimeMode && emails.length > 0) {
      processNewEmailsForIntelligence();
    }
  }, [emails, realTimeMode]);

  // Process new emails for AI intelligence
  const processNewEmailsForIntelligence = useCallback(async () => {
    const unprocessedEmails = (emails as EmailItem[]).filter((email) => 
      !aiAnalysis.has(email.id) && 
      !processingEmails.has(email.id) &&
      !email.is_read
    );

    if (unprocessedEmails.length === 0) return;

    for (const email of unprocessedEmails) {
      setProcessingEmails(prev => new Set(prev).add(email.id));
      
      try {
        // TODO: Implement real AI analysis integration
        // - Connect to AI services (OpenAI, Azure Cognitive Services, etc.)
        // - Implement "See-Think-Act" framework for business intelligence
        // - Build institutional knowledge system for pattern recognition
        // - Extract opportunities, predictions, and workflows from email content
        // - Store analysis results for learning and improvement
        // 
        // For now, we'll simulate email analysis since the new EmailService doesn't have this method yet
        // In a real implementation, this would call the EmailService's analysis methods
        const analysis = {
          opportunities: [],
          predictions: [],
          workflows: [],
          businessValue: 'low' as const,
          urgency: 'low' as const
        };
        
      if (analysis) {
          setAiAnalysis(prev => new Map(prev).set(email.id, {
            opportunities: analysis.opportunities ?? [],
            predictions: analysis.predictions ?? [],
            workflows: analysis.workflows ?? [],
            businessValue: analysis.businessValue || 'low',
            urgency: analysis.urgency || 'low'
          }));

          // Update workflow status
          if (analysis.workflows) {
            (analysis.workflows ?? []).forEach((workflow: { id: string; status: string }) => {
              setWorkflowStatus((prev: Map<string, string>) => new Map(prev).set(workflow.id, workflow.status));
            });
          }

          // Generate intelligence insights
          generateIntelligenceInsights(email, analysis);
        }
      } catch {
        // Log error for debugging but don't show to user
        // In production, this would be sent to error tracking service
        // TODO: Implement proper error tracking service
      } finally {
        setProcessingEmails((prev: Set<string>) => {
          const newSet = new Set(prev);
          newSet.delete(email.id);
          return newSet;
        });
      }
    }
  }, [emails, aiAnalysis, processingEmails]);

  // Generate intelligence insights from email analysis
  const generateIntelligenceInsights = useCallback((email: InboxItem, analysis: {
    opportunities?: Array<{ id: string; title: string; description: string; confidence: number; category: string; }>;
    predictions?: Array<{ id: string; title: string; description: string; probability: number; timeframe: string; }>;
    workflows?: Array<{ id: string; name: string; status: string; type: string; priority: string; }>;
    businessValue?: 'low' | 'medium' | 'high' | 'critical';
    urgency?: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    const insights: IntelligenceInsight[] = [];

    // Opportunity insights
    if ((analysis.opportunities ?? []).length > 0) {
      insights.push({
        type: 'opportunity',
        title: `${(analysis.opportunities ?? []).length} Business Opportunities Detected`,
        description: `AI identified ${(analysis.opportunities ?? []).length} potential business opportunities in this email`,
        icon: <Target className="h-4 w-4" />,
        priority: 'high',
        emailId: email.id
      });
    }

    // Prediction insights
    if ((analysis.predictions ?? []).length > 0) {
      insights.push({
        type: 'prediction',
        title: `${(analysis.predictions ?? []).length} Predictive Insights Generated`,
        description: `AI generated ${(analysis.predictions ?? []).length} predictions based on email patterns`,
        icon: <TrendingUp className="h-4 w-4" />,
        priority: 'medium',
        emailId: email.id
      });
    }

    // Workflow insights
    if ((analysis.workflows ?? []).length > 0) {
      insights.push({
        type: 'workflow',
        title: `${(analysis.workflows ?? []).length} Automated Workflows Triggered`,
        description: `AI triggered ${(analysis.workflows ?? []).length} automated workflows for this email`,
        icon: <Zap className="h-4 w-4" />,
        priority: 'high',
        emailId: email.id
      });
    }

    setIntelligenceInsights(prev => [...prev, ...insights]);
  }, []);

  const handleMarkAsRead = async (emailId: string, isRead: boolean, provider: string = 'microsoft') => {
    try {
      const result = await emailService.markAsRead(emailId, isRead, provider as any);
      if (!result.success) {
        toast({
          title: 'Failed to update email',
          description: result.error || 'Unable to change read status',
          variant: 'destructive',
        });
        return;
      }
      refetch();
    } catch (err) {
      toast({
        title: 'Unexpected error',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const handleFilterChange = (newFilters: Partial<EmailFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDisconnectMicrosoft = async () => {
    try {
      setIsDisconnecting(true);
      // Use the new EmailService to revoke tokens
      const result = await emailService.revokeToken('microsoft');
      if (result.success) {
        const providers = await emailService.getSupportedProviders();
        setConnectedProviders(providers as unknown as string[]);
      }
    } catch {
      // TODO: Implement proper error handling/notification
      // In production, this would show a user-friendly error message
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleAddMailbox = () => {
    // Navigate to integrations setup to add mailbox
    window.location.assign('/integrations/settings');
  };

  const handleToggleRealTimeMode = () => {
    setRealTimeMode(!realTimeMode);
  };

  // Navigation handlers
  const handleTabChange = (tab: 'inbox' | 'starred' | 'sent' | 'archive' | 'trash') => {
    setActiveTab(tab);
    // Reset filters when changing tabs since folder filtering is now handled by the backend
    setFilters({});
  };

  // Email viewer handlers
  const handleViewEmail = async (email: InboxItem) => {
    setViewingEmail(email);
    setIsEmailViewerOpen(true);
    setFullEmailContent({ isLoading: true });
    setEmailViewMode('html'); // Reset to HTML view by default
    
    // Mark as read when viewing
    if (!email.is_read) {
      handleMarkAsRead(email.id, true, email.provider);
    }
    
    // Fetch full email content
    try {
      const result = await emailService.getFullEmail(email.id);
      if (result.success && result.data) {
        setFullEmailContent({
          content: result.data.content,
          html_content: result.data.html_content,
          isLoading: false
        });
      } else {
        // Check if this is an email integration setup error
        if (result.error && result.error.includes('Email integration not set up')) {
          setFullEmailContent({
            isLoading: false,
            error: 'Email integration not set up. Please connect your Microsoft 365 account to view emails.'
          });
          
          // Show a toast with setup guidance
          toast({
            title: 'Email Integration Required',
            description: 'Connect your Microsoft 365 account to view emails. Go to Integrations → Microsoft 365 to get started.',
            variant: 'destructive',
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/integrations'}
              >
                Set Up Integration
              </Button>
            )
          });
        } else {
          setFullEmailContent({
            isLoading: false,
            error: result.error || 'Failed to load email content'
          });
        }
      }
    } catch (error) {
      setFullEmailContent({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load email content'
      });
    }
  };

  const handleCloseEmailViewer = () => {
    setIsEmailViewerOpen(false);
    setViewingEmail(null);
    setFullEmailContent({ isLoading: false });
  };

  // Fire Cycle thought creation handlers
  const handleCreateThoughtFromEmail = (email: InboxItem) => {
    setSelectedEmailForThought(email);
    setIsCreateThoughtOpen(true);
  };

  const handleCreateThought = async (thoughtData: CreateThoughtData) => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create thoughts',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingThought(true);
    try {
      // Create the thought using the thoughts service
      const result = await thoughtsService.createThought({
        user_id: user.id,
        content: thoughtData.content,
                 category: thoughtData.category as any,
         status: 'concept',
         personal_or_professional: 'professional',
         mainsubcategories: [thoughtData.firePhase],
         initiative: false,
         impact: 'medium',
         parent_idea_id: undefined,
         workflow_stage: 'create_idea',
         department: undefined,
         priority: thoughtData.priority,
         estimated_effort: undefined,
         ai_clarification_data: {
           sourceEmailId: thoughtData.sourceEmailId,
           sourceEmailSubject: thoughtData.sourceEmailSubject,
           sourceEmailSender: thoughtData.sourceEmailSender,
           firePhase: thoughtData.firePhase,
           createdFromEmail: true
         },
         aiinsights: {},
        interaction_method: 'email_integration' as any,
        company_id: (user as any).company_id || undefined,
        created_by: user.id,
        updated_by: user.id
      });

      if (result.success && result.data) {
        toast({
          title: 'Thought created successfully',
          description: `Your thought has been created in the ${thoughtData.firePhase} phase of the Fire Cycle.`,
        });
        
        // Close the dialog and reset state
        setIsCreateThoughtOpen(false);
        setSelectedEmailForThought(null);
        
        // Optionally navigate to the Fire Cycle dashboard
        // window.location.href = '/fire-cycle-dashboard';
      } else {
        throw new Error(result.error || 'Failed to create thought');
      }
    } catch (error) {
      toast({
        title: 'Failed to create thought',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingThought(false);
    }
  };

  const getPriorityBadge = (email: InboxItem) => {
    const analysis = aiAnalysis.get(email.id);
    if (!analysis) return null;

    const priority = analysis.urgency;
    const value = analysis.businessValue;

    if (priority === 'critical' || value === 'critical') {
      return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    }
    if (priority === 'high' || value === 'high') {
      return <Badge variant="default" className="text-xs">High Priority</Badge>;
    }
    if (priority === 'medium' || value === 'medium') {
      return <Badge variant="secondary" className="text-xs">Medium</Badge>;
    }
    return null;
  };

  const getIntelligenceIndicator = (email: InboxItem) => {
    const analysis = aiAnalysis.get(email.id);
    if (!analysis) return null;

  const hasOpportunities = (analysis.opportunities ?? []).length > 0;
  const hasPredictions = (analysis.predictions ?? []).length > 0;
  const hasWorkflows = (analysis.workflows ?? []).length > 0;

    if (hasOpportunities || hasPredictions || hasWorkflows) {
      return (
        <Tooltip content={
          <div className="space-y-1">
            {hasOpportunities && <div>• {(analysis.opportunities ?? []).length} opportunities</div>}
            {hasPredictions && <div>• {(analysis.predictions ?? []).length} predictions</div>}
            {hasWorkflows && <div>• {(analysis.workflows ?? []).length} workflows</div>}
          </div>
        }>
                     <Brain className="h-4 w-4 text-primary" />
        </Tooltip>
      );
    }

    return null;
  };

  const getWorkflowStatus = (email: InboxItem) => {
    const analysis = aiAnalysis.get(email.id);
    if (!analysis?.workflows?.length) return null;

  const completedWorkflows = (analysis.workflows ?? []).filter((w: any) => 
      workflowStatus.get(w.id) === 'completed'
    ).length;

  const totalWorkflows = (analysis.workflows ?? []).length;

    if (completedWorkflows === totalWorkflows) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (completedWorkflows > 0) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading inbox: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      <style dangerouslySetInnerHTML={{
        __html: `
          .email-html-content {
            max-width: 100%;
            overflow-x: auto;
          }
          .email-html-content img {
            max-width: 100%;
            height: auto;
          }
          .email-html-content table {
            border-collapse: collapse;
            width: 100%;
          }
          .email-html-content table td,
          .email-html-content table th {
            border: 1px solid #e5e7eb;
            padding: 8px;
          }
          .email-html-content a {
            color: #3b82f6;
            text-decoration: underline;
          }
          .email-html-content a:hover {
            color: #2563eb;
          }
        `
      }} />
      
      {/* Left Sidebar - Navigation */}
      <div className="w-64 border-r border-border bg-muted/30">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-foreground">Mail</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Intelligence Mode Toggle */}
          <div className="mb-4">
            <Button
              variant={realTimeMode ? "default" : "outline"}
              size="sm"
              onClick={handleToggleRealTimeMode}
              className="w-full"
            >
              <Brain className="h-4 w-4 mr-2" />
              {realTimeMode ? 'AI Mode On' : 'AI Mode Off'}
            </Button>
          </div>

          {/* Intelligence Insights */}
          {intelligenceInsights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">AI Insights</h3>
              <div className="space-y-2">
                {intelligenceInsights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center space-x-2">
                      {insight.icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-primary truncate">
                          {insight.title}
                        </p>
                        <p className="text-xs text-primary/80 truncate">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Mailbox Button */}
          <Button
            onClick={handleAddMailbox}
            className="w-full mb-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mailbox
          </Button>

          {/* Navigation */}
          <nav className="space-y-1">
            <Button
              variant={activeTab === 'inbox' ? 'default' : 'ghost'}
              className="w-full justify-start hover:bg-muted/50"
              onClick={() => handleTabChange('inbox')}
            >
              <Inbox className="h-4 w-4 mr-3" />
              Inbox
              <span className="ml-auto text-xs text-muted-foreground">{total}</span>
            </Button>
            <Button
              variant={activeTab === 'starred' ? 'default' : 'ghost'}
              className="w-full justify-start hover:bg-muted/50"
              onClick={() => handleTabChange('starred')}
            >
              <Star className="h-4 w-4 mr-3" />
              Starred
            </Button>
            <Button
              variant={activeTab === 'sent' ? 'default' : 'ghost'}
              className="w-full justify-start hover:bg-muted/50"
              onClick={() => handleTabChange('sent')}
            >
              <Send className="h-4 w-4 mr-3" />
              Sent
            </Button>
            <Button
              variant={activeTab === 'archive' ? 'default' : 'ghost'}
              className="w-full justify-start hover:bg-muted/50"
              onClick={() => handleTabChange('archive')}
            >
              <Archive className="h-4 w-4 mr-3" />
              Archive
            </Button>
            <Button
              variant={activeTab === 'trash' ? 'default' : 'ghost'}
              className="w-full justify-start hover:bg-muted/50"
              onClick={() => handleTabChange('trash')}
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Trash
            </Button>
          </nav>

          {/* Connected Accounts */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-foreground mb-3">Connected Accounts</h3>
            {connectedProviders.length > 0 ? (
              <div className="space-y-2">
                {connectedProviders.map(provider => (
                  <div key={provider} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium capitalize">{provider}</span>
                    </div>
                    {provider === 'microsoft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDisconnectMicrosoft}
                        disabled={isDisconnecting}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Unlink className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                            <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No accounts connected</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddMailbox}
                  className="mt-2 text-primary hover:text-primary/80"
                >
                  Connect Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search in mail..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={filters.is_read === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange({ is_read: filters.is_read === false ? undefined : false })}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Unread
                </Button>
                <Button
                  variant={filters.is_important ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange({ is_important: !filters.is_important })}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Important
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange({ is_read: false })}
                >
                  <Brain className="h-4 w-4 mr-1" />
                  AI Priority
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive text-lg font-medium">Failed to load emails</p>
              <p className="text-muted-foreground text-sm mb-4">
                {error instanceof Error ? error.message : 'An error occurred while loading emails'}
              </p>
              {connectedProviders.length === 0 && (
                <Button 
                  onClick={() => window.location.href = '/integrations'}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Email Account
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {emails.map((email: InboxItem) => (
                <div
                  key={email.id}
                              className={`flex items-center p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
              !email.is_read ? 'bg-primary/10' : ''
            } ${selectedEmail === email.id ? 'bg-primary/20' : ''}`}
                  onClick={() => handleViewEmail(email)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {email.sender_name?.charAt(0) || email.sender_email?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Email Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium text-sm truncate ${
                          !email.is_read ? 'font-semibold' : ''
                        }`}>
                          {email.sender_name || email.sender_email}
                        </p>
                        {email.is_important && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                        {getPriorityBadge(email)}
                        {getIntelligenceIndicator(email)}
                        {getWorkflowStatus(email)}
                        {processingEmails.has(email.id) && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        )}
                      </div>
                                             <p className={`text-sm truncate ${
                         !email.is_read ? 'font-semibold text-foreground' : 'text-foreground'
                       }`}>
                        {email.subject || '(No subject)'}
                      </p>
                                             <p className="text-xs text-muted-foreground truncate">
                        {email.body_preview}
                      </p>
                    </div>

                    {/* Meta Info */}
                                         <div className="flex items-center space-x-2 text-xs text-muted-foreground flex-shrink-0">
                      {email.has_attachments && (
                                                 <span className="text-primary">📎</span>
                      )}
                      {email.provider && (
                                                 <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {email.provider}
                        </span>
                      )}
                      <span>
                        {email.item_timestamp ? new Date(email.item_timestamp).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(email.id, !email.is_read, email.provider);
                      }}
                      className="opacity-0 group-hover: opacity-100 transition-opacity"
                    >
                      {email.is_read ? <EyeOff className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </Button>
                    
                    {/* Create Thought Button */}
                    <Tooltip content="Create Fire Cycle thought from this email">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateThoughtFromEmail(email);
                        }}
                                                 className="opacity-0 group-hover: opacity-100 transition-opacity text-primary hover:text-primary/80"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {emails.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  {connectedProviders.length === 0 ? (
                    <>
                      <p className="text-muted-foreground text-lg font-medium">No email integration set up</p>
                      <p className="text-muted-foreground text-sm mb-4">Connect your Microsoft 365 account to start viewing emails</p>
                      <Button 
                        onClick={() => window.location.href = '/integrations'}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Connect Email Account
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-lg font-medium">No emails found</p>
                      <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Thought Dialog */}
      <Dialog open={isCreateThoughtOpen} onOpenChange={setIsCreateThoughtOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Fire Cycle Thought from Email</DialogTitle>
          </DialogHeader>
          {selectedEmailForThought && (
            <CreateThoughtForm
              email={selectedEmailForThought}
              onSubmit={handleCreateThought}
              onCancel={() => {
                setIsCreateThoughtOpen(false);
                setSelectedEmailForThought(null);
              }}
              isLoading={isCreatingThought}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Email Viewer Dialog */}
      <Dialog open={isEmailViewerOpen} onOpenChange={setIsEmailViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {viewingEmail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="truncate">{viewingEmail.subject || '(No Subject)'}</span>
                  <div className="flex items-center space-x-2">
                    {viewingEmail.is_important && (
                      <Star className="h-4 w-4 text-warning fill-current" />
                    )}
                    {getPriorityBadge(viewingEmail)}
                  </div>
                </DialogTitle>
                <DialogDescription className="flex items-center justify-between">
                  <span>From: {viewingEmail.sender_name || viewingEmail.sender_email}</span>
                  <span className="text-xs text-muted-foreground">
                    {viewingEmail.item_timestamp ? new Date(viewingEmail.item_timestamp).toLocaleString() : ''}
                  </span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Email Metadata */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    {viewingEmail.has_attachments && (
                      <span className="flex items-center space-x-1">
                        <span>📎</span>
                        <span>Has attachments</span>
                      </span>
                    )}
                    {viewingEmail.provider && (
                      <span className="bg-muted px-2 py-1 rounded text-xs">
                        {viewingEmail.provider}
                      </span>
                    )}
                  </div>
                </div>

                {/* Email Body */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-foreground">Email Content</h4>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={emailViewMode === 'html' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEmailViewMode('html')}
                        disabled={!fullEmailContent.html_content}
                      >
                        HTML
                      </Button>
                      <Button
                        variant={emailViewMode === 'text' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEmailViewMode('text')}
                        disabled={!fullEmailContent.content}
                      >
                        Plain Text
                      </Button>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    {fullEmailContent.isLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Loading email content...</span>
                      </div>
                    ) : fullEmailContent.error ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                        <p className="text-destructive">{fullEmailContent.error}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Showing preview instead
                        </p>
                        <div className="mt-4 p-3 bg-muted rounded border">
                          <pre className="text-sm whitespace-pre-wrap">{viewingEmail.body_preview}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="email-content">
                        {emailViewMode === 'html' && fullEmailContent.html_content ? (
                          <div 
                            className="email-html-content"
                            dangerouslySetInnerHTML={{ __html: fullEmailContent.html_content }} 
                          />
                        ) : emailViewMode === 'text' && fullEmailContent.content ? (
                          <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-3 rounded border">
                            {fullEmailContent.content}
                          </pre>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No {emailViewMode === 'html' ? 'HTML' : 'plain text'} content available</p>
                            {fullEmailContent.content && emailViewMode === 'html' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEmailViewMode('text')}
                                className="mt-2"
                              >
                                Switch to Plain Text
                              </Button>
                            )}
                            {fullEmailContent.html_content && emailViewMode === 'text' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEmailViewMode('html')}
                                className="mt-2"
                              >
                                Switch to HTML
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleMarkAsRead(viewingEmail.id, !viewingEmail.is_read, viewingEmail.provider);
                      }}
                    >
                      {viewingEmail.is_read ? <EyeOff className="h-4 w-4 mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                      {viewingEmail.is_read ? 'Mark as Unread' : 'Mark as Read'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleCreateThoughtFromEmail(viewingEmail);
                        handleCloseEmailViewer();
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Thought
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseEmailViewer}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create Thought Form Component
interface CreateThoughtFormProps {
  email: InboxItem;
  onSubmit: (data: CreateThoughtData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CreateThoughtForm: React.FC<CreateThoughtFormProps> = ({ email, onSubmit, onCancel, isLoading }) => {
  const [content, setContent] = useState('');
  const [firePhase, setFirePhase] = useState<'focus' | 'insight' | 'roadmap' | 'execute'>('focus');
  const [category, setCategory] = useState('idea');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Initialize content with email subject and preview
  useEffect(() => {
    const emailContent = [
      email.subject && `Subject: ${email.subject}`,
      email.body_preview && `Content: ${email.body_preview}`,
      email.sender_name && `From: ${email.sender_name} (${email.sender_email})`
    ].filter(Boolean).join('\n\n');
    
    setContent(emailContent);
  }, [email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit({
        content: content.trim(),
        firePhase,
        category,
        priority,
        sourceEmailId: email.id,
        sourceEmailSubject: email.subject || '',
        sourceEmailSender: email.sender_name || email.sender_email || ''
      });
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'focus': return Target;
      case 'insight': return Lightbulb;
      case 'roadmap': return MapIcon;
      case 'execute': return Play;
      default: return Sparkles;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fire-phase">FIRE Phase *</Label>
          <Select value={firePhase} onValueChange={(value) => setFirePhase(value as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIRE_PHASES.map((phase) => {
                const IconComponent = phase.icon;
                return (
                  <SelectItem key={phase.id} value={phase.id}>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{phase.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {FIRE_PHASES.find(p => p.id === firePhase)?.description}
          </p>
        </div>
        
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="reminder">Reminder</SelectItem>
            <SelectItem value="update">Update</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="content">Thought Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your thought, idea, or action item..."
          className="mt-1 min-h-[120px]"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          This content will be used to create a structured thought in the Fire Cycle system.
        </p>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !content.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Create Thought
        </Button>
      </div>
    </form>
  );
};

export default UnifiedInbox; 
