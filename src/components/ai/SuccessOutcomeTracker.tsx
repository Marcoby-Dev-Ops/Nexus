/**
 * SuccessOutcomeTracker Component
 * Pillar: 1,2 - Measure business impact and close feedback loops
 * Tracks outcomes of AI recommendations and measures success over time
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Textarea } from '@/shared/components/ui/Textarea';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Target,
  DollarSign,
  Zap
} from 'lucide-react';
import { useToast } from '@/shared/ui/components/Toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/index';

interface SuccessOutcome {
  id: string;
  messageid: string;
  conversationid: string;
  recommendation: string;
  expectedoutcome: string;
  actual_outcome?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'not_applicable';
  impacttype: 'time_savings' | 'cost_reduction' | 'revenue_increase' | 'efficiency_gain' | 'quality_improvement';
  quantified_impact?: {
    metric: string;
    before: number;
    after?: number;
    unit: string;
    timeframe: string;
  };
  followupdate: string;
  completed_at?: string;
  user_notes?: string;
}

interface SuccessOutcomeTrackerProps {
  messageId: string;
  conversationId: string;
  recommendation: string;
  expectedOutcome: string;
  impactType?: SuccessOutcome['impact_type'];
  followUpDays?: number;
  onOutcomeTracked?: (outcome: SuccessOutcome) => void;
}

export const SuccessOutcomeTracker: React.FC<SuccessOutcomeTrackerProps> = ({
  messageId,
  conversationId,
  recommendation,
  expectedOutcome,
  impactType = 'efficiency_gain',
  followUpDays = 7,
  onOutcomeTracked
}) => {
  const [outcome, setOutcome] = useState<SuccessOutcome | null>(null);
  const [showTracker, setShowTracker] = useState(false);
  const [status, setStatus] = useState<SuccessOutcome['status']>('pending');
  const [actualOutcome, setActualOutcome] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [quantifiedImpact, setQuantifiedImpact] = useState({
    metric: '',
    before: 0,
    after: 0,
    unit: '',
    timeframe: 'week'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    loadExistingOutcome();
  }, [messageId]);

  const loadExistingOutcome = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('ai_success_outcomes')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setOutcome(data);
        setStatus(data.status);
        setActualOutcome(data.actual_outcome || '');
        setUserNotes(data.user_notes || '');
        if (data.quantified_impact) {
          setQuantifiedImpact(data.quantified_impact);
        }
      }
    } catch {
      // No existing outcome found, which is fine
    }
  };

  const createInitialOutcome = async () => {
    if (!user?.id || outcome) return;

    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + followUpDays);

      const newOutcome: Partial<SuccessOutcome> = {
        messageid: messageId,
        conversationid: conversationId,
        recommendation,
        expectedoutcome: expectedOutcome,
        status: 'pending',
        impacttype: impactType,
        followup_date: followUpDate.toISOString(),
      };

      const { data, error } = await supabase
        .from('ai_success_outcomes')
        .insert(newOutcome)
        .select()
        .single();

      if (error) throw error;

      setOutcome(data);
      setShowTracker(true);

      // Schedule follow-up notification
      await supabase.from('ai_audit_logs').insert({
        userid: user.id,
        action: 'success_outcome_created',
        tablename: 'ai_success_outcomes',
        recordid: data.id,
        details: {
          recommendation,
          expectedoutcome: expectedOutcome,
          followup_date: followUpDate.toISOString(),
          impacttype: impactType
        }
      });

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error creating success outcome: ', error);
    }
  };

  const updateOutcome = async () => {
    if (!outcome || !user?.id || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const updates: Partial<SuccessOutcome> = {
        status,
        actualoutcome: actualOutcome.trim() || undefined,
        usernotes: userNotes.trim() || undefined,
      };

      if (status === 'completed' || status === 'failed') {
        updates.completed_at = new Date().toISOString();
      }

      if (quantifiedImpact.metric && quantifiedImpact.before > 0) {
        updates.quantified_impact = quantifiedImpact;
      }

      const { data, error } = await supabase
        .from('ai_success_outcomes')
        .update(updates)
        .eq('id', outcome.id)
        .select()
        .single();

      if (error) throw error;

      setOutcome(data);
      onOutcomeTracked?.(data);

      // Track in analytics
      await supabase.from('ai_audit_logs').insert({
        userid: user.id,
        action: 'success_outcome_updated',
        tablename: 'ai_success_outcomes',
        recordid: outcome.id,
        details: {
          status,
          hasquantified_impact: !!updates.quantified_impact,
          impacttype: impactType
        }
      });

      showToast({
        title: 'Outcome Updated',
        description: 'Thanks for tracking your progress!',
        type: 'success'
      });

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error updating outcome: ', error);
      showToast({
        title: 'Update Failed',
        description: 'Unable to save outcome. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: SuccessOutcome['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: SuccessOutcome['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'in_progress':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const getImpactIcon = (type: SuccessOutcome['impact_type']) => {
    switch (type) {
      case 'time_savings':
        return <Clock className="h-4 w-4" />;
      case 'cost_reduction':
        return <DollarSign className="h-4 w-4" />;
      case 'revenue_increase':
        return <TrendingUp className="h-4 w-4" />;
      case 'efficiency_gain':
        return <Zap className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  // Don't show tracker for very old messages
  const isRecentMessage = () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return true; // For now, always show
  };

  if (!isRecentMessage()) {
    return null;
  }

  // Show initial tracking prompt
  if (!outcome && !showTracker) {
    return (
      <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-4">
          <Target className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Track the outcome of this recommendation</p>
            <p className="text-xs text-muted-foreground mt-1">
              Help us measure impact: {expectedOutcome}
            </p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={createInitialOutcome}>
                <Target className="h-3 w-3 mr-1" />
                Track Outcome
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowTracker(false)}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show outcome tracker
  if (outcome || showTracker) {
    return (
      <Card className="mt-3 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {getImpactIcon(impactType)}
              Outcome Tracking
            </CardTitle>
            <Badge className={getStatusColor(status)}>
              {getStatusIcon(status)}
              <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expected vs Actual */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Expected outcome: </div>
            <div className="text-sm bg-background/50 p-2 rounded border">
              {expectedOutcome}
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium">Current status:</label>
            <div className="flex flex-wrap gap-1">
              {(['pending', 'in_progress', 'completed', 'failed', 'not_applicable'] as const).map((s) => (
                <Button
                  key={s}
                  variant={status === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatus(s)}
                  className="h-7 text-xs"
                >
                  {getStatusIcon(s)}
                  <span className="ml-1 capitalize">{s.replace('_', ' ')}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Actual Outcome */}
          {(status === 'completed' || status === 'failed') && (
            <div className="space-y-2">
              <label className="text-xs font-medium">What actually happened?</label>
              <Textarea
                placeholder="Describe the actual outcome..."
                value={actualOutcome}
                onChange={(e) => setActualOutcome(e.target.value)}
                className="min-h-[60px] text-sm"
              />
            </div>
          )}

          {/* Quantified Impact */}
          {status === 'completed' && (
            <div className="space-y-2">
              <label className="text-xs font-medium">Quantify the impact (optional):</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Metric (e.g., Hours saved)"
                  value={quantifiedImpact.metric}
                  onChange={(e) => setQuantifiedImpact(prev => ({ ...prev, metric: e.target.value }))}
                  className="px-2 py-1 text-xs border rounded"
                />
                <input
                  type="number"
                  placeholder="Before"
                  value={quantifiedImpact.before || ''}
                  onChange={(e) => setQuantifiedImpact(prev => ({ ...prev, before: Number(e.target.value) }))}
                  className="px-2 py-1 text-xs border rounded"
                />
                <input
                  type="number"
                  placeholder="After"
                  value={quantifiedImpact.after || ''}
                  onChange={(e) => setQuantifiedImpact(prev => ({ ...prev, after: Number(e.target.value) }))}
                  className="px-2 py-1 text-xs border rounded"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={quantifiedImpact.unit}
                  onChange={(e) => setQuantifiedImpact(prev => ({ ...prev, unit: e.target.value }))}
                  className="px-2 py-1 text-xs border rounded"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium">Additional notes: </label>
            <Textarea
              placeholder="Any additional context or learnings..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="min-h-[50px] text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={updateOutcome}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Update Outcome'}
            </Button>
            {!outcome && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTracker(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}; 