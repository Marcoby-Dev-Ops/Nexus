// Test environment variables loading in client
// Test getEnv function
import { getEnv } from './core/environment.js';

try {
  const env = getEnv();
  console.log('API URL:', env.api.url);
  console.log('API Base URL:', env.api.baseUrl);
} catch (error) {
  console.error('Error calling getEnv():', error);
}
