// Test environment variables loading in client
console.log('🔍 Testing Client Environment Variables...');

console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || 'NOT SET');
console.log('VITE_DEV_APP_URL:', import.meta.env.VITE_DEV_APP_URL || 'NOT SET');
console.log('VITE_AUTHENTIK_CLIENT_ID:', import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'NOT SET');

// Test getEnv function
import { getEnv } from './core/environment.js';

try {
  const env = getEnv();
  console.log('getEnv().api.url:', env.api.url);
  console.log('getEnv().api.baseUrl:', env.api.baseUrl);
} catch (error) {
  console.error('Error calling getEnv():', error);
}
