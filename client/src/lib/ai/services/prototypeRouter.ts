import { agentRegistry } from '../core/agentRegistry';
import { AIGateway } from '../lib/AIGateway';

export interface RouteResult {
  agentId: string;
  confidence: number;
  reasoning: string;
}

/**
 * Simple prototype router that either runs in mock mode (env PROTOTYPE_ROUTER_MOCK)
 * or makes a single LLM call via the existing AIGateway and expects a JSON reply.
 */
export async function routeQuery(query: string, tenantId = 'dev-tenant'): Promise<RouteResult> {
  const mock = !!process.env.PROTOTYPE_ROUTER_MOCK;

  // Basic mock mode for local testing (no external LLM calls)
  if (mock) {
    const q = query.toLowerCase();
    const candidates = agentRegistry.getAllAgents();

    // Very small heuristic to pick an agent from registry metadata using name and tags
    for (const agent of candidates) {
      const name = (agent.name || '').toLowerCase();
      const tags = (agent.tags || []).map(t => t.toLowerCase());
      const dept = (agent.type === 'departmental' && (agent as any).department) ? String((agent as any).department).toLowerCase() : '';

      if (q.includes(name) || tags.some((t: string) => q.includes(t)) || (dept && q.includes(dept))) {
        return {
          agentId: agent.id,
          confidence: 0.85,
          reasoning: `Matched query keywords to agent "${agent.name}" (mock heuristic).`,
        };
      }
    }

    // fallback to concierge director or executive assistant
    const fallback = agentRegistry.getAgent('concierge-director') || agentRegistry.getAgent('executive-assistant') || agentRegistry.getAllAgents()[0];
    return {
      agentId: fallback?.id || 'executive-assistant',
      confidence: 0.45,
      reasoning: 'No strong match found; defaulting to concierge/executive (mock).',
    };
  }

  // Real LLM path
  const gateway = new AIGateway({ enableLocal: true, enableOpenAI: true, enableOpenRouter: true });

  // Compose a concise system prompt listing agents and asking for a JSON response
  const agentsSummary = agentRegistry.getAllAgents().map(a => `- id: ${a.id}, name: ${a.name}, tags: ${(a.tags || []).join(', ') || 'n/a'}`).join('\n');

  const system = `You are a routing assistant. Given a user query, return a JSON object with keys: agentId, confidence (0..1), reasoning. Available agents:\n${agentsSummary}`;

  const request = {
    task: 'route_query',
    role: 'routing',
    input: query,
    tenantId,
    sensitivity: 'low',
    system,
    json: true,
  } as any;

  const resp = await gateway.call<{ agentId: string; confidence: number; reasoning: string }>(request);

  // Basic sanity checks
  if (!resp || !resp.output) {
    throw new Error('Empty response from LLM gateway');
  }

  const out = resp.output as any;
  return {
    agentId: out.agentId || 'executive-assistant',
    confidence: typeof out.confidence === 'number' ? out.confidence : 0.5,
    reasoning: out.reasoning || JSON.stringify(out),
  };
}

export default { routeQuery };
