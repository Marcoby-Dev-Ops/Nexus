import { enhancedMemoryService } from '@/lib/ai/core/enhancedMemoryService';
import { factStoreService } from '@/lib/ai/core/factStoreService';

jest.mock('@/lib/ai/core/factStoreService');
const mockedFactStore = factStoreService as jest.Mocked<typeof factStoreService>;

describe('EnhancedMemoryService FactStore integration', () => {
  it('maps facts and calls inspector callback', async () => {
    const sampleFacts = [
      { id: 'f1', value: 'Company policy: do not share secrets', kind: 'policy', importance: 9, score: 0.92 },
      { id: 'f2', value: 'Preferred contact: email', kind: 'org', importance: 6, score: 0.6 }
    ];

    mockedFactStore.retrieveRelevantFacts.mockResolvedValue(sampleFacts as any);

    const received: any[] = [];
    enhancedMemoryService.registerInspectorCallback((facts) => {
      received.push(...facts);
    });

    const results = await enhancedMemoryService.retrieveMemories({ userId: 'u1', query: 'contact method', limit: 5 });

    expect(results.length).toBeGreaterThan(0);
    // Should map the first fact into memory item shape
    expect(results[0].type).toBe('fact');
    expect(received.length).toBeGreaterThan(0);

    // cleanup
    enhancedMemoryService.registerInspectorCallback(undefined);
  });
});
