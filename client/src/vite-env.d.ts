/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTHENTIK_BASE_URL: string
  readonly VITE_AUTHENTIK_CLIENT_ID: string
  readonly VITE_API_URL: string
  readonly VITE_DEV_APP_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_CLIENT_SECRET: string
  readonly VITE_HUBSPOT_CLIENT_ID: string
  readonly VITE_HUBSPOT_CLIENT_SECRET: string
  readonly VITE_PAYPAL_CLIENT_ID: string
  readonly VITE_PAYPAL_CLIENT_SECRET: string
  readonly VITE_PAYPAL_ENV: string
  readonly VITE_MICROSOFT_CLIENT_ID: string
  readonly VITE_MICROSOFT_CLIENT_SECRET: string
  readonly VITE_SLACK_CLIENT_ID: string
  readonly VITE_SLACK_CLIENT_SECRET: string
  readonly VITE_EMAIL_SERVICE_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_ANALYZE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

