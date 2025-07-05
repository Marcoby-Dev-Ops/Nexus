import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    // Disable Lit dev mode in production
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    // Include Microsoft Graph Toolkit dependencies for proper bundling
    include: [
      '@microsoft/mgt-element',
      '@microsoft/mgt-react',
      '@microsoft/mgt-msal2-provider',
      '@microsoft/mgt-components',
      'lit',
      'lit/decorators.js',
      'lit/directives/class-map.js'
    ]
  },
  build: {
    // Configure build for better Microsoft Graph Toolkit compatibility
    rollupOptions: {
      external: [],
      output: {
        // Separate MGT components into their own chunk
        manualChunks: (id) => {
          if (id.includes('@microsoft/mgt')) {
            return 'mgt'
          }
          if (id.includes('lit')) {
            return 'lit'
          }
        }
      }
    }
  }
})
