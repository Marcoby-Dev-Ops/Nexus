import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Define test environment variables once
const TEST_ENV_VARS = {
  VITE_POSTGRES_URL: 'postgresql://postgres:postgres@localhost:5433/vector_db',
  VITE_POSTGRES_HOST: 'localhost',
  VITE_POSTGRES_PORT: 5433,
  VITE_POSTGRES_DB: 'vector_db',
  VITE_POSTGRES_USER: 'postgres',
  VITE_POSTGRES_PASSWORD: 'postgres',
  VITE_OPENROUTER_API_KEY: 'test-openrouter-key',
  VITE_GOOGLE_CLIENT_ID: 'test-google-client-id',
  VITE_GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  VITE_GOOGLE_API_KEY: 'test-google-api-key',
  VITE_MICROSOFT_CLIENT_ID: 'test-microsoft-client-id',
  VITE_MICROSOFT_CLIENT_SECRET: 'test-microsoft-client-secret',
  VITE_MICROSOFT_REDIRECT_URI: 'http://localhost:5173/integrations/microsoft365/callback',
  VITE_MS_TEAMS_TENANT_ID: 'test-teams-tenant-id',
  VITE_SLACK_CLIENT_ID: 'test-slack-client-id',
  VITE_HUBSPOT_CLIENT_ID: 'test-hubspot-client-id',
  VITE_PAYPAL_CLIENT_ID: 'test-paypal-client-id',
  VITE_PAYPAL_CLIENT_SECRET: 'test-paypal-client-secret',
  VITE_PAYPAL_ENV: 'sandbox',
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_stripe_key',
  VITE_NINJARMM_CLIENT_ID: 'test-ninjarmm-client-id',
  VITE_N8N_URL: 'https://test.n8n.io',
  VITE_N8N_API_KEY: 'test-n8n-api-key',
  
  VITE_AI_CHAT_URL: 'https://localhost:5173/functions/v1/ai_chat',
  VITE_NEXT_PUBLIC_APP_URL: 'https://nexux.marcoby.com',
  VITE_DEV_APP_URL: 'http://localhost:5173',
};

// Mock import.meta.env for Jest
Object.defineProperty(window, 'importMeta', {
  writable: true,
  value: {
    env: TEST_ENV_VARS
  }
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

// Mock window.URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mock-url'),
});

// Mock window.URL.revokeObjectURL
Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock console methods to reduce noise in tests
Object.defineProperty(window, 'console', {
  writable: true,
  value: {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
});

// Mock fetch
Object.defineProperty(window, 'fetch', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
});

// Mock TextEncoder for React Router (only if not already defined)
if (typeof TextEncoder === 'undefined') {
  Object.defineProperty(window, 'TextEncoder', {
    writable: true,
    value: class TextEncoder {
      encode(text: string) {
        // Simple implementation that returns a Uint8Array
        const bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
          bytes[i] = text.charCodeAt(i);
        }
        return bytes;
      }
    },
  });
}

// Mock TextDecoder for React Router (only if not already defined)
if (typeof TextDecoder === 'undefined') {
  Object.defineProperty(window, 'TextDecoder', {
    writable: true,
    value: class TextDecoder {
      decode(bytes: Uint8Array) {
        // Simple implementation that converts bytes back to string
        let result = '';
        for (let i = 0; i < bytes.length; i++) {
          result += String.fromCharCode(bytes[i]);
        }
        return result;
      }
    },
  });
}

// Helper function to get test secrets
export const getTestSecrets = async () => {
  return TEST_ENV_VARS;
};

// Helper function to mock secrets in tests
export const mockSecrets = () => {
  return TEST_ENV_VARS;
}; 