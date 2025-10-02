import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';

interface SuggestionPreviewModalProps {
  suggestion: any | null;
  onClose: () => void;
  onApply: (s: any) => Promise<void>;
}

export default function SuggestionPreviewModal({ suggestion, onClose, onApply }: SuggestionPreviewModalProps) {
  const [applying, setApplying] = useState(false);

  if (!suggestion) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-[720px] max-w-full">
        <h3 className="text-lg font-semibold mb-2">Preview Suggestion</h3>
        <div className="text-sm text-muted-foreground mb-4">
          Suggested changes from message: <span className="font-mono text-xs ml-2">{suggestion.sourceMessageId}</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-auto mb-4">
          {(suggestion.suggestedChanges || []).map((c: any, i: number) => (
            <div key={i} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="text-sm font-medium">{c.field}</div>
                <div className="text-xs text-gray-500">Old: {String(c.old || '')}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-400">New: {String(c.new)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={async () => { setApplying(true); await onApply(suggestion); setApplying(false); onClose(); }} disabled={applying}>{applying ? 'Applying...' : 'Apply'}</Button>
        </div>
      </div>
    </div>
  );
}
