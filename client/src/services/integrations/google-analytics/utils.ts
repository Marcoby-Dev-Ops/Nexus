/**
 * Google Analytics Integration Utilities
 * Following the same pattern as HubSpot integration
 */

interface GoogleAnalyticsAuthUrlParams {
  clientId: string;
  redirectUri: string;
  requiredScopes: string[];
  state?: string;
}

/**
 * Creates Google Analytics OAuth authorization URL
 */
export function createGoogleAnalyticsAuthUrl({
  clientId,
  redirectUri,
  requiredScopes,
  state
}: GoogleAnalyticsAuthUrlParams): string {
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const scopes = requiredScopes.join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });

  if (state) {
    params.append('state', state);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Validates Google Analytics OAuth callback parameters
 */
export function validateGoogleAnalyticsCallback(searchParams: URLSearchParams): {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
} {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  return {
    code: code || undefined,
    state: state || undefined,
    error: error || undefined,
    errorDescription: errorDescription || undefined
  };
}

/**
 * Google Analytics API endpoints
 */
export const GOOGLE_ANALYTICS_API = {
  // OAuth endpoints
  AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  
  // Analytics API endpoints
  ANALYTICS_DATA_URL: 'https://analyticsdata.googleapis.com/v1beta',
  ANALYTICS_ADMIN_URL: 'https://analyticsadmin.googleapis.com/v1beta',
  
  // Account and property management
  ACCOUNT_SUMMARIES: 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
  PROPERTIES: 'https://analyticsadmin.googleapis.com/v1beta/properties',
  
  // Data reporting
  RUN_REPORT: 'https://analyticsdata.googleapis.com/v1beta/properties',
  
  // User management
  USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

/**
 * Required scopes for Google Analytics integration
 */
export const GOOGLE_ANALYTICS_SCOPES = {
  READONLY: 'https://www.googleapis.com/auth/analytics.readonly',
  READ_WRITE: 'https://www.googleapis.com/auth/analytics',
  EDIT: 'https://www.googleapis.com/auth/analytics.edit',
  USER_INFO: 'https://www.googleapis.com/auth/userinfo.email',
  USER_PROFILE: 'https://www.googleapis.com/auth/userinfo.profile'
};

/**
 * Google Analytics metric and dimension definitions
 */
export const GOOGLE_ANALYTICS_METRICS = {
  // Traffic metrics
  SESSIONS: 'sessions',
  USERS: 'totalUsers',
  NEW_USERS: 'newUsers',
  SCREEN_PAGE_VIEWS: 'screenPageViews',
  AVERAGE_SESSION_DURATION: 'averageSessionDuration',
  
  // Engagement metrics
  BOUNCE_RATE: 'bounceRate',
  ENGAGEMENT_RATE: 'engagementRate',
  EVENT_COUNT: 'eventCount',
  
  // Conversion metrics
  CONVERSIONS: 'conversions',
  CONVERSION_RATE: 'conversionRate',
  
  // Revenue metrics
  TOTAL_REVENUE: 'totalRevenue',
  AVERAGE_ORDER_VALUE: 'averageOrderValue',
  
  // E-commerce metrics
  TRANSACTIONS: 'transactions',
  ITEMS_PURCHASED: 'itemsPurchased'
};

export const GOOGLE_ANALYTICS_DIMENSIONS = {
  // Time dimensions
  DATE: 'date',
  DATE_HOUR: 'dateHour',
  DATE_HOUR_MINUTE: 'dateHourMinute',
  
  // Traffic source dimensions
  SOURCE: 'source',
  MEDIUM: 'medium',
  CAMPAIGN: 'campaignName',
  AD_CONTENT: 'adContent',
  KEYWORD: 'keyword',
  
  // Page dimensions
  PAGE_PATH: 'pagePath',
  PAGE_TITLE: 'pageTitle',
  LANDING_PAGE: 'landingPage',
  
  // User dimensions
  USER_TYPE: 'userType',
  DEVICE_CATEGORY: 'deviceCategory',
  BROWSER: 'browser',
  OPERATING_SYSTEM: 'operatingSystem',
  COUNTRY: 'country',
  CITY: 'city',
  
  // Event dimensions
  EVENT_NAME: 'eventName',
  EVENT_PARAMETER_NAME: 'eventParameterName',
  EVENT_PARAMETER_VALUE: 'eventParameterValue'
};

/**
 * Common Google Analytics report configurations
 */
export const GOOGLE_ANALYTICS_REPORTS = {
  // Traffic overview
  TRAFFIC_OVERVIEW: {
    metrics: [
      GOOGLE_ANALYTICS_METRICS.SESSIONS,
      GOOGLE_ANALYTICS_METRICS.USERS,
      GOOGLE_ANALYTICS_METRICS.NEW_USERS,
      GOOGLE_ANALYTICS_METRICS.SCREEN_PAGE_VIEWS,
      GOOGLE_ANALYTICS_METRICS.AVERAGE_SESSION_DURATION
    ],
    dimensions: [GOOGLE_ANALYTICS_DIMENSIONS.DATE],
    dateRange: { startDate: '7daysAgo', endDate: 'today' }
  },
  
  // Traffic sources
  TRAFFIC_SOURCES: {
    metrics: [
      GOOGLE_ANALYTICS_METRICS.SESSIONS,
      GOOGLE_ANALYTICS_METRICS.USERS,
      GOOGLE_ANALYTICS_METRICS.BOUNCE_RATE
    ],
    dimensions: [
      GOOGLE_ANALYTICS_DIMENSIONS.SOURCE,
      GOOGLE_ANALYTICS_DIMENSIONS.MEDIUM
    ],
    dateRange: { startDate: '30daysAgo', endDate: 'today' }
  },
  
  // Page performance
  PAGE_PERFORMANCE: {
    metrics: [
      GOOGLE_ANALYTICS_METRICS.SCREEN_PAGE_VIEWS,
      GOOGLE_ANALYTICS_METRICS.USERS,
      GOOGLE_ANALYTICS_METRICS.AVERAGE_SESSION_DURATION
    ],
    dimensions: [GOOGLE_ANALYTICS_DIMENSIONS.PAGE_PATH],
    dateRange: { startDate: '30daysAgo', endDate: 'today' }
  },
  
  // E-commerce performance
  ECOMMERCE_PERFORMANCE: {
    metrics: [
      GOOGLE_ANALYTICS_METRICS.TOTAL_REVENUE,
      GOOGLE_ANALYTICS_METRICS.TRANSACTIONS,
      GOOGLE_ANALYTICS_METRICS.CONVERSION_RATE,
      GOOGLE_ANALYTICS_METRICS.AVERAGE_ORDER_VALUE
    ],
    dimensions: [GOOGLE_ANALYTICS_DIMENSIONS.DATE],
    dateRange: { startDate: '30daysAgo', endDate: 'today' }
  }
};

/**
 * Transforms Google Analytics data to internal format
 */
export function transformGoogleAnalyticsData(data: any, reportType: string) {
  switch (reportType) {
    case 'traffic_overview':
      return {
        sessions: data.sessions || 0,
        users: data.totalUsers || 0,
        newUsers: data.newUsers || 0,
        pageViews: data.screenPageViews || 0,
        averageSessionDuration: data.averageSessionDuration || 0,
        bounceRate: data.bounceRate || 0,
        engagementRate: data.engagementRate || 0
      };
      
    case 'traffic_sources':
      return {
        source: data.source || 'Unknown',
        medium: data.medium || 'Unknown',
        sessions: data.sessions || 0,
        users: data.totalUsers || 0,
        bounceRate: data.bounceRate || 0
      };
      
    case 'page_performance':
      return {
        pagePath: data.pagePath || '/',
        pageViews: data.screenPageViews || 0,
        users: data.totalUsers || 0,
        averageSessionDuration: data.averageSessionDuration || 0
      };
      
    case 'ecommerce_performance':
      return {
        revenue: data.totalRevenue || 0,
        transactions: data.transactions || 0,
        conversionRate: data.conversionRate || 0,
        averageOrderValue: data.averageOrderValue || 0
      };
      
    default:
      return data;
  }
}

/**
 * Validates Google Analytics property ID format
 */
export function isValidGoogleAnalyticsPropertyId(propertyId: string): boolean {
  // GA4 property IDs are typically numeric strings
  return /^\d+$/.test(propertyId);
}

/**
 * Formats Google Analytics date range for API requests
 */
export function formatDateRange(startDate: string, endDate: string) {
  return {
    startDate,
    endDate
  };
}

/**
 * Common date ranges for Google Analytics reports
 */
export const GOOGLE_ANALYTICS_DATE_RANGES = {
  TODAY: { startDate: 'today', endDate: 'today' },
  YESTERDAY: { startDate: 'yesterday', endDate: 'yesterday' },
  LAST_7_DAYS: { startDate: '7daysAgo', endDate: 'today' },
  LAST_30_DAYS: { startDate: '30daysAgo', endDate: 'today' },
  LAST_90_DAYS: { startDate: '90daysAgo', endDate: 'today' },
  THIS_MONTH: { startDate: 'thisMonth', endDate: 'today' },
  LAST_MONTH: { startDate: 'lastMonth', endDate: 'lastMonth' },
  THIS_YEAR: { startDate: 'thisYear', endDate: 'today' }
};
