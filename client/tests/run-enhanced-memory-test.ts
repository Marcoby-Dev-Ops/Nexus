/* eslint-disable no-console */
// This is a standalone diagnostic script. Console output is intentional for quick manual verification.
import { enhancedMemoryService } from '../src/lib/ai/core/enhancedMemoryService'

// Minimal process declaration to avoid needing full @types/node in this client test context
// (Only exit is used.)
declare const process: { exit(code?: number): never }

async function run() {
  console.log('Running quick enhancedMemoryService helper checks...')

  const imp1 = await enhancedMemoryService.__calculateImportanceForTest('short note', {}, 'fact')
  console.log('importance(short fact):', imp1)

  const longContent = 'a'.repeat(200) + ' important'
  const imp2 = await enhancedMemoryService.__calculateImportanceForTest(longContent, { urgent: true }, 'goal')
  console.log('importance(long urgent goal):', imp2)

  const adj0 = enhancedMemoryService.__adjustImportanceForTest(5, 0)
  const adj6 = enhancedMemoryService.__adjustImportanceForTest(5, 6)
  const adj11 = enhancedMemoryService.__adjustImportanceForTest(5, 11)
  console.log('adjust(5,0):', adj0, 'adjust(5,6):', adj6, 'adjust(5,11):', adj11)

  // Basic assertions
  const ok = (typeof imp1 === 'number') && imp2 >= 8 && adj6 > adj0 && adj11 > adj6
  if (!ok) {
    console.error('One or more checks failed')
    process.exit(1)
  }

  console.log('All quick checks passed')
}

run().catch(err => {
  console.error('Error running checks:', err)
  process.exit(2)
})
