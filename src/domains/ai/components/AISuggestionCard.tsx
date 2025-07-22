import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/Card';
import { Lightbulb, AlertTriangle, Loader2 } from 'lucide-react';
import type { DepartmentId } from '@/shared/constants/departments';
import { Button } from '@/shared/components/ui/Button';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { API_CONFIG } from '@/core/constants';

interface AISuggestionCardProps {
  departmentId: DepartmentId;
}

interface Suggestion {
  title: string;
  description: string;
  actionLabel: string;
}

export const AISuggestionCard: React.FC<AISuggestionCardProps> = ({ departmentId }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuthContext();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!session) {
        setLoading(false);
        setError('Authentication is required to get AI suggestions.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/functions/v1/ai_generate_suggestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ departmentId }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch suggestions');
        }

        const data = await res.json();
        setSuggestions(data.suggestions || data); 
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [departmentId, session]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="ml-2">Generating AI insights...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-8 text-destructive">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <p>Error: {error}</p>
        </div>
      );
    }

    if (suggestions.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>No suggestions available for this department yet.</p>
        </div>
      );
    }
    
    return suggestions.map((suggestion, index) => (
      <div key={index} className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{suggestion.title}</h4>
          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => alert(`Action: ${suggestion.actionLabel}`)}>
          {suggestion.actionLabel}
        </Button>
      </div>
    ));
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Lightbulb className="w-6 h-6 text-warning" />
          <CardTitle>AI Suggestions</CardTitle>
        </div>
        <CardDescription>
          Automated insights and next-best actions based on your department's data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
};
