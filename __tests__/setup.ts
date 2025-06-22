import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset console
  Object.assign(console, originalConsole);
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key'; 