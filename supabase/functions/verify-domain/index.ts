// supabase/functions/verify-domain/index.ts
import { serve } from "std/server";

serve(async (req: Request) => {
  try {
    const { domain, verificationCode } = await req.json();
    if (!domain || !verificationCode) {
      return new Response(JSON.stringify({ error: "Missing domain or verificationCode" }), { status: 400 });
    }
    // Deno DNS API
    const records = await Deno.resolveDns(domain, "TXT");
    const found = records.some((txt: string[]) =>
      txt.some((entry: string) => entry.includes(`nexus-verification=${verificationCode}`))
    );
    return Response.json({ verified: found });
  } catch (err) {
    let message = "DNS lookup failed";
    if (typeof err === "object" && err && "message" in err && typeof (err as any).message === "string") {
      message = (err as any).message;
    }
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}); 