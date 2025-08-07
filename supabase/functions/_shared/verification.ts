export async function verifyMicrosoftGraph(req: Request): Promise<boolean> {
  // Placeholder for actual signature verification logic (e.g., JWT validation)
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  return !!auth?.startsWith('Bearer ');
}

export async function verifyGmailWebhook(req: Request): Promise<boolean> {
  // Placeholder for Gmail webhook verification (e.g., Pub/Sub verification)
  const token = req.headers.get('X-Goog-Channel-Token');
  return Boolean(token);
}

export function requirePermission(scope: string, userScopes: string[]): boolean {
  return userScopes.includes(scope);
}


