import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lightbulb, Loader2 } from 'lucide-react';
import { ideasService } from '@/lib/services/ideasService';
import type { Idea } from '@/lib/services/ideasService';
import { Alert, AlertDescription } from '@/components/ui/Alert';

export const IdeasWidget: React.FC = () => {
  const queryClient = useQueryClient();
  const [newIdea, setNewIdea] = useState('');

  const { data: ideas, isLoading, isError, error } = useQuery<Idea[], Error>({
    queryKey: ['ideas'],
    queryFn: () => ideasService.getIdeas(),
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ideas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Quickly capture a new idea..."
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddIdea();
            }}
            className="flex-1"
            disabled={isAdding}
          />
          <Button onClick={handleAddIdea} variant="secondary" aria-label="Add idea" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
        
        {isLoading && <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>}
        
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> Failed to load ideas: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {ideas?.map((idea) => (
            <div key={idea.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{idea.text}</p>
                <p className="text-xs text-muted-foreground">{idea.date}</p>
              </div>
            </div>
          ))}
          {ideas?.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              No ideas yet. Start capturing your thoughts!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 