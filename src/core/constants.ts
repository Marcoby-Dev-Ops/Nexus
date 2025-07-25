// Auto-generated utility file
export const constants = () => {
  // TODO: Implement utility functions
};

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 3,
  endpoints: {
    auth: '/auth',
    users: '/users',
    analytics: '/analytics',
    business: '/business',
    ai: '/ai',
    automation: '/automation',
    integrations: '/integrations'
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};
