import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), visualizer({ filename: 'dist/bundle-analysis.html', open: true })],
  resolve: {
    alias: {
      '@/app': resolve(__dirname, 'src/app'),
      '@/core': resolve(__dirname, 'src/core'),
      '@/shared': resolve(__dirname, 'src/shared'),
      '@/domains': resolve(__dirname, 'src/domains'),
      '@/domains/dashboard': resolve(__dirname, 'src/domains/dashboard'),
      '@/domains/workspace': resolve(__dirname, 'src/domains/workspace'),
      '@/domains/marketplace': resolve(__dirname, 'src/domains/marketplace'),
      '@/domains/admin': resolve(__dirname, 'src/domains/admin'),
      '@/domains/ai': resolve(__dirname, 'src/domains/ai'),
      '@/domains/analytics': resolve(__dirname, 'src/domains/analytics'),
      '@/domains/automation': resolve(__dirname, 'src/domains/automation'),
      '@/domains/integrations': resolve(__dirname, 'src/domains/integrations'),
      '@/domains/help-center': resolve(__dirname, 'src/domains/help-center'),
      '@/domains/knowledge': resolve(__dirname, 'src/domains/knowledge'),
      '@/domains/departments': resolve(__dirname, 'src/domains/departments'),
    },
  },
  define: {
    // Disable Lit dev mode in production
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://kqclbpimkraenvbffnpk.functions.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  optimizeDeps: {
    // Include Microsoft Graph Toolkit dependencies for proper bundling
    include: [
      '@microsoft/mgt-element',
      '@microsoft/mgt-react',
      '@microsoft/mgt-msal2-provider',
      '@microsoft/mgt-components'
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
          if (id.includes('framer-motion')) {
            return 'framer-motion';
          }
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-js';
          }
          if (id.includes('axios')) {
            return 'axios';
          }
        },
      }
    }
  }
})
