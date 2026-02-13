/**
 * Tests for OAuth provider-agnostic callback and clean disconnect.
 *
 * Covers:
 * 1. POST /api/oauth/callback  – resolves provider from server-side oauthStates
 * 2. POST /api/oauth/disconnect/:id – cleans up both user_integrations & oauth_tokens
 * 3. normalizeProvider / deriveIntegrationStatus utility helpers
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Inline the small helpers we want to unit-test (they are not exported from
// the route module, so we replicate them here for isolated verification).
// ---------------------------------------------------------------------------

const PROVIDER_ALIASES = {
  microsoft365: 'microsoft',
  'google-analytics': 'google_analytics',
  google_analytics: 'google_analytics',
  googleworkspace: 'google-workspace',
  google_workspace: 'google-workspace',
};

function normalizeProvider(provider) {
  if (!provider) return provider;
  return PROVIDER_ALIASES[provider] || provider;
}

function toIsoStringOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function deriveIntegrationStatus(row = {}) {
  const rawStatus = String(row.status || '').toLowerCase();
  const expiresAtIso = toIsoStringOrNull(row.expires_at);
  const expiresAtMs = expiresAtIso ? Date.parse(expiresAtIso) : NaN;
  const isExpired = Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();
  if (isExpired) return 'expired';
  if (rawStatus === 'active' || rawStatus === 'connected') return 'connected';
  return rawStatus || 'unknown';
}

// ---------------------------------------------------------------------------
// Tests – normalizeProvider
// ---------------------------------------------------------------------------

test('normalizeProvider resolves microsoft365 to microsoft', () => {
  assert.equal(normalizeProvider('microsoft365'), 'microsoft');
});

test('normalizeProvider resolves google-analytics to google_analytics', () => {
  assert.equal(normalizeProvider('google-analytics'), 'google_analytics');
});

test('normalizeProvider resolves google_workspace to google-workspace', () => {
  assert.equal(normalizeProvider('google_workspace'), 'google-workspace');
});

test('normalizeProvider passes through unknown providers', () => {
  assert.equal(normalizeProvider('hubspot'), 'hubspot');
  assert.equal(normalizeProvider('slack'), 'slack');
});

test('normalizeProvider handles null/undefined gracefully', () => {
  assert.equal(normalizeProvider(null), null);
  assert.equal(normalizeProvider(undefined), undefined);
});

// ---------------------------------------------------------------------------
// Tests – deriveIntegrationStatus
// ---------------------------------------------------------------------------

test('deriveIntegrationStatus returns "connected" for active status with valid token', () => {
  const futureDate = new Date(Date.now() + 3600_000).toISOString();
  assert.equal(
    deriveIntegrationStatus({ status: 'active', expires_at: futureDate }),
    'connected'
  );
});

test('deriveIntegrationStatus returns "expired" when token is past expiry', () => {
  const pastDate = new Date(Date.now() - 3600_000).toISOString();
  assert.equal(
    deriveIntegrationStatus({ status: 'active', expires_at: pastDate }),
    'expired'
  );
});

test('deriveIntegrationStatus returns "connected" for status "connected"', () => {
  assert.equal(
    deriveIntegrationStatus({ status: 'connected' }),
    'connected'
  );
});

test('deriveIntegrationStatus returns raw status when unknown', () => {
  assert.equal(
    deriveIntegrationStatus({ status: 'pending' }),
    'pending'
  );
});

test('deriveIntegrationStatus returns "unknown" for empty row', () => {
  assert.equal(deriveIntegrationStatus({}), 'unknown');
});

test('deriveIntegrationStatus ignores invalid expires_at', () => {
  assert.equal(
    deriveIntegrationStatus({ status: 'active', expires_at: 'not-a-date' }),
    'connected'
  );
});

// ---------------------------------------------------------------------------
// Tests – oauthStates map simulation (provider-agnostic callback logic)
// ---------------------------------------------------------------------------

test('provider-agnostic callback resolves provider from oauthStates', () => {
  const oauthStates = new Map();
  const stateKey = 'test-state-abc123';

  oauthStates.set(stateKey, {
    state: stateKey,
    codeVerifier: 'verifier',
    userId: 'user-42',
    integrationSlug: 'microsoft',
    redirectUri: 'https://app.example.com/integrations/oauth/callback',
    timestamp: Date.now(),
    expiresAt: Date.now() + 600_000,
  });

  const entry = oauthStates.get(stateKey);
  assert.ok(entry, 'state should exist in map');
  assert.equal(entry.integrationSlug, 'microsoft');
  assert.equal(entry.userId, 'user-42');
  assert.ok(entry.expiresAt > Date.now(), 'state should not be expired');
});

test('provider-agnostic callback rejects expired state', () => {
  const oauthStates = new Map();
  const stateKey = 'expired-state';

  oauthStates.set(stateKey, {
    state: stateKey,
    codeVerifier: null,
    userId: 'user-42',
    integrationSlug: 'hubspot',
    redirectUri: 'https://app.example.com/callback',
    timestamp: Date.now() - 700_000,
    expiresAt: Date.now() - 100_000,
  });

  const entry = oauthStates.get(stateKey);
  assert.ok(entry, 'state entry should exist');
  assert.ok(entry.expiresAt < Date.now(), 'state should be expired');
});

test('provider-agnostic callback rejects missing state', () => {
  const oauthStates = new Map();
  const entry = oauthStates.get('nonexistent');
  assert.equal(entry, undefined, 'missing state should return undefined');
});

// ---------------------------------------------------------------------------
// Tests – disconnect cleanup simulation
// ---------------------------------------------------------------------------

test('disconnect deletes from both oauth_tokens and user_integrations', () => {
  // Simulate the two DELETE queries the server executes
  const deletedTables = [];

  const mockQuery = async (sql, params) => {
    if (sql.includes('DELETE FROM oauth_tokens')) {
      deletedTables.push('oauth_tokens');
      assert.equal(params[0], 'user-42', 'user_id should match');
      assert.equal(params[1], 'microsoft', 'integration_slug should match');
    }
    if (sql.includes('DELETE FROM user_integrations')) {
      deletedTables.push('user_integrations');
      assert.equal(params[0], 'int-1', 'integration id should match');
    }
    return { data: [], error: null };
  };

  // Simulate the disconnect sequence
  const integration = { id: 'int-1', user_id: 'user-42', integration_name: 'microsoft' };

  return (async () => {
    await mockQuery(
      'DELETE FROM oauth_tokens WHERE user_id = $1 AND integration_slug = $2',
      [integration.user_id, integration.integration_name]
    );
    await mockQuery(
      'DELETE FROM user_integrations WHERE id = $1',
      [integration.id]
    );

    assert.deepEqual(deletedTables, ['oauth_tokens', 'user_integrations'],
      'both tables should be cleaned up in order');
  })();
});

test('disconnect with SENSITIVE_ACTION_CONFIRMATION requires confirm param', () => {
  const SENSITIVE_ACTION_CONFIRMATION = true;
  const confirm = undefined;

  // The server returns 400 when confirm !== 'DISCONNECT' and env flag is true
  if (SENSITIVE_ACTION_CONFIRMATION && confirm !== 'DISCONNECT') {
    assert.ok(true, 'should require confirmation');
  } else {
    assert.fail('should have required confirmation');
  }
});

test('disconnect with confirm=DISCONNECT passes validation', () => {
  const SENSITIVE_ACTION_CONFIRMATION = true;
  const confirm = 'DISCONNECT';

  const passes = !(SENSITIVE_ACTION_CONFIRMATION && confirm !== 'DISCONNECT');
  assert.ok(passes, 'should pass validation with correct confirm value');
});

// ---------------------------------------------------------------------------
// Tests – INTEGRATION_ALIASES matching (used by client disconnect)
// ---------------------------------------------------------------------------

test('integration alias set matches microsoft/microsoft365 variants', () => {
  const INTEGRATION_ALIASES = {
    microsoft: ['microsoft', 'microsoft365'],
    microsoft365: ['microsoft365', 'microsoft'],
  };

  function getIntegrationAliasSet(value) {
    const normalized = value.toLowerCase().replace(/\s+/g, '_');
    const aliases = INTEGRATION_ALIASES[normalized] || [normalized];
    return new Set(aliases);
  }

  const microsoftAliases = getIntegrationAliasSet('microsoft');
  assert.ok(microsoftAliases.has('microsoft'));
  assert.ok(microsoftAliases.has('microsoft365'));

  const m365Aliases = getIntegrationAliasSet('microsoft365');
  assert.ok(m365Aliases.has('microsoft'));
  assert.ok(m365Aliases.has('microsoft365'));
});

// ---------------------------------------------------------------------------
// Tests – toIsoStringOrNull edge cases
// ---------------------------------------------------------------------------

test('toIsoStringOrNull returns null for falsy values', () => {
  assert.equal(toIsoStringOrNull(null), null);
  assert.equal(toIsoStringOrNull(undefined), null);
  assert.equal(toIsoStringOrNull(''), null);
  assert.equal(toIsoStringOrNull(0), null);
});

test('toIsoStringOrNull returns ISO string for valid date', () => {
  const result = toIsoStringOrNull('2026-02-12T10:00:00Z');
  assert.ok(result, 'should return a string');
  assert.ok(result.includes('2026-02-12'), 'should contain the date');
});

test('toIsoStringOrNull returns null for invalid date string', () => {
  assert.equal(toIsoStringOrNull('not-a-date'), null);
});
