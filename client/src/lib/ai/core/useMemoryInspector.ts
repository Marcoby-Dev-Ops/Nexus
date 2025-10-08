import { useState, useCallback } from 'react';
import type { MemoryInspectorProps } from '../../../components/MemoryInspector/MemoryInspector';

export function useMemoryInspector() {
  const [visible, setVisible] = useState(false);
  const [facts, setFacts] = useState<MemoryInspectorProps['facts']>([]);

  const show = useCallback((newFacts: MemoryInspectorProps['facts']) => {
    setFacts(newFacts);
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return {
    visible,
    facts,
    show,
    hide,
  } as const;
}
