import { selectData, insertOne, updateOne, callRPC } from '@/lib/api-client';
import { vectorSearch } from '@/lib/database/vectorSearch';
import { logger } from '@/shared/utils/logger';
import { telemetryService } from '../../telemetry/TelemetryService';

export interface FactItem {
  id: string;
  orgId?: string | null;
  userId?: string | null;
  kind: 'org' | 'user' | 'goal' | 'fact' | 'policy';
  key: string; // short identifier
  value: string; // canonical text representation
  metadata: Record<string, any>;
  importance: number; // 1-10
  lastAccessed: Date;
  accessCount: number;
  vector?: number[]; // optional embedding cached on the client side
}

export interface FactQueryOptions {
  orgId?: string | null;
  userId?: string | null;
  kinds?: FactItem['kind'][];
  limit?: number;
  minImportance?: number;
}

class FactStoreService {
  // lightweight in-memory cache for recent lookups
  private cache = new Map<string, { items: FactItem[]; updatedAt: number }>();
  private cacheTTL = 1000 * 60 * 2;

  /**
   * Upsert a fact into the facts table (server-side should handle vector upsert)
   */
  async upsertFact(fact: Partial<FactItem> & { key: string; value: string }): Promise<string | null> {
    try {
      const payload = {
        org_id: fact.orgId || null,
        user_id: fact.userId || null,
        kind: fact.kind || 'fact',
        key: fact.key,
        value: fact.value,
        metadata: fact.metadata || {},
        importance: fact.importance || 5
      };

      const { data, error } = await insertOne('facts', payload);
      if (error) {
        logger.error('Error upserting fact:', error);
        return null;
      }

      // invalidate cache for org/user
      this.invalidateCacheFor(fact.orgId || null, fact.userId || null);

      return data.id;
    } catch (err) {
      logger.error('upsertFact failed', err);
      return null;
    }
  }

  /**
   * Reinforce or decay a fact's importance.
   * delta > 0 => reinforcement, delta < 0 => decay
   */
  async adjustImportance(factId: string, delta: number): Promise<void> {
    try {
      const { data } = await selectData('facts', '*', { id: factId });
      const fact = Array.isArray(data) ? data[0] : data;
      if (!fact) return;

      const current = Number(fact.importance || 5);
      let next = current + delta;
      // apply soft bounds and diminishing returns
      if (delta > 0) next = Math.min(10, current + Math.max(0.25, delta * (1 - current / 12)));
      else next = Math.max(1, current + delta);

      await updateOne('facts', factId, { importance: Math.round(next * 100) / 100 });
      this.invalidateCacheFor(fact.org_id || null, fact.user_id || null);
    } catch (err) {
      logger.error('adjustImportance failed', err);
    }
  }

  /**
   * Retrieve semantically relevant facts using vector search RPC and fallback to keyword filtering.
   */
  async retrieveRelevantFacts(query: string, options: FactQueryOptions = {}): Promise<FactItem[]> {
    try {
      const cacheKey = JSON.stringify({ q: query, o: options });
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.updatedAt < this.cacheTTL) return cached.items;

      const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      // Call server RPC that accepts an embedding and returns matched facts (match_facts)
      const rpcRes = await callRPC('match_facts', { query });
      if (rpcRes?.error) logger.warn('match_facts RPC error', rpcRes.error);

      const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      // rpcRes.data expected to be an array of fact rows with score
      const rows = (rpcRes?.data || []) as any[];

      // Telemetry: send timing, match count, top similarity, orgId
      try {
        const matchCount = rows.length;
        const topSimilarity = rows.length ? (rows[0].score || rows[0].similarity || 0) : 0;
        telemetryService.recordEvent({
          type: 'factstore.search',
          payload: {
            query,
            matchCount,
            topSimilarity,
            durationMs: Math.max(0, t1 - t0),
            orgId: options.orgId || null
          }
        });
      } catch (unknownErr) {
        const e = unknownErr as any;
        logger.warn('Telemetry record failed in FactStoreService', e?.message || e);
      }

      // Filter by org/user/kinds/minImportance
      const filtered = rows.filter(r => {
        if (options.orgId && r.org_id !== options.orgId) return false;
        if (options.userId && r.user_id !== options.userId) return false;
        if (options.kinds && !options.kinds.includes(r.kind)) return false;
        if (options.minImportance && (r.importance || 0) < options.minImportance) return false;
        return true;
      });

      const mapped: FactItem[] = filtered.slice(0, options.limit || 10).map(r => ({
        id: r.id,
        orgId: r.org_id,
        userId: r.user_id,
        kind: r.kind,
        key: r.key,
        value: r.value,
        metadata: r.metadata || {},
        importance: Number(r.importance || 5),
        lastAccessed: r.last_accessed ? new Date(r.last_accessed) : new Date(),
        accessCount: Number(r.access_count || 0)
      }));

      this.cache.set(cacheKey, { items: mapped, updatedAt: Date.now() });
      return mapped;
    } catch (err) {
      logger.error('retrieveRelevantFacts failed', err);
      return [];
    }
  }

  /**
   * Simple conscience check: ensure agent text does not contradict high-level principles stored as facts (kind: 'policy').
   * Returns list of mismatches if any.
   */
  async conscienceCheck(agentOutput: string, orgId?: string | null): Promise<{ principleId: string; principleText: string; score: number }[]> {
    try {
      // Query policy facts for org
      const policies = await this.retrieveRelevantFacts(agentOutput, { orgId, kinds: ['policy'], limit: 20 });

      // Use vectorSearch client-side similarity scoring as a quick check (if available)
      const results: { principleId: string; principleText: string; score: number }[] = [];
      for (const p of policies) {
        // naive similarity: check substring mismatch or explicit contradictions keywords
        const lowerOut = agentOutput.toLowerCase();
        const lowerPrinciple = p.value.toLowerCase();
        const contradictionKeywords = ['not allowed', "don't", 'forbidden', 'prohibited', 'must not'];
        const contradicts = contradictionKeywords.some(k => lowerOut.includes(k) && !lowerPrinciple.includes(k));

        // If agent output references something opposite to principle text, flag with low confidence score
        if (contradicts || !lowerOut.includes(lowerPrinciple.slice(0, Math.min(20, lowerPrinciple.length)))) {
          results.push({ principleId: p.id, principleText: p.value, score: 0.35 });
        }
      }

      return results;
    } catch (err) {
      logger.error('conscienceCheck failed', err);
      return [];
    }
  }

  private invalidateCacheFor(orgId: string | null, userId: string | null) {
    // simple invalidation: clear entire cache for simplicity
    this.cache.clear();
  }
}

export const factStoreService = new FactStoreService();
