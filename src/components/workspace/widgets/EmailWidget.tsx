import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { googleWorkspaceService } from '@/lib/services/googleWorkspaceService';
import { Loader2, Mail, AlertCircle, Inbox, MessageSquare, Check, PlusCircle } from 'lucide-react';
import { useIntegrationProviders } from '@/hooks/useIntegrationProviders';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Alert, AlertDescription } from "@/components/ui/Alert";

// Standardized email type
export type Email = {
  id: string;
  subject: string;
  from: string;
  fromInitials: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  viewLink: string;
  source: 'google' | 'microsoft';
};

type GoogleEmailPayloadHeader = {
    name: 'From' | 'Subject' | 'Date' | string; // Allow other headers
    value: string;
};

type GoogleEmail = {
    id: string;
    snippet: string;
    labelIds: string[];
    payload: {
        headers: GoogleEmailPayloadHeader[];
    };
};

const fetchAllEmails = async (
    providers: ReturnType<typeof useIntegrationProviders>
): Promise<Email[]> => {
    const promises: Promise<Email[]>[] = [];

    if (providers.google.isConnected) {
        promises.push(
            googleWorkspaceService.getEmails(5).then(emails => 
                emails.map((e: GoogleEmail): Email => {
                    const fromHeader = e.payload.headers.find((h) => h.name === 'From');
                    const subjectHeader = e.payload.headers.find((h) => h.name === 'Subject');
                    const dateHeader = e.payload.headers.find((h) => h.name === 'Date');
                    const fromName = fromHeader?.value.includes('<') ? fromHeader.value.split('<')[0].trim() : fromHeader?.value || 'Unknown';
                    
                    return {
                        id: e.id,
                        subject: subjectHeader?.value || 'No Subject',
                        from: fromName,
                        fromInitials: fromName.split(' ').map((n: string) => n[0]).join(''),
                        preview: e.snippet,
                        timestamp: dateHeader?.value || 'Unknown Date',
                        isRead: !e.labelIds.includes('UNREAD'),
                        viewLink: `https://mail.google.com/mail/u/0/#inbox/${e.id}`,
                        source: 'google'
                    }
                })
            )
        );
    }

    const allEmails = await Promise.all(promises);
    return allEmails.flat().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const EmailWidget: React.FC = () => {
  const queryClient = useQueryClient();
  const providers = useIntegrationProviders();
  
  // Mock emails for development/demo
  const mockEmails: Email[] = [
    {
      id: 'mock-1',
      subject: 'Q4 Planning Session - Action Items & Next Steps',
      from: 'Sarah Johnson (Product Manager)',
      fromInitials: 'SJ',
      preview: 'Hi team, I wanted to share the latest updates from our Q4 planning session. We have made significant progress on the roadmap and identified key priorities for the next quarter. The engineering team has committed to delivering the new dashboard feature by November 15th, and we\'re on track to launch the mobile app beta by December 1st.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isRead: false,
      viewLink: 'https://mail.google.com/mock-1',
      source: 'google'
    },
    {
      id: 'mock-2',
      subject: 'Weekly Standup - Tomorrow 9:00 AM',
      from: 'Google Calendar',
      fromInitials: 'GC',
      preview: 'This is a reminder that you have a meeting scheduled for tomorrow at 9:00 AM: Weekly Standup with the development team. The meeting will cover sprint progress, blockers, and upcoming deliverables. Please prepare your updates on the authentication system refactor and the new API endpoints.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      isRead: true,
      viewLink: 'https://mail.google.com/mock-2',
      source: 'google'
    },
    {
      id: 'mock-3',
      subject: 'Feature Request: Advanced Search Filters',
      from: 'Alex Chen (UX Designer)',
      fromInitials: 'AC',
      preview: 'Hey! I have an idea for a new feature that could really improve our user experience. Based on user feedback, we should add advanced search filters to help users find content more efficiently. I\'ve attached some mockups and user research data that shows this could increase engagement by 25%. Would love to discuss this in our next design review.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      isRead: false,
      viewLink: 'https://mail.google.com/mock-3',
      source: 'google'
    },
    {
      id: 'mock-4',
      subject: 'Security Alert: New Login from Unknown Device',
      from: 'Marcoby Security Team',
      fromInitials: 'MS',
      preview: 'We detected a new login to your account from an unknown device. Location: San Francisco, CA. Device: Chrome on macOS. If this was you, you can safely ignore this message. If not, please secure your account immediately by changing your password and enabling two-factor authentication.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      isRead: true,
      viewLink: 'https://mail.google.com/mock-4',
      source: 'google'
    },
    {
      id: 'mock-5',
      subject: 'Invoice #INV-2024-001 - Payment Confirmation',
      from: 'Stripe Billing',
      fromInitials: 'SB',
      preview: 'Thank you for your payment! Your invoice #INV-2024-001 for $99.00 has been successfully processed. This covers your Nexus Pro subscription for November 2024. You can download your receipt from the billing portal or view it directly in your account dashboard.',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      isRead: false,
      viewLink: 'https://mail.google.com/mock-5',
      source: 'google'
    }
  ];
  
  const { data: emails, isLoading, isError } = useQuery<Email[], Error>({
    queryKey: ['inboxItems', providers.google.isConnected],
    queryFn: () => fetchAllEmails(providers),
    enabled: providers.google.isConnected,
  });

  const markAsReadMutation = useMutation({
      mutationFn: async (email: Email) => {
          await googleWorkspaceService.markEmailAsRead(email.id);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['inboxItems'] });
      },
      onError: (error: any) => {
          // Optionally, show a toast or log error
          console.error('Failed to mark email as read:', error);
      }
  })

  const handleComposeEmail = () => {
    window.open('https://mail.google.com/mail/u/0/#inbox?compose=new', '_blank');
  };

  const renderContent = () => {
    if (providers.isLoading) {
        return <div className="flex justify-center items-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!providers.google.isConnected) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
            <Inbox className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Connect Your Email</h3>
            <p className="text-sm text-muted-foreground">Connect Gmail to see your latest emails and manage your inbox.</p>
            <div className="flex gap-4">
                <Button onClick={providers.google.connect}>Connect Google</Button>
            </div>
            {/* Show mock emails for demo */}
            <div className="w-full mt-6 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Demo Emails:</h4>
              {mockEmails.slice(0, 2).map((email) => (
                <div key={email.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/30">
                  <Avatar>
                    <AvatarFallback>{email.fromInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    {/* Header row with sender and timestamp */}
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-semibold text-foreground truncate pr-2">{email.from}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(email.timestamp).toLocaleDateString()}</p>
                    </div>
                    {/* Subject line */}
                    <p className="text-sm font-medium text-foreground truncate mb-1 leading-tight">{email.subject}</p>
                    {/* Preview text - multiple lines */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{email.preview}</p>
                    {/* Read status indicator */}
                    {!email.isRead && (
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                        <span className="text-xs text-primary font-medium">Unread</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </div>
      );
    }

    if (isLoading) {
      return <div className="flex justify-center items-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (isError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading emails. Please try again.</AlertDescription>
        </Alert>
      );
    }

    // Use real emails if available, otherwise show mock emails
    const displayEmails = emails && emails.length > 0 ? emails : mockEmails;

    if (displayEmails.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <Mail className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">All Caught Up!</h3>
          <p className="text-sm text-muted-foreground">You have no new emails in your inbox.</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
            {displayEmails.map((email) => (
            <div key={email.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border/50">
                <Avatar>
                    <AvatarFallback>{email.fromInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(email.viewLink, '_blank')}>
                    {/* Header row with sender and timestamp */}
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold text-foreground truncate pr-2">{email.from}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(email.timestamp).toLocaleDateString()}</p>
                    </div>
                    {/* Subject line */}
                    <p className="text-sm font-medium text-foreground truncate mb-1 leading-tight">{email.subject}</p>
                    {/* Preview text - multiple lines */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{email.preview}</p>
                    {/* Read status indicator */}
                    {!email.isRead && (
                        <div className="flex items-center mt-1">
                            <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                            <span className="text-xs text-primary font-medium">Unread</span>
                        </div>
                    )}
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); window.open(email.viewLink, '_blank'); }} 
                      title="Reply to email"
                      aria-label="Reply to email"
                      className="h-8 w-8"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); markAsReadMutation.mutate(email); }} 
                      title="Mark as read"
                      aria-label="Mark as read"
                      className="h-8 w-8"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email</CardTitle>
            <CardDescription>Stay on top of your inbox with quick access to recent emails.</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleComposeEmail}
            disabled={!providers.google.isConnected}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 