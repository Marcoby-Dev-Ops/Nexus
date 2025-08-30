import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite'
import type { PluginOption } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the parent directory (root of project).
  const env = loadEnv(mode, '../', '')
  
     // Only include bundle analyzer for analysis builds
   const plugins: PluginOption[] = [react()];
   if (process.env.ANALYZE === 'true') {
     plugins.push(visualizer({ 
       filename: 'dist/bundle-analysis.html', 
       open: true 
     }));
   }
   
   
  
  return {
    base: '/',
    plugins,
    resolve: {
      alias: {
        '@/app': resolve(__dirname, 'src/app'),
        '@/core': resolve(__dirname, 'src/core'),
        '@/shared': resolve(__dirname, 'src/shared'),
        '@/hooks': resolve(__dirname, 'src/hooks'),
        '@/components': resolve(__dirname, 'src/components'),
        '@/lib': resolve(__dirname, 'src/lib'),
        '@/domains': resolve(__dirname, 'src/domains'),
        '@/pages': resolve(__dirname, 'src/pages'),
        '@/services': resolve(__dirname, 'src/services'),
        '@/utils': resolve(__dirname, 'src/utils'),
        '@/types': resolve(__dirname, 'src/types'),
        '@/styles': resolve(__dirname, 'src/styles'),
        '@/ai': resolve(__dirname, 'src/ai'),
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
        '@/business': resolve(__dirname, 'src/business'),
        '@/archive': resolve(__dirname, 'src/archive'),
        
      },
    },
    define: {
      // Disable Lit dev mode in production
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      // Inject environment variables
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      // Global polyfills for browser compatibility
      global: 'globalThis',
      // Inject all VITE_ environment variables
      ...Object.keys(env).reduce((acc, key) => {
        if (key.startsWith('VITE_')) {
          acc[`import.meta.env.${key}`] = JSON.stringify(env[key]);
        }
        return acc;
      }, {} as Record<string, string>),
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              // Proxy error logging removed for production
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Request logging removed for production
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              // Response logging removed for production
            });
          },
        },
      },
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      allowedHosts: ['nexus.marcoby.net', 'localhost', '.marcoby.net'],
    },
                 optimizeDeps: {
       // Include packages that need proper ES module handling
       include: []
     },
    build: {
      // Configure build for better Microsoft Graph Toolkit compatibility
      chunkSizeWarningLimit: 1500, // Increase from 1000KB to 1.5MB
      rollupOptions: {
        external: [
          // Node.js modules that should not be bundled for browser
          'pg',
          'events',
          'util',
          'crypto',
          'fs',
          'path',
          'os',
          'net',
          'tls',
          'stream',
          'buffer',
          'querystring',
          'url',
          'http',
          'https',
          'zlib',
          'assert',
          'constants',
          'domain',
          'punycode',
          'string_decoder',
          'timers',
          'tty',
          'vm',
          'worker_threads',
          'child_process',
          'cluster',
          'dgram',
          'dns',
          'module',
          'perf_hooks',
          'process',
          'readline',
          'repl',
          'string_decoder',
          'sys',
          'trace_events',
          'v8',
          'wasi'
        ],
        output: {
          // Separate chunks for better performance
          manualChunks: (id) => {
            // Vendor chunks for large libraries
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            
            if (id.includes('axios')) {
              return 'axios';
            }
            if (id.includes('react-router-dom')) {
              return 'react-router';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-react';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('react-hook-form')) {
              return 'react-hook-form';
            }
            if (id.includes('zod')) {
              return 'zod';
            }
            if (id.includes('zustand')) {
              return 'zustand';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            if (id.includes('date-fns')) {
              return 'date-fns';
            }
            
            if (id.includes('react-window')) {
              return 'react-window';
            }
            if (id.includes('react-virtualized-auto-sizer')) {
              return 'react-virtualized';
            }
            if (id.includes('@dnd-kit')) {
              return 'dnd-kit';
            }
            if (id.includes('sonner')) {
              return 'sonner';
            }
            if (id.includes('vaul')) {
              return 'vaul';
            }
            if (id.includes('react-confetti')) {
              return 'react-confetti';
            }
            if (id.includes('react-day-picker')) {
              return 'react-day-picker';
            }
            if (id.includes('react-error-boundary')) {
              return 'react-error-boundary';
            }
            if (id.includes('react-use')) {
              return 'react-use';
            }
            if (id.includes('i18next')) {
              return 'i18next';
            }
            if (id.includes('openai')) {
              return 'openai';
            }
            if (id.includes('pino')) {
              return 'pino';
            }
            if (id.includes('uuid')) {
              return 'uuid';
            }
            if (id.includes('yargs')) {
              return 'yargs';
            }
            if (id.includes('immer')) {
              return 'immer';
            }
            if (id.includes('clsx')) {
              return 'clsx';
            }
            if (id.includes('tailwind-merge')) {
              return 'tailwind-merge';
            }
            if (id.includes('class-variance-authority')) {
              return 'cva';
            }
            if (id.includes('next-themes')) {
              return 'next-themes';
            }
            if (id.includes('@simplewebauthn')) {
              return 'webauthn';
            }
            if (id.includes('rehype-')) {
              return 'rehype';
            }
            if (id.includes('remark-')) {
              return 'remark';
            }
            if (id.includes('tailwindcss-animate')) {
              return 'tailwind-animate';
            }
            
            // Shared utilities chunk
            if (id.includes('@/shared/utils/') || id.includes('@/shared/utils\\')) {
              return 'shared-utils';
            }
            
            // Auth-related chunk
            if (id.includes('@/core/auth') || id.includes('@/hooks/useAuth') || id.includes('@/shared/utils/signOut')) {
              return 'auth';
            }
            
            // UI components chunk
            if (id.includes('@/shared/components/ui/')) {
              return 'ui-components';
            }
            
            // Integration-specific chunks
            if (id.includes('@/services/integrations/hubspot')) {
              return 'hubspot-integration';
            }
            if (id.includes('@/services/integrations/salesforce')) {
              return 'salesforce-integration';
            }
            if (id.includes('@/services/integrations/microsoft')) {
              return 'microsoft-integration';
            }
            
            // Domain-specific chunks
            if (id.includes('@/domains/')) {
              const domainMatch = id.match(/@\/domains\/([^\/]+)/);
              if (domainMatch) {
                return `domain-${domainMatch[1]}`;
              }
            }
            
            // Page-specific chunks for large pages
            if (id.includes('@/pages/admin/')) {
              return 'admin-pages';
            }
            if (id.includes('@/pages/analytics/')) {
              return 'analytics-pages';
            }
            if (id.includes('@/pages/ai/')) {
              return 'ai-pages';
            }
            if (id.includes('@/pages/integrations/')) {
              return 'integration-pages';
            }
            
            // Default vendor chunk for other node_modules
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        }
      }
    }
  }
})
