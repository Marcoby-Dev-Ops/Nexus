// Microsoft Graph API services discovery
// Note: This module doesn't require database access for service discovery

// Microsoft Graph API base URL
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

// Service definitions
const services = [
  {
    id: 'mailbox',
    name: 'User Mailbox',
    description: 'Your personal email inbox and folders',
    icon: 'mail',
    category: 'Email',
    scopes: ['Mail.Read', 'Mail.ReadWrite'],
    endpoint: '/me/mailFolders'
  },
  {
    id: 'shared_mailboxes',
    name: 'Shared Mailboxes',
    description: 'Shared email accounts you have access to',
    icon: 'users',
    category: 'Email',
    scopes: ['Mail.Read', 'Mail.ReadWrite'],
    endpoint: '/me/mailFolders'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Your personal calendar and events',
    icon: 'calendar',
    category: 'Calendar',
    scopes: ['Calendars.Read', 'Calendars.ReadWrite'],
    endpoint: '/me/calendar'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Teams channels and chat conversations',
    icon: 'message-square',
    category: 'Communication',
    scopes: ['Team.ReadBasic.All', 'Channel.ReadBasic.All'],
    endpoint: '/me/joinedTeams'
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Your personal cloud storage',
    icon: 'folder',
    category: 'Storage',
    scopes: ['Files.Read.All', 'Files.ReadWrite'],
    endpoint: '/me/drive'
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    description: 'SharePoint sites and document libraries',
    icon: 'folder-open',
    category: 'Storage',
    scopes: ['Sites.Read.All'],
    endpoint: '/me/sites'
  }
];

/**
 * Check if a service is available by making a test API call
 */
async function checkServiceAvailability(accessToken, service) {
  try {
    console.log(`Checking service: ${service.id}`);
    
    const response = await fetch(`${GRAPH_API_BASE}${service.endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Service ${service.id} response status:`, response.status);

    if (response.ok) {
      const data = await response.json();
      
      // Extract relevant data based on service type
      let serviceData = {};
      
      switch (service.id) {
        case 'mailbox':
          serviceData = {
            mailFolders: data.value?.length || 0
          };
          break;
        case 'shared_mailboxes':
          // Filter for non-personal folders (shared mailboxes)
          const sharedFolders = data.value?.filter(folder => 
            !['inbox', 'sent items', 'drafts', 'deleted items'].includes(folder.displayName?.toLowerCase())
          ) || [];
          serviceData = {
            sharedFolders: sharedFolders.length
          };
          break;
        case 'teams':
          serviceData = {
            teams: data.value?.length || 0
          };
          break;
        case 'onedrive':
          serviceData = {
            driveType: data.driveType || 'personal'
          };
          break;
        case 'sharepoint':
          serviceData = {
            sites: data.value?.length || 0
          };
          break;
        case 'calendar':
          serviceData = {
            calendarType: data.calendarType || 'default'
          };
          break;
      }

      console.log(`Service ${service.id} is available with data:`, serviceData);

      return {
        ...service,
        available: true,
        data: serviceData
      };
    } else {
      // Service not available or insufficient permissions
      console.log(`Service ${service.id} is not available (status: ${response.status})`);
      return {
        ...service,
        available: false,
        data: null
      };
    }
  } catch (error) {
    console.error(`Error checking service ${service.id}:`, error);
    return {
      ...service,
      available: false,
      data: null
    };
  }
}

/**
 * Microsoft 365 Services Discovery Edge Function
 * @param {Object} payload - Function payload containing accessToken
 * @param {Object} user - Authenticated user object (can be null for public calls)
 * @returns {Promise<Array>} Array of discovered services
 */
async function microsoftServicesDiscoveryHandler(payload, user) {
  try {
    console.log('Microsoft 365 service discovery handler called');
    console.log('Payload:', payload);
    console.log('User:', user);
    
    const { accessToken } = payload;
    
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    console.log('Starting Microsoft 365 service discovery');

    // Check availability for all services in parallel
    const discoveryPromises = services.map(service => 
      checkServiceAvailability(accessToken, service)
    );

    const discoveredServices = await Promise.all(discoveryPromises);

    console.log('Service discovery completed', {
      totalServices: discoveredServices.length,
      availableServices: discoveredServices.filter(s => s.available).length,
      userId: user?.id || 'anonymous'
    });

    return discoveredServices;

  } catch (error) {
    console.error('Microsoft 365 service discovery failed:', error);
    throw error;
  }
}

module.exports = microsoftServicesDiscoveryHandler;
