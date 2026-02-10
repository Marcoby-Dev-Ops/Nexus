import React from 'react';
import { Sparkles } from 'lucide-react';

interface ChatWelcomeProps {
  userName: string;
  agentName?: string;
  onSuggestionClick?: (suggestion: string) => void;
}

export default function ChatWelcome({ userName, agentName, onSuggestionClick }: ChatWelcomeProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-muted/35 rounded-full flex items-center justify-center ring-1 ring-border/60 shadow-sm">
        <Sparkles className="w-8 h-8 text-primary/80" />
      </div>
      <h1 className="text-3xl md:text-[2.05rem] font-semibold tracking-tight text-foreground">
        Good to see you, {userName}
      </h1>
      <p className="text-[0.98rem] text-muted-foreground max-w-xl leading-relaxed">
        I'm here to help you with your business intelligence needs. What would you like to explore today?
      </p>

      {onSuggestionClick && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-6 w-full max-w-2xl">
          {[
            "Summarize recent performance",
            "Analyze sales trends",
            "Identify growth opportunities",
            "Draft a quarterly report"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="px-4 py-3 text-[0.95rem] text-left text-muted-foreground hover:text-foreground bg-card/75 hover:bg-card border border-border rounded-xl transition-colors leading-snug"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
