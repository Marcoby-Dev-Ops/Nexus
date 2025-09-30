// Clear the auth session to force refresh with new user ID
if (typeof window !== 'undefined') {
  console.log('Clearing auth session...');
  localStorage.removeItem('authentik_session');
  console.log('Auth session cleared. Please refresh the page to re-authenticate.');
} else {
  console.log('This script must be run in a browser environment');
}
