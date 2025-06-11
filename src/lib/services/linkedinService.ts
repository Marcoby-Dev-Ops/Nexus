/**
 * LinkedIn Integration Service
 * Provides company data enrichment and professional network insights
 */

interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface LinkedInTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface CompanyEnrichmentData {
  name: string;
  description: string;
  industry: string;
  size: string;
  founded: string;
  headquarters: string;
  website: string;
  specialties: string[];
  employee_count: number;
  followers_count: number;
  logo_url: string;
  social_profiles: {
    linkedin: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

class LinkedInService {
  private config: LinkedInConfig;
  private baseUrl = 'https://api.linkedin.com/v2';
  private authUrl = 'https://www.linkedin.com/oauth/v2';

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET || '',
      redirectUri: import.meta.env.VITE_LINKEDIN_REDIRECT_URI || `${window.location.origin}/integrations/linkedin/callback`,
      scopes: [
        'r_liteprofile',
        'r_emailaddress',
        'r_organization_social',
        'r_organization_admin',
        'w_organization_social'
      ]
    };
  }

  /**
   * Initiate OAuth 2.0 authorization flow
   */
  initiateAuth(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: this.generateState()
    });

    const authUrl = `${this.authUrl}/authorization?${params}`;
    
    // Store state for validation
    sessionStorage.setItem('linkedin_oauth_state', params.get('state')!);
    
    return authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string, state: string): Promise<LinkedInTokens> {
    // Validate state
    const storedState = sessionStorage.getItem('linkedin_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    const tokenEndpoint = `${this.authUrl}/accessToken`;
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description}`);
    }

    const tokens = await response.json() as LinkedInTokens;
    
    // Store tokens securely
    this.storeTokens(tokens);
    
    // Clean up state
    sessionStorage.removeItem('linkedin_oauth_state');
    
    return tokens;
  }

  /**
   * Enrich company data using LinkedIn
   */
  async enrichCompanyData(domain: string): Promise<CompanyEnrichmentData> {
    try {
      // First try to find company by domain
      const searchResponse = await this.makeAuthenticatedRequest(
        `/organizationSearch?q=domain&domain=${domain}`
      );

      if (!searchResponse.elements?.length) {
        throw new Error('Company not found on LinkedIn');
      }

      const companyId = searchResponse.elements[0].id;

      // Get detailed company information
      const companyData = await this.makeAuthenticatedRequest(
        `/organizations/${companyId}?projection=(id,name,description,industry,specialties,staffCount,websiteUrl,logoUrl)`
      );

      // Get company social profiles
      const socialData = await this.makeAuthenticatedRequest(
        `/organizations/${companyId}/socialProfiles`
      );

      // Format the enriched data
      return {
        name: companyData.name,
        description: companyData.description,
        industry: companyData.industry,
        size: this.mapEmployeeCount(companyData.staffCount),
        founded: companyData.founded,
        headquarters: companyData.headquarters,
        website: companyData.websiteUrl,
        specialties: companyData.specialties || [],
        employee_count: companyData.staffCount,
        followers_count: companyData.followersCount,
        logo_url: companyData.logoUrl,
        social_profiles: {
          linkedin: `https://www.linkedin.com/company/${companyId}`,
          twitter: socialData.twitter,
          facebook: socialData.facebook,
          instagram: socialData.instagram
        }
      };
    } catch (error) {
      console.error('LinkedIn company enrichment failed:', error);
      throw error;
    }
  }

  /**
   * Make authenticated request to LinkedIn API
   */
  private async makeAuthenticatedRequest(endpoint: string): Promise<any> {
    const tokens = this.getStoredTokens();
    if (!tokens) {
      throw new Error('No authentication tokens available');
    }

    // Check if token is expired and refresh if needed
    const tokenData = JSON.parse(tokens);
    if (this.isTokenExpired(tokenData)) {
      await this.refreshTokens();
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${JSON.parse(this.getStoredTokens()!).access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LinkedIn API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh expired tokens
   */
  private async refreshTokens(): Promise<void> {
    const tokens = this.getStoredTokens();
    if (!tokens) {
      throw new Error('No refresh token available');
    }

    const tokenData = JSON.parse(tokens);
    const tokenEndpoint = `${this.authUrl}/accessToken`;
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token'
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description}`);
    }

    const newTokens = await response.json();
    this.storeTokens(newTokens);
  }

  /**
   * Store tokens securely
   */
  private storeTokens(tokens: LinkedInTokens): void {
    localStorage.setItem('linkedin_tokens', JSON.stringify(tokens));
  }

  /**
   * Get stored tokens
   */
  private getStoredTokens(): string | null {
    return localStorage.getItem('linkedin_tokens');
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(tokenData: LinkedInTokens): boolean {
    return Date.now() >= tokenData.expires_in * 1000;
  }

  /**
   * Generate random state for OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2);
  }

  /**
   * Map LinkedIn employee count to size category
   */
  private mapEmployeeCount(count: number): string {
    if (count <= 10) return '1-10';
    if (count <= 50) return '11-50';
    if (count <= 200) return '51-200';
    if (count <= 500) return '201-500';
    if (count <= 1000) return '501-1000';
    if (count <= 5000) return '1001-5000';
    if (count <= 10000) return '5001-10000';
    return '10000+';
  }

  /**
   * Disconnect integration
   */
  async disconnect(): Promise<void> {
    localStorage.removeItem('linkedin_tokens');
    sessionStorage.removeItem('linkedin_oauth_state');
  }
}

export const linkedinService = new LinkedInService(); 