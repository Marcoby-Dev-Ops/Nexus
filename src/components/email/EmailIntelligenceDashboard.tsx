import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Input } from '@/shared/components/ui/Input.tsx';
import { useAuth } from '@/hooks/index';
import { emailIntelligenceService, type OpportunityDetection, type ReplyDraft } from '@/core/services/emailIntelligenceService';
import { emailIntegrationService, type EmailAnalysisResult } from '@/core/services/emailIntegrationService';
import { RefreshCw, Mail, AlertTriangle, CheckCircle, Zap, Eye, Brain } from 'lucide-react';
interface EmailData {
  id: string;
  subject: string;
  senderemail: string;
  sender_name?: string;
  content?: string;
  body_preview?: string;
  itemtimestamp: string;
  isread: boolean;
  isimportant: boolean;
  urgency_score?: number;
  ai_category?: string;
}

export const EmailIntelligenceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityDetection[]>([]);
  const [replyDraft, setReplyDraft] = useState<ReplyDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load real emails from unified inbox
  useEffect(() => {
    if (user?.id) {
      loadUserEmails();
    }
  }, [user?.id]);

  const loadUserEmails = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userEmails = await emailIntegrationService.getUserEmails(user.id, 20);
      setEmails(userEmails);
      
      if (userEmails.length === 0) {
        setError('No emails found in your unified inbox. Make sure you have email integrations set up.');
      }
    } catch (err) {
      setError('Failed to load emails from unified inbox');
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error loading emails: ', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEmail = async (email: EmailData) => {
    if (!user?.id) return;
    
    setAnalysisLoading(true);
    setError(null);
    
    try {
      const analysis = await emailIntegrationService.triggerEmailAnalysis(user.id, email.id);
      
      if (analysis) {
        setOpportunities(analysis.opportunities);
        setReplyDraft(analysis.replyDraft || null);
        setSelectedEmail(email);
      } else {
        setOpportunities([]);
        setReplyDraft(null);
        setError('No opportunities detected in this email');
      }
    } catch (err) {
      setError('Failed to analyze email');
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error analyzing email: ', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const processAllEmails = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await emailIntegrationService.processNewEmails(user.id);
      
      if (results.length > 0) {
        setError(`Processed ${results.length} emails. Found ${results.filter(r => r.opportunities.length > 0).length} with opportunities.`);
      } else {
        setError('No new emails to process or no opportunities found');
      }
      
      // Reload emails to show updated data
      await loadUserEmails();
    } catch (err) {
      setError('Failed to process emails');
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error processing emails: ', err);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getBusinessValueColor = (value: string) => {
    switch (value) {
      case 'high': return 'bg-purple-100 text-purple-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Intelligence</h1>
          <p className="text-muted-foreground">
            AI-powered email analysis for opportunity detection and reply drafting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUserEmails} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={processAllEmails} disabled={loading}>
            <Brain className="w-4 h-4 mr-2" />
            Analyze All
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emails.length}</div>
            <p className="text-xs text-muted-foreground">
              In unified inbox
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emails.filter(e => !e.is_read).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending analysis
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Important</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emails.filter(e => e.is_important).length}
            </div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground">
              Detected in selected email
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
        {/* Email List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Unified Inbox Emails
            </CardTitle>
            <CardDescription>
              Your emails from the unified inbox. Click to analyze for opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading emails...</span>
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No emails found in unified inbox</p>
                <p className="text-sm">Set up email integrations to see your emails here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedEmail?.id === email.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover: border-primary/50'
                    }`}
                    onClick={() => analyzeEmail(email)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{email.subject || '(No Subject)'}</h4>
                          {!email.is_read && (
                            <Badge variant="secondary" className="text-xs">Unread</Badge>
                          )}
                          {email.is_important && (
                            <Badge variant="destructive" className="text-xs">Important</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          From: {email.sender_name || email.sender_email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(email.item_timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {email.ai_category && (
                          <Badge variant="outline" className="text-xs">
                            {email.ai_category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis
            </CardTitle>
            <CardDescription>
              {selectedEmail ? `Analyzing: ${selectedEmail.subject}` : 'Select an email to analyze'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Analyzing email...</span>
              </div>
            ) : selectedEmail ? (
              <div className="space-y-4">
                {/* Email Content */}
                <div>
                  <h4 className="font-medium mb-2">Email Content</h4>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p><strong>Subject: </strong> {selectedEmail.subject || '(No Subject)'}</p>
                    <p><strong>From: </strong> {selectedEmail.sender_name || selectedEmail.sender_email}</p>
                    <p><strong>Date:</strong> {new Date(selectedEmail.item_timestamp).toLocaleString()}</p>
                    <div className="mt-2">
                      <strong>Content: </strong>
                      <p className="text-muted-foreground mt-1">
                        {selectedEmail.content || selectedEmail.body_preview || 'No content available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opportunities */}
                {opportunities.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2">Detected Opportunities</h4>
                    <div className="space-y-2">
                      {opportunities.map((opportunity, index) => (
                        <Alert key={index}>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{opportunity.type}</span>
                              <Badge className={getUrgencyColor(opportunity.urgency)}>
                                {opportunity.urgency} urgency
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {opportunity.description}
                            </p>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No business opportunities detected in this email.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Reply Draft */}
                {replyDraft && (
                  <div>
                    <h4 className="font-medium mb-2">AI-Generated Reply Draft</h4>
                    <div className="space-y-2">
                      <Textarea
                        value={replyDraft.content}
                        readOnly
                        className="min-h-[120px]"
                      />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{replyDraft.tone}</Badge>
                        <Badge variant="outline">{replyDraft.length}</Badge>
                        <Badge variant="outline">{replyDraft.urgency}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select an email from the list to analyze</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 