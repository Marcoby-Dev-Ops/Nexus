import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { AlertCircle, CheckCircle, XCircle, Clock, Brain } from 'lucide-react';
import { supabase } from "@/core/supabase";

interface ActionCard {
  id: string;
  domain: string;
  kind: 'approval' | 'notification' | 'action_required';
  title: string;
  description: string;
  meta: {
    issuedAt: string;
    agentConfidence: number;
    recommendedAction: string;
    [key: string]: any;
  };
  data?: any;
}

interface ActionCardsProps {
  userId?: string;
  onActionTaken?: (cardId: string, action: string) => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({ 
  userId, 
  onActionTaken 
}) => {
  const [actionCards, setActionCards] = useState<ActionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingCard, setProcessingCard] = useState<string | null>(null);

  useEffect(() => {
    loadActionCards();
    
    // Set up real-time subscription for new action cards
    const subscription = supabase
      .channel('action_cards')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'action_cards',
          filter: userId ? `user_id=eq.${userId}` : undefined
        }, 
        (payload) => {
          const newCard = payload.new as ActionCard;
          setActionCards(prev => [newCard, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const loadActionCards = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Load pending action cards from database
      const { data, error } = await supabase
        .from('action_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to load action cards: ', error);
        return;
      }

      setActionCards(data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error loading action cards: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (card: ActionCard, action: 'approve' | 'reject' | 'modify') => {
    try {
      setProcessingCard(card.id);

      // Update card status in database
      await supabase
        .from('action_cards')
        .update({ 
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'modified',
          resolvedat: new Date().toISOString()
        })
        .eq('id', card.id);

      // Execute the action based on card type and user decision
      if (card.domain === 'thoughts' && action === 'approve') {
        await executeThoughtAction(card);
      }

      // Remove card from UI
      setActionCards(prev => prev.filter(c => c.id !== card.id));

      // Notify parent component
      onActionTaken?.(card.id, action);

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to handle action: ', error);
    } finally {
      setProcessingCard(null);
    }
  };

  const executeThoughtAction = async (card: ActionCard) => {
    const { recommendedAction } = card.meta;
    
    switch (recommendedAction) {
      case 'merge':
        // Merge thoughts logic
        await mergeThoughts(card.data);
        break;
      case 'update_existing':
        // Update existing thought logic
        await updateExistingThought(card.data);
        break;
      case 'link_as_related':
        // Link as related thoughts logic
        await linkAsRelated(card.data);
        break;
      default: // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('Unknown recommended action:', recommendedAction);
    }
  };

  const mergeThoughts = async (_data: any) => {
    // Implementation for merging thoughts
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Merging thoughts: ', data);
  };

  const updateExistingThought = async (_data: any) => {
    // Implementation for updating existing thought
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Updating existing thought: ', data);
  };

  const linkAsRelated = async (_data: any) => {
    // Implementation for linking as related
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Linking as related: ', data);
  };

  const getCardIcon = (kind: string) => {
    switch (kind) {
      case 'approval':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'notification':
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case 'action_required':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-success/10 text-success';
    if (confidence >= 0.6) return 'bg-warning/10 text-warning';
    return 'bg-destructive/10 text-destructive';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Brain className="h-6 w-6 animate-pulse text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading action cards...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actionCards.length === 0) {
    return null; // Don't show anything if no action cards
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        AI Recommendations
      </h3>
      
      {actionCards.map((card) => (
        <Card key={card.id} className="border-l-4 border-l-warning">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getCardIcon(card.kind)}
                <CardTitle className="text-base">{card.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getConfidenceBadgeColor(card.meta.agentConfidence)}>
                  {Math.round(card.meta.agentConfidence * 100)}% confident
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {card.meta.recommendedAction.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              {card.description}
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAction(card, 'approve')}
                disabled={processingCard === card.id}
                className="bg-success hover: bg-success/90"
              >
                {processingCard === card.id ? 'Processing...' : 'Approve'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(card, 'reject')}
                disabled={processingCard === card.id}
              >
                Reject
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(card, 'modify')}
                disabled={processingCard === card.id}
              >
                Modify
              </Button>
            </div>
            
            <div className="mt-3 text-xs text-muted-foreground">
              Suggested at {new Date(card.meta.issuedAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 