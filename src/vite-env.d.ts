/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase Configuration
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  
  // OpenAI Configuration
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_KEY: string
  readonly VITE_OPENROUTER_API_KEY: string
  
  // Google Services
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_CLIENT_SECRET: string
  
  // Microsoft Services
  readonly VITE_MICROSOFT_CLIENT_ID: string
  readonly VITE_MS_TEAMS_CLIENT_ID: string
  readonly VITE_MS_TEAMS_CLIENT_SECRET: string
  readonly VITE_MS_TEAMS_TENANT_ID: string
  readonly VITE_MS_TEAMS_REDIRECT_URI: string
  
  // Social Media Integrations
  readonly VITE_LINKEDIN_CLIENT_ID: string
  readonly VITE_LINKEDIN_CLIENT_SECRET: string
  readonly VITE_LINKEDIN_REDIRECT_URI: string
  readonly VITE_SLACK_CLIENT_ID: string
  readonly VITE_HUBSPOT_CLIENT_ID: string
  
  // Payment Services
  readonly VITE_PAYPAL_CLIENT_ID: string
  readonly VITE_PAYPAL_ENV: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_WEBHOOK_SECRET: string
  
  // Other Services
  readonly VITE_NINJARMM_CLIENT_ID: string
  readonly VITE_N8N_URL: string
  
  // Application Features
  readonly VITE_CHAT_V2: string
  
  // Vite Built-in Environment Variables
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
  readonly MODE: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
