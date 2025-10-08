import { describe, it, expect } from 'vitest';
import * as apiClient from '@/lib/api-client';
import * as database from '@/lib/database';

// Public helpers we expect to rely on going forward
const REQUIRED_EXPORTS = [
  'selectData',
  'selectOne',
  'insertOne',
  'updateOne',
  'upsertOne',
  'deleteOne',
  'selectWithOptions',
  'callRPC',
  'callEdgeFunction',
  'getAuthHeaders'
];

describe('database export parity', () => {
  it('should export all required helpers also available from api-client', () => {
    const missing: string[] = [];
    for (const key of REQUIRED_EXPORTS) {
      if (!(key in database)) missing.push(key);
      // Also sanity check original source still provides it
      expect(apiClient).toHaveProperty(key);
    }
    if (missing.length) {
      throw new Error(`database module missing exports: ${missing.join(', ')}`);
    }
  });
});
