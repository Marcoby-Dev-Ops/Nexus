// supabase/functions/_shared/cors.ts
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173', // WSL/Windows browsers sometimes use 127.0.0.1 instead of localhost
  'http://localhost:5174', // Additional dev port
  'https://nexus.marcoby.com'
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// For production use with origin checking
export const corsHeadersWithOrigin = (origin: string | null) => {
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
}; 