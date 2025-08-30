import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/hooks/index';
import { AIInsightsService, type OpportunityDetection, type ReplyDraft } from '@/services/ai';
import type { EmailService } from '@/services/email';
import { serviceRegistry } from '@/core/services/ServiceRegistry';
import { EmailViewer } from './EmailViewer';
import { RefreshCw, Mail, AlertTriangle, CheckCircle, Zap, Eye, Brain, EyeOff } from 'lucide-react';
interface EmailData {
  id: string;
  subject: string;
  sender: string;
  body: string;
  receivedAt: string;
  source: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  businessValue: 'low' | 'medium' | 'high' | 'critical';
  analysisResult?: any;
  processingStatus?: string;
}

export const EmailIntelligenceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [viewingEmail, setViewingEmail] = useState<EmailData | null>(null);
  const [isEmailViewerOpen, setIsEmailViewerOpen] = useState(false);
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
      const emailService = serviceRegistry.getService<EmailService>('email');
      const result = await emailService.getEmails({}, 20, 0);
      if (result.success && result.data) {
        setEmails(result.data.items.map(email => ({
          id: email.id,
          subject: email.subject || '',
          sender: email.sender_email || '',
          body: email.body_preview || '',
          receivedAt: email.item_timestamp || '',
          source: email.provider || 'unknown',
          urgency: 'low',
          businessValue: 'low',
        })));
      }
      
      if (result.success && result.data && result.data.items.length === 0) {
        setError('No emails found in your unified inbox. Make sure you have email integrations set up.');
      }
    } catch (err) {
      setError('Failed to load emails from unified inbox');
       
     
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
      // For now, we'll simulate email analysis since the simplified EmailService doesn't have analysis methods
      // In a real implementation, this would call AI analysis services
      const analysis = {
        opportunities: [],
        replyDraft: null
      };
      
      setOpportunities(analysis.opportunities);
      setReplyDraft(analysis.replyDraft || null);
      setSelectedEmail(email);
    } catch (err) {
      setError('Failed to analyze email');
       
     
    // eslint-disable-next-line no-console
    console.error('Error analyzing email: ', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const viewEmail = (email: EmailData) => {
    setViewingEmail(email);
    setIsEmailViewerOpen(true);
  };

  const closeEmailViewer = () => {
    setIsEmailViewerOpen(false);
    setViewingEmail(null);
  };

  const handleDeleteEmail = async (emailId: string) => {
    // Remove email from the list
    setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
    
    // If the deleted email was selected, clear the selection
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
      setOpportunities([]);
      setReplyDraft(null);
    }
  };

  const processAllEmails = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For now, we'll simulate email processing since the simplified EmailService doesn't have processing methods
      // In a real implementation, this would call AI processing services
      setError('Email processing is not yet implemented in the simplified email service');
      
      // Reload emails to show updated data
      await loadUserEmails();
    } catch (err) {
      setError('Failed to process emails');
       
     
    // eslint-disable-next-line no-console
    console.error('Error processing emails: ', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-warning/20 text-warning border-warning/30';
      case 'medium': return 'bg-primary/20 text-primary border-primary/30';
      case 'low': return 'bg-muted/30 text-muted-foreground border-border';
      default: return 'bg-muted/30 text-muted-foreground border-border';
    }
  };

  const getBusinessValueColor = (value: string) => {
    switch (value) {
      case 'critical': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'high': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
            <CardTitle className="text-sm font-medium">High Urgency</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emails.filter(e => e.urgency === 'high' || e.urgency === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emails.filter(e => e.businessValue === 'high' || e.businessValue === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Business value
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
              Your emails from the unified inbox. Click to view full content or analyze for opportunities.
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
                     className={`p-3 rounded-lg border transition-colors ${
                       selectedEmail?.id === email.id
                         ? 'border-primary bg-primary/5'
                         : 'border-border hover:border-primary/50'
                     }`}
                   >
                     <div className="flex items-start justify-between">
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-medium truncate">{email.subject || '(No Subject)'}</h4>
                           <Badge className={getPriorityColor(email.urgency)}>
                             {email.urgency}
                           </Badge>
                           <Badge className={getBusinessValueColor(email.businessValue)}>
                             {email.businessValue}
                           </Badge>
                         </div>
                         <p className="text-sm text-muted-foreground truncate">
                           From: {email.sender}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {new Date(email.receivedAt).toLocaleDateString()}
                         </p>
                       </div>
                       <div className="flex items-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => viewEmail(email)}
                           className="h-8 w-8 p-0"
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => analyzeEmail(email)}
                           className="h-8 w-8 p-0"
                         >
                           <Brain className="h-4 w-4" />
                         </Button>
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
                     <p><strong>From: </strong> {selectedEmail.sender}</p>
                     <p><strong>Date:</strong> {new Date(selectedEmail.receivedAt).toLocaleString()}</p>
                     <div className="mt-2">
                       <strong>Content: </strong>
                       <p className="text-muted-foreground mt-1">
                         {selectedEmail.body || 'No content available'}
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
                              <Badge className={getPriorityColor(opportunity.urgency)}>
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
                       <div className="bg-muted p-3 rounded-lg text-sm">
                         <div className="whitespace-pre-wrap">
                           {replyDraft.content}
                         </div>
                       </div>
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

       {/* Email Viewer */}
       <EmailViewer
         email={viewingEmail}
         isOpen={isEmailViewerOpen}
         onClose={closeEmailViewer}
         onDelete={handleDeleteEmail}
         onRefresh={loadUserEmails}
       />
     </div>
   );
 }; 
