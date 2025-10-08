import React, { useState } from 'react';
import AgentSuggestion from './AgentSuggestion';
import { defaultAgentService } from '../../lib/ai/services/defaultAgentService';

const MOCK_SUGGESTIONS = [
  { agentId: 'sales-director', agentName: 'Sales Director', confidence: 0.87, reasoning: 'Query indicates pipeline and conversion focus; Sales expertise recommended.' },
  { agentId: 'marketing-cmo', agentName: 'Marketing CMO', confidence: 0.76, reasoning: 'Mentions campaign and launch; Marketing can draft the brief.' },
];

export const AgentSuggestionDemo: React.FC = () => {
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);
  const [accepted, setAccepted] = useState<string | null>(null);

  const accept = (agentId: string) => {
    // Switch the active agent in the defaultAgentService and add a short assistant note
    try {
      defaultAgentService.switchAgent(agentId);
      defaultAgentService.addAssistantResponse(`Routing to ${agentId} as requested by the user.`, agentId);
    } catch (err) {
      // swallow errors in demo context
      // eslint-disable-next-line no-console
      console.warn('Failed to perform agent switch:', err);
    }

    setAccepted(agentId);
    setSuggestions(prev => prev.filter(s => s.agentId !== agentId));
  };

  const dismiss = () => setSuggestions([]);

  return (
    <div style={{ padding: 20 }}>
      <h3>Agent Handoff Suggestions (Demo)</h3>

      {accepted && <div style={{ marginBottom: 12, color: '#065f46' }}>Accepted agent: {accepted}</div>}

      {suggestions.length === 0 && !accepted && <div style={{ color: '#6b7280' }}>No suggestions at the moment.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {suggestions.map(s => (
          <AgentSuggestion
            key={s.agentId}
            agentId={s.agentId}
            agentName={s.agentName}
            confidence={s.confidence}
            reasoning={s.reasoning}
            onAccept={accept}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </div>
  );
};

export default AgentSuggestionDemo;
