/**
 * Dynamic import wrapper for AuthentikAuthService
 * This file is used specifically for dynamic imports to avoid Vite build warnings
 */

export const getAuthentikAuthService = async () => {
  const { authentikAuthService } = await import('./authentikAuthServiceInstance');
  return authentikAuthService;
};
