import React from 'react';

export interface MemoryInspectorProps {
  query?: string;
  facts: Array<{ id: string; key: string; value: string; kind?: string; importance?: number; score?: number }>;
  onClose?: () => void;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({ facts = [], onClose, query }) => {
  return (
    <div style={{ position: 'fixed', right: 20, top: 80, width: 480, maxHeight: '70vh', overflowY: 'auto', background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Memory Inspector</strong>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>✕</button>
      </div>
      {query ? <div style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>Query: <em style={{ color: '#666' }}>{query}</em></div> : null}
      {facts.length === 0 ? (
        <div style={{ color: '#666' }}>No facts retrieved</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {facts.map(f => (
            <li key={f.id} style={{ padding: 8, borderBottom: '1px solid #f3f3f3' }}>
              <div style={{ fontSize: 12, color: '#555' }}>{f.kind || 'fact'} · {f.key}</div>
              <div style={{ marginTop: 6, fontSize: 14 }}>{f.value}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>Importance: {f.importance ?? '-'} · Score: {typeof f.score === 'number' ? f.score.toFixed(3) : '-'}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemoryInspector;
