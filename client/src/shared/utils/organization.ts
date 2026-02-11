/**
 * Organization helpers
 */
export function isValidOrgId(orgId: unknown): boolean {
  if (!orgId || typeof orgId !== 'string') return false;
  if (orgId === 'default') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
}

export function normalizeOrgId(orgId?: string | null): string | null {
  if (!orgId) return null;
  if (isValidOrgId(orgId)) return orgId;
  return null;
}

export default normalizeOrgId;
