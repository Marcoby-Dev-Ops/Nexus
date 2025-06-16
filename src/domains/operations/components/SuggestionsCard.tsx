import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  suggestions: string | string[];
  loading?: boolean;
}

const SuggestionsCard: React.FC<Props> = ({ suggestions, loading }) => (
  <Card>
    <CardHeader>
      <CardTitle>AI Suggestions</CardTitle>
      <CardDescription>Opportunities to optimise operations</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      {loading && <Skeleton className="h-20 w-full" />}
      {!loading && ((Array.isArray(suggestions) && suggestions.length === 0) || !suggestions) && (
        <p className="text-muted-foreground text-sm">No suggestions at the moment. Great job!</p>
      )}
      {!loading && ((Array.isArray(suggestions) && suggestions.length > 0) || typeof suggestions === 'string') && (
        <ul className="list-disc pl-4 space-y-1">
          {typeof suggestions === 'string'
            ? <li>{suggestions}</li>
            : suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
    </CardContent>
  </Card>
);

export default SuggestionsCard; 