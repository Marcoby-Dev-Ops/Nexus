import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Lightbulb, Loader2, Plus, Star, TrendingUp, Target, Zap } from 'lucide-react';
import { ideasService } from '@/lib/services/ideasService';
import type { Idea } from '@/lib/services/ideasService';
import { Alert, AlertDescription } from '@/components/ui/Alert';

// Mock enhanced ideas with categories and priorities
const mockEnhancedIdeas = [
  {
    id: '1',
    text: 'Implement automated customer onboarding flow to reduce support tickets by 40%',
    date: '2 hours ago',
    category: 'automation',
    priority: 'high',
    estimatedImpact: 'High ROI'
  },
  {
    id: '2',
    text: 'Create a referral program with 20% commission for existing customers',
    date: '1 day ago',
    category: 'growth',
    priority: 'medium',
    estimatedImpact: 'Revenue boost'
  },
  {
    id: '3',
    text: 'Weekly team knowledge sharing sessions to improve cross-training',
    date: '2 days ago',
    category: 'team',
    priority: 'medium',
    estimatedImpact: 'Better collaboration'
  },
  {
    id: '4',
    text: 'AI-powered content generation tool for social media marketing',
    date: '3 days ago',
    category: 'innovation',
    priority: 'low',
    estimatedImpact: 'Time savings'
  }
];

const categoryIcons = {
  automation: <Zap className="h-4 w-4 text-blue-600" />,
  growth: <TrendingUp className="h-4 w-4 text-green-600" />,
  team: <Target className="h-4 w-4 text-purple-600" />,
  innovation: <Star className="h-4 w-4 text-orange-600" />,
  default: <Lightbulb className="h-4 w-4 text-gray-600" />
};

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const IdeasWidget: React.FC = () => {
  const queryClient = useQueryClient();
  const [newIdea, setNewIdea] = useState('');

  const { data: ideas, isLoading, isError, error } = useQuery<Idea[], Error>({
    queryKey: ['ideas'],
    queryFn: () => ideasService.getIdeas(),
    // Use mock data as fallback
    placeholderData: mockEnhancedIdeas,
  });

  const { mutate: addIdea, isPending: isAdding } = useMutation({
    mutationFn: (ideaText: string) => ideasService.createIdea(ideaText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      setNewIdea('');
    },
  });

  const handleAddIdea = () => {
    if (newIdea.trim()) {
      addIdea(newIdea);
    }
  };

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category as keyof typeof categoryIcons] || categoryIcons.default;
  };

  const getPriorityBadge = (priority: string) => {
    const colorClass = priorityColors[priority as keyof typeof priorityColors] || priorityColors.low;
    return (
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        {priority}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-orange-600" />
          Ideas & Innovation
        </CardTitle>
        <CardDescription>
          Capture and organize your breakthrough ideas for business growth
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Capture your next big idea..."
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddIdea();
            }}
            className="flex-1"
            disabled={isAdding}
          />
          <Button onClick={handleAddIdea} variant="outline" aria-label="Add idea" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
        
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-3 border rounded-lg animate-pulse">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-4 w-4 bg-muted rounded"></div>
                  <div className="h-5 w-16 bg-muted rounded"></div>
                </div>
                <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}
        
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> Failed to load ideas: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {ideas?.map((idea) => (
            <div 
              key={idea.id} 
              className="p-3 rounded-lg border-2 border-transparent hover:border-border/50 bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(idea.category || 'default')}
                  <span className="text-xs text-muted-foreground capitalize">
                    {idea.category || 'general'}
                  </span>
                </div>
                {idea.priority && getPriorityBadge(idea.priority)}
              </div>
              
              <p className="text-sm font-medium text-foreground mb-2 leading-relaxed">
                {idea.text}
              </p>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{idea.date}</p>
                {idea.estimatedImpact && (
                  <span className="text-xs text-blue-600 font-medium">
                    {idea.estimatedImpact}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {ideas?.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-2">
                No ideas yet. Start capturing your thoughts!
              </p>
              <p className="text-xs text-muted-foreground">
                Great ideas drive innovation and business growth
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 