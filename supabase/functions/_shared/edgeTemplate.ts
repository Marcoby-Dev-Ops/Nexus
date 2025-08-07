import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

type ServiceResponse<T> = { success: boolean; data?: T; error?: string };

export type Handler<T> = (req: Request) => Promise<ServiceResponse<T>>;

export function withJson<T>(handler: Handler<T>) {
  return async (req: Request): Promise<Response> => {
    try {
      const result = await handler(req);
      const status = result.success ? 200 : 400;
      return new Response(JSON.stringify(result), {
        status,
        headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}


