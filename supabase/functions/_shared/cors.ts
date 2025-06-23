// supabase/functions/_shared/cors.ts
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', // Add port 5174 for current dev server
  'https://app.your-production-domain.com' // TODO: Replace with your actual production URL
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for development
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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