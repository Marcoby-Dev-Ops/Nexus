import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';

interface SuggestionCardProps {
  suggestion: any;
  onPreview: (s: any) => void;
}

export default function SuggestionCard({ suggestion, onPreview }: SuggestionCardProps) {
  const summary = suggestion.summary || (suggestion.suggestedChanges || []).map((c: any) => `${c.field} → ${c.new}`).join(', ');

  return (
    <div className="border border-gray-700 bg-gray-900 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-200 font-medium">AI Suggestion</div>
          <div className="text-xs text-gray-400">{summary}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-xs">{(suggestion.confidence || 0).toFixed(2)}</Badge>
          <Button size="sm" variant="outline" onClick={() => onPreview(suggestion)}>Preview & Apply</Button>
        </div>
      </div>
    </div>
  );
}
