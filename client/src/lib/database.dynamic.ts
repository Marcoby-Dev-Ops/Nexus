/**
 * Dynamic import wrapper for database module
 * This file is used specifically for dynamic imports to avoid Vite build warnings
 */

export const getDatabase = async () => {
  const { database } = await import('./database');
  return database;
};
