import { factStoreService } from '../src/lib/ai/core/factStoreService';

describe('FactStoreService basic behavior', () => {
  test('conscienceCheck returns array (no policies present)', async () => {
    const res = await factStoreService.conscienceCheck('This is a benign agent output.');
    expect(Array.isArray(res)).toBe(true);
  });
});
