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
const microsoftServicesDiscoveryHandler = require('./microsoft_services_discovery');
const aiInsightsOnboardingHandler = require('./ai-insights-onboarding');
const aiInsightsHealthHandler = require('./ai-insights-health');
const { ai_chat: aiChatHandler } = require('./ai_chat');
const journeyHandler = require('./journey');
const journeysHandler = require('./journeys');
const journeyAnalyticsHandler = require('./journey-analytics');
const getUserJourneysHandler = require('./get_user_journeys');
const getJourneyTypesHandler = require('./get_journey_types');
const getPlaybookItemsHandler = require('./get_playbook_items');
const businessIdentityHandler = require('./business_identity');
const dbSelectHandler = require('./db_select');
const aiEmbeddingsHandler = require('./ai_embeddings');
const aiVectorSearchHandler = require('./ai_vector_search');
const aiStoreDocumentHandler = require('./ai_store_document');
const aiRagStatsHandler = require('./ai_rag_stats');

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
  'business-health': businessHealthHandler, // Support both formats
  'complete-onboarding': completeOnboardingHandler,
  'microsoft_services_discovery': microsoftServicesDiscoveryHandler,
  'ai-insights-onboarding': aiInsightsOnboardingHandler,
  'ai-insights-health': aiInsightsHealthHandler,
  'ai_chat': aiChatHandler,
  'journey': journeyHandler,
  'journeys': journeysHandler,
  'journey-analytics': journeyAnalyticsHandler,
  'get_user_journeys': getUserJourneysHandler,
  'get_journey_types': getJourneyTypesHandler,
  'get_playbook_items': getPlaybookItemsHandler,
  'business_identity': businessIdentityHandler,
  'db_select': dbSelectHandler,
  'ai_embeddings': aiEmbeddingsHandler,
  'ai_vector_search': aiVectorSearchHandler,
  'ai_store_document': aiStoreDocumentHandler,
  'ai_rag_stats': aiRagStatsHandler,
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
    
    // If the function already returns a structured response with success/data, return it directly
    if (result && typeof result === 'object' && 'success' in result) {
      return result;
    }
    
    // Otherwise, wrap it in the standard structure
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
