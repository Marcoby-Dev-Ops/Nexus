import React from 'react';

type Props = {
  agentId: string;
  agentName: string;
  confidence: number; // 0..1
  reasoning: string;
  onAccept?: (agentId: string) => void;
  onDismiss?: () => void;
};

export const AgentSuggestion: React.FC<Props> = ({ agentId, agentName, confidence, reasoning, onAccept, onDismiss }) => {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff', maxWidth: 560 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{agentName}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Suggested agent • {Math.round(confidence * 100)}% confidence</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onDismiss && onDismiss()} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Dismiss</button>
          <button onClick={() => onAccept && onAccept(agentId)} style={{ background: '#0369a1', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Accept</button>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: '#374151' }}>{reasoning}</div>

      <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
        Agent ID: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{agentId}</code>
      </div>
    </div>
  );
};

export default AgentSuggestion;
