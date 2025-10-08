// Test environment variables loading in client
// Test getEnv function
import { getEnv } from './core/environment.js';

/* eslint-disable no-console */
try {
  const env = getEnv();
  console.log('API URL:', env.api?.url);
  console.log('API Base URL:', env.api?.baseUrl);
} catch (error) {
  // Keep simple error logging in test env
  console.error('Error calling getEnv():', error?.message ?? error);
}
/* eslint-enable no-console */
