import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/Dialog';
import { useToast } from '@/shared/components/ui/use-toast';
import { usePersonalThoughts } from '@/shared/hooks/usePersonalThoughts';
import { X, Trash2, Brain, Save, Edit3, Mail, User, Calendar, AlertTriangle } from 'lucide-react';

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

interface EmailViewerProps {
  email: EmailData | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (emailId: string) => void;
  onRefresh?: () => void;
}

export const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  isOpen,
  onClose,
  onDelete,
  onRefresh
}) => {
  const { toast } = useToast();
  const { createThought, updateThought } = usePersonalThoughts();
  
  const [isCreatingThought, setIsCreatingThought] = useState(false);
  const [thoughtContent, setThoughtContent] = useState('');
  const [thoughtTitle, setThoughtTitle] = useState('');
  const [isEditingThought, setIsEditingThought] = useState(false);
  const [existingThoughtId, setExistingThoughtId] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!email || !onDelete) return;
    
    try {
      onDelete(email.id);
      toast({
        title: 'Email deleted',
        description: 'The email has been deleted successfully.',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete email. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateThought = async () => {
    if (!email || !thoughtContent.trim()) return;

    try {
      const thoughtData = {
        title: thoughtTitle.trim() || `Thought from: ${email.subject}`,
        content: thoughtContent,
        category: 'email',
        tags: ['email', email.urgency, email.businessValue],
        metadata: {
          source: 'email',
          emailId: email.id,
          emailSubject: email.subject,
          emailSender: email.sender,
          emailReceivedAt: email.receivedAt,
        }
      };

      await createThought(thoughtData);
      
      toast({
        title: 'Thought created',
        description: 'A new thought has been created from this email.',
      });
      
      setIsCreatingThought(false);
      setThoughtContent('');
      setThoughtTitle('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create thought. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateThought = async () => {
    if (!existingThoughtId || !thoughtContent.trim()) return;

    try {
      await updateThought(existingThoughtId, {
        title: thoughtTitle.trim() || `Updated thought from: ${email?.subject}`,
        content: thoughtContent,
      });
      
      toast({
        title: 'Thought updated',
        description: 'The thought has been updated successfully.',
      });
      
      setIsEditingThought(false);
      setThoughtContent('');
      setThoughtTitle('');
      setExistingThoughtId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update thought. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setIsCreatingThought(false);
    setIsEditingThought(false);
    setThoughtContent('');
    setThoughtTitle('');
    setExistingThoughtId(null);
    onClose();
  };

  if (!email) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <DialogTitle>Email Details</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingThought(true)}
                disabled={isCreatingThought}
              >
                <Brain className="h-4 w-4 mr-2" />
                Create Thought
              </Button>
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{email.subject || '(No Subject)'}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{email.sender}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(email.receivedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{email.source}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(email.urgency)}>
                    {email.urgency} urgency
                  </Badge>
                  <Badge className={getBusinessValueColor(email.businessValue)}>
                    {email.businessValue} value
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Email Body */}
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {email.body || 'No content available'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {email.analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {email.analysisResult.opportunities && email.analysisResult.opportunities.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Detected Opportunities</h4>
                      <div className="space-y-2">
                        {email.analysisResult.opportunities.map((opportunity: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
                            <div>
                              <div className="font-medium">{opportunity.type}</div>
                              <div className="text-sm text-muted-foreground">{opportunity.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {email.analysisResult.replyDraft && (
                    <div>
                      <h4 className="font-medium mb-2">AI-Generated Reply Draft</h4>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="whitespace-pre-wrap text-sm">
                          {email.analysisResult.replyDraft.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create/Edit Thought Dialog */}
        <Dialog open={isCreatingThought || isEditingThought} onOpenChange={() => {
          setIsCreatingThought(false);
          setIsEditingThought(false);
          setThoughtContent('');
          setThoughtTitle('');
          setExistingThoughtId(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditingThought ? 'Update Thought' : 'Create Thought from Email'}
              </DialogTitle>
              <DialogDescription>
                {isEditingThought 
                  ? 'Update the existing thought with new information from this email.'
                  : 'Create a new thought based on this email content.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="thought-title">Title</Label>
                <Input
                  id="thought-title"
                  value={thoughtTitle}
                  onChange={(e) => setThoughtTitle(e.target.value)}
                  placeholder="Enter thought title..."
                />
              </div>
              
              <div>
                <Label htmlFor="thought-content">Content</Label>
                <Textarea
                  id="thought-content"
                  value={thoughtContent}
                  onChange={(e) => setThoughtContent(e.target.value)}
                  placeholder="Enter thought content..."
                  className="min-h-[200px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingThought(false);
                  setIsEditingThought(false);
                  setThoughtContent('');
                  setThoughtTitle('');
                  setExistingThoughtId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={isEditingThought ? handleUpdateThought : handleCreateThought}
                disabled={!thoughtContent.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditingThought ? 'Update Thought' : 'Create Thought'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
