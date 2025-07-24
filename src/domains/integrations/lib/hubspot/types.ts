/**
 * HubSpot Integration Types
 */

export interface HubSpotConfig {
  baseUrl: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface HubSpotContact {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotCompany {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotDeal {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  associations?: {
    contacts?: { results: Array<{ id: string }> };
    companies?: { results: Array<{ id: string }> };
  };
}

export interface HubSpotIntegration {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    clientId?: string;
  };
  config: {
    portalId?: string;
    portalTimezone?: string;
    redirectUri?: string;
    scopes?: string[];
    connectedAt?: string;
  };
  metadata?: {
    portalInfo?: any;
    tokenType?: string;
  };
}

export interface HubSpotOAuthTokens {
  accesstoken: string;
  refreshtoken: string;
  expiresin: number;
  tokentype: string;
  scope?: string;
}

export interface HubSpotPortalInfo {
  portalId: string;
  timeZone: string;
  currency: string;
  name: string;
}

export interface HubSpotAuthUrlParams {
  clientId: string;
  redirectUri: string;
  requiredScopes: string[];
  optionalScopes?: string[];
  state?: string;
} 