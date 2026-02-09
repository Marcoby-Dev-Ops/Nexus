import React from 'react';
import { Sparkles } from 'lucide-react';

interface ChatWelcomeProps {
  userName: string;
  agentName?: string;
  onSuggestionClick?: (suggestion: string) => void;
}

export default function ChatWelcome({ userName, agentName, onSuggestionClick }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-muted/50 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary/60 dark:text-gray-300" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground">
        Good to see you, {userName}
      </h1>
      <p className="text-muted-foreground max-w-md">
        I'm here to help you with your business intelligence needs. What would you like to explore today?
      </p>

      {onSuggestionClick && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-8 w-full max-w-lg">
          {[
            "Summarize recent performance",
            "Analyze sales trends",
            "Identify growth opportunities",
            "Draft a quarterly report"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="px-4 py-3 text-sm text-left text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted border border-border rounded-lg transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
