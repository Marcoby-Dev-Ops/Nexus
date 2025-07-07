/**
 * Callback System Index
 * Exports and initializes the unified callback system
 */

export * from './CallbackRegistry';
export * from './CallbackHandler';
export * from './configs/integrationCallbacks';
export type * from '@/lib/types/callbacks';

import { initializeCallbackRegistry } from './CallbackRegistry';
import { registerAllCallbacks } from './configs/integrationCallbacks';

/**
 * Initialize the entire callback system
 */
export const initializeCallbackSystem = async (): Promise<void> => {
  try {
    console.log('🔄 Initializing callback system...');
    
    // Initialize the registry
    await initializeCallbackRegistry();
    
    // Register all callback configurations
    await registerAllCallbacks();
    
    console.log('✅ Callback system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize callback system:', error);
    throw error;
  }
};

/**
 * Re-export commonly used items for convenience
 */
export { callbackRegistry } from './CallbackRegistry';
export { CallbackProcessor } from './CallbackHandler'; 