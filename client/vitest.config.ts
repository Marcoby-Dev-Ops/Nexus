import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    // DOM-based tests use jsdom
    environment: 'jsdom',
    // Include the existing tests folder and any react tests under src/__tests__
    include: ['tests/**/*.test.ts', 'src/**/__tests__/**/*.test.{ts,tsx}', 'src/**/__tests__/*.test.{ts,tsx}'],
    coverage: { provider: 'v8' },
    // Setup file to provide test globals and compatibility shims
    setupFiles: ['./test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
