// Test environment variables loading in client
// Test getEnv function
import { getEnv } from './core/environment.js';

try {
  const env = getEnv();
  .api.url:', env.api.url);
  .api.baseUrl:', env.api.baseUrl);
} catch (error) {
  console.error('Error calling getEnv():', error);
}
