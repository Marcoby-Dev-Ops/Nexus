const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');

// Import local edge function implementations
const healthHandler = require('./health');
const workspaceItemsHandler = require('./workspace-items');
const getUsersHandler = require('./get-users');
const getTalkingPointsHandler = require('./get-talking-points');
const generateFollowupEmailHandler = require('./generate-followup-email');
const getFinancePerformanceHandler = require('./get-finance-performance');
const getSalesPerformanceHandler = require('./get-sales-performance');
const businessHealthHandler = require('./business_health');
const completeOnboardingHandler = require('./complete-onboarding');

// Map function names to their handlers
const functionHandlers = {
  'health': healthHandler,
  'workspace-items': workspaceItemsHandler,
  'get_users': getUsersHandler,
  'get_talking_points': getTalkingPointsHandler,
  'generate_followup_email': generateFollowupEmailHandler,
  'get_finance_performance': getFinancePerformanceHandler,
  'get_sales_performance': getSalesPerformanceHandler,
  'business_health': businessHealthHandler,
  'complete-onboarding': completeOnboardingHandler,
};

/**
 * Execute a local edge function
 * @param {string} functionName - Name of the function to execute
 * @param {Object} payload - Function payload
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Function result
 */
async function executeLocalEdgeFunction(functionName, payload, user) {
  try {
    // Check if function exists
    if (!functionHandlers[functionName]) {
      throw createError(`Edge function '${functionName}' not found`, 404);
    }

    // Execute the function
    const result = await functionHandlers[functionName](payload, user);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error(`Error executing edge function ${functionName}:`, error);
    throw error;
  }
}

module.exports = {
  executeLocalEdgeFunction,
  functionHandlers
};
