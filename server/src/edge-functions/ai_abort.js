const { abortRequest } = require('./ai_request_registry');

async function ai_abort(payload, user) {
  const { requestId } = payload || {};
  if (!requestId) {
    return { success: false, error: 'requestId is required' };
  }

  const aborted = abortRequest(requestId);
  if (aborted) {
    return { success: true, data: { aborted: true, requestId } };
  }

  return { success: false, error: 'Request not found or could not be aborted' };
}

module.exports = { ai_abort };
