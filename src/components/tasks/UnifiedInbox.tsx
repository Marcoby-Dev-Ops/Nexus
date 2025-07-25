import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Loader2, Mail, AlertCircle, Search, Star, EyeOff, Unlink, Plus, Settings, Inbox, Send, Archive, Trash2, Filter, MoreHorizontal, RefreshCw, Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap, Target } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/Avatar';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Tooltip } from '@/shared/components/ui/Tooltip';
import { useInboxItems } from '@/shared/hooks/useDataService.ts';
import type { OWAInboxFilters } from '@/services/email/owaInboxService';
import { owaInboxService } from '@/services/email/owaInboxService';
import { EmailIntegrationService } from '@/core/services/emailIntegrationService';
import { supabase } from '@/lib/supabase';

interface InboxItem {
  id: string;
  user_id?: string;
  subject: string;
  sendername: string;
  senderemail: string;
  recipientemail: string;
  content: string;
  htmlcontent: string;
  bodypreview: string;
  messageid: string;
  threadid: string;
  isread: boolean;
  isimportant: boolean;
  isflagged: boolean;
  hasattachments: boolean;
  provider: string;
  itemtimestamp: string;
  receivedat: string;
  status: string;
  aipriorityscore: number;
  aicategory: string;
  aisentiment: string;
  aisummary: string;
  aiactionitems: string[];
  priorityscore: number;
  integrationid: string | null;
  externalid: string;
  sourcetype: string;
  createdat: string;
  updatedat: string;
}

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

const emailIntegrationService = new EmailIntegrationService();

const UnifiedInbox: React.FC = () => {
  const [filters, setFilters] = useState<OWAInboxFilters>({});
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<Map<string, AIAnalysis>>(new Map());
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set());
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [intelligenceInsights, setIntelligenceInsights] = useState<IntelligenceInsight[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<Map<string, string>>(new Map());

  // Get connected providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      const providers = await owaInboxService.getConnectedProviders();
      setConnectedProviders(providers);
    };
    fetchProviders();
  }, []);

  // Use the data service hook instead of OWA service
  const { error, refetch } = useInboxItems(filters, 50, 0);
  const emails = (inboxData as InboxData)?.items || [];
  const total = (inboxData as InboxData)?.total || 0;
  const isError = !!error;

  // Real-time email processing
  useEffect(() => {
    if (realTimeMode && emails.length > 0) {
      processNewEmailsForIntelligence();
    }
  }, [emails, realTimeMode]);

  // Process new emails for AI intelligence
  const processNewEmailsForIntelligence = useCallback(async () => {
    const unprocessedEmails = emails.filter(email => 
      !aiAnalysis.has(email.id) && 
      !processingEmails.has(email.id) &&
      !email.is_read
    );

    if (unprocessedEmails.length === 0) return;

    for (const email of unprocessedEmails) {
      setProcessingEmails(prev => new Set(prev).add(email.id));
      
      try {
        const analysis = await emailIntegrationService.triggerEmailAnalysis(email.user_id || 'unknown', email.id);
        
        if (analysis) {
          setAiAnalysis(prev => new Map(prev).set(email.id, {
            opportunities: analysis.opportunities || [],
            predictions: analysis.predictions || [],
            workflows: analysis.workflows || [],
            businessValue: analysis.businessValue || 'low',
            urgency: analysis.urgency || 'low'
          }));

          // Update workflow status
          if (analysis.workflows) {
            analysis.workflows.forEach((workflow) => {
              setWorkflowStatus(prev => new Map(prev).set(workflow.id, workflow.status));
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
        setProcessingEmails(prev => {
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
    if (analysis.opportunities?.length > 0) {
      insights.push({
        type: 'opportunity',
        title: `${analysis.opportunities.length} Business Opportunities Detected`,
        description: `AI identified ${analysis.opportunities.length} potential business opportunities in this email`,
        icon: <Target className="h-4 w-4" />,
        priority: 'high',
        emailId: email.id
      });
    }

    // Prediction insights
    if (analysis.predictions?.length > 0) {
      insights.push({
        type: 'prediction',
        title: `${analysis.predictions.length} Predictive Insights Generated`,
        description: `AI generated ${analysis.predictions.length} predictions based on email patterns`,
        icon: <TrendingUp className="h-4 w-4" />,
        priority: 'medium',
        emailId: email.id
      });
    }

    // Workflow insights
    if (analysis.workflows?.length > 0) {
      insights.push({
        type: 'workflow',
        title: `${analysis.workflows.length} Automated Workflows Triggered`,
        description: `AI triggered ${analysis.workflows.length} automated workflows for this email`,
        icon: <Zap className="h-4 w-4" />,
        priority: 'high',
        emailId: email.id
      });
    }

    setIntelligenceInsights(prev => [...prev, ...insights]);
  }, []);

  const handleMarkAsRead = async (emailId: string, isRead: boolean, provider: string = 'microsoft') => {
    try {
      // Update the email read status in the database
      const { error } = await supabase
        .from('ai_inbox_items')
        .update({ isread: isRead })
        .eq('id', emailId);
      
      if (error) {
        // TODO: Implement proper error handling/notification
        // In production, this would show a user-friendly error message
      } else {
        // Refetch the inbox data
        refetch();
      }
    } catch {
      // TODO: Implement proper error handling/notification
      // In production, this would show a user-friendly error message
    }
  };

  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const handleFilterChange = (newFilters: Partial<OWAInboxFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDisconnectMicrosoft = async () => {
    try {
      setIsDisconnecting(true);
      await owaInboxService.removeOAuthTokens('microsoft');
      const providers = await owaInboxService.getConnectedProviders();
      setConnectedProviders(providers);
    } catch {
      // TODO: Implement proper error handling/notification
      // In production, this would show a user-friendly error message
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleAddMailbox = () => {
    // TODO: Implement add mailbox flow
    // This will open a modal or navigate to mailbox setup
  };

  const handleToggleRealTimeMode = () => {
    setRealTimeMode(!realTimeMode);
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

    const hasOpportunities = analysis.opportunities.length > 0;
    const hasPredictions = analysis.predictions.length > 0;
    const hasWorkflows = analysis.workflows.length > 0;

    if (hasOpportunities || hasPredictions || hasWorkflows) {
      return (
        <Tooltip content={
          <div className="space-y-1">
            {hasOpportunities && <div>• {analysis.opportunities.length} opportunities</div>}
            {hasPredictions && <div>• {analysis.predictions.length} predictions</div>}
            {hasWorkflows && <div>• {analysis.workflows.length} workflows</div>}
          </div>
        }>
          <Brain className="h-4 w-4 text-blue-600" />
        </Tooltip>
      );
    }

    return null;
  };

  const getWorkflowStatus = (email: InboxItem) => {
    const analysis = aiAnalysis.get(email.id);
    if (!analysis?.workflows?.length) return null;

    const completedWorkflows = analysis.workflows.filter((w: any) => 
      workflowStatus.get(w.id) === 'completed'
    ).length;

    const totalWorkflows = analysis.workflows.length;

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
    <div className="flex h-full bg-white">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 border-r border-gray-200 bg-gray-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Mail</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-gray-500 hover: text-gray-700"
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
              <h3 className="text-sm font-medium text-gray-700 mb-3">AI Insights</h3>
              <div className="space-y-2">
                {intelligenceInsights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      {insight.icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-900 truncate">
                          {insight.title}
                        </p>
                        <p className="text-xs text-blue-700 truncate">
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
            className="w-full mb-6 bg-blue-600 hover: bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mailbox
          </Button>

          {/* Navigation */}
          <nav className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
            >
              <Inbox className="h-4 w-4 mr-3" />
              Inbox
              <span className="ml-auto text-xs text-gray-500">{total}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100"
            >
              <Star className="h-4 w-4 mr-3" />
              Starred
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100"
            >
              <Send className="h-4 w-4 mr-3" />
              Sent
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100"
            >
              <Archive className="h-4 w-4 mr-3" />
              Archive
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Trash
            </Button>
          </nav>

          {/* Connected Accounts */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Connected Accounts</h3>
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
                <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No accounts connected</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddMailbox}
                  className="mt-2 text-blue-600 hover: text-blue-700"
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search in mail"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus: ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={filters.is_read === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange({ isread: filters.is_read === false ? undefined : false })}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Unread
                </Button>
                <Button
                  variant={filters.is_important ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange({ isimportant: !filters.is_important })}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Important
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange({ isread: false })}
                >
                  <Brain className="h-4 w-4 mr-1" />
                  AI Priority
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {emails.map((email: InboxItem) => (
                <div
                  key={email.id}
                  className={`flex items-center p-4 hover: bg-gray-50 cursor-pointer transition-colors ${
                    !email.is_read ? 'bg-blue-50' : ''
                  } ${selectedEmail === email.id ? 'bg-blue-100' : ''}`}
                  onClick={() => setSelectedEmail(email.id)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
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
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        )}
                      </div>
                      <p className={`text-sm truncate ${
                        !email.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'
                      }`}>
                        {email.subject || '(No subject)'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {email.body_preview}
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0">
                      {email.has_attachments && (
                        <span className="text-blue-500">📎</span>
                      )}
                      {email.provider && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
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
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {emails.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No emails found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedInbox; 