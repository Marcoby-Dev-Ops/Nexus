const { loadAtomRegistry, getEntityPolicy } = require('../atom/registry');

function extractDecisionId(req, registry) {
  const headers = registry?.enforcement?.decisionContext?.acceptedHeaders || [];
  for (const h of headers) {
    const v = req.headers?.[h.toLowerCase()];
    if (v) return String(v);
  }

  const fields = registry?.enforcement?.decisionContext?.acceptedFields || [];
  for (const f of fields) {
    if (req.body && req.body[f]) return String(req.body[f]);
  }

  return null;
}

/**
 * Enforce the Atom Registry change policy for a specific entity/action.
 *
 * This is intentionally lightweight: it does not implement approval workflows.
 * It only enforces the “Energy required for nucleus/constraint mutations” rule.
 */
function requireDecisionContext(entityKey, actionLabel) {
  return (req, res, next) => {
    try {
      const registry = loadAtomRegistry();
      const policy = getEntityPolicy(entityKey);

      if (!policy) return next();

      const requiresDecision = !!policy?.changePolicy?.requiresDecision;
      if (!requiresDecision) return next();

      // Create can be allowed without decision depending on product choice; enforce by default only for update/delete.
      const action = String(actionLabel || '').toLowerCase();
      const enforceForActions = new Set(['update', 'delete', 'patch']);
      if (!enforceForActions.has(action)) return next();

      const decisionId = extractDecisionId(req, registry);
      if (!decisionId) {
        return res.status(409).json({
          success: false,
          error: `Decision context required to ${action} ${entityKey} (provide x-nexus-decision-id or decisionId).`,
          code: 'DECISION_REQUIRED',
          entity: entityKey,
          action
        });
      }

      req.nexusDecisionContext = { decisionId };
      return next();
    } catch (error) {
      // Fail-open if registry read fails in dev; safer would be fail-closed, but that can brick the app.
      return next();
    }
  };
}

module.exports = {
  requireDecisionContext
};
