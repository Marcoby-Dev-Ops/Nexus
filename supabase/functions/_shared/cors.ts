// supabase/functions/_shared/cors.ts
const allowedOrigins = [
  'http://localhost:5173',
  'https://app.your-production-domain.com' // TODO: Replace with your actual production URL
];

export const corsHeaders = (origin: string | null) => {
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
}; 