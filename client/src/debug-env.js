// Debug environment variables in browser
console.log('🔍 Debugging Environment Variables...');

console.log('import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('import.meta.env.VITE_AUTHENTIK_CLIENT_ID:', import.meta.env.VITE_AUTHENTIK_CLIENT_ID);

// Test getEnv function
import { getEnv } from './core/environment.js';

try {
  const env = getEnv();
  console.log('getEnv().api.url:', env.api.url);
  console.log('getEnv().api.baseUrl:', env.api.baseUrl);
  
  if (!env.api.url) {
    console.error('❌ API URL is empty! This will cause API calls to fail.');
  } else {
    console.log('✅ API URL is set:', env.api.url);
  }
} catch (error) {
  console.error('❌ Error calling getEnv():', error);
}
