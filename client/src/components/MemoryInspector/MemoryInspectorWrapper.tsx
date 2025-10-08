import React, { useEffect } from 'react';
import MemoryInspector from './MemoryInspector';
import { useMemoryInspector } from '../../lib/ai/core/useMemoryInspector';
import { enhancedMemoryService } from '../../lib/ai/core/enhancedMemoryService';

export const MemoryInspectorWrapper: React.FC = () => {
  const { visible, facts, show, hide } = useMemoryInspector();

  useEffect(() => {
    // Register a callback so the enhancedMemoryService can push facts
    enhancedMemoryService.registerInspectorCallback((fcts) => {
      show(fcts.map(f => ({ id: f.id, key: f.key || f.id, value: f.value, kind: f.kind, importance: f.importance, score: f.score })));
    });

    return () => {
      enhancedMemoryService.registerInspectorCallback(undefined);
    };
  }, [show]);

  if (!visible) return null;

  return <MemoryInspector facts={facts} onClose={hide} />;
};

export default MemoryInspectorWrapper;
