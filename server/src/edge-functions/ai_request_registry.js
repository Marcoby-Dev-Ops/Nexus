/**
 * Simple in-memory registry for tracking active AI requests and their AbortControllers.
 * This allows cooperative cancellation when a client requests an abort via the ai_abort edge function.
 */
const activeAiRequests = new Map(); // requestId -> AbortController

function registerRequest(requestId, controller) {
  if (!requestId) return;
  activeAiRequests.set(requestId, controller);
}

function unregisterRequest(requestId) {
  if (!requestId) return;
  activeAiRequests.delete(requestId);
}

function abortRequest(requestId) {
  const controller = activeAiRequests.get(requestId);
  if (controller) {
    try {
      controller.abort();
      return true;
    } catch (err) {
      return false;
    }
  }
  return false;
}

function listActiveRequests() {
  return Array.from(activeAiRequests.keys());
}

module.exports = {
  registerRequest,
  unregisterRequest,
  abortRequest,
  listActiveRequests,
  activeAiRequests
};
