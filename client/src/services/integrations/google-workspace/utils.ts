/**
 * Google Workspace Integration Utilities
 * Following the same pattern as Google Analytics integration
 */

interface GoogleWorkspaceAuthUrlParams {
  clientId: string;
  redirectUri: string;
  requiredScopes: string[];
  state?: string;
}

/**
 * Creates Google Workspace OAuth authorization URL
 */
export function createGoogleWorkspaceAuthUrl({
  clientId,
  redirectUri,
  requiredScopes,
  state
}: GoogleWorkspaceAuthUrlParams): string {
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
 * Validates Google Workspace OAuth callback parameters
 */
export function validateGoogleWorkspaceCallback(searchParams: URLSearchParams): {
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
 * Google Workspace API endpoints
 */
export const GOOGLE_WORKSPACE_API = {
  // OAuth endpoints
  AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  
  // Gmail API endpoints
  GMAIL_API: 'https://gmail.googleapis.com/gmail/v1/users/me',
  GMAIL_MESSAGES: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
  GMAIL_THREADS: 'https://gmail.googleapis.com/gmail/v1/users/me/threads',
  
  // Calendar API endpoints
  CALENDAR_API: 'https://www.googleapis.com/calendar/v3',
  CALENDAR_CALENDARS: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
  CALENDAR_EVENTS: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
  
  // Drive API endpoints
  DRIVE_API: 'https://www.googleapis.com/drive/v3',
  DRIVE_FILES: 'https://www.googleapis.com/drive/v3/files',
  DRIVE_ABOUT: 'https://www.googleapis.com/drive/v3/about',
  
  // Contacts API endpoints
  CONTACTS_API: 'https://people.googleapis.com/v1',
  CONTACTS_PEOPLE: 'https://people.googleapis.com/v1/people/me',
  CONTACTS_CONNECTIONS: 'https://people.googleapis.com/v1/people/me/connections',
  
  // User management
  USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

/**
 * Required scopes for Google Workspace integration
 */
export const GOOGLE_WORKSPACE_SCOPES = {
  // Gmail scopes
  GMAIL_READONLY: 'https://www.googleapis.com/auth/gmail.readonly',
  GMAIL_MODIFY: 'https://www.googleapis.com/auth/gmail.modify',
  GMAIL_SEND: 'https://www.googleapis.com/auth/gmail.send',
  
  // Calendar scopes
  CALENDAR_READONLY: 'https://www.googleapis.com/auth/calendar.readonly',
  CALENDAR_EVENTS: 'https://www.googleapis.com/auth/calendar.events',
  CALENDAR: 'https://www.googleapis.com/auth/calendar',
  
  // Drive scopes
  DRIVE_READONLY: 'https://www.googleapis.com/auth/drive.readonly',
  DRIVE_FILE: 'https://www.googleapis.com/auth/drive.file',
  DRIVE: 'https://www.googleapis.com/auth/drive',
  
  // Contacts scopes
  CONTACTS_READONLY: 'https://www.googleapis.com/auth/contacts.readonly',
  CONTACTS: 'https://www.googleapis.com/auth/contacts',
  
  // User info scopes
  USER_INFO_EMAIL: 'https://www.googleapis.com/auth/userinfo.email',
  USER_INFO_PROFILE: 'https://www.googleapis.com/auth/userinfo.profile'
};

/**
 * Google Workspace service types
 */
export const GOOGLE_WORKSPACE_SERVICES = {
  GMAIL: 'gmail',
  CALENDAR: 'calendar',
  DRIVE: 'drive',
  CONTACTS: 'contacts'
} as const;

export type GoogleWorkspaceService = typeof GOOGLE_WORKSPACE_SERVICES[keyof typeof GOOGLE_WORKSPACE_SERVICES];

/**
 * Google Workspace data types
 */
export interface GoogleWorkspaceEmail {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
  };
  internalDate: string;
}

export interface GoogleWorkspaceCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  status: string;
}

export interface GoogleWorkspaceDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
  webViewLink?: string;
  owners?: Array<{
    displayName: string;
    emailAddress: string;
  }>;
}

export interface GoogleWorkspaceContact {
  resourceName: string;
  etag: string;
  names?: Array<{
    displayName: string;
    givenName?: string;
    familyName?: string;
  }>;
  emailAddresses?: Array<{
    value: string;
    type?: string;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
  }>;
}

/**
 * Transforms Google Workspace data for consistent format
 */
export function transformGoogleWorkspaceData(data: any, service: GoogleWorkspaceService) {
  switch (service) {
    case GOOGLE_WORKSPACE_SERVICES.GMAIL:
      return transformGmailData(data);
    case GOOGLE_WORKSPACE_SERVICES.CALENDAR:
      return transformCalendarData(data);
    case GOOGLE_WORKSPACE_SERVICES.DRIVE:
      return transformDriveData(data);
    case GOOGLE_WORKSPACE_SERVICES.CONTACTS:
      return transformContactsData(data);
    default:
      return data;
  }
}

function transformGmailData(data: any) {
  if (data.messages) {
    return data.messages.map((message: any) => ({
      id: message.id,
      threadId: message.threadId,
      snippet: message.snippet,
      internalDate: new Date(parseInt(message.internalDate)).toISOString()
    }));
  }
  return data;
}

function transformCalendarData(data: any) {
  if (data.items) {
    return data.items.map((event: any) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      attendees: event.attendees,
      location: event.location,
      status: event.status
    }));
  }
  return data;
}

function transformDriveData(data: any) {
  if (data.files) {
    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink
    }));
  }
  return data;
}

function transformContactsData(data: any) {
  if (data.connections) {
    return data.connections.map((contact: any) => ({
      resourceName: contact.resourceName,
      displayName: contact.names?.[0]?.displayName,
      email: contact.emailAddresses?.[0]?.value,
      phone: contact.phoneNumbers?.[0]?.value
    }));
  }
  return data;
}

/**
 * Validates Google Workspace service type
 */
export function isValidGoogleWorkspaceService(service: string): service is GoogleWorkspaceService {
  return Object.values(GOOGLE_WORKSPACE_SERVICES).includes(service as GoogleWorkspaceService);
}

/**
 * Formats date range for API requests
 */
export function formatDateRange(startDate: string, endDate: string) {
  return {
    start: new Date(startDate).toISOString(),
    end: new Date(endDate).toISOString()
  };
}
