import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Brain, Eye, Zap, Plus, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { PersonalMemoryCapture } from '@/components/ai/PersonalMemoryCapture';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/Dialog';

interface PersonalThought {
  id: string;
  content: string;
  category: string;
  tags: string[];
  createdat: string;
  businessContext?: any;
}

interface PersonalAnalytics {
  totalThoughts: number;
  ideas: number;
  goals: number;
  reminders: number;
  completedGoals: number;
  streak: number;
}

interface PersonalAutomation {
  id: string;
  type: string;
  status: string;
  triggeredBy: string;
  createdat: string;
}

const fetchPersonalThoughts = async (): Promise<PersonalThought[]> => {
  try {
    const { data, error } = await supabase
      .from('personal_thoughts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data || [];
  } catch (error) {
    // Return mock data if table doesn't exist yet
    return [
      {
        id: '1',
        content: 'Need to review Q4 marketing strategy and align with sales goals',
        category: 'strategy',
        tags: ['marketing', 'sales', 'planning'],
        createdat: new Date().toISOString(),
        businessContext: { department: 'marketing', priority: 'high' }
      },
      {
        id: '2',
        content: 'Customer feedback suggests we need to improve onboarding process',
        category: 'improvement',
        tags: ['customer', 'onboarding', 'feedback'],
        createdat: new Date(Date.now() - 86400000).toISOString(),
        businessContext: { department: 'customer-success', priority: 'medium' }
      }
    ];
  }
};

const fetchPersonalAnalytics = async (): Promise<PersonalAnalytics> => {
  try {
    const { data, error } = await supabase.rpc('get_personal_analytics');
    if (error) throw error;
    return (data as PersonalAnalytics) || {
      totalThoughts: 0,
      ideas: 0,
      goals: 0,
      reminders: 0,
      completedGoals: 0,
      streak: 0,
    };
  } catch (error) {
    // Return mock analytics data
    return {
      totalThoughts: 24,
      ideas: 8,
      goals: 12,
      reminders: 6,
      completedGoals: 9,
      streak: 7,
    };
  }
};

const fetchPersonalAutomations = async (): Promise<PersonalAutomation[]> => {
  try {
    const { data, error } = await supabase
      .from('personal_automations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    return data || [];
  } catch (error) {
    // Return mock automation data
    return [
      {
        id: '1',
        type: 'Email Follow-up',
        status: 'active',
        triggeredBy: 'New Lead Created',
        createdat: new Date().toISOString()
      },
      {
        id: '2',
        type: 'Task Reminder',
        status: 'active',
        triggeredBy: 'Due Date Approaching',
        createdat: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }
};

export const PersonalTrinityWidget: React.FC = () => {
  const {
    data: thoughts = [],
    isLoading: loadingThoughts, 
    isError: errorThoughts 
  } = useQuery<PersonalThought[]>({
    queryKey: ['personal_thoughts'],
    queryFn: fetchPersonalThoughts
  });

  const {
    data: analytics = {
      totalThoughts: 0,
      ideas: 0,
      goals: 0,
      reminders: 0,
      completedGoals: 0,
      streak: 0,
    },
    isLoading: loadingAnalytics,
    isError: errorAnalytics
  } = useQuery<PersonalAnalytics>({
    queryKey: ['personal_analytics'],
    queryFn: fetchPersonalAnalytics
  });

  const {
    data: automations = [],
    isLoading: loadingAutomations, 
    isError: errorAutomations 
  } = useQuery<PersonalAutomation[]>({
    queryKey: ['personal_automations'],
    queryFn: fetchPersonalAutomations
  });

  const [showCapture, setShowCapture] = useState(false);

  // Summary values
  const latestThought = thoughts[0];
  const summaryAnalytics = analytics;
  const summaryAutomation = automations[0];

  // Placeholder handlers for navigation
  const handleSeeAll = (section: string) => {
    // TODO: Implement navigation to full-feature page for section
    alert(`Navigate to full ${section} page`);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto my-8 bg-card rounded-2xl shadow-lg border border-border">
      <CardHeader className="flex flex-col md: flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <Brain className="text-primary" />
          Personal Trinity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overview grid for SEE, ACT, THINK */}
        <div className="grid grid-cols-1 md: grid-cols-3 gap-6">
          {/* SEE Overview */}
          <div className="flex flex-col h-full min-h-[180px] p-4 bg-muted rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="text-secondary" />
              <h2 className="text-lg font-semibold">SEE</h2>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <div className="text-sm text-foreground">
                Streak: <span className="font-bold text-success">{summaryAnalytics.streak}</span> days
              </div>
              <div className="text-sm text-foreground">
                Completed Goals: <span className="font-bold">{summaryAnalytics.completedGoals}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => handleSeeAll('see')}>
                  See all <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          {/* ACT Overview */}
          <div className="flex flex-col h-full min-h-[180px] p-4 bg-muted rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-warning" />
              <h2 className="text-lg font-semibold">ACT</h2>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              {summaryAutomation ? (
                <div className="text-sm text-foreground truncate">
                  <span className="font-medium">{summaryAutomation.type}</span>: {summaryAutomation.status}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No active automations</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => handleSeeAll('act')}>
                  See all <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          {/* THINK Overview */}
          <div className="flex flex-col h-full min-h-[180px] p-4 bg-muted rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="text-primary" />
              <h2 className="text-lg font-semibold">THINK</h2>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setShowCapture(true)} aria-label="Capture Thought" title="Capture Thought">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              {latestThought ? (
                <div className="text-sm text-foreground truncate">
                  <span className="font-medium">{latestThought.category.toUpperCase()}</span>: {latestThought.content}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No recent thoughts</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => handleSeeAll('think')}>
                  See all <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      {/* Capture Thought Modal */}
      <Dialog open={showCapture} onOpenChange={setShowCapture}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capture Personal Thought</DialogTitle>
            <DialogDescription>
              Add a new personal thought, idea, or reminder.
            </DialogDescription>
          </DialogHeader>
          {/* Placeholder for capture form */}
          <div className="text-muted-foreground text-sm py-4">[Capture form goes here]</div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCapture(false)}>Cancel</Button>
            <Button variant="default" disabled>Save Thought</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 