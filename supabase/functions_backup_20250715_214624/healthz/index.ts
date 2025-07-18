import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(() =>
  new Response(
    JSON.stringify({ ok: true, ts: Date.now() }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  ),
); 