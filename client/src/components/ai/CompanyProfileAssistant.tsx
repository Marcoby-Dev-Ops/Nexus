/**
 * Company Profile Assistant Component
 * 
 * Provides AI-powered assistance for completing company profile forms
 * Integrates with AIFormAssistanceService for intelligent field suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Sparkles, CheckCircle, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Separator } from '@/shared/components/ui/Separator';
import { useToast } from '@/shared/components/ui/use-toast';
import { aiFormAssistanceService, type FormAssistanceSession, type FormSuggestion } from '@/services/ai';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';

interface CompanyProfileAssistantProps {
  onSuggestionAccepted?: (fieldName: string, value: string) => void;
  onSessionCreated?: (sessionId: string) => void;
  onCompletionUpdate?: (percentage: number) => void;
  className?: string;
}

export const CompanyProfileAssistant: React.FC<CompanyProfileAssistantProps> = ({
  onSuggestionAccepted,
  onSessionCreated,
  onCompletionUpdate,
  className = ''
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  
  const [session, setSession] = useState<FormAssistanceSession | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState<FormSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [assistantActive, setAssistantActive] = useState(false);

  // Initialize AI assistant session
  const initializeAssistant = useCallback(async () => {
    if (!user?.id || !profile?.company_id) {
      toast({
        title: 'Error',
        description: 'User or company information not available.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiFormAssistanceService.createSession({
        userId: user.id,
        companyId: profile.company_id,
        formType: 'company_profile',
        existingData: {} // Will be populated as user fills form
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setSession(result.data);
        setAssistantActive(true);
        onSessionCreated?.(result.data.id);
        
        toast({
          title: 'AI Assistant Ready',
          description: 'Your AI assistant is ready to help complete your company profile.',
        });
      }
    } catch (error) {
      console.error('Error initializing AI assistant:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize AI assistant. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, profile?.company_id, toast, onSessionCreated]);

  // Generate suggestion for a field
  const generateSuggestion = useCallback(async (fieldName: string, fieldType: 'text' | 'select' | 'textarea' | 'array', currentValue?: string) => {
    if (!session) {
      toast({
        title: 'Error',
        description: 'AI assistant session not initialized.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await aiFormAssistanceService.generateFieldSuggestion({
        sessionId: session.id,
        fieldName,
        fieldType,
        currentValue,
        contextData: {
          fieldType,
          currentValue,
          timestamp: new Date().toISOString()
        }
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setCurrentSuggestion(result.data);
      }
    } catch (error) {
      console.error('Error generating suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI suggestion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [session, toast]);

  // Accept a suggestion
  const acceptSuggestion = useCallback(async (suggestionId: string) => {
    if (!session) return;

    try {
      const result = await aiFormAssistanceService.acceptSuggestion(suggestionId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data && currentSuggestion) {
        onSuggestionAccepted?.(currentSuggestion.field_name, currentSuggestion.suggested_value);
        setCurrentSuggestion(null);
        
        toast({
          title: 'Suggestion Applied',
          description: `Applied AI suggestion for ${currentSuggestion.field_name}.`,
        });
      }
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply suggestion. Please try again.',
        variant: 'destructive',
      });
    }
  }, [session, currentSuggestion, onSuggestionAccepted, toast]);

  // Reject a suggestion
  const rejectSuggestion = useCallback(() => {
    setCurrentSuggestion(null);
  }, []);

  // Update session data
  const updateSessionData = useCallback(async (fieldData: Record<string, any>) => {
    if (!session) return;

    try {
      const result = await aiFormAssistanceService.updateSessionData(session.id, fieldData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setSession(prev => prev ? { ...prev, completion_percentage: result.data.completionPercentage } : null);
        onCompletionUpdate?.(result.data.completionPercentage);
      }
    } catch (error) {
      console.error('Error updating session data:', error);
    }
  }, [session, onCompletionUpdate]);

  // Auto-generate suggestions for common fields
  useEffect(() => {
    if (assistantActive && session && !currentSuggestion) {
      // Auto-suggest for key fields if they're empty
      const keyFields = [
        { name: 'mission', type: 'textarea' as const },
        { name: 'vision', type: 'textarea' as const },
        { name: 'coreValues', type: 'array' as const },
        { name: 'uniqueValueProposition', type: 'textarea' as const }
      ];

      // Find first empty key field and suggest
      const emptyField = keyFields.find(field => 
        !session.session_data[field.name] || 
        (Array.isArray(session.session_data[field.name]) && session.session_data[field.name].length === 0)
      );

      if (emptyField) {
        generateSuggestion(emptyField.name, emptyField.type);
      }
    }
  }, [assistantActive, session, currentSuggestion, generateSuggestion]);

  if (!assistantActive) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>AI Profile Assistant</span>
          </CardTitle>
          <CardDescription>
            Get AI-powered suggestions to help complete your company profile efficiently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={initializeAssistant}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Start AI Assistant
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>AI Profile Assistant</span>
          <Badge variant="secondary" className="ml-auto">
            {session?.completion_percentage || 0}% Complete
          </Badge>
        </CardTitle>
        <CardDescription>
          AI-powered suggestions to help complete your company profile.
        </CardDescription>
        <Progress value={session?.completion_percentage || 0} className="mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {currentSuggestion ? (
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Suggestion for: {currentSuggestion.field_name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(currentSuggestion.confidence_score * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentSuggestion.reasoning}
                </p>
                <div className="bg-background p-2 rounded border">
                  <p className="text-sm">{currentSuggestion.suggested_value}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => acceptSuggestion(currentSuggestion.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={rejectSuggestion}
                    className="flex-1"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isGenerating ? 'Generating AI suggestions...' : 'AI assistant is ready to help!'}
            </p>
            {isGenerating && (
              <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />
            )}
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateSuggestion('mission', 'textarea')}
              disabled={isGenerating}
            >
              Mission Statement
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateSuggestion('vision', 'textarea')}
              disabled={isGenerating}
            >
              Vision Statement
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateSuggestion('coreValues', 'array')}
              disabled={isGenerating}
            >
              Core Values
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateSuggestion('uniqueValueProposition', 'textarea')}
              disabled={isGenerating}
            >
              Value Proposition
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
