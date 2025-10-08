import { describe, it, expect } from 'vitest'
import { enhancedMemoryService } from '../src/lib/ai/core/enhancedMemoryService'

describe('EnhancedMemoryService helpers', () => {
  it('calculateImportance: base type importance and content adjustments', async () => {
    const imp1 = await enhancedMemoryService.__calculateImportanceForTest('short note', {}, 'fact')
    expect(typeof imp1).toBe('number')
    expect(imp1).toBeGreaterThanOrEqual(1)

    // longer content increases importance
    const longContent = 'a'.repeat(200) + ' important'
    const imp2 = await enhancedMemoryService.__calculateImportanceForTest(longContent, { urgent: true }, 'goal')
    expect(imp2).toBeGreaterThanOrEqual(8)
    expect(imp2).toBeLessThanOrEqual(10)
  })

  it('adjustImportance: increases with access count thresholds', () => {
    const base = 5
    expect(enhancedMemoryService.__adjustImportanceForTest(base, 0)).toBe(base)
    expect(enhancedMemoryService.__adjustImportanceForTest(base, 6)).toBeGreaterThan(base)
    expect(enhancedMemoryService.__adjustImportanceForTest(base, 11)).toBeGreaterThan(enhancedMemoryService.__adjustImportanceForTest(base, 6))
  })
})
