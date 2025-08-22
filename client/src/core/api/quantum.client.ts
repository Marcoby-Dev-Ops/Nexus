import { useEffect, useState } from 'react';
import type { QuantumBlockId, QuantumBlockProfile, QuantumImprovePlan, QuantumHealth } from '../types/quantum';
import { quantumMockService } from './quantum.mock';

// Use mock service for development, can be easily swapped for real API calls
const USE_MOCK = import.meta.env.DEV;

export function useQuantumBlock(blockId: QuantumBlockId) {
  const [data, setData] = useState<QuantumBlockProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        
        if (USE_MOCK) {
          const mockData = await quantumMockService.getBlock(blockId);
          if (alive) setData(mockData);
        } else {
          const res = await fetch(`/api/quantum/blocks/${blockId}`, { credentials: 'include' });
          if (!res.ok) throw new Error(await res.text());
          const json = await res.json(); 
          if (alive) setData(json);
        }
      } catch (e) { 
        if (alive) setErr(e); 
      }
      finally { 
        if (alive) setLoading(false); 
      }
    })();
    return () => { alive = false; };
  }, [blockId]);

  return { data, loading, error };
}

export function useQuantumStrengthenPlan(blockId: QuantumBlockId, target?: Partial<QuantumHealth>) {
  const [data, setData] = useState<QuantumImprovePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const plan = await strengthenBlock(blockId, target);
        if (alive) setData(plan);
      } catch (e) { 
        if (alive) setErr(e); 
      }
      finally { 
        if (alive) setLoading(false); 
      }
    })();
    return () => { alive = false; };
  }, [blockId, target]);

  return { data, loading, error };
}

export async function strengthenBlock(blockId: QuantumBlockId, target?: Partial<QuantumHealth>): Promise<QuantumImprovePlan> {
  if (USE_MOCK) {
    return await quantumMockService.planStrengthening(blockId, target);
  }

  const res = await fetch(`/api/quantum/blocks/${blockId}/strengthen`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ target })
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as QuantumImprovePlan;
}

export async function saveQuantumOnboarding(payload: Record<string, unknown>) {
  if (USE_MOCK) {
    return await quantumMockService.saveOnboarding(payload);
  }

  const res = await fetch('/api/quantum/onboarding/save', {
    method: 'POST', 
    headers: { 'content-type': 'application/json' }, 
    credentials: 'include', 
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function commitImprovementPlan(blockId: QuantumBlockId, planId: string) {
  if (USE_MOCK) {
    return await quantumMockService.commitPlan(blockId, planId);
  }

  const res = await fetch(`/api/quantum/blocks/${blockId}/commit-plan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ planId })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
