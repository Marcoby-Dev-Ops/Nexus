const express = require('express');
const { logger } = require('../src/utils/logger');
const router = express.Router();
const crypto = require('crypto');
const dns = require('dns').promises;

const SUPPORTED_EMAIL_OAUTH_SLUGS = ['microsoft', 'google-workspace', 'google_workspace', 'google'];
const EMAIL_ADDRESS_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

// Middleware to authenticate OpenClaw requests
const authenticateOpenClaw = (req, res, next) => {
  const apiKey = req.headers['x-openclaw-api-key'] || req.query.apiKey;
  
  // In production, validate against stored API keys
  // For now, accept any key or use environment variable
  const validApiKey = process.env.OPENCLAW_API_KEY || 'openclaw-default-key';
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'UNAUTHORIZED'
    });
  }
  
  if (apiKey !== validApiKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      code: 'FORBIDDEN'
    });
  }
  
  next();
};

function getTrustedUserId(req) {
  const headerUserId = req.headers['x-nexus-user-id'];
  return String(Array.isArray(headerUserId) ? headerUserId[0] : (headerUserId || '')).trim() || null;
}

function getUserOverrideAttempt(req) {
  const headerUserId = getTrustedUserId(req);
  const bodyUserId = req.body?.userId;
  const queryUserId = req.query?.userId;
  const argsUserId = req.body?.args?.userId;
  const providedUserId = String(bodyUserId || queryUserId || argsUserId || '').trim() || null;

  if (!providedUserId || !headerUserId || providedUserId === headerUserId) return null;
  return {
    headerUserId,
    providedUserId
  };
}

function normalizeIntegrationStatus(rawStatus, expiresAtIso) {
  const status = String(rawStatus || '').toLowerCase();
  const expiresAtMs = expiresAtIso ? Date.parse(expiresAtIso) : NaN;
  const expired = Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();
  if (expired) return 'expired';
  if (status === 'active' || status === 'connected') return 'connected';
  if (status === 'failed' || status === 'error') return 'failed';
  if (status === 'disconnected') return 'disconnected';
  return status || 'unknown';
}

function normalizeProvider(provider) {
  const value = String(provider || '').trim().toLowerCase();
  if (!value) return '';
  if (value === 'microsoft365') return 'microsoft';
  if (value === 'google_workspace' || value === 'googleworkspace') return 'google-workspace';
  if (value === 'google-workspace') return 'google-workspace';
  return value;
}

function inferEmailProviderFromMxRecords(mxRecords = []) {
  const hosts = mxRecords
    .map((record) => String(record?.exchange || '').toLowerCase())
    .filter(Boolean);

  const hasHost = (fragments = []) =>
    hosts.some((host) => fragments.some((fragment) => host.includes(fragment)));

  if (hasHost(['protection.outlook.com', 'outlook.com', 'office365.com'])) {
    return {
      provider: 'microsoft',
      displayName: 'Microsoft 365',
      workflow: 'oauth',
      confidence: 'high'
    };
  }

  if (hasHost(['google.com', 'googlemail.com'])) {
    return {
      provider: 'google_workspace',
      displayName: 'Google Workspace',
      workflow: 'oauth',
      confidence: 'high'
    };
  }

  return {
    provider: 'custom_imap',
    displayName: 'Custom IMAP/SMTP',
    workflow: 'imap_manual',
    confidence: hosts.length ? 'medium' : 'low'
  };
}

function buildConnectorOptions() {
  const supportsMicrosoft = SUPPORTED_EMAIL_OAUTH_SLUGS.includes('microsoft');
  const supportsGoogle = SUPPORTED_EMAIL_OAUTH_SLUGS.includes('google-workspace')
    || SUPPORTED_EMAIL_OAUTH_SLUGS.includes('google_workspace')
    || SUPPORTED_EMAIL_OAUTH_SLUGS.includes('google');

  return [
    { provider: 'microsoft', displayName: 'Microsoft 365', workflow: 'oauth', supported: supportsMicrosoft },
    { provider: 'google_workspace', displayName: 'Google Workspace', workflow: 'oauth', supported: supportsGoogle },
    { provider: 'custom_imap', displayName: 'Custom IMAP/SMTP', workflow: 'imap_manual', supported: false }
  ];
}

function getInternalApiBaseUrl(req) {
  if (process.env.INTERNAL_API_BASE_URL) return process.env.INTERNAL_API_BASE_URL;
  if (process.env.NEXUS_API_URL) return process.env.NEXUS_API_URL.replace(/\/+$/, '');
  const protocol = (req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = req.get('host') || `127.0.0.1:${process.env.PORT || 3001}`;
  return `${protocol}://${host}`;
}

function toIsoOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizeEmailAddress(value) {
  return String(value || '').trim().toLowerCase();
}

function parseSenderFilters(fromValue) {
  if (!fromValue) return [];
  if (Array.isArray(fromValue)) {
    return fromValue
      .map((entry) => normalizeEmailAddress(entry))
      .filter(Boolean);
  }
  return [normalizeEmailAddress(fromValue)].filter(Boolean);
}

function buildTimeWindow(args = {}) {
  const preset = String(args.datePreset || '').trim().toLowerCase();
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  const setUtcStartOfDay = (date) => date.setUTCHours(0, 0, 0, 0);
  const setUtcEndOfDay = (date) => date.setUTCHours(23, 59, 59, 999);

  if (!preset || preset === 'today') {
    setUtcStartOfDay(start);
    setUtcEndOfDay(end);
    return { startIso: start.toISOString(), endIso: end.toISOString(), preset: preset || 'today' };
  }

  if (preset === 'last_7_days') {
    start.setUTCDate(start.getUTCDate() - 7);
    return { startIso: start.toISOString(), endIso: end.toISOString(), preset };
  }

  if (preset === 'last_30_days') {
    start.setUTCDate(start.getUTCDate() - 30);
    return { startIso: start.toISOString(), endIso: end.toISOString(), preset };
  }

  if (preset === 'this_week') {
    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setUTCDate(now.getUTCDate() - diffToMonday);
    setUtcStartOfDay(start);
    setUtcEndOfDay(end);
    return { startIso: start.toISOString(), endIso: end.toISOString(), preset };
  }

  if (preset === 'last_week') {
    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setUTCDate(now.getUTCDate() - diffToMonday - 7);
    setUtcStartOfDay(start);
    end.setUTCDate(now.getUTCDate() - diffToMonday - 1);
    setUtcEndOfDay(end);
    return { startIso: start.toISOString(), endIso: end.toISOString(), preset };
  }

  if (preset === 'this_month') {
    start.setUTCDate(1);
    setUtcStartOfDay(start);
    setUtcEndOfDay(end);
    return { startIso: start.toISOString(), endIso: end.toISOString(), preset };
  }

  if (preset === 'last_month') {
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - 1);
    setUtcStartOfDay(start);
    end.setUTCDate(0);
    setUtcEndOfDay(end);
    return { startIso: start.toISOString(), endIso: end.toISOString(), preset };
  }

  if (preset === 'custom') {
    const startIso = toIsoOrNull(args.startDate);
    const endIso = toIsoOrNull(args.endDate);
    return { startIso, endIso, preset };
  }

  const startIso = toIsoOrNull(args.startDate);
  const endIso = toIsoOrNull(args.endDate);
  return { startIso, endIso, preset: 'custom' };
}

function parseSearchLimit(limitValue, fallback = 20) {
  const parsed = Number(limitValue || fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), 50);
}

function normalizeProviderSlug(provider) {
  const normalized = normalizeProvider(provider);
  if (normalized === 'google') return 'google-workspace';
  if (normalized === 'google_workspace') return 'google-workspace';
  return normalized;
}

function resolveProviderPreference(provider) {
  const normalized = normalizeProviderSlug(provider || 'auto');
  if (!normalized || normalized === 'auto' || normalized === 'all') {
    return ['microsoft', 'google-workspace', 'google_workspace', 'google'];
  }
  if (normalized === 'google-workspace') return ['google-workspace', 'google_workspace', 'google'];
  return [normalized];
}

function buildGraphDateFilter(window) {
  const clauses = [];
  if (window.startIso) clauses.push(`receivedDateTime ge ${window.startIso}`);
  if (window.endIso) clauses.push(`receivedDateTime le ${window.endIso}`);
  if (!clauses.length) return '';
  return clauses.join(' and ');
}

function applyLocalEmailFilters(emails = [], filters = {}) {
  const senderFilters = parseSenderFilters(filters.from);
  const queryText = String(filters.query || '').trim().toLowerCase();
  const unreadOnly = Boolean(filters.unreadOnly);
  const startMs = filters.startIso ? Date.parse(filters.startIso) : NaN;
  const endMs = filters.endIso ? Date.parse(filters.endIso) : NaN;

  return emails.filter((email) => {
    const sender = normalizeEmailAddress(email.from?.email || email.from || '');
    if (senderFilters.length && !senderFilters.includes(sender)) return false;
    if (unreadOnly && email.isRead) return false;

    if (queryText) {
      const haystack = [
        String(email.subject || ''),
        String(email.preview || ''),
        String(email.from?.name || ''),
        String(email.from?.email || ''),
      ].join('\n').toLowerCase();
      if (!haystack.includes(queryText)) return false;
    }

    const receivedMs = Date.parse(String(email.receivedAt || ''));
    if (Number.isFinite(startMs) && Number.isFinite(receivedMs) && receivedMs < startMs) return false;
    if (Number.isFinite(endMs) && Number.isFinite(receivedMs) && receivedMs > endMs) return false;

    return true;
  });
}

async function fetchMicrosoftMessages(accessToken, filters = {}) {
  const limit = parseSearchLimit(filters.limit, 20);
  const candidateSize = Math.min(Math.max(limit * 4, 20), 100);
  const graphParams = new URLSearchParams({
    $top: String(candidateSize),
    $orderby: 'receivedDateTime desc',
    $select: 'id,subject,from,receivedDateTime,bodyPreview,hasAttachments,isRead,importance,webLink'
  });
  const dateFilter = buildGraphDateFilter(filters);
  if (dateFilter) graphParams.set('$filter', dateFilter);

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages?${graphParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.body-content-type="text"'
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Microsoft email query failed: ${details}`);
  }

  const rawMessages = Array.isArray(payload?.value) ? payload.value : [];
  const mapped = rawMessages.map((item) => ({
    provider: 'microsoft',
    id: item.id,
    subject: item.subject || '(No subject)',
    preview: item.bodyPreview || '',
    receivedAt: item.receivedDateTime || null,
    from: {
      name: item.from?.emailAddress?.name || null,
      email: item.from?.emailAddress?.address || null,
    },
    isRead: Boolean(item.isRead),
    hasAttachments: Boolean(item.hasAttachments),
    importance: item.importance || 'normal',
    webLink: item.webLink || null
  }));

  const filtered = applyLocalEmailFilters(mapped, filters);
  return filtered.slice(0, limit);
}

function buildGmailQuery(filters = {}) {
  const parts = [];
  if (filters.query) parts.push(String(filters.query));
  const senders = parseSenderFilters(filters.from);
  if (senders.length === 1) {
    parts.push(`from:${senders[0]}`);
  } else if (senders.length > 1) {
    parts.push(`(${senders.map((sender) => `from:${sender}`).join(' OR ')})`);
  }
  if (filters.startIso) parts.push(`after:${Math.floor(Date.parse(filters.startIso) / 1000)}`);
  if (filters.endIso) parts.push(`before:${Math.floor(Date.parse(filters.endIso) / 1000)}`);
  if (filters.unreadOnly) parts.push('is:unread');
  return parts.join(' ').trim();
}

function extractHeader(headers = [], targetName = '') {
  const found = headers.find((header) => String(header?.name || '').toLowerCase() === targetName.toLowerCase());
  return found?.value || null;
}

function parseFromHeader(fromHeader) {
  const raw = String(fromHeader || '');
  if (!raw) return { name: null, email: null };
  const match = raw.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].replace(/(^"|"$)/g, '').trim() || null,
      email: normalizeEmailAddress(match[2])
    };
  }
  return { name: null, email: normalizeEmailAddress(raw) };
}

async function fetchGmailMessages(accessToken, filters = {}) {
  const limit = parseSearchLimit(filters.limit, 20);
  const candidateSize = Math.min(Math.max(limit * 4, 20), 100);
  const query = buildGmailQuery(filters);
  const listParams = new URLSearchParams({
    maxResults: String(candidateSize)
  });
  if (query) listParams.set('q', query);

  const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const listPayload = await listResponse.json().catch(() => ({}));
  if (!listResponse.ok) {
    const details = listPayload?.error?.message || `HTTP ${listResponse.status}`;
    throw new Error(`Google Workspace email query failed: ${details}`);
  }

  const references = Array.isArray(listPayload?.messages) ? listPayload.messages : [];
  if (!references.length) return [];

  const detailResponses = await Promise.all(
    references.slice(0, candidateSize).map(async (entry) => {
      const detailResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(entry.id)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const detailPayload = await detailResponse.json().catch(() => ({}));
      if (!detailResponse.ok) return null;
      const headers = detailPayload?.payload?.headers || [];
      const from = parseFromHeader(extractHeader(headers, 'From'));
      const subject = extractHeader(headers, 'Subject') || '(No subject)';
      const receivedAt = detailPayload?.internalDate
        ? new Date(Number(detailPayload.internalDate)).toISOString()
        : null;

      return {
        provider: 'google-workspace',
        id: detailPayload.id,
        subject,
        preview: detailPayload.snippet || '',
        receivedAt,
        from,
        isRead: !Array.isArray(detailPayload.labelIds) || !detailPayload.labelIds.includes('UNREAD'),
        hasAttachments: false,
        importance: 'normal',
        webLink: `https://mail.google.com/mail/u/0/#inbox/${detailPayload.id}`
      };
    })
  );

  const mapped = detailResponses.filter(Boolean);
  const filtered = applyLocalEmailFilters(mapped, filters);
  return filtered.slice(0, limit);
}

async function executeToolByName(req, toolName, args = {}) {
  const userId = getTrustedUserId(req);
  if (!userId) {
    throw new Error('x-nexus-user-id header is required');
  }

  const overrideAttempt = getUserOverrideAttempt(req);
  if (overrideAttempt) {
    logger.warn('Rejected OpenClaw userId override attempt', {
      headerUserId: overrideAttempt.headerUserId,
      providedUserId: overrideAttempt.providedUserId,
      endpoint: req.originalUrl || req.path,
      ip: req.ip
    });
  }

  const internalApiBaseUrl = getInternalApiBaseUrl(req);
  const { query } = require('../src/database/connection');
  const safeName = String(toolName || '').trim();
  const correlationId = String(req.headers['x-correlation-id'] || '').trim() || crypto.randomUUID();

  if (safeName === 'nexus_get_integration_status') {
    const result = await query(
      `SELECT
         ui.id,
         ui.integration_name,
         ui.status,
         ui.last_sync_at,
         ui.updated_at,
         ot.expires_at
       FROM user_integrations ui
       LEFT JOIN oauth_tokens ot
         ON ot.user_id = ui.user_id
        AND ot.integration_slug = ui.integration_name
       WHERE ui.user_id = $1
       ORDER BY ui.updated_at DESC`,
      [userId]
    );
    if (result.error) throw new Error(result.error);
    const integrations = (result.data || []).map((row) => {
      const expiresAt = row.expires_at ? new Date(row.expires_at).toISOString() : null;
      const status = normalizeIntegrationStatus(row.status, expiresAt);
      return {
        integrationId: row.id,
        provider: row.integration_name,
        status,
        lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
        tokenExpiresAt: expiresAt
      };
    });
    return { userId, integrations, connectedCount: integrations.filter((i) => i.status === 'connected').length };
  }

  if (safeName === 'nexus_resolve_email_provider') {
    const email = normalizeEmailAddress(args.email || '');
    if (!email || !EMAIL_ADDRESS_REGEX.test(email)) {
      throw new Error('valid email is required');
    }

    const domainMatch = email.match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);
    if (!domainMatch) throw new Error('email domain is invalid');
    const domain = domainMatch[1];

    let mxRecords = [];
    try {
      mxRecords = await dns.resolveMx(domain);
      mxRecords.sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0));
    } catch (_error) {
      mxRecords = [];
    }

    const recommendation = inferEmailProviderFromMxRecords(mxRecords);
    return {
      correlationId,
      email,
      domain,
      mxRecords,
      recommendation,
      suggestedImap: {
        host: `imap.${domain}`,
        port: 993,
        useSSL: true,
        username: email
      },
      connectorOptions: buildConnectorOptions()
    };
  }

  if (safeName === 'nexus_start_email_connection') {
    const providerRaw = String(args.provider || '').trim();
    if (!providerRaw) throw new Error('provider is required');
    const provider = normalizeProvider(providerRaw);
    const redirectUri = String(args.redirectUri || '').trim();
    const search = new URLSearchParams({ userId });
    if (redirectUri) search.set('redirectUri', redirectUri);
    const response = await fetch(`${internalApiBaseUrl}/api/oauth/${provider}/start?${search.toString()}`, {
      headers: { 'x-correlation-id': correlationId }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `OAuth start failed (${response.status})`);
    return payload;
  }

  if (safeName === 'nexus_connect_imap') {
    const response = await fetch(`${internalApiBaseUrl}/api/oauth/imap/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
      body: JSON.stringify({
        userId,
        email: args.email,
        host: args.host,
        port: args.port,
        username: args.username,
        password: args.password,
        useSSL: args.useSSL !== false,
        providerHint: args.providerHint || 'custom_imap'
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `IMAP connect failed (${response.status})`);
    return payload;
  }

  if (safeName === 'nexus_test_integration_connection') {
    const providerRaw = String(args.provider || '').trim();
    if (!providerRaw) throw new Error('provider is required');
    const provider = normalizeProvider(providerRaw);
    const response = await fetch(`${internalApiBaseUrl}/api/oauth/${provider}/test-saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
      body: JSON.stringify({ userId })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `Connection test failed (${response.status})`);
    return payload;
  }

  if (safeName === 'nexus_search_emails') {
    const limit = parseSearchLimit(args.limit, 20);
    const providersToTry = resolveProviderPreference(args.provider);
    const tokenResult = await query(
      `SELECT integration_slug, access_token, expires_at, updated_at
       FROM oauth_tokens
       WHERE user_id = $1
         AND integration_slug = ANY($2::text[])
       ORDER BY updated_at DESC`,
      [userId, providersToTry]
    );
    if (tokenResult.error) throw new Error(tokenResult.error);

    const availableTokens = (tokenResult.data || [])
      .filter((row) => row && row.access_token)
      .map((row) => ({
        provider: normalizeProviderSlug(row.integration_slug),
        token: row.access_token,
        expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null
      }));

    if (!availableTokens.length) {
      throw new Error('No connected email provider token found. Connect Microsoft 365 or Google Workspace first.');
    }

    const expiredProviders = availableTokens
      .filter((entry) => entry.expiresAt && Date.parse(entry.expiresAt) <= Date.now())
      .map((entry) => entry.provider);
    const activeTokens = availableTokens.filter((entry) => !expiredProviders.includes(entry.provider));
    if (!activeTokens.length) {
      throw new Error(`Connected email token(s) are expired for: ${expiredProviders.join(', ')}. Reconnect required.`);
    }

    const timeWindow = buildTimeWindow(args);
    const commonFilters = {
      from: args.from,
      query: args.query,
      unreadOnly: Boolean(args.unreadOnly),
      startIso: timeWindow.startIso,
      endIso: timeWindow.endIso,
      limit
    };

    const collected = [];
    const errors = [];
    for (const entry of activeTokens) {
      try {
        if (entry.provider === 'microsoft') {
          const messages = await fetchMicrosoftMessages(entry.token, commonFilters);
          for (const message of messages) collected.push(message);
          continue;
        }
        if (entry.provider === 'google-workspace') {
          const messages = await fetchGmailMessages(entry.token, commonFilters);
          for (const message of messages) collected.push(message);
          continue;
        }
        errors.push(`provider "${entry.provider}" is not supported for inbox search`);
      } catch (error) {
        errors.push(`${entry.provider}: ${error?.message || String(error)}`);
      }
    }

    const sorted = collected
      .filter(Boolean)
      .sort((a, b) => Date.parse(String(b.receivedAt || 0)) - Date.parse(String(a.receivedAt || 0)))
      .slice(0, limit);

    return {
      userId,
      providersQueried: activeTokens.map((entry) => entry.provider),
      emails: sorted,
      total: sorted.length,
      appliedFilters: {
        datePreset: timeWindow.preset,
        startDate: timeWindow.startIso,
        endDate: timeWindow.endIso,
        from: parseSenderFilters(args.from),
        query: String(args.query || '').trim() || null,
        unreadOnly: Boolean(args.unreadOnly),
        limit
      },
      warnings: errors
    };
  }

  if (safeName === 'nexus_disconnect_integration') {
    const providerRaw = String(args.provider || '').trim();
    let integrationId = String(args.integrationId || '').trim();
    const provider = providerRaw ? normalizeProvider(providerRaw) : '';
    if (!integrationId) {
      if (!provider) throw new Error('integrationId or provider is required');
      const lookup = await query(
        `SELECT id
         FROM user_integrations
         WHERE user_id = $1 AND integration_name = $2
         ORDER BY updated_at DESC
         LIMIT 1`,
        [userId, provider]
      );
      if (lookup.error) throw new Error(lookup.error);
      integrationId = lookup.data?.[0]?.id || '';
      if (!integrationId) throw new Error(`No integration found for provider "${provider}"`);
    }

    const response = await fetch(`${internalApiBaseUrl}/api/oauth/disconnect/${integrationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
      body: JSON.stringify({ userId, confirm: 'DISCONNECT' })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `Disconnect failed (${response.status})`);
    return {
      success: true,
      integrationId,
      provider: provider || undefined
    };
  }

  throw new Error(`Unknown tool: ${safeName}`);
}

const NEXUS_TOOL_CATALOG = [
  {
    name: 'nexus_get_integration_status',
    description: 'Get live integration connection status for the current Nexus user.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'nexus_resolve_email_provider',
    description: 'Resolve email provider by MX lookup and suggest connection workflow.',
    inputSchema: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string' } },
      additionalProperties: false
    }
  },
  {
    name: 'nexus_start_email_connection',
    description: 'Start OAuth connect flow for Microsoft or Google Workspace.',
    inputSchema: {
      type: 'object',
      required: ['provider'],
      properties: {
        provider: { type: 'string', enum: ['microsoft', 'microsoft365', 'google_workspace', 'google-workspace'] },
        redirectUri: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'nexus_connect_imap',
    description: 'Connect custom IMAP account and persist credentials for Nexus use.',
    inputSchema: {
      type: 'object',
      required: ['email', 'host', 'port', 'username', 'password'],
      properties: {
        email: { type: 'string' },
        host: { type: 'string' },
        port: { type: 'number' },
        username: { type: 'string' },
        password: { type: 'string' },
        useSSL: { type: 'boolean' },
        providerHint: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'nexus_test_integration_connection',
    description: 'Test saved OAuth connection health for a provider.',
    inputSchema: {
      type: 'object',
      required: ['provider'],
      properties: { provider: { type: 'string' } },
      additionalProperties: false
    }
  },
  {
    name: 'nexus_search_emails',
    description: 'Search connected inbox emails by date range, sender(s), and free-text query.',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['auto', 'all', 'microsoft', 'google_workspace', 'google-workspace'] },
        datePreset: { type: 'string', enum: ['today', 'last_7_days', 'last_30_days', 'this_week', 'last_week', 'this_month', 'last_month', 'custom'] },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        from: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ]
        },
        query: { type: 'string' },
        unreadOnly: { type: 'boolean' },
        limit: { type: 'number' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'nexus_disconnect_integration',
    description: 'Disconnect an integration by ID or provider.',
    inputSchema: {
      type: 'object',
      properties: {
        integrationId: { type: 'string' },
        provider: { type: 'string' }
      },
      additionalProperties: false
    }
  }
];

// Health check for OpenClaw integration
router.get('/health', authenticateOpenClaw, (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'openclaw-integration',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Tool catalog for OpenClaw plugin/tool-runtime discovery
router.get('/tools/catalog', authenticateOpenClaw, (req, res) => {
  res.json({
    success: true,
    metadata: {
      catalogVersion: '2026-02-12',
      generatedAt: new Date().toISOString(),
      compatibility: {
        minOpenClawVersion: '2026.2.0'
      }
    },
    tools: NEXUS_TOOL_CATALOG
  });
});

// Execute Nexus integration tools from OpenClaw
router.post('/tools/execute', authenticateOpenClaw, async (req, res) => {
  try {
    const { tool, args = {} } = req.body || {};
    const toolName = String(tool || '').trim();
    if (!toolName) {
      return res.status(400).json({
        success: false,
        error: 'tool is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await executeToolByName(req, toolName, args);
    logger.info('OpenClaw tool executed', {
      tool: toolName,
      userId: getTrustedUserId(req),
      correlationId: String(req.headers['x-correlation-id'] || '').trim() || null
    });
    return res.json({
      success: true,
      tool: toolName,
      result
    });
  } catch (error) {
    const isAuthError = String(error?.message || '').includes('x-nexus-user-id header is required');
    logger.error('OpenClaw tool execution failed', {
      tool: req.body?.tool,
      error: error?.message || String(error)
    });
    return res.status(isAuthError ? 401 : 400).json({
      success: false,
      error: error?.message || 'Tool execution failed',
      code: isAuthError ? 'UNAUTHORIZED' : 'TOOL_EXECUTION_ERROR'
    });
  }
});

// Sync a conversation from OpenClaw
router.post('/conversations/sync', authenticateOpenClaw, async (req, res) => {
  try {
    const {
      userId,
      conversationId,
      title,
      messages,
      model,
      systemPrompt,
      metadata
    } = req.body;
    
    // Validate required fields
    if (!userId || !conversationId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, conversationId, and messages array are required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Validate messages structure
    for (const [index, message] of messages.entries()) {
      if (!message.id || !message.role || !message.content) {
        return res.status(400).json({
          success: false,
          error: `Message at index ${index} is missing required fields: id, role, or content`,
          code: 'VALIDATION_ERROR'
        });
      }
      
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        return res.status(400).json({
          success: false,
          error: `Message at index ${index} has invalid role: ${message.role}. Must be user, assistant, or system`,
          code: 'VALIDATION_ERROR'
        });
      }
    }
    
    logger.info('Syncing OpenClaw conversation', {
      userId,
      conversationId,
      messageCount: messages.length,
      title
    });
    
    // Import database client
    const { query } = require('../src/database/connection');
    
    // Use the sync function from migration
    const result = await query(
      `SELECT sync_openclaw_conversation(
        $1, $2, $3, $4::jsonb, $5, $6, $7::jsonb
      ) as conversation_id`,
      [
        userId,
        conversationId,
        title || 'OpenClaw Conversation',
        JSON.stringify(messages),
        model || 'openclaw',
        systemPrompt,
        metadata || {}
      ]
    );
    
    const nexusConversationId = result.rows[0].conversation_id;
    
    logger.info('OpenClaw conversation synced successfully', {
      userId,
      conversationId,
      nexusConversationId,
      messageCount: messages.length
    });
    
    res.json({
      success: true,
      data: {
        conversationId: nexusConversationId,
        externalId: conversationId,
        messageCount: messages.length,
        syncedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Failed to sync OpenClaw conversation:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get OpenClaw conversations for a user
router.get('/conversations', authenticateOpenClaw, async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId query parameter is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const { query } = require('../src/database/connection');
    
    const result = await query(
      `SELECT * FROM openclaw_conversations WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        conversations: result.rows,
        count: result.rows.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to fetch OpenClaw conversations:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get a specific OpenClaw conversation
router.get('/conversations/:conversationId', authenticateOpenClaw, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    
    const { query: dbQuery } = require('../src/database/connection');
    
    let query = `SELECT * FROM openclaw_conversations WHERE id = $1`;
    let params = [conversationId];
    
    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }
    
    const result = await dbQuery(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Failed to fetch OpenClaw conversation:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Stream real-time conversation updates (SSE)
router.get('/conversations/stream', authenticateOpenClaw, (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId query parameter is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({
      timestamp: new Date().toISOString(),
      userId
    })}\n\n`);
    
    logger.info('OpenClaw SSE connection established', { userId });
    
    // In a real implementation, you would:
    // 1. Subscribe to database changes (LISTEN/NOTIFY in PostgreSQL)
    // 2. Use Redis pub/sub for horizontal scaling
    // 3. Handle reconnections with last-event-id
    
    // For now, just keep the connection open
    const keepAlive = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 30000);
    
    // Clean up on connection close
    req.on('close', () => {
      clearInterval(keepAlive);
      logger.info('OpenClaw SSE connection closed', { userId });
    });
    
  } catch (error) {
    logger.error('Failed to establish SSE connection:', error);
    res.status(500).end();
  }
});

module.exports = router;
