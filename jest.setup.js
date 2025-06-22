// @ts-nocheck
// @ts-ignore
require('@testing-library/jest-dom');

// Polyfill for TextEncoder/TextDecoder (needed for React Router)
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
  takeRecords: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}));

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

// Mock scrollTo
global.scrollTo = jest.fn();

// Mock URL for React Router
global.URL = global.URL || require('url').URL;

// Load environment variables from .env for tests
require('dotenv').config({ path: '.env' });

// Map VITE_ Supabase vars to generic names used in tests
if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}
if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
}

// Polyfill global fetch for Node < 18
if (typeof fetch === 'undefined') {
  require('cross-fetch/polyfill');
}

// Mock crypto.randomUUID for Node.js test environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce test noise while preserving functionality
const originalConsole = { ...console };

// Enhanced console mocking that preserves test output
global.console = {
  ...originalConsole,
  log: jest.fn((...args) => {
    if (process.env.NODE_ENV !== 'test' || process.env.VERBOSE_TESTS) {
      originalConsole.log(...args);
    }
  }),
  error: jest.fn((...args) => {
    // Always show errors in tests, but filter out expected ones
    const message = args.join(' ');
    if (!message.includes('Test error') && !message.includes('Network error')) {
      originalConsole.error(...args);
    }
  }),
  warn: jest.fn((...args) => {
    if (process.env.NODE_ENV !== 'test' || process.env.VERBOSE_TESTS) {
      originalConsole.warn(...args);
    }
  }),
  info: jest.fn((...args) => {
    if (process.env.NODE_ENV !== 'test' || process.env.VERBOSE_TESTS) {
      originalConsole.info(...args);
    }
  }),
};

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch) {
    global.fetch.mockClear();
  }
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Supabase client for tests
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  },
}));

// Silence console errors/warnings in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
}); 