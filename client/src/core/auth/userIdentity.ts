import type { AuthSession } from '@/core/auth/authentikAuthServiceInstance';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (_error) {
    return null;
  }
}

export function resolveCanonicalUserId(
  fallbackUserId?: string | null,
  session?: AuthSession | null
): string | null {
  const accessToken = session?.session?.accessToken || session?.accessToken;
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    const sub = payload?.sub;
    if (typeof sub === 'string' && sub.length > 0) {
      return sub;
    }
  }

  if (session?.user?.id) {
    return session.user.id;
  }

  return fallbackUserId || null;
}

