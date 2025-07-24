import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), visualizer({ filename: 'dist/bundle-analysis.html', open: true })],
    resolve: {
      alias: {
        '@/app': resolve(__dirname, 'src/app'),
        '@/core': resolve(__dirname, 'src/core'),
        '@/shared': resolve(__dirname, 'src/shared'),
        '@/domains': resolve(__dirname, 'src/domains'),
        '@/domains/dashboard': resolve(__dirname, 'src/domains/dashboard'),
        '@/domains/tasks/workspace': resolve(__dirname, 'src/domains/tasks/workspace'),
        '@/domains/marketplace': resolve(__dirname, 'src/domains/marketplace'),
        '@/domains/business': resolve(__dirname, 'src/domains/business'),
        '@/domains/admin': resolve(__dirname, 'src/domains/admin'),
        '@/domains/ai': resolve(__dirname, 'src/domains/ai'),
        '@/domains/analytics': resolve(__dirname, 'src/domains/analytics'),
        '@/domains/automation': resolve(__dirname, 'src/domains/automation'),
        '@/domains/integrations': resolve(__dirname, 'src/domains/integrations'),
        '@/domains/help-center': resolve(__dirname, 'src/domains/help-center'),
        '@/domains/help-center/knowledge': resolve(__dirname, 'src/domains/help-center/knowledge'),
        '@/domains/business/fire-cycle': resolve(__dirname, 'src/domains/business/fire-cycle'),
        '@/domains/admin/waitlist': resolve(__dirname, 'src/domains/admin/waitlist'),
        '@/domains/hype': resolve(__dirname, 'src/domains/hype'),
        '@/domains/entrepreneur': resolve(__dirname, 'src/domains/entrepreneur'),
        '@/domains/admin/development': resolve(__dirname, 'src/domains/admin/development'),
        '@/domains/departments': resolve(__dirname, 'src/domains/departments'),
        '@/archive': resolve(__dirname, 'src/archive'),
      },
    },
    define: {
      // Disable Lit dev mode in production
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      // Inject environment variables
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
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
    preview: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
    },
    optimizeDeps: {
      // Optimize dependencies for better performance
      include: [
        '@supabase/supabase-js',
        'react',
        'react-dom',
        'zustand'
      ]
    },
    build: {
      // Configure build for better Microsoft Graph Toolkit compatibility
      rollupOptions: {
        external: [],
        output: {
          // Separate chunks for better performance
          manualChunks: (id) => {
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-js';
            }
            if (id.includes('axios')) {
              return 'axios';
            }
            if (id.includes('react-router-dom')) {
              return 'react-router';
            }
          },
        }
      }
    }
  }
})
